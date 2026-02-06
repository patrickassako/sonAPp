"""
Projects API routes - Migrated to Supabase REST API.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import List
import uuid

from app.supabase_client import get_supabase_client
from app.auth import get_current_user
from app.schemas import ProjectCreate, ProjectResponse, AudioFileResponse

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


@router.post("/", response_model=ProjectResponse, status_code=201)
@limiter.limit("20/minute")
async def create_project(
    request: Request,
    project_data: ProjectCreate,
    user_id: str = Depends(get_current_user)
):
    """
    Create a new music project.
    
    Modes:
    - TEXT: User provides lyrics directly
    - CONTEXT: User provides context for AI lyrics generation
    """
    # Validate mode
    if project_data.mode not in ["TEXT", "CONTEXT"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Must be TEXT or CONTEXT")
    
    # Validate inputs based on mode
    if project_data.mode == "TEXT" and not project_data.lyrics_final:
        raise HTTPException(status_code=400, detail="lyrics_final required for TEXT mode")
    
    if project_data.mode == "CONTEXT" and not project_data.context_input:
        raise HTTPException(status_code=400, detail="context_input required for CONTEXT mode")
    
    # Create project data
    client = get_supabase_client()
    project = client.insert("projects", {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": project_data.title,
        "mode": project_data.mode,
        "language": project_data.language,
        "style_id": project_data.style_id,
        "custom_style_text": project_data.custom_style_text,
        "context_input": project_data.context_input,
        "lyrics_final": project_data.lyrics_final,
        "audio_url": project_data.audio_url,
        "generate_video": project_data.generate_video,
        "status": "draft"
    })
    
    return project


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    user_id: str = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0
):
    """
    List projects for the current user with pagination.

    Returns projects ordered by creation date (newest first).
    """
    # Cap limit to prevent abuse
    limit = min(limit, 100)

    client = get_supabase_client()
    projects = client.select(
        "projects",
        filters={"user_id": user_id},
        order="created_at.desc",
        limit=limit,
        offset=offset
    )

    return projects


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    user_id: str = Depends(get_current_user)
):
    """Get project details."""
    client = get_supabase_client()
    projects = client.select(
        "projects",
        filters={"id": project_id, "user_id": user_id},
        limit=1
    )

    if not projects:
        raise HTTPException(status_code=404, detail="Project not found")

    return projects[0]


@router.get("/{project_id}/audio", response_model=List[AudioFileResponse])
async def get_project_audio(
    project_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get all audio files for a project.
    
    Returns audio files ordered by version number.
    """
    # Verify project ownership
    client = get_supabase_client()
    projects = client.select(
        "projects",
        filters={"id": project_id, "user_id": user_id},
        limit=1
    )
    
    if not projects:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get audio files
    audio_files = client.select(
        "audio_files",
        filters={"project_id": project_id},
        order="version_number.asc"
    )
    
    return audio_files
