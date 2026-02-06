"""
Generation API routes - Migrated to Supabase REST API.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from rq import Queue
from redis import Redis, ConnectionPool
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging
import uuid
import asyncio
from functools import partial

from app.supabase_client import get_supabase_client
from app.auth import get_current_user
import re
from app.schemas import GenerateRequest, JobStatusResponse, GenerateLyricsRequest, LyricsResponse, SuccessResponse
from app.utils.credits import reserve_credits_supabase, debit_credits_supabase
from app.config import settings
from app.providers.suno import get_suno_provider

logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

# Initialize Redis with connection pool and RQ
redis_pool = ConnectionPool.from_url(settings.REDIS_URL, max_connections=20)
redis_conn = Redis(connection_pool=redis_pool)
job_queue = Queue("music_generation", connection=redis_conn)



@router.post("/lyrics", response_model=LyricsResponse)
@limiter.limit("10/minute")
async def generate_lyrics(
    request: Request,
    body: GenerateLyricsRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Generate lyrics based on description and style using SunoAPI.
    Cost: 1 Credit.
    """
    try:
        client = get_supabase_client()

        # 1. Debit 1 credit immediately (direct debit, no prior reservation)
        try:
            debit_credits_supabase(client, user_id, 1, metadata={"action": "generate_lyrics"}, from_reserved=False)
        except ValueError as e:
            raise HTTPException(status_code=402, detail=str(e))

        suno = get_suno_provider()

        # Build prompt (SunoAPI limit: 200 characters)
        full_prompt = f"{body.description}"
        if body.style:
            full_prompt += f" Style: {body.style}."
        if body.language == "fr":
            full_prompt += " French."
        else:
            full_prompt += " English."

        # Truncate to 200 characters if needed
        if len(full_prompt) > 200:
            full_prompt = full_prompt[:197] + "..."
            logger.warning(f"Prompt truncated to 200 chars for SunoAPI")
            
        # Run sync Suno call in thread executor to avoid blocking event loop
        loop = asyncio.get_event_loop()
        task_id = await loop.run_in_executor(None, partial(suno.generate_lyrics, full_prompt))

        # Poll with exponential backoff (2s, 3s, 4s, ...) max ~50s total
        delay = 2.0
        for _ in range(15):
            await asyncio.sleep(delay)
            status = await loop.run_in_executor(None, partial(suno.get_lyrics_status, task_id))
            if status["status"] == "completed":
                texts = status["lyrics"]
                return LyricsResponse(
                    lyrics=texts[0] if texts else "",
                    candidates=texts
                )
            if status["status"] == "failed":
                raise HTTPException(status_code=500, detail="Lyrics generation failed")
            delay = min(delay * 1.3, 6.0)  # backoff up to 6s max

        raise HTTPException(status_code=504, detail="Lyrics generation timed out")

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Lyrics generation error: %s", e)
        raise HTTPException(status_code=500, detail="Lyrics generation failed")


@router.post("/", response_model=JobStatusResponse, status_code=202)
@limiter.limit("5/minute")
async def start_generation(
    request: Request,
    body: GenerateRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Start music generation for a project.
    
    Flow:
    1. Verify project ownership and status
    2. Calculate cost (Dynamic)
    3. Reserve credits
    4. Create generation job
    5. Queue async worker
    6. Return job status
    
    Returns 202 Accepted (async processing)
    """
    try:
        client = get_supabase_client()

        # Verify project
        projects = client.select(
            "projects",
            filters={"id": body.project_id, "user_id": user_id},
            limit=1
        )
        
        if not projects:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = projects[0]
        
        if project.get("status") == "generating":
            raise HTTPException(status_code=400, detail="Generation already in progress")
        
        if project.get("mode") == "TEXT" and not project.get("lyrics_final"):
            raise HTTPException(status_code=400, detail="No lyrics found for TEXT mode")
        
        # Calculate Credits Cost
        # Base Cost = 4
        # Context Mode Discount = -1 (Lyrics paid separately)
        # Humming Surcharge = +1
        # Singing Surcharge = +2
        
        credits_cost = 4

        if project.get("mode") == "CONTEXT":
            credits_cost -= 1

        if project.get("audio_url"):
            if project.get("lyrics_final"):
                credits_cost += 1
            else:
                credits_cost += 2

        # Video clip surcharge: 1 credit per 30s (estimate 4 credits for ~2min)
        if project.get("generate_video"):
            credits_cost += 4

        try:
            reserve_credits_supabase(client, user_id, credits_cost)
        except ValueError as e:
            raise HTTPException(status_code=402, detail=str(e))
        
        # Create generation job
        job_id = str(uuid.uuid4())
        job = client.insert("generation_jobs", {
            "id": job_id,
            "project_id": body.project_id,
            "user_id": user_id,
            "status": "queued",
            "credits_cost": credits_cost,
            "metadata": {"style_id": project.get("style_id"), "language": project.get("language")}
        })
        
        # Update project status
        client.update(
            "projects",
            {"status": "generating"},
            {"id": body.project_id}
        )
        
        # Queue job for async processing
        job_queue.enqueue(
            'app.workers.music_worker.generate_music',
            job_id,
            body.project_id,
            job_timeout='7m'
        )
        
        return job

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to start generation: %s", e)
        raise HTTPException(status_code=500, detail="Music generation failed")


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
@limiter.limit("30/minute")
async def get_job_status(
    request: Request,
    job_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get generation job status.

    Returns current status, progress, and error information if applicable.
    """
    client = get_supabase_client()

    jobs = client.select(
        "generation_jobs",
        filters={"id": job_id, "user_id": user_id},
        limit=1
    )

    if not jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[0]
    # Extract video_status from metadata if present
    metadata = job.get("metadata") or {}
    if isinstance(metadata, dict):
        job["video_status"] = metadata.get("video_status")

    return job


@router.post("/video/{project_id}", response_model=SuccessResponse)
@limiter.limit("3/minute")
async def generate_video_clip(
    request: Request,
    project_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Manually trigger video clip generation for a completed project.
    Finds the first audio file with a provider_audio_id and queues video generation.
    """
    client = get_supabase_client()

    # Verify project ownership
    projects = client.select(
        "projects",
        filters={"id": project_id, "user_id": user_id},
        limit=1
    )
    if not projects:
        raise HTTPException(status_code=404, detail="Project not found")

    project = projects[0]
    if project.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Project must be completed first")

    # Get audio files
    audio_files = client.select(
        "audio_files",
        filters={"project_id": project_id},
        order="version_number.asc"
    )
    if not audio_files:
        raise HTTPException(status_code=404, detail="No audio files found")

    # Check if video already exists
    first_af = audio_files[0]
    if first_af.get("video_url"):
        raise HTTPException(status_code=400, detail="Video already exists for this track")

    # Get provider_job_id from generation job
    jobs = client.select(
        "generation_jobs",
        filters={"project_id": project_id, "status": "completed"},
        order="created_at.desc",
        limit=1
    )
    if not jobs:
        raise HTTPException(status_code=400, detail="No completed generation job found")

    job = jobs[0]
    provider_job_id = job.get("provider_job_id")
    if not provider_job_id:
        raise HTTPException(status_code=400, detail="Missing provider job ID")

    # Get or derive the suno audio ID
    provider_audio_id = first_af.get("provider_audio_id")
    if not provider_audio_id and first_af.get("file_url"):
        # Try extracting UUID from the audio URL
        match = re.search(r'/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', first_af["file_url"])
        if match:
            provider_audio_id = match.group(1)
            # Save it for future use
            client.update("audio_files", {"provider_audio_id": provider_audio_id}, {"id": first_af["id"]})

    if not provider_audio_id:
        raise HTTPException(status_code=400, detail="Cannot determine Suno audio ID for this track")

    # Debit credits for video: 1 credit per 30s
    duration = first_af.get("duration", 120)
    video_credits = max(1, -(-duration // 30))  # ceil division
    try:
        debit_credits_supabase(client, user_id, video_credits, metadata={"action": "generate_video", "project_id": project_id}, from_reserved=False)
    except ValueError as e:
        raise HTTPException(status_code=402, detail=str(e))

    # Queue the video generation job
    job_queue.enqueue(
        'app.workers.music_worker.generate_video',
        first_af["id"],
        provider_job_id,
        provider_audio_id,
        project.get("title", "BimZik"),
        user_id,
        video_credits,
        job_timeout='5m'
    )

    return SuccessResponse(message="Video generation started")
