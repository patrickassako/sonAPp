"""
Email sender via SMTP for BimZik notifications.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import settings


def send_notification_email(to_email: str, track_title: str, style_id: str, share_url: str, image_url: str = ""):
    """Send a generation-completed notification email."""
    if not settings.SMTP_PASSWORD:
        print("⚠️ SMTP_PASSWORD not configured, skipping email notification")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = f"BimZik <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg["Subject"] = f"🎵 {track_title} - Votre morceau est prêt !"

    html = f"""\
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #7F13EC, #FFD700); padding: 32px; text-align: center;">
    <h1 style="margin: 0; font-size: 28px; color: #ffffff;">🎵 Votre morceau est prêt !</h1>
  </div>
  <div style="padding: 32px;">
    {"<div style='text-align: center; margin-bottom: 24px;'><img src='" + image_url + "' alt='Pochette' style='width: 200px; height: 200px; border-radius: 12px; object-fit: cover;' /></div>" if image_url else ""}
    <h2 style="color: #FFD700; text-align: center; margin: 0 0 8px;">{track_title}</h2>
    <p style="color: #888; text-align: center; margin: 0 0 32px;">Style : {style_id}</p>
    <div style="text-align: center;">
      <a href="{share_url}" style="display: inline-block; background: linear-gradient(135deg, #7F13EC, #FFD700); color: #000; font-weight: bold; padding: 14px 40px; border-radius: 50px; text-decoration: none; font-size: 16px;">🎧 Écouter maintenant</a>
    </div>
    <p style="color: #666; text-align: center; margin-top: 32px; font-size: 12px;">BimZik - Créez votre musique avec l'IA</p>
  </div>
</div>"""

    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        print(f"📧 Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"⚠️ SMTP error: {e}")
        return False
