# VaultID Email OTP Engine (app/services/otp.py)
import random
import time
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

otp_store = {}
OTP_EXPIRY_SECONDS = 300 

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")

def send_email_otp(target_email: str, code: str):
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = target_email
    msg['Subject'] = "Your VaultID Security Verification Code"

    body = f"""
    Hello,

    Your VaultID verification code is: {code}

    This code will expire in 5 minutes. If you did not request this code, please ignore this message.

    Best regards,
    VaultID Security Team
    """
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"[EMAIL ENGINE] Dispatched OTP to {target_email}")
    except Exception as e:
        print(f"[EMAIL ENGINE ERROR] Failed to send email: {e}")

def generate_otp(user_id: int, target_email: str = None) -> str:
    code = f"{random.randint(100000, 999999)}"
    expires_at = time.time() + OTP_EXPIRY_SECONDS
    
    otp_store[user_id] = {
        "code": code,
        "expires_at": expires_at
    }

    print(f"\n[CONSOLE DEBUG] Generated OTP for User {user_id}: {code}\n")

    if target_email and SENDER_EMAIL:
        send_email_otp(target_email, code)

    return code

def verify_otp(user_id: int, input_code: str) -> bool:
    record = otp_store.get(user_id)
    if not record:
        return False
    
    if time.time() > record["expires_at"]:
        del otp_store[user_id]
        return False
    
    if record["code"] == input_code:
        del otp_store[user_id]
        return True
    
    return False