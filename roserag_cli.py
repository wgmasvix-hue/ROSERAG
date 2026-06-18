#!/usr/bin/env python3
"""
ROSERAG CLI — install, configure, and run your institutional intelligence platform.

Usage:
  roserag init          Interactive setup wizard (writes .env)
  roserag start         Start the server  [--host] [--port]
  roserag status        Check if the server is running  [--port]
"""

import argparse
import json
import os
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent


# ── Helpers ───────────────────────────────────────────────────────────────────

def _ask(prompt: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    answer = input(f"  {prompt}{suffix}: ").strip()
    return answer or default


def _section(title: str) -> None:
    print(f"\n  ── {title} {'─' * max(0, 38 - len(title))}")


def _write_env(lines: list[str], path: Path) -> None:
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


# ── Commands ──────────────────────────────────────────────────────────────────

def cmd_init(_args) -> None:
    print("\n┌─────────────────────────────────────────┐")
    print("│   ROSERAG — Institution Setup Wizard    │")
    print("└─────────────────────────────────────────┘")

    # ── Branding ──────────────────────────────────────────────────────────────
    _section("Institution Branding")
    inst_name  = _ask("Full institution name", "My Institution")
    # Derive a sensible 4-letter prefix from the first word
    first_word = inst_name.split()[0] if inst_name.split() else "INST"
    default_prefix = first_word[:4].upper()
    brand_prefix   = _ask("Brand prefix (left half of logo)", default_prefix)
    brand_suffix   = _ask("Brand suffix (right half of logo)", "RAG")
    tagline = _ask("Tagline", "Institutional Intelligence Platform")
    primary_color  = _ask("Primary brand colour (hex)", "#9b2248")
    accent_color   = _ask("Accent brand colour  (hex)", "#d44e72")

    env: list[str] = [
        "# ── Institution Branding ─────────────────────────────────────────────",
        f"INSTITUTION_NAME={inst_name}",
        f"INSTITUTION_TAGLINE={tagline}",
        f"BRAND_PREFIX={brand_prefix}",
        f"BRAND_SUFFIX={brand_suffix}",
        f"BRAND_COLOR_PRIMARY={primary_color}",
        f"BRAND_COLOR_ACCENT={accent_color}",
        "",
    ]

    # ── LLM Provider ──────────────────────────────────────────────────────────
    _section("LLM Provider")
    print("  1) Ollama  — local, free (requires Ollama installed)")
    print("  2) DeepSeek + Jina AI  — cloud, API keys needed")
    print("  3) OpenAI  — cloud, API key needed")
    choice = _ask("Provider", "1")

    env.append("# ── LLM Provider ─────────────────────────────────────────────────────")

    if choice == "2":
        llm_key   = _ask("DeepSeek API key (sk-...)")
        embed_key = _ask("Jina AI API key  (jina_...)")
        env += [
            "LLM_PROVIDER=openai",
            f"LLM_API_KEY={llm_key}",
            "LLM_API_BASE=https://api.deepseek.com",
            "CHAT_MODEL=deepseek-chat",
            f"EMBED_API_KEY={embed_key}",
            "EMBED_API_BASE=https://api.jina.ai",
            "EMBED_MODEL=jina-embeddings-v2-base-en",
        ]
    elif choice == "3":
        llm_key = _ask("OpenAI API key (sk-...)")
        env += [
            "LLM_PROVIDER=openai",
            f"LLM_API_KEY={llm_key}",
            "LLM_API_BASE=https://api.openai.com",
            "CHAT_MODEL=gpt-4o-mini",
            f"EMBED_API_KEY={llm_key}",
            "EMBED_API_BASE=https://api.openai.com",
            "EMBED_MODEL=text-embedding-3-small",
        ]
    else:
        ollama_url   = _ask("Ollama base URL", "http://localhost:11434")
        chat_model   = _ask("Ollama chat model", "llama3.2")
        embed_model  = _ask("Ollama embed model", "nomic-embed-text")
        env += [
            "LLM_PROVIDER=ollama",
            f"OLLAMA_BASE_URL={ollama_url}",
            f"OLLAMA_CHAT_MODEL={chat_model}",
            f"OLLAMA_EMBED_MODEL={embed_model}",
        ]

    env.append("")

    # ── Qdrant ────────────────────────────────────────────────────────────────
    _section("Vector Database (Qdrant)")
    print("  1) Local   — Docker (docker-compose up -d)")
    print("  2) Cloud   — qdrant.io free tier")
    q_choice = _ask("Qdrant location", "1")

    env.append("# ── Qdrant ───────────────────────────────────────────────────────────")

    if q_choice == "2":
        q_host = _ask("Qdrant cloud hostname (e.g. xyz.qdrant.io)")
        q_key  = _ask("Qdrant API key")
        env += [
            f"QDRANT_HOST={q_host}",
            "QDRANT_PORT=6333",
            f"QDRANT_API_KEY={q_key}",
            "QDRANT_USE_HTTPS=true",
            f"COLLECTION_NAME={brand_prefix.lower()}{brand_suffix.lower()}",
        ]
    else:
        env += [
            "QDRANT_HOST=localhost",
            "QDRANT_PORT=6333",
            "QDRANT_API_KEY=",
            "QDRANT_USE_HTTPS=false",
            f"COLLECTION_NAME={brand_prefix.lower()}{brand_suffix.lower()}",
        ]

    env += [
        "",
        "# ── RAG ──────────────────────────────────────────────────────────────",
        "CHUNK_SIZE=1000",
        "CHUNK_OVERLAP=200",
        "TOP_K=5",
        "DATA_DIR=data",
    ]

    env_path = ROOT / ".env"
    _write_env(env, env_path)

    logo = f"{brand_prefix}{brand_suffix}"
    print(f"\n  ✓  .env written — your platform is branded as '{logo}'")

    if q_choice == "1":
        print("  ✓  Start Qdrant:  docker-compose up -d")
    print(f"  ✓  Launch server: roserag start")
    print(f"  ✓  Open browser:  http://localhost:8000\n")


def cmd_start(args) -> None:
    host = args.host
    port = args.port
    reload_flag = [] if args.no_reload else ["--reload"]
    print(f"\n  Starting on http://{host}:{port} …\n")
    env = {**os.environ, "PYTHONPATH": str(ROOT)}
    subprocess.run(
        [
            sys.executable, "-m", "uvicorn",
            "backend.app.main:app",
            "--host", host,
            "--port", str(port),
        ] + reload_flag,
        cwd=ROOT,
        env=env,
    )


def cmd_status(args) -> None:
    url = f"http://localhost:{args.port}/api/health"
    try:
        with urllib.request.urlopen(url, timeout=3) as r:
            data = json.loads(r.read())
        print(f"\n  Online  ✓  {data}\n")
    except Exception as exc:
        print(f"\n  Offline ✗  {exc}\n")
        sys.exit(1)


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        prog="roserag",
        description="ROSERAG — Institutional Intelligence Platform CLI",
    )
    sub = parser.add_subparsers(dest="command", metavar="<command>")
    sub.required = True

    sub.add_parser("init", help="Interactive setup wizard (writes .env)")

    p_start = sub.add_parser("start", help="Start the server")
    p_start.add_argument("--host",      default="0.0.0.0",  help="Bind host  (default 0.0.0.0)")
    p_start.add_argument("--port",      type=int, default=8000, help="Bind port  (default 8000)")
    p_start.add_argument("--no-reload", action="store_true", help="Disable auto-reload")

    p_status = sub.add_parser("status", help="Check if server is running")
    p_status.add_argument("--port", type=int, default=8000)

    args = parser.parse_args()
    {
        "init":   cmd_init,
        "start":  cmd_start,
        "status": cmd_status,
    }[args.command](args)


if __name__ == "__main__":
    main()
