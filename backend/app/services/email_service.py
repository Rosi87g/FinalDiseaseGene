import urllib.request
import urllib.error
import json
from app.config import settings

def send_otp_email(to_email: str, otp: str, subject: str, purpose: str) -> bool:
    if purpose == "verification":
        heading = "Verify Your Email"
        body_text = "Use the code below to verify your email address."
        code_label = "AUTHORIZATION_CODE"
        footer_text = "This code expires in 10 minutes. If you didn't create an account, ignore this email."
    elif purpose == "password_reset":
        heading = "Reset Your Password"
        body_text = "Use the code below to reset your password."
        code_label = "RESET_CODE"
        footer_text = "This code expires in 10 minutes. If you didn't request a reset, ignore this email."
    elif purpose == "forgot_username":
        heading = "Your Username"
        body_text = "You requested your username. Here it is:"
        code_label = "YOUR_USERNAME"
        footer_text = "If you didn't request this, ignore this email. Your account is safe."
    else:
        heading = "Notification"
        body_text = ""
        code_label = "CODE"
        footer_text = ""

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0a0b0f;font-family:'Courier New',monospace;color:#e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0b0f;padding:40px 0;">
        <tr><td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#0d0e12;border:1px solid #181b24;border-radius:8px;overflow:hidden;">
            <tr><td style="background:#050507;padding:20px 32px;border-bottom:1px solid #181b24;">
              <span style="color:#00f5d4;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">
                // DISEASEGENEMAP &nbsp;·&nbsp; AUTH_SYSTEM
              </span>
            </td></tr>
            <tr><td style="padding:36px 32px;">
              <p style="margin:0 0 8px;font-size:11px;color:#64748b;letter-spacing:0.12em;text-transform:uppercase;">SECURE_NOTIFICATION</p>
              <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#ffffff;text-transform:uppercase;">{heading}</h1>
              <p style="margin:0 0 28px;font-size:13px;color:#94a3b8;line-height:1.6;">{body_text}</p>
              <div style="background:#050507;border:1px solid #00f5d4;border-radius:6px;padding:24px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:10px;color:#64748b;letter-spacing:0.15em;text-transform:uppercase;">{code_label}</p>
                <span style="font-size:36px;font-weight:700;color:#00f5d4;letter-spacing:0.35em;">{otp}</span>
              </div>
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">{footer_text}</p>
            </td></tr>
            <tr><td style="background:#050507;padding:16px 32px;border-top:1px solid #181b24;">
              <p style="margin:0;font-size:10px;color:#334155;text-align:center;">
                DISEASEGENEMAP &nbsp;·&nbsp; AUTOMATED SYSTEM MESSAGE &nbsp;·&nbsp; DO NOT REPLY
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    payload = json.dumps({
        "sender": {
            "name": getattr(settings, 'BREVO_SENDER_NAME', 'DiseaseGeneMap'),
            "email": getattr(settings, 'BREVO_SENDER_EMAIL', settings.BREVO_LOGIN)
        },
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=payload,
        headers={
            "accept": "application/json",
            "api-key": settings.BREVO_API_KEY,
            "content-type": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as response:
            print(f"[EMAIL SENT] dispatched to {to_email} — status {response.status}")
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"[EMAIL ERROR] HTTP {e.code} — {body}")
        return False
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {to_email}: {e}")
        return False