"""
Notifications API - Subscribe to email or push notifications for generation completion.
"""

import re
import json
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.supabase_client import get_supabase_client
from app.auth import get_current_user
from app.config import settings

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


class NotificationSubscribeRequest(BaseModel):
    job_id: str
    channel: str = "email"  # "email" or "push"
    destination: str  # email address or JSON push subscription


def _validate_email(email: str) -> bool:
    """Basic email validation."""
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))


def _validate_push_subscription(destination: str) -> bool:
    """Validate that destination is a valid push subscription JSON."""
    try:
        sub = json.loads(destination)
        return bool(sub.get("endpoint") and sub.get("keys", {}).get("p256dh") and sub.get("keys", {}).get("auth"))
    except (json.JSONDecodeError, AttributeError):
        return False


@router.get("/vapid-key")
async def get_vapid_key():
    """Return the public VAPID key for Push subscription."""
    if not settings.VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=503, detail="Push notifications not configured")
    return {"vapid_public_key": settings.VAPID_PUBLIC_KEY}


@router.post("/subscribe")
@limiter.limit("10/minute")
async def subscribe_notification(
    request: Request,
    body: NotificationSubscribeRequest,
    user_id: str = Depends(get_current_user),
):
    """
    Subscribe to a notification when a generation job completes.
    Supports email and push channels. One subscription per job_id (upsert).
    """
    channel = body.channel

    if channel == "email":
        if not _validate_email(body.destination):
            raise HTTPException(status_code=400, detail="Invalid email address")
    elif channel == "push":
        if not _validate_push_subscription(body.destination):
            raise HTTPException(status_code=400, detail="Invalid push subscription")
    else:
        raise HTTPException(status_code=400, detail="Invalid channel. Use 'email' or 'push'")

    client = get_supabase_client()

    # Verify the job belongs to the user
    jobs = client.select("generation_jobs", filters={"id": body.job_id}, limit=1)
    if not jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    if jobs[0]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your job")

    # Upsert: delete existing preference for this job, then insert
    try:
        client.delete("notification_preferences", filters={"job_id": body.job_id})
    except Exception:
        pass

    client.insert("notification_preferences", {
        "job_id": body.job_id,
        "user_id": user_id,
        "channel": channel,
        "destination": body.destination,
        "notified": False,
    })

    msg = "Notifications push activées" if channel == "push" else "Notification email activée"
    return {"success": True, "message": msg}
