"""
Web Push notification sender using pywebpush.
"""

import json
from pywebpush import webpush, WebPushException
from app.config import settings


def send_push_notification(subscription_json: str, title: str, body: str, url: str) -> bool:
    """Send a Web Push notification to a subscribed client."""
    try:
        subscription = json.loads(subscription_json)
        payload = json.dumps({"title": title, "body": body, "url": url})
        webpush(
            subscription_info=subscription,
            data=payload,
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_CLAIMS_EMAIL},
        )
        return True
    except WebPushException as e:
        print(f"Web Push error: {e}")
        return False
    except Exception as e:
        print(f"Web Push unexpected error: {e}")
        return False
