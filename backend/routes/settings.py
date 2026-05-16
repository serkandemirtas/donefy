from fastapi import APIRouter, HTTPException
from config import get_config, save_settings
import email_service

router = APIRouter()
_MASK  = "••••••••"


def _mask(s): return _MASK if s else ""
def _is_mask(v): return isinstance(v, str) and set(v).issubset({"•"})


@router.get("/settings")
def get_settings():
    cfg = get_config()
    return {
        "port":               cfg.PORT,
        "ai_provider":        cfg.AI_PROVIDER,
        "anthropic_api_key":  _mask(cfg.ANTHROPIC_API_KEY),
        "anthropic_model":    cfg.ANTHROPIC_MODEL,
        "openai_api_key":     _mask(cfg.OPENAI_API_KEY),
        "openai_model":       cfg.OPENAI_MODEL,
        "gemini_api_key":     _mask(cfg.GEMINI_API_KEY),
        "gemini_model":       cfg.GEMINI_MODEL,
        "mail_host":          cfg.MAIL_HOST,
        "mail_port":          cfg.MAIL_PORT,
        "mail_use_tls":       cfg.MAIL_USE_TLS,
        "mail_user":          cfg.MAIL_USER,
        "mail_password":      _mask(cfg.MAIL_PASSWORD),
        "scheduler_interval": cfg.SCHEDULER_INTERVAL,
        "theme":              cfg.THEME,
        "language":           cfg.LANGUAGE,
    }


@router.get("/settings/theme")
def get_theme(): return {"theme": get_config().THEME, "language": get_config().LANGUAGE}


@router.put("/settings")
def update_settings(body: dict):
    updates = {k: v for k, v in body.items() if v is not None and not _is_mask(v)}
    if not updates: raise HTTPException(400, "No fields to update.")
    new = save_settings(updates)
    for k in ("anthropic_api_key","openai_api_key","gemini_api_key","mail_password"):
        new[k] = _mask(new.get(k, ""))
    return new


@router.post("/settings/test-email")
def test_email(body: dict):
    to = body.get("to", "").strip()
    if not to: raise HTTPException(400, "Recipient email required.")
    ok = email_service.send_reminder_email(to, "This is a test email from DONEFY ✓")
    if not ok: raise HTTPException(503, "Failed to send email. Check SMTP settings.")
    return {"message": f"Test email sent to {to}."}
