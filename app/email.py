import asyncio
import smtplib
from email.mime.text import MIMEText
from app.config import settings


def _send_email_sync(email: str, code: str):
    """Synchronous worker function executed in a background thread."""
    msg = MIMEText(f"Your VaultID verification code is: {code}\n\nThis code will expire in 10 minutes.")
    msg["Subject"] = "VaultID - Authentication OTP"
    msg["From"] = settings.EMAIL_FROM or "noreply@vaultid.com"
    msg["To"] = email

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
        server.starttls()
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)


async def send_otp_email(email: str, code: str):
    """Sends an OTP email and prints the code to the terminal for local testing."""
    
    # 1. Print prominent terminal log for fast local testing
    print("\n" + "=" * 55)
    print(f"🔑 [VaultID DEV LOG] Target: {email} | OTP Code: {code}")
    print("=" * 55 + "\n")

    # 2. Check if valid SMTP settings exist before attempting to send
    if not settings.SMTP_HOST or "example.com" in settings.SMTP_HOST:
        print("[VaultID] Skipping SMTP dispatch (SMTP_HOST is unconfigured or set to example.com).")
        return

    # 3. Offload blocking smtplib network calls to a thread pool
    try:
        await asyncio.to_thread(_send_email_sync, email, code)
        print(f"[VaultID] OTP email successfully dispatched to {email}")
    except Exception as e:
        print(f"[VaultID] Failed to send email via SMTP: {e}")