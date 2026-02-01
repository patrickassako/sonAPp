"""
Generation API routes - Migrated to Supabase REST API.
"""

from fastapi import APIRouter, Depends, HTTPException
from rq import Queue
from redis import Redis
import uuid
import asyncio

from app.supabase_client import get_supabase_client
from app.auth import get_current_user
from app.schemas import GenerateRequest, JobStatusResponse, GenerateLyricsRequest, LyricsResponse
from app.utils.credits import reserve_credits_supabase
from app.config import settings
from app.providers.suno import get_suno_provider

router = APIRouter()

# Initialize Redis and RQ
redis_conn = Redis.from_url(settings.REDIS_URL)
job_queue = Queue("music_generation", connection=redis_conn)



@router.post("/lyrics", response_model=LyricsResponse)
async def generate_lyrics(
    request: GenerateLyricsRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Generate lyrics based on description and style using SunoAPI.
    """
    try:
        suno = get_suno_provider()
        
        # Build prompt
        full_prompt = f"{request.description}"
        if request.style:
            full_prompt += f" Style: {request.style}."
        if request.language == "fr":
            full_prompt += " Language: French."
        else:
            full_prompt += " Language: English."
            
        print(f"DEBUG: Generating lyrics with prompt: {full_prompt}")
        task_id = suno.generate_lyrics(full_prompt)
        print(f"DEBUG: Lyrics Task ID: {task_id}")
        
        # Poll for result (max 40s)
        for _ in range(20):
            await asyncio.sleep(2)
            status = suno.get_lyrics_status(task_id)
            if status["status"] == "completed":
                print(f"DEBUG: Lyrics generated successfully")
                texts = status["lyrics"]
                return LyricsResponse(
                    lyrics=texts[0] if texts else "", 
                    candidates=texts
                )
            if status["status"] == "failed":
                raise HTTPException(status_code=500, detail=f"Suno Error: {status.get('error')}")
                
        raise HTTPException(status_code=504, detail="Lyrics generation timed out (Suno API is slow)")

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=JobStatusResponse, status_code=202)
async def start_generation(
    request: GenerateRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Start music generation for a project.
    
    Flow:
    1. Verify project ownership and status
    2. Reserve credits (10 credits)
    3. Create generation job
    4. Queue async worker
    5. Return job status
    
    Returns 202 Accepted (async processing)
    """
    print(f"DEBUG: Start generation for project {request.project_id}, user {user_id}")
    try:
        client = get_supabase_client()
        
        # Verify project
        print("DEBUG: Fetching project...")
        projects = client.select(
            "projects",
            filters={"id": request.project_id, "user_id": user_id},
            limit=1
        )
        
        if not projects:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = projects[0]
        print(f"DEBUG: Project found: {project.get('id')}")
        
        if project.get("status") == "generating":
            raise HTTPException(status_code=400, detail="Generation already in progress")
        
        if project.get("mode") == "TEXT" and not project.get("lyrics_final"):
            raise HTTPException(status_code=400, detail="No lyrics found for TEXT mode")
        
        # Reserve credits
        credits_cost = 10  # TODO: Make configurable
        
        print("DEBUG: Reserving credits...")
        try:
            reserve_credits_supabase(client, user_id, credits_cost)
        except ValueError as e:
            raise HTTPException(status_code=402, detail=str(e))
        
        # Create generation job
        print("DEBUG: Creating generation job...")
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
        print("DEBUG: Updating project status...")
        client.update(
            "projects",
            {"status": "generating"},
            {"id": request.project_id}
        )
        
        # Queue job for async processing
        print("DEBUG: Enqueuing job...")
        job_queue.enqueue(
            'app.workers.music_worker.generate_music',
            job_id,
            request.project_id,
            job_timeout='30m'
        )
        
        print("DEBUG: Generation started successfully")
        return job

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"FAILED to start generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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
