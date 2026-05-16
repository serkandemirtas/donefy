# DONEFY — AI-Powered Productivity

A desktop todo app built with FastAPI, React, and PyWebView.  
Supports Anthropic Claude, OpenAI GPT, and Google Gemini for AI features.

---

## Features

- Task management — add, edit, delete, complete
- Date grouping: Today / Upcoming / No Date / Overdue
- Priority levels: High / Medium / Low
- Due dates & email reminders (SMTP)
- Voice input (browser Web Speech API)
- **AI Capture** — speak or type freely, AI structures tasks
- **AI Assistant** — chat, prioritize, suggest tasks from a goal
- Photo attachments per task
- Monthly calendar view
- Multi-provider AI: Anthropic / OpenAI / Gemini
- Dark / Light / System theme
- English / Turkish language

---

## Quick Start (Source)

**Requirements:** Python 3.10+, Node.js 18+

```bash
# 1. Clone
git clone https://github.com/srkn-pc/donefy.git
cd donefy

# 2. Install & run (Windows)
setup.bat
```

Or manually:

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
npm run build

# Run
cd ../backend
python main.py
```

---

## Build EXE

```bash
# Double-click or run:
build-exe.bat
# Output: backend/dist/DONEFY/DONEFY.exe
```

For a full installer wizard, install [Inno Setup 6](https://jrsoftware.org/isdl.php) then run `build-installer.bat`.

---

## Configuration

Open the app → **Settings (⚙)** in the sidebar:

| Setting | Description |
|---------|-------------|
| AI Provider | Anthropic / OpenAI / Gemini + API key |
| Theme | Dark / Light / System |
| Language | English / Turkish |
| Email (SMTP) | Gmail or any SMTP for reminders |

---

## Project Structure

```
donefy/
├── backend/
│   ├── main.py          # Entry point (FastAPI + PyWebView)
│   ├── app.py           # App factory, routers, static files
│   ├── config.py        # Settings loader
│   ├── database.py      # SQLite connection
│   ├── models.py        # Task CRUD
│   ├── ai_service.py    # Multi-provider AI calls
│   ├── scheduler.py     # Reminder scheduler (APScheduler)
│   ├── email_service.py # SMTP email sender
│   └── routes/          # FastAPI routers (tasks, ai, settings, …)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/  # TaskCard, AddTask, AICapture, AIPanel, …
│   │   ├── hooks/       # useTasks, useLang
│   │   ├── services/    # api.js
│   │   └── styles/      # index.css
│   └── public/logo.png
├── setup.bat            # First-time setup
├── run.bat              # Daily launcher
├── build-exe.bat        # Build portable EXE
└── build-installer.bat  # Build installer (needs Inno Setup)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | PyWebView |
| Backend | FastAPI + Uvicorn |
| Database | SQLite |
| Frontend | React 18 + Vite |
| AI | Anthropic SDK / OpenAI SDK / google-generativeai |
| Scheduler | APScheduler |
