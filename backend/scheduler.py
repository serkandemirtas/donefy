"""backend/scheduler.py"""
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import models
from email_service import send_reminder_email
from config import get_config

logger = logging.getLogger(__name__)
_queue = []
_sched = BackgroundScheduler(timezone="UTC")


def get_queue():
    items = list(_queue); _queue.clear(); return items


def _check():
    for t in models.get_pending_reminders():
        if t.get("reminder_email"):
            send_reminder_email(t["reminder_email"], t["text"], t.get("due_date"))
        _queue.append({"id": t["id"], "title": "⏰ Reminder", "body": t["text"]})
        models.mark_reminder_sent(t["id"])


def start_scheduler():
    if _sched.running: return
    cfg = get_config()
    _sched.add_job(_check, IntervalTrigger(seconds=cfg.SCHEDULER_INTERVAL),
                   id="check", replace_existing=True)
    _sched.start()


def stop_scheduler():
    if _sched.running: _sched.shutdown(wait=False)
