"""
routes/tasks.py
---------------
REST API endpoints for task CRUD operations.

Endpoints:
  GET    /api/tasks          — list all tasks
  POST   /api/tasks          — create a new task
  PUT    /api/tasks/{id}     — update fields of a task (partial update)
  DELETE /api/tasks/done     — delete all completed tasks, returns count
  DELETE /api/tasks/{id}     — delete a specific task by id
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import models

router = APIRouter()


class TaskIn(BaseModel):
    """Request body for creating a new task."""
    text:           str
    priority:       str            = "medium"
    due_date:       Optional[str]  = None   # YYYY-MM-DD
    reminder_time:  Optional[str]  = None   # YYYY-MM-DDTHH:MM
    reminder_email: Optional[str]  = None   # email to send reminder to
    image_path:     Optional[str]  = None   # relative path e.g. "uploads/abc.jpg"
    notes:          Optional[str]  = None   # extra notes


class TaskUpdate(BaseModel):
    """Request body for updating a task — all fields optional (partial update)."""
    text:           Optional[str] = None
    priority:       Optional[str] = None
    done:           Optional[int] = None   # 0 = pending, 1 = done
    due_date:       Optional[str] = None
    reminder_time:  Optional[str] = None
    reminder_email: Optional[str] = None
    reminder_sent:  Optional[int] = None
    image_path:     Optional[str] = None
    notes:          Optional[str] = None


@router.get("/tasks")
def list_tasks():
    """Return all tasks ordered by due_date ASC, then created_at DESC."""
    return models.get_all()


@router.post("/tasks", status_code=201)
def create_task(body: TaskIn):
    """Create a new task. Returns the created task object."""
    try:
        return models.create(**body.dict())
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.put("/tasks/{task_id}")
def update_task(task_id: int, body: TaskUpdate):
    """Partially update a task — only provided fields are changed."""
    # Filter out None values so existing fields aren't overwritten with null
    fields = {k: v for k, v in body.dict().items() if v is not None}
    try:
        result = models.update(task_id, **fields)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if result is None:
        raise HTTPException(404, "Task not found.")
    return result


@router.delete("/tasks/done")
def delete_done():
    """Delete all completed tasks. Returns count of deleted tasks."""
    return {"deleted": models.delete_done()}


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    """Delete a single task by id."""
    if not models.delete(task_id):
        raise HTTPException(404, "Task not found.")
    return {"message": "Deleted."}
