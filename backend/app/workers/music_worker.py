"""
Music generation worker - RQ async job (Migrated to Supabase).

This worker handles async music generation via SunoProvider.
"""

import os
import sys
from pathlib import Path

# Ensure app is in path
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from datetime import datetime
import time
import uuid

from app.supabase_client import get_supabase_client
from app.providers import get_suno_provider
from app.utils.credits import debit_credits_supabase, refund_credits_supabase


import asyncio

def generate_music_async(job_id: str, project_id: str):
    """Async wrapper for generation logic."""
    loop = asyncio.get_event_loop()
    if loop.is_running():
        # Should not happen in RQ, but just in case
        return loop.create_task(_generate_music_impl(job_id, project_id))
    else:
        return loop.run_until_complete(_generate_music_impl(job_id, project_id))

def generate_music(job_id: str, project_id: str):
    """
    Entry point for RQ worker (Synchronous).
    Calls the async implementation via asyncio.run().
    """
    try:
        asyncio.run(_generate_music_impl(job_id, project_id))
    except Exception as e:
        print(f"CRITICAL WORKER ERROR: {e}")
        import traceback
        traceback.print_exc()

async def _generate_music_impl(job_id: str, project_id: str):
    """
    Actual generation logic (Async).
    """
    client = get_supabase_client()
    
    try:
        # Get job and project
        jobs = client.select("generation_jobs", filters={"id": job_id}, limit=1)
        projects = client.select("projects", filters={"id": project_id}, limit=1)
        
        if not jobs or not projects:
            print(f"Job or project not found: job={job_id}, project={project_id}")
            return
        
        job = jobs[0]
        project = projects[0]
        
        # Mark job as processing
        client.update(
            "generation_jobs",
            {"status": "processing", "provider_job_id": None},
            {"id": job_id}
        )
        
        # Get Suno provider
        suno = get_suno_provider()
        
        # Create music generation request
        print(f"🎵 Generating music for project {project['title']}")
        
        # SunoProvider methods are synchronous (httpx.Client)
        provider_job_id = suno.create_track(
            lyrics=project.get("lyrics_final", ""),
            style_id=project["style_id"],
            language=project["language"],
            title=project["title"],
            audio_url=project.get("audio_url")
        )
        
        # Update job with provider ID
        client.update(
            "generation_jobs",
            {"provider_job_id": provider_job_id},
            {"id": job_id}
        )
        
        print(f"🎶 Provider job created: {provider_job_id}")
        
        # Poll for completion
        max_attempts = 30
        poll_interval = 10  # seconds
        
        for attempt in range(max_attempts):
            # Synchronous call
            status_response = suno.get_status(provider_job_id)
            status = status_response["status"]
            
            print(f"[{attempt+1}/{max_attempts}] Status: {status}")
            
            if status == "completed":
                # Success! Save audio files
                audio_clips = status_response.get("audio_urls", [])
                metadata = status_response.get("metadata", {})
                stream_urls = metadata.get("stream_urls", [])
                image_urls = metadata.get("image_urls", [])
                
                # If audio_clips is just strings, we iterate differently
                # status_response['audio_urls'] is a list of strings
                
                for idx, file_url in enumerate(audio_clips):
                    stream_url = stream_urls[idx] if idx < len(stream_urls) else None
                    image_url = image_urls[idx] if idx < len(image_urls) else None
                    
                    client.insert("audio_files", {
                        "id": str(uuid.uuid4()),
                        "project_id": project_id,
                        "job_id": job_id,
                        "file_path": file_url,  # Use URL as path (required NOT NULL)
                        "file_url": file_url,
                        "stream_url": stream_url,
                        "image_url": image_url,
                        "duration": 180,  # approximate (column name is 'duration')
                        "version_number": idx + 1
                    })
                
                # Debit credits
                debit_credits_supabase(
                    client,
                    job["user_id"],
                    job["credits_cost"],
                    job_id=job_id,
                    metadata={"provider_job_id": provider_job_id}
                )
                
                # Mark job complete
                client.update(
                    "generation_jobs",
                    {
                        "status": "completed",
                        "completed_at": datetime.utcnow().isoformat()
                    },
                    {"id": job_id}
                )
                
                # Update project status
                client.update(
                    "projects",
                    {"status": "completed"},
                    {"id": project_id}
                )
                
                print(f"✅ Generation completed successfully!")
                return
            
            elif status == "failed":
                # Generation failed
                error_message = status_response.get("error", "Unknown error")
                
                # Refund credits
                refund_credits_supabase(
                    client,
                    job["user_id"],
                    job["credits_cost"],
                    job_id=job_id,
                    reason=f"generation_failed: {error_message}"
                )
                
                # Mark job failed
                client.update(
                    "generation_jobs",
                    {
                        "status": "failed",
                        "error_message": error_message,
                        "completed_at": datetime.utcnow().isoformat()
                    },
                    {"id": job_id}
                )
                
                # Update project status
                client.update(
                    "projects",
                    {"status": "failed"},
                    {"id": project_id}
                )
                
                print(f"❌ Generation failed: {error_message}")
                return
            
            # Still processing, wait and retry
            if attempt < max_attempts - 1:
                # Use asyncio sleep for async func
                await asyncio.sleep(poll_interval)
        
        # Timeout - refund credits
        refund_credits_supabase(
            client,
            job["user_id"],
            job["credits_cost"],
            job_id=job_id,
            reason="generation_timeout"
        )
        
        client.update(
            "generation_jobs",
            {
                "status": "failed",
                "error_message": "Generation timeout after 5 minutes",
                "completed_at": datetime.utcnow().isoformat()
            },
            {"id": job_id}
        )
        
        client.update(
            "projects",
            {"status": "failed"},
            {"id": project_id}
        )
        
        print(f"⏱️ Generation timed out")
    
    except Exception as e:
        print(f"💥 Worker error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Refund credits on any error
        try:
            job = client.select("generation_jobs", filters={"id": job_id}, limit=1)[0]
            refund_credits_supabase(
                client,
                job["user_id"],
                job["credits_cost"],
                job_id=job_id,
                reason=f"worker_error: {str(e)}"
            )
            
            client.update(
                "generation_jobs",
                {
                    "status": "failed",
                    "error_message": str(e),
                    "completed_at": datetime.utcnow().isoformat()
                },
                {"id": job_id}
            )
        except:
            pass  # Best effort
