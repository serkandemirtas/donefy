"""backend/database.py"""
import sqlite3
from config import get_config


def get_connection():
    cfg  = get_config()
    conn = sqlite3.connect(str(cfg.DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            text           TEXT    NOT NULL,
            priority       TEXT    NOT NULL DEFAULT 'medium',
            done           INTEGER NOT NULL DEFAULT 0,
            created_at     INTEGER NOT NULL,
            due_date       TEXT,
            reminder_time  TEXT,
            reminder_email TEXT,
            reminder_sent  INTEGER NOT NULL DEFAULT 0,
            image_path     TEXT,
            notes          TEXT
        )
    """)
    # migrations
    for col, typedef in [("image_path","TEXT"), ("notes","TEXT")]:
        try:
            conn.execute(f"ALTER TABLE tasks ADD COLUMN {col} {typedef}")
        except:
            pass
    conn.commit()
    conn.close()
    print("✅ Database ready")
