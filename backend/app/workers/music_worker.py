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
from app.config import settings
from app.utils.email_sender import send_notification_email
from app.utils.web_push import send_push_notification


import asyncio


def _send_notification(client, job_id: str, project_id: str, project: dict):
    """Send notification (email or push) if user opted in."""
    try:
        prefs = client.select("notification_preferences", filters={"job_id": job_id}, limit=1)
        if not prefs:
            return
        pref = prefs[0]
        if pref.get("notified"):
            return

        channel = pref.get("channel", "email")
        share_url = f"{settings.FRONTEND_URL}/share/{project_id}"
        project_url = f"{settings.FRONTEND_URL}/projects/{project_id}"
        track_title = project.get("title", "Votre chanson")

        sent = False

        if channel == "push":
            sent = send_push_notification(
                subscription_json=pref["destination"],
                title=f"{track_title} est prête !",
                body="Votre chanson a été générée avec succès. Cliquez pour l'écouter.",
                url=project_url,
            )
        else:
            # Default: email
            audio_files = client.select("audio_files", filters={"job_id": job_id}, limit=1)
            image_url = audio_files[0].get("image_url", "") if audio_files else ""

            sent = send_notification_email(
                to_email=pref["destination"],
                track_title=track_title,
                style_id=project.get("style_id", ""),
                share_url=share_url,
                image_url=image_url,
            )

        if sent:
            client.update("notification_preferences", {"notified": True}, {"id": pref["id"]})

    except Exception as e:
        print(f"⚠️ Notification error (non-blocking): {e}")


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
            audio_url=project.get("audio_url"),
            custom_style_text=project.get("custom_style_text")
        )
        
        # Update job with provider ID
        client.update(
            "generation_jobs",
            {"provider_job_id": provider_job_id},
            {"id": job_id}
        )
        
        print(f"🎶 Provider job created: {provider_job_id}")
        
        # Poll for completion with exponential backoff
        max_attempts = 24
        poll_interval = 5  # initial seconds

        for attempt in range(max_attempts):
            status_response = suno.get_status(provider_job_id)
            status = status_response["status"]

            print(f"[{attempt+1}/{max_attempts}] Status: {status}")
            
            if status == "completed":
                # Success! Save audio files
                audio_clips = status_response.get("audio_urls", [])
                metadata = status_response.get("metadata", {})
                stream_urls = metadata.get("stream_urls", [])
                image_urls = metadata.get("image_urls", [])
                suno_audio_ids = metadata.get("suno_audio_ids", [])

                suno_data = metadata.get("suno_data", [])

                audio_file_ids = []
                for idx, file_url in enumerate(audio_clips):
                    stream_url = stream_urls[idx] if idx < len(stream_urls) else None
                    image_url = image_urls[idx] if idx < len(image_urls) else None
                    provider_audio_id = suno_audio_ids[idx] if idx < len(suno_audio_ids) else None
                    # Use real duration from Suno response
                    track_duration = suno_data[idx].get("duration", 120) if idx < len(suno_data) else 120
                    af_id = str(uuid.uuid4())
                    audio_file_ids.append(af_id)

                    client.insert("audio_files", {
                        "id": af_id,
                        "project_id": project_id,
                        "job_id": job_id,
                        "file_path": file_url,
                        "file_url": file_url,
                        "stream_url": stream_url,
                        "image_url": image_url,
                        "provider_audio_id": provider_audio_id,
                        "duration": track_duration,
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

                # Video generation (if requested)
                video_status = None
                print(f"🎬 generate_video={project.get('generate_video')}, suno_audio_ids={suno_audio_ids}")
                if project.get("generate_video") and suno_audio_ids:
                    video_status = "processing"
                    client.update(
                        "generation_jobs",
                        {"metadata": {
                            "provider_job_id": provider_job_id,
                            "video_status": "processing"
                        }},
                        {"id": job_id}
                    )
                    try:
                        first_audio_id = suno_audio_ids[0]
                        print(f"🎬 Starting video generation for audio {first_audio_id}")
                        video_task_id = suno.create_video(
                            task_id=provider_job_id,
                            audio_id=first_audio_id,
                            author=project.get("title", "BimZik"),
                            domain_name="bimzik.com"
                        )
                        print(f"🎬 Video task created: {video_task_id}")

                        # Poll video status
                        video_poll_interval = 5
                        for v_attempt in range(20):
                            await asyncio.sleep(video_poll_interval)
                            v_status = suno.get_video_status(video_task_id)
                            print(f"🎬 [{v_attempt+1}/20] Video status: {v_status['status']}")

                            if v_status["status"] == "completed" and v_status.get("video_url"):
                                # Save video_url on the first audio file
                                client.update(
                                    "audio_files",
                                    {"video_url": v_status["video_url"]},
                                    {"id": audio_file_ids[0]}
                                )
                                video_status = "completed"
                                print(f"🎬 Video ready: {v_status['video_url']}")
                                break
                            elif v_status["status"] == "failed":
                                video_status = "failed"
                                print(f"🎬 Video generation failed")
                                break

                            video_poll_interval = min(video_poll_interval * 1.3, 20)
                        else:
                            video_status = "failed"
                            print(f"🎬 Video generation timed out")

                    except Exception as ve:
                        video_status = "failed"
                        print(f"🎬 Video error (non-blocking): {ve}")

                # Mark job complete
                job_metadata = {"provider_job_id": provider_job_id}
                if video_status:
                    job_metadata["video_status"] = video_status
                client.update(
                    "generation_jobs",
                    {
                        "status": "completed",
                        "completed_at": datetime.utcnow().isoformat(),
                        "metadata": job_metadata
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

                # Send email notification if user opted in
                _send_notification(client, job_id, project_id, project)

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
            
            # Still processing, wait with backoff and retry
            if attempt < max_attempts - 1:
                await asyncio.sleep(poll_interval)
                poll_interval = min(poll_interval * 1.3, 20)  # backoff up to 20s
        
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


def generate_video(audio_file_id: str, provider_job_id: str, provider_audio_id: str, project_title: str, user_id: str = None, video_credits: int = 0):
    """
    Standalone RQ job to generate a video clip for an existing audio file.
    Called manually from the API when user clicks "Generate clip".
    """
    try:
        asyncio.run(_generate_video_impl(audio_file_id, provider_job_id, provider_audio_id, project_title, user_id, video_credits))
    except Exception as e:
        print(f"CRITICAL VIDEO WORKER ERROR: {e}")
        import traceback
        traceback.print_exc()


def _refund_video_credits(client, user_id: str, video_credits: int, reason: str):
    """Refund video credits by re-crediting the user (direct debit was used, not reservation)."""
    if not user_id or video_credits <= 0:
        return
    try:
        profiles = client.select("profiles", filters={"id": user_id}, limit=1)
        if profiles:
            profile = profiles[0]
            client.update("profiles", {"credits": profile["credits"] + video_credits}, {"id": user_id})
            import uuid as _uuid
            client.insert("transactions", {
                "id": str(_uuid.uuid4()),
                "user_id": user_id,
                "type": "refund",
                "amount": video_credits,
                "status": "completed",
                "metadata": {"reason": reason}
            })
            print(f"💰 Refunded {video_credits} video credits to user {user_id}")
    except Exception as e:
        print(f"⚠️ Video credit refund failed: {e}")


async def _generate_video_impl(audio_file_id: str, provider_job_id: str, provider_audio_id: str, project_title: str, user_id: str = None, video_credits: int = 0):
    """Generate video clip for a single audio file."""
    client = get_supabase_client()
    suno = get_suno_provider()

    try:
        print(f"🎬 Manual video generation for audio_file={audio_file_id}, suno_audio={provider_audio_id}")
        video_task_id = suno.create_video(
            task_id=provider_job_id,
            audio_id=provider_audio_id,
            author=project_title or "BimZik",
            domain_name="bimzik.com"
        )
        print(f"🎬 Video task created: {video_task_id}")

        poll_interval = 5
        for attempt in range(25):
            await asyncio.sleep(poll_interval)
            v_status = suno.get_video_status(video_task_id)
            print(f"🎬 [{attempt+1}/25] Video status: {v_status['status']}")

            if v_status["status"] == "completed" and v_status.get("video_url"):
                client.update(
                    "audio_files",
                    {"video_url": v_status["video_url"]},
                    {"id": audio_file_id}
                )
                print(f"🎬 Video saved: {v_status['video_url']}")
                return
            elif v_status["status"] == "failed":
                print(f"🎬 Video generation failed")
                _refund_video_credits(client, user_id, video_credits, "video_generation_failed")
                return

            poll_interval = min(poll_interval * 1.3, 20)

        print(f"🎬 Video generation timed out")
        _refund_video_credits(client, user_id, video_credits, "video_generation_timeout")
    except Exception as e:
        print(f"🎬 Video error: {e}")
        _refund_video_credits(client, user_id, video_credits, f"video_error: {e}")
        import traceback
        traceback.print_exc()
