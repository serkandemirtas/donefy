"""backend/email_service.py"""
import smtplib, logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import get_config

logger = logging.getLogger(__name__)


def send_reminder_email(to, task_text, due_date=None):
    cfg = get_config()
    if not cfg.MAIL_USER or not cfg.MAIL_PASSWORD:
        logger.warning("Email credentials not set.")
        return False
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"⏰ Reminder: {task_text[:60]}"
    msg["From"]    = cfg.MAIL_USER
    msg["To"]      = to
    html = f"""<html><body style='font-family:sans-serif;background:#0a0a0f;color:#e2e2e8;padding:32px'>
    <div style='max-width:480px;margin:auto;background:#13131a;border:1px solid #2a2a3a;border-radius:12px;padding:28px'>
    <p style='font-size:11px;letter-spacing:.2em;color:#4a9eff;text-transform:uppercase;margin:0 0 12px'>DONEFY · Reminder</p>
    <h2 style='font-size:20px;margin:0 0 16px'>⏰ {task_text}</h2>
    {'<p style="color:#6e6e8e">Due: '+due_date+'</p>' if due_date else ''}
    </div></body></html>"""
    msg.attach(MIMEText(task_text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))
    try:
        with smtplib.SMTP(cfg.MAIL_HOST, cfg.MAIL_PORT) as s:
            if cfg.MAIL_USE_TLS: s.starttls()
            s.login(cfg.MAIL_USER, cfg.MAIL_PASSWORD)
            s.sendmail(cfg.MAIL_USER, to, msg.as_string())
        return True
    except Exception as e:
        logger.error("Email error: %s", e)
        return False
