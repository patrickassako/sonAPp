"""
Public share endpoint - no authentication required.
Allows anyone with a link to view completed tracks.
"""

from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.supabase_client import get_supabase_client

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


@router.get("/{project_id}")
@limiter.limit("60/minute")
async def get_shared_project(request: Request, project_id: str):
    """
    Get a shared project's public data.
    No authentication required - anyone with the link can view.
    Only returns completed projects. Does NOT expose user_id, lyrics, or context.
    """
    client = get_supabase_client()

    # Fetch project (no auth check - public endpoint)
    projects = client.select(
        "projects",
        filters={"id": project_id},
        limit=1
    )

    if not projects or projects[0].get("status") != "completed":
        raise HTTPException(status_code=404, detail="Track not found")

    project = projects[0]

    # Fetch audio files
    audio_files = client.select(
        "audio_files",
        filters={"project_id": project_id},
        order="version_number.asc"
    )

    return {
        "id": project["id"],
        "title": project["title"],
        "style_id": project.get("style_id"),
        "custom_style_text": project.get("custom_style_text"),
        "created_at": project["created_at"],
        "audio_files": [
            {
                "id": af["id"],
                "file_url": af.get("file_url"),
                "stream_url": af.get("stream_url"),
                "image_url": af.get("image_url"),
                "video_url": af.get("video_url"),
                "duration": af.get("duration"),
                "version_number": af["version_number"],
            }
            for af in audio_files
        ],
    }
