"""
main.py
-------
DONEFY application entry point.

How it works:
  1. FastAPI starts on a background thread (localhost only, not exposed externally)
  2. We wait until the server responds to /api/health before opening the window
  3. PyWebView opens a native OS window that loads the React app
  4. The window looks and behaves like a native desktop application

Usage:
  Production:  python main.py
  Dev mode:    python main.py --dev   (load React from Vite on port 5173)
"""

import sys
import time
import threading
import argparse
import logging
import urllib.request

import uvicorn

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)


def _run_server():
    """Start the FastAPI/Uvicorn server. Runs on a daemon thread."""
    from app import create_app
    from config import get_config
    cfg = get_config()
    uvicorn.run(create_app(), host=cfg.HOST, port=cfg.PORT, log_level="warning")


def _wait_for_server(port, timeout=15):
    """
    Poll the health endpoint until the server is ready or timeout expires.
    Returns True if server started, False otherwise.
    """
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(f"http://localhost:{port}/api/health")
            return True
        except:
            time.sleep(0.3)
    return False


def main():
    parser = argparse.ArgumentParser(description="DONEFY Desktop App")
    parser.add_argument("--dev", action="store_true",
                        help="Load React from Vite dev server (port 5173)")
    args = parser.parse_args()

    from config import get_config
    cfg = get_config()

    # Start backend in background (daemon=True means it dies with the main process)
    threading.Thread(target=_run_server, daemon=True).start()

    if not _wait_for_server(cfg.PORT):
        logger.error("Server did not start within 15 seconds. Exiting.")
        sys.exit(1)

    # In dev mode, load from Vite's hot-reload server; otherwise use the built app
    url = "http://localhost:5173" if args.dev else f"http://localhost:{cfg.PORT}"
    logger.info("DONEFY ready at %s", url)

    try:
        import webview
        # Open native OS window — looks like a real app, not a browser
        webview.create_window(
            title    = "DONEFY",
            url      = url,
            width    = 1280,
            height   = 820,
            min_size = (960, 640),
        )
        webview.start(debug=args.dev)
    except ImportError:
        # Fallback if pywebview not installed: keep server alive, user opens browser
        logger.warning("pywebview not found. Open in browser: %s", url)
        threading.Event().wait()


if __name__ == "__main__":
    main()
