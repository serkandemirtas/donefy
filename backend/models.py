"""backend/models.py — CRUD layer (no categories, date-based)"""
import time
from database import get_connection

VALID_PRIORITIES = {"low", "medium", "high"}


def _row(r): return dict(r)


def get_all():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM tasks ORDER BY due_date ASC NULLS LAST, created_at DESC").fetchall()
    conn.close()
    return [_row(r) for r in rows]


def get_by_id(task_id):
    conn = get_connection()
    row  = conn.execute("SELECT * FROM tasks WHERE id=?", (task_id,)).fetchone()
    conn.close()
    return _row(row) if row else None


def get_pending_reminders():
    now  = time.strftime("%Y-%m-%dT%H:%M", time.localtime())
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM tasks WHERE reminder_sent=0 AND reminder_time IS NOT NULL "
        "AND reminder_time<=? AND done=0", (now,)
    ).fetchall()
    conn.close()
    return [_row(r) for r in rows]


def create(text, priority="medium", due_date=None,
           reminder_time=None, reminder_email=None,
           image_path=None, notes=None):
    _validate(text, priority)
    conn   = get_connection()
    cursor = conn.execute(
        "INSERT INTO tasks (text,priority,done,created_at,due_date,"
        "reminder_time,reminder_email,reminder_sent,image_path,notes) "
        "VALUES (?,?,0,?,?,?,?,0,?,?)",
        (text.strip(), priority, int(time.time()*1000),
         due_date, reminder_time, reminder_email, image_path, notes),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM tasks WHERE id=?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return _row(row)


def update(task_id, **fields):
    ex = get_by_id(task_id)
    if not ex: return None
    text           = fields.get("text",           ex["text"])
    priority       = fields.get("priority",       ex["priority"])
    done           = int(fields.get("done",        ex["done"]))
    due_date       = fields.get("due_date",        ex["due_date"])
    reminder_time  = fields.get("reminder_time",   ex["reminder_time"])
    reminder_email = fields.get("reminder_email",  ex["reminder_email"])
    reminder_sent  = int(fields.get("reminder_sent", ex["reminder_sent"]))
    image_path     = fields.get("image_path",      ex["image_path"])
    notes          = fields.get("notes",           ex["notes"])
    _validate(text, priority)
    conn = get_connection()
    conn.execute(
        "UPDATE tasks SET text=?,priority=?,done=?,due_date=?,"
        "reminder_time=?,reminder_email=?,reminder_sent=?,image_path=?,notes=? WHERE id=?",
        (text.strip(), priority, done, due_date, reminder_time,
         reminder_email, reminder_sent, image_path, notes, task_id),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM tasks WHERE id=?", (task_id,)).fetchone()
    conn.close()
    return _row(row)


def mark_reminder_sent(task_id):
    conn = get_connection()
    conn.execute("UPDATE tasks SET reminder_sent=1 WHERE id=?", (task_id,))
    conn.commit()
    conn.close()


def delete(task_id):
    if not get_by_id(task_id): return False
    conn = get_connection()
    conn.execute("DELETE FROM tasks WHERE id=?", (task_id,))
    conn.commit()
    conn.close()
    return True


def delete_done():
    conn = get_connection()
    cur  = conn.execute("DELETE FROM tasks WHERE done=1")
    conn.commit()
    n = cur.rowcount
    conn.close()
    return n


def _validate(text, priority):
    if not str(text).strip():
        raise ValueError("Task text cannot be empty.")
    if priority not in VALID_PRIORITIES:
        raise ValueError(f"Invalid priority: {priority}")
