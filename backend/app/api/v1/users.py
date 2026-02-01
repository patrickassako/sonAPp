"""
Users API routes.
"""

from fastapi import APIRouter, Depends, HTTPException

from app.supabase_client import get_supabase_client
from app.auth import get_current_user
from app.schemas import ProfileResponse, WalletResponse

router = APIRouter()


@router.get("/profile", response_model=ProfileResponse)
async def get_user_profile(
    user_id: str = Depends(get_current_user)
):
    """Get current user profile."""
    client = get_supabase_client()
    profiles = client.select("profiles", filters={"id": user_id}, limit=1)
    
    if not profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return profiles[0]


@router.get("/wallet", response_model=WalletResponse)
async def get_user_wallet(
    user_id: str = Depends(get_current_user)
):
    """
    Get user wallet information.
    
    Returns available credits, reserved credits, and spending history.
    """
    client = get_supabase_client()
    profiles = client.select("profiles", filters={"id": user_id}, limit=1)
    
    if not profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    user = profiles[0]
    return WalletResponse(
        credits=user["credits"],
        credits_reserved=user["credits_reserved"],
        credits_available=user["credits"] - user["credits_reserved"],
        total_spent=user["total_credits_spent"],
        total_spent_money=str(user["total_spent_money"])
    )
