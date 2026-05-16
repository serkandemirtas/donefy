<img width="1024" height="559" alt="4aa2ff3e-0b83-47e1-8389-39966bcaa987" src="https://github.com/user-attachments/assets/b08e39ad-dd0c-490a-9c52-b57bcb2cce34" />

---
# DONEFY — AI-Powered Productivity

A desktop todo app built with FastAPI, React, and PyWebView.  
Supports Anthropic Claude, OpenAI GPT, and Google Gemini for AI features.

---
<img width="1024" height="559" alt="4aa2ff3e-0b83-47e1-8389-39966bcaa987" src="https://github.com/user-attachments/assets/b8b022f5-7b3b-4508-9e6b-247a00f7c0c0" />
<img width="1918" height="987" alt="Ekran görüntüsü 2026-05-16 213942" src="https://github.com/user-attachments/assets/03d98e24-4ca8-4fb3-9144-c3f4814abbcb" />
<img width="1915" height="988" alt="Ekran görüntüsü 2026-05-16 215447" src="https://github.com/user-attachments/assets/b7a40a81-41a2-47da-84f3-619520d5983e" />
<img width="1912" height="922" alt="Ekran görüntüsü 2026-05-16 215458" src="https://github.com/user-attachments/assets/394f2164-8851-4923-9754-eef065889513" />
<img width="1917" height="923" alt="Ekran görüntüsü 2026-05-16 215509" src="https://github.com/user-attachments/assets/dcd72ff0-0cd2-45e2-bfa6-f2b6701adced" />
<img width="1915" height="990" alt="Ekran görüntüsü 2026-05-16 215523" src="https://github.com/user-attachments/assets/db7e1cbc-db7c-4be3-9ff0-d834a7673124" />
<img width="1915" height="922" alt="Ekran görüntüsü 2026-05-16 215535" src="https://github.com/user-attachments/assets/631d4c79-75b7-4ec6-94f6-1863a5e2b7e8" />
<img width="1913" height="921" alt="Ekran görüntüsü 2026-05-16 215556" src="https://github.com/user-attachments/assets/a526a33c-27fe-4b57-8872-2e5fc77b4bce" />
<img width="1908" height="922" alt="Ekran görüntüsü 2026-05-16 215617" src="https://github.com/user-attachments/assets/ad11864c-6c7d-4871-9be4-c99bf2d113b4" />
<img width="1912" height="987" alt="Ekran görüntüsü 2026-05-16 215632" src="https://github.com/user-attachments/assets/d0282a5e-a0ac-422c-ac11-a0b9882cd3cb" />

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
