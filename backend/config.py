"""backend/config.py"""
import json, sys
from pathlib import Path

BASE_DIR      = Path(__file__).parent
SETTINGS_FILE = BASE_DIR / "settings.json"

_DEFAULTS = {
    "port": 5000,
    "ai_provider":        "anthropic",
    "anthropic_api_key":  "",
    "anthropic_model":    "claude-opus-4-6",
    "openai_api_key":     "",
    "openai_model":       "gpt-4o",
    "gemini_api_key":     "",
    "gemini_model":       "gemini-1.5-pro",
    "mail_host":          "smtp.gmail.com",
    "mail_port":          587,
    "mail_use_tls":       True,
    "mail_user":          "",
    "mail_password":      "",
    "scheduler_interval": 60,
    "theme":              "dark",
    "language":           "en",
}


def _load():
    if not SETTINGS_FILE.exists():
        SETTINGS_FILE.write_text(json.dumps(_DEFAULTS, indent=2))
        return dict(_DEFAULTS)
    try:
        return {**_DEFAULTS, **json.loads(SETTINGS_FILE.read_text())}
    except:
        return dict(_DEFAULTS)


def save_settings(new_values: dict) -> dict:
    current = _load()
    current.update(new_values)
    SETTINGS_FILE.write_text(json.dumps(current, indent=2))
    return current


class Config:
    def __init__(self):
        s = _load()
        self.BASE_DIR      = BASE_DIR
        self.DB_PATH       = BASE_DIR / "todos.db"
        self.UPLOAD_DIR    = BASE_DIR / "uploads"
        self.FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"
        self.HOST          = "127.0.0.1"
        self.PORT          = int(s.get("port", 5000))
        self.AI_PROVIDER       = s.get("ai_provider",        "anthropic")
        self.ANTHROPIC_API_KEY = s.get("anthropic_api_key",  "")
        self.ANTHROPIC_MODEL   = s.get("anthropic_model",    "claude-opus-4-6")
        self.OPENAI_API_KEY    = s.get("openai_api_key",     "")
        self.OPENAI_MODEL      = s.get("openai_model",       "gpt-4o")
        self.GEMINI_API_KEY    = s.get("gemini_api_key",     "")
        self.GEMINI_MODEL      = s.get("gemini_model",       "gemini-1.5-pro")
        self.MAIL_HOST         = s.get("mail_host",          "smtp.gmail.com")
        self.MAIL_PORT         = int(s.get("mail_port",      587))
        self.MAIL_USE_TLS      = bool(s.get("mail_use_tls",  True))
        self.MAIL_USER         = s.get("mail_user",          "")
        self.MAIL_PASSWORD     = s.get("mail_password",      "")
        self.SCHEDULER_INTERVAL = int(s.get("scheduler_interval", 60))
        self.THEME             = s.get("theme",    "dark")
        self.LANGUAGE          = s.get("language", "en")


def get_config():
    return Config()
