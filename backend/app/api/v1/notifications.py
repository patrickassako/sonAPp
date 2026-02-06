"""
Notifications API - Subscribe to email notifications for generation completion.
"""

import re
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.supabase_client import get_supabase_client
from app.auth import get_current_user

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


class NotificationSubscribeRequest(BaseModel):
    job_id: str
    destination: str  # email address


def _validate_email(email: str) -> bool:
    """Basic email validation."""
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))


@router.post("/subscribe")
@limiter.limit("10/minute")
async def subscribe_notification(
    request: Request,
    body: NotificationSubscribeRequest,
    user_id: str = Depends(get_current_user),
):
    """
    Subscribe to an email notification when a generation job completes.
    One subscription per job_id (upsert).
    """
    if not _validate_email(body.destination):
        raise HTTPException(status_code=400, detail="Invalid email address")

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
        "channel": "email",
        "destination": body.destination,
        "notified": False,
    })

    return {"success": True, "message": "Notification email activée"}
