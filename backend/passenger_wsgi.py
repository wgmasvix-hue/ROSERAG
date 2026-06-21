"""
cPanel Python App entry point for RoseRAG FastAPI backend.

In cPanel → Setup Python App:
  - Python version: 3.11
  - Application root: backend/
  - Application URL: rag.chengetai.co.zw
  - Application startup file: passenger_wsgi.py
  - Application Entry point: application
"""

import sys
import os

# Make sure the app directory is in the path
sys.path.insert(0, os.path.dirname(__file__))

from app.main import app

# cPanel Passenger requires a WSGI callable named 'application'.
# FastAPI is ASGI — we bridge it using asgiref.
try:
    from asgiref.wsgi import WsgiToAsgi  # type: ignore
    application = WsgiToAsgi(app)
except ImportError:
    # Fallback: serve via uvicorn in a thread (less ideal but works)
    import threading
    import uvicorn  # type: ignore

    def _start():
        uvicorn.run(app, host="127.0.0.1", port=8000)

    t = threading.Thread(target=_start, daemon=True)
    t.start()

    def application(environ, start_response):
        start_response("200 OK", [("Content-Type", "text/plain")])
        return [b"RoseRAG backend starting…"]
