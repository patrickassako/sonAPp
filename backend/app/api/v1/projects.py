"""
Projects API routes - Migrated to Supabase REST API.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List
import uuid
from datetime import datetime

from app.supabase_client import get_supabase_client
from app.auth import get_current_user
from app.schemas import ProjectCreate, ProjectResponse, AudioFileResponse

router = APIRouter()


@router.post("/", response_model=ProjectResponse, status_code=201)
async def create_project(
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
        "context_input": project_data.context_input,
        "lyrics_final": project_data.lyrics_final,
        "status": "draft"
    })
    
    return project


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    user_id: str = Depends(get_current_user)
):
    """
    List all projects for the current user.
    
    Returns projects ordered by creation date (newest first).
    """
    client = get_supabase_client()
    projects = client.select(
        "projects", 
        filters={"user_id": user_id},
        order="created_at.desc"
    )
    
    return projects


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    user_id: str = Depends(get_current_user)
):
    """Get project details."""
    if project_id.startswith("mock-"):
        return {
            "id": project_id,
            "user_id": user_id,
            "title": "Mock Project",
            "mode": "TEXT",
            "language": "en",
            "style_id": "Afrobeats",
            "context_input": None,
            "lyrics_final": "[Verse 1]\nThis is a mock song\nTesting the versions\n[Chorus]\nYeah yeah",
            "status": "completed",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }

    client = get_supabase_client()
    # Debug: First check if project exists at all
    projects = client.select(
        "projects",
        filters={"id": project_id},
        limit=1
    )
    
    if not projects:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found in database")
        
    project = projects[0]
    
    # Check ownership
    if project["user_id"] != user_id:
        raise HTTPException(status_code=403, detail=f"Project belongs to user {project['user_id']}, not {user_id}")
    
    return project


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
    if project_id.startswith("mock-"):
        return [
            {
                "id": str(uuid.uuid4()),
                "file_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                "stream_url": None,
                "image_url": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bXVzaWN8ZW58MHx8MHx8fDA%3D",
                "duration": 120,
                "version_number": 1,
                "created_at": datetime.now()
            },
            {
                "id": str(uuid.uuid4()),
                "file_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                "stream_url": None,
                "image_url": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bXVzaWN8ZW58MHx8MHx8fDA%3D",
                "duration": 130,
                "version_number": 2,
                "created_at": datetime.now()
            }
        ]

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
