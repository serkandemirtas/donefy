"""backend/ai_service.py — Multi-provider AI"""
import json, logging, time
from config import get_config

logger = logging.getLogger(__name__)


def _call(system, user, max_tokens=2048):
    cfg      = get_config()
    provider = cfg.AI_PROVIDER.lower()
    if provider == "openai":
        from openai import OpenAI
        if not cfg.OPENAI_API_KEY:
            raise RuntimeError("OpenAI API key missing. Go to Settings → AI.")
        r = OpenAI(api_key=cfg.OPENAI_API_KEY).chat.completions.create(
            model=cfg.OPENAI_MODEL, max_tokens=max_tokens,
            messages=[{"role":"system","content":system},{"role":"user","content":user}])
        return r.choices[0].message.content
    if provider == "gemini":
        import google.generativeai as genai
        if not cfg.GEMINI_API_KEY:
            raise RuntimeError("Gemini API key missing. Go to Settings → AI.")
        genai.configure(api_key=cfg.GEMINI_API_KEY)
        r = genai.GenerativeModel(cfg.GEMINI_MODEL, system_instruction=system)\
              .generate_content(user, generation_config={"max_output_tokens": max_tokens})
        return r.text
    import anthropic
    if not cfg.ANTHROPIC_API_KEY:
        raise RuntimeError("Anthropic API key missing. Go to Settings → AI.")
    r = anthropic.Anthropic(api_key=cfg.ANTHROPIC_API_KEY).messages.create(
        model=cfg.ANTHROPIC_MODEL, max_tokens=max_tokens,
        system=system, messages=[{"role":"user","content":user}])
    return r.content[0].text


def _strip(raw):
    raw = raw.strip()
    if raw.startswith("```"): raw = "\n".join(raw.split("\n")[1:])
    return raw.rstrip("`").strip()


def rough_to_tasks(rough_text, lang="en"):
    today = time.strftime("%Y-%m-%d")
    if lang == "tr":
        system = (
            f"Sen bir yapılacaklar asistanısın. Bugün: {today}.\n"
            "SADECE JSON dizisi döndür:\n"
            '[{"text":"görev","priority":"low|medium|high","due_date":"YYYY-MM-DD veya null","notes":"detay veya null"}]'
        )
        prompt = f"Kaba metin:\n{rough_text}"
    else:
        system = (
            f"You are a task assistant. Today: {today}.\n"
            "Return ONLY a JSON array:\n"
            '[{"text":"task","priority":"low|medium|high","due_date":"YYYY-MM-DD or null","notes":"detail or null"}]'
        )
        prompt = f"Input:\n{rough_text}"
    raw = _call(system, prompt, 2048)
    try:
        tasks = json.loads(_strip(raw))
        if isinstance(tasks, list):
            return [{"text":str(t.get("text","")).strip(),"priority":t.get("priority","medium"),
                     "due_date":t.get("due_date"),"notes":t.get("notes")}
                    for t in tasks if str(t.get("text","")).strip()]
    except Exception as e:
        logger.error("JSON parse error: %s", e)
    return [{"text":rough_text.strip(),"priority":"medium","due_date":None,"notes":None}]


def suggest_tasks(goal, lang="en"):
    system = "Return ONLY a raw JSON array of 3-7 concise actionable task strings. No markdown."
    if lang == "tr": system += " Respond in Turkish."
    raw = _call(system, f"Goal: {goal}", 512)
    try:
        t = json.loads(_strip(raw))
        if isinstance(t, list): return [str(x) for x in t]
    except: pass
    return [raw.strip()]


def prioritise(tasks, lang="en"):
    if not tasks:
        return "No pending tasks!" if lang == "en" else "Bekleyen görev yok!"
    summary = "\n".join(f"- [{t['priority']}] {t['text']}" + (f" [due: {t['due_date']}]" if t.get("due_date") else "")
                        for t in tasks if not t.get("done"))
    lang_note = "Respond in Turkish." if lang == "tr" else "Respond in English."
    return _call(f"You are a productivity expert. Analyse tasks and give a short prioritisation advice (3-5 sentences). {lang_note}",
                 f"Tasks:\n{summary}")


def chat(message, tasks, lang="en"):
    pending = [t for t in tasks if not t.get("done")]
    context = "\n".join(f"- [{t['priority']}] {t['text']}" for t in pending[:20])
    lang_note = "Respond in Turkish." if lang == "tr" else "Respond in English."
    system = f"You are a task assistant. Give short practical answers. {lang_note}\nUser's tasks:\n{context or '(none)'}"
    return _call(system, message)
