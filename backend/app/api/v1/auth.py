"""
Auth API routes.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.profile import Profile
from app.schemas import ProfileResponse

router = APIRouter()


@router.get("/me", response_model=ProfileResponse)
async def get_current_user_profile(
    user: Profile = Depends(get_current_user)
):
    """
    Get current authenticated user profile.
    
    Requires: Authorization Bearer token
    """
    return user
