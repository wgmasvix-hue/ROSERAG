from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from .api import documents, search, chat
from .api import ask, history, analytics, graph, copilot, bridge, drive
from .services import memory_service
from .config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — initialize persistent stores
    memory_service.init_db()
    yield
    # Shutdown (nothing to clean up currently)


app = FastAPI(
    title="ROSERAG",
    description="Institutional Intelligence Platform — Retrieve · Reason · Respond",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Existing endpoints
app.include_router(documents.router, prefix="/api")
app.include_router(search.router,    prefix="/api")
app.include_router(chat.router,      prefix="/api")

# New platform endpoints
app.include_router(ask.router,       prefix="/api")
app.include_router(history.router,   prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(graph.router,     prefix="/api")
app.include_router(copilot.router,   prefix="/api")
app.include_router(bridge.router,    prefix="/api")
app.include_router(drive.router)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": f"{settings.brand_prefix}{settings.brand_suffix}",
        "version": "2.0.0",
    }


@app.get("/api/config")
async def get_config():
    return {
        "institution_name":    settings.institution_name,
        "institution_tagline": settings.institution_tagline,
        "brand_prefix":        settings.brand_prefix,
        "brand_suffix":        settings.brand_suffix,
        "brand_color_primary": settings.brand_color_primary,
        "brand_color_accent":  settings.brand_color_accent,
    }


# Serve UI — Angular build (ui/dist/roserag-ui/browser/) takes priority;
# falls back to the legacy vanilla-JS frontend/ for dev without a built UI.
_root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_angular_dist = os.path.join(_root_dir, "ui", "dist", "roserag-ui", "browser")
_legacy_dir   = os.path.join(_root_dir, "frontend")

if os.path.isdir(_angular_dist):
    # Angular SPA: static assets + index.html fallback for all non-API paths
    app.mount("/", StaticFiles(directory=_angular_dist, html=True), name="ui")
elif os.path.isdir(_legacy_dir):
    app.mount("/static", StaticFiles(directory=_legacy_dir), name="static")

    @app.get("/", response_class=FileResponse)
    async def root():
        return FileResponse(os.path.join(_legacy_dir, "index.html"))
