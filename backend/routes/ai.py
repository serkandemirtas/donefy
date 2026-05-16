"""
routes/ai.py
------------
AI-powered endpoints. All responses are in the user's selected language.

Endpoints:
  POST /api/ai/rough-to-tasks  — convert free-form voice/text to a task list
  POST /api/ai/suggest         — generate tasks from a goal description
  POST /api/ai/prioritise      — recommend which task to focus on
  POST /api/ai/chat            — free-form assistant chat with task context
"""

from fastapi import APIRouter, HTTPException
import models
import ai_service

router = APIRouter()


@router.post("/rough-to-tasks")
def rough_to_tasks(body: dict):
    """
    Convert unstructured input (voice transcript or free-form text) into
    a structured list of tasks with priority, due date, and notes.
    Body: { text: str, lang: "en"|"tr" }
    """
    text = body.get("text", "").strip()
    lang = body.get("lang", "en")
    if not text:
        raise HTTPException(400, "'text' field is required.")
    try:
        return {"tasks": ai_service.rough_to_tasks(text, lang)}
    except RuntimeError as e:
        raise HTTPException(503, str(e))


@router.post("/suggest")
def suggest(body: dict):
    """
    Generate 3–7 actionable task strings from a goal description.
    Body: { goal: str, lang: "en"|"tr" }
    """
    goal = body.get("goal", "").strip()
    lang = body.get("lang", "en")
    if not goal:
        raise HTTPException(400, "'goal' field is required.")
    try:
        return {"tasks": ai_service.suggest_tasks(goal, lang)}
    except RuntimeError as e:
        raise HTTPException(503, str(e))


@router.post("/prioritise")
def prioritise(body: dict = {}):
    """
    Analyse all pending tasks and return a prioritisation recommendation.
    Body: { lang: "en"|"tr" }
    """
    lang = body.get("lang", "en")
    try:
        return {"recommendation": ai_service.prioritise(models.get_all(), lang)}
    except RuntimeError as e:
        raise HTTPException(503, str(e))


@router.post("/chat")
def chat(body: dict):
    """
    Free-form chat with the AI assistant. The AI has access to the user's task list.
    Body: { message: str, lang: "en"|"tr" }
    """
    msg  = body.get("message", "").strip()
    lang = body.get("lang", "en")
    if not msg:
        raise HTTPException(400, "'message' field is required.")
    try:
        return {"reply": ai_service.chat(msg, models.get_all(), lang)}
    except RuntimeError as e:
        raise HTTPException(503, str(e))
