#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  RoseRAG — Backend Deploy (Ollama + Caddy)
#  Run from your LOCAL machine:
#    chmod +x deploy-backend.sh && ./deploy-backend.sh
#
#  What this does:
#    1. Clones / updates the repo on the server at /opt/roserag
#    2. Installs Caddy (HTTPS reverse proxy)
#    3. Starts Ollama + Qdrant + Redis + FastAPI via Docker Compose
#    4. Pulls llama3.2 and nomic-embed-text into Ollama
#    5. Copies widget.html to the web root
#    6. Writes the Caddyfile and reloads Caddy
# ═══════════════════════════════════════════════════════════════

set -e

SERVER="34.68.70.25"
DOMAIN="rag.dare.co.zw"
SSH_USER="${SSH_USER:-root}"
SSH_PASS="${SSH_PASS:-}"        # leave blank to use SSH key auth
REPO_URL="https://github.com/wgmasvix-hue/ROSERAG.git"
REMOTE_DIR="/opt/roserag"

# ── SSH helpers ───────────────────────────────────────────────
if [ -n "$SSH_PASS" ]; then
  if ! command -v sshpass &>/dev/null; then
    command -v apt-get &>/dev/null && sudo apt-get install -y sshpass || \
    command -v brew    &>/dev/null && brew install hudochenkov/sshpass/sshpass || \
    { echo "ERROR: install sshpass first."; exit 1; }
  fi
  SSH="sshpass -p '${SSH_PASS}' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=20"
  SCP="sshpass -p '${SSH_PASS}' scp -o StrictHostKeyChecking=no"
else
  SSH="ssh -o StrictHostKeyChecking=no -o ConnectTimeout=20"
  SCP="scp -o StrictHostKeyChecking=no"
fi

echo ""
echo "┌────────────────────────────────────────────┐"
echo "│  RoseRAG  ·  Ollama + Caddy Deploy         │"
echo "│  → ${DOMAIN}                  │"
echo "└────────────────────────────────────────────┘"
echo ""

# ── 1. Verify connection ──────────────────────────────────────
echo "1/6  Connecting…"
eval "$SSH ${SSH_USER}@${SERVER} 'echo \"  ✓ connected as \$(whoami) on \$(hostname)\"'"

# ── 2. Install Docker (if missing) ───────────────────────────
echo "2/6  Checking Docker…"
eval "$SSH ${SSH_USER}@${SERVER}" "bash -s" <<'REMOTE_DOCKER'
if ! command -v docker &>/dev/null; then
  echo "  Installing Docker…"
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker && systemctl start docker
  echo "  ✓ Docker installed"
else
  echo "  ✓ Docker $(docker --version | awk '{print $3}' | tr -d ',')"
fi
REMOTE_DOCKER

# ── 3. Clone or update repo ───────────────────────────────────
echo "3/6  Syncing repo…"
eval "$SSH ${SSH_USER}@${SERVER}" "bash -s" <<REMOTE_REPO
set -e
if [ -d "${REMOTE_DIR}/.git" ]; then
  cd ${REMOTE_DIR}
  git fetch origin
  git reset --hard origin/claude/roserag-enhancements-hr6uin
  echo "  ✓ Repo updated"
else
  git clone --branch claude/roserag-enhancements-hr6uin ${REPO_URL} ${REMOTE_DIR}
  echo "  ✓ Repo cloned"
fi
mkdir -p ${REMOTE_DIR}/data
REMOTE_REPO

# ── 4. Upload .env ────────────────────────────────────────────
echo "4/6  Uploading .env…"
if [ ! -f ".env" ]; then
  echo "  WARNING: no local .env found — server will use existing .env (if any)"
else
  eval "$SCP .env ${SSH_USER}@${SERVER}:${REMOTE_DIR}/.env"
  eval "$SSH ${SSH_USER}@${SERVER} 'chmod 600 ${REMOTE_DIR}/.env && echo \"  ✓ .env installed\"'"
fi

# ── 5. Start Docker Compose stack ────────────────────────────
echo "5/6  Starting services (Ollama + Qdrant + Redis + Backend)…"
eval "$SSH ${SSH_USER}@${SERVER}" "bash -s" <<REMOTE_STACK
set -e
cd ${REMOTE_DIR}

# Stop old standalone containers if any
docker rm -f roserag-qdrant roserag-ollama 2>/dev/null || true

# Build & start (excluding the Next.js platform container — Caddy serves static)
docker compose pull --quiet
docker compose build --quiet
docker compose up -d qdrant redis ollama backend

echo "  Services started. Waiting for backend health check…"
for i in \$(seq 1 30); do
  if curl -sf http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
    echo "  ✓ Backend healthy"
    break
  fi
  [ \$i -eq 30 ] && echo "  WARNING: backend not responding after 150s — check logs" || sleep 5
done

# Pull Ollama models (runs in background — takes a few minutes first time)
echo "  Pulling Ollama models (runs in background)…"
docker exec roserag-ollama ollama pull llama3.2    &
docker exec roserag-ollama ollama pull nomic-embed-text &
echo "  ✓ Model pulls started (llama3.2 ~2 GB, nomic-embed-text ~270 MB)"
echo "    Monitor: docker exec roserag-ollama ollama list"
REMOTE_STACK

# ── 6. Install Caddy + write Caddyfile ───────────────────────
echo "6/6  Installing Caddy and configuring HTTPS…"
eval "$SSH ${SSH_USER}@${SERVER}" "bash -s" <<REMOTE_CADDY
set -e
DOMAIN="${DOMAIN}"
WEB_ROOT="${REMOTE_DIR}/platform/out"

# Install Caddy
if ! command -v caddy &>/dev/null; then
  echo "  Installing Caddy…"
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl 2>/dev/null || true
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q && apt-get install -y caddy
  echo "  ✓ Caddy installed"
else
  echo "  ✓ Caddy already installed ($(caddy version))"
fi

# Stop nginx if running (port conflict)
systemctl stop nginx 2>/dev/null && systemctl disable nginx 2>/dev/null && echo "  (stopped nginx)" || true

mkdir -p /var/log/caddy

# Write Caddyfile
cat > /etc/caddy/Caddyfile << CADDYEOF
\${DOMAIN} {

    encode gzip

    handle /api/* {
        reverse_proxy localhost:8000 {
            header_up Host {host}
            header_up X-Real-IP {remote_host}
            flush_interval -1
        }
    }

    handle {
        root * \${WEB_ROOT}
        try_files {path} {path}/index.html =404
        file_server
    }

    @static {
        path /_next/static/*
    }
    header @static Cache-Control "public, max-age=31536000, immutable"

    log {
        output file /var/log/caddy/roserag-access.log {
            roll_size 10mb
            roll_keep 5
        }
    }
}
CADDYEOF

# Copy widget.html into the web root so it's served at /widget.html
cp ${REMOTE_DIR}/widget.html \${WEB_ROOT}/widget.html 2>/dev/null || true

# Validate and reload
caddy validate --config /etc/caddy/Caddyfile
systemctl enable caddy && systemctl restart caddy
echo "  ✓ Caddy running with automatic HTTPS"
REMOTE_CADDY

echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅  Deploy complete!"
echo ""
echo "  Platform:   https://${DOMAIN}"
echo "  Widget:     https://${DOMAIN}/widget.html"
echo "  API health: https://${DOMAIN}/api/health"
echo ""
echo "  Check Ollama models (pull takes a few min):"
echo "    ssh ${SSH_USER}@${SERVER} 'docker exec roserag-ollama ollama list'"
echo ""
echo "  Stream backend logs:"
echo "    ssh ${SSH_USER}@${SERVER} 'docker compose -f ${REMOTE_DIR}/docker-compose.yml logs -f backend'"
echo "══════════════════════════════════════════════════"
