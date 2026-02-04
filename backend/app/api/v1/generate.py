"""
Generation API routes - Migrated to Supabase REST API.
"""

from fastapi import APIRouter, Depends, HTTPException
from rq import Queue
from redis import Redis, ConnectionPool
import logging
import uuid
import asyncio
from functools import partial

from app.supabase_client import get_supabase_client
from app.auth import get_current_user
from app.schemas import GenerateRequest, JobStatusResponse, GenerateLyricsRequest, LyricsResponse
from app.utils.credits import reserve_credits_supabase, debit_credits_supabase
from app.config import settings
from app.providers.suno import get_suno_provider

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Redis with connection pool and RQ
redis_pool = ConnectionPool.from_url(settings.REDIS_URL, max_connections=20)
redis_conn = Redis(connection_pool=redis_pool)
job_queue = Queue("music_generation", connection=redis_conn)



@router.post("/lyrics", response_model=LyricsResponse)
async def generate_lyrics(
    request: GenerateLyricsRequest,
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
        full_prompt = f"{request.description}"
        if request.style:
            full_prompt += f" Style: {request.style}."
        if request.language == "fr":
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
async def start_generation(
    request: GenerateRequest,
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
            filters={"id": request.project_id, "user_id": user_id},
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
        try:
            reserve_credits_supabase(client, user_id, credits_cost)
        except ValueError as e:
            raise HTTPException(status_code=402, detail=str(e))
        
        # Create generation job
        job_id = str(uuid.uuid4())
        job = client.insert("generation_jobs", {
            "id": job_id,
            "project_id": request.project_id,
            "user_id": user_id,
            "status": "queued",
            "credits_cost": credits_cost,
            "metadata": {"style_id": project.get("style_id"), "language": project.get("language")}
        })
        
        # Update project status
        client.update(
            "projects",
            {"status": "generating"},
            {"id": request.project_id}
        )
        
        # Queue job for async processing
        job_queue.enqueue(
            'app.workers.music_worker.generate_music',
            job_id,
            request.project_id,
            job_timeout='7m'
        )
        
        return job

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to start generation: %s", e)
        raise HTTPException(status_code=500, detail="Music generation failed")


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
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
    
    return jobs[0]
