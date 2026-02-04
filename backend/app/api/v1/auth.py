"""
Auth API routes - Uses Supabase REST API.
"""

from fastapi import APIRouter, Depends, HTTPException

from app.supabase_client import get_supabase_client
from app.auth import get_current_user
from app.schemas import ProfileResponse

router = APIRouter()


@router.get("/me", response_model=ProfileResponse)
async def get_current_user_profile(
    user_id: str = Depends(get_current_user)
):
    """
    Get current authenticated user profile.

    Requires: Authorization Bearer token
    """
    client = get_supabase_client()
    profiles = client.select("profiles", filters={"id": user_id}, limit=1)

    if not profiles:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profiles[0]
