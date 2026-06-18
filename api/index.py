import sys
import os

# Add project root to Python path so backend package is importable
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _root)

# Vercel's serverless runtime provides a writable /tmp directory.
# SQLite history is ephemeral (resets on cold start) — acceptable for cloud deployment.
os.environ.setdefault("DATA_DIR", "/tmp/roserag")

from backend.app.main import app  # noqa: F401, E402 — re-export for Vercel ASGI handler
