"""
app.py
------
FastAPI application factory for DONEFY.

Responsibilities:
  - Registers all API routers under /api
  - Serves uploaded images from /uploads
  - Serves the built React app (frontend/dist/) in production
  - Falls back to index.html for any non-API path (SPA routing)
  - Starts the database and reminder scheduler on startup

Logo fix: we mount the full dist/ directory as StaticFiles so that
/logo.png (copied there by Vite from public/) is served correctly.
Previously only /assets was mounted, causing /logo.png to return index.html.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse

from config    import get_config
from database  import init_db
from scheduler import start_scheduler, stop_scheduler

from routes.tasks         import router as tasks_router
from routes.settings      import router as settings_router
from routes.ai            import router as ai_router
from routes.notifications import router as notif_router
from routes.upload        import router as upload_router, UPLOAD_DIR


def create_app() -> FastAPI:
    app = FastAPI(title="DONEFY", version="1.0.0")
    cfg = get_config()

    # Allow requests from Vite dev server and the production server itself
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── API routers ────────────────────────────────────────────────────────────
    app.include_router(tasks_router,    prefix="/api")
    app.include_router(settings_router, prefix="/api")
    app.include_router(ai_router,       prefix="/api/ai")
    app.include_router(notif_router,    prefix="/api")
    app.include_router(upload_router,   prefix="/api")

    # ── Serve uploaded images ─────────────────────────────────────────────────
    UPLOAD_DIR.mkdir(exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    # ── Serve React build in production ───────────────────────────────────────
    dist = cfg.FRONTEND_DIST

    if dist.exists():
        # Mount /assets for JS/CSS chunks (Vite puts them here)
        assets_dir = dist / "assets"
        if assets_dir.exists():
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

        # Explicitly serve logo.png and other root-level static files from dist/
        # This fixes the logo not appearing — Vite copies public/ to dist/ root.
        @app.get("/logo.png")
        def serve_logo():
            return FileResponse(dist / "logo.png")

        # SPA fallback: all other non-API paths return index.html so React Router works
        @app.get("/{full_path:path}")
        def spa(full_path: str):
            return FileResponse(dist / "index.html")

    else:
        # Frontend not built yet — show a helpful error page
        @app.get("/{full_path:path}")
        def no_build(full_path: str):
            return HTMLResponse("""<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:system-ui;background:#08080f;color:#e8e8f0;
       display:flex;align-items:center;justify-content:center;
       height:100vh;margin:0;flex-direction:column;gap:12px}
  h2{color:#f87171} code{background:#18182a;padding:8px 16px;border-radius:8px;font-size:14px}
</style></head><body>
<h2>⚠ Frontend not built</h2>
<p>Run in the <b>frontend/</b> folder:</p>
<code>npm install</code><code>npm run build</code>
<p>Or double-click <b>setup.bat</b></p>
</body></html>""")

    # ── Lifecycle hooks ────────────────────────────────────────────────────────
    @app.on_event("startup")
    def on_startup():
        """Initialize database tables and start the reminder scheduler."""
        init_db()
        start_scheduler()

    @app.on_event("shutdown")
    def on_shutdown():
        """Gracefully stop the scheduler when the server exits."""
        stop_scheduler()

    return app
