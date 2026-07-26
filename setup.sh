#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  RoseRAG — Complete Server Setup
#  Run once (or again to update):
#    cd /opt/roserag && bash setup.sh
# ═══════════════════════════════════════════════════════════════

set -e
REPO=/opt/roserag
DOMAIN=rag.chengetai.co.zw
WEB_ROOT=$REPO/platform/out

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
info() { echo -e "${CYAN}→ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
fail() { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  RoseRAG · ChengetAI Labs Setup"
echo "  Domain:  $DOMAIN"
echo "  Repo:    $REPO"
echo "═══════════════════════════════════════════════════════"
echo ""

cd $REPO

# ── 1. Pull latest code ───────────────────────────────────────
info "Pulling latest code..."
git fetch origin
git reset --hard origin/claude/roserag-enhancements-hr6uin
ok "Repo up to date ($(git log -1 --format='%h %s'))"

# ── 2. Ensure .env exists ────────────────────────────────────
info "Checking .env..."
if [ ! -f $REPO/.env ]; then
  cp $REPO/.env.example $REPO/.env
  chmod 600 $REPO/.env
  warn ".env created from example — edit $REPO/.env to add API keys if needed"
else
  ok ".env present"
fi
mkdir -p $REPO/data

# ── 3. Ollama models ─────────────────────────────────────────
info "Checking Ollama..."
if ! command -v ollama &>/dev/null; then
  fail "Ollama not found. Install it first: curl -fsSL https://ollama.ai/install.sh | sh"
fi
ok "Ollama $(ollama --version 2>/dev/null | head -1)"

MODELS=$(ollama list 2>/dev/null || echo "")
echo "  Current models:"
echo "$MODELS" | sed 's/^/    /'

# Pull nomic-embed-text (required for vector search)
if ! echo "$MODELS" | grep -q "nomic-embed-text"; then
  info "Pulling nomic-embed-text (embedding model, ~270 MB)..."
  ollama pull nomic-embed-text
  ok "nomic-embed-text ready"
else
  ok "nomic-embed-text already present"
fi

# Pull qwen2.5:3b (general chat model) if llama3.2 not present
if ! echo "$MODELS" | grep -q "qwen2.5:3b" && ! echo "$MODELS" | grep -q "llama3.2"; then
  info "Pulling qwen2.5:3b (chat model, ~2 GB — this takes a few minutes)..."
  ollama pull qwen2.5:3b
  ok "qwen2.5:3b ready"
elif echo "$MODELS" | grep -q "qwen2.5:3b"; then
  ok "qwen2.5:3b already present"
else
  ok "llama3.2 already present (will use that)"
  sed -i 's/CHAT_MODEL=qwen2.5:3b/CHAT_MODEL=llama3.2/' $REPO/docker-compose.yml
  sed -i 's/REASONER_MODEL=qwen2.5:3b/REASONER_MODEL=llama3.2/' $REPO/docker-compose.yml
fi

# ── 4. Docker services ────────────────────────────────────────
info "Starting Docker services..."

# Clean up orphans from previous attempts
docker compose down --remove-orphans 2>/dev/null || true
docker rm -f roserag-qdrant roserag-redis roserag-backend roserag-ollama 2>/dev/null || true

# Start
docker compose up -d qdrant redis backend
ok "Containers started"

# ── 5. Wait for backend ───────────────────────────────────────
info "Waiting for backend to be ready (up to 90s)..."
for i in $(seq 1 18); do
  if curl -sf http://localhost:8001/api/health > /dev/null 2>&1; then
    ok "Backend healthy"
    break
  fi
  if [ $i -eq 18 ]; then
    warn "Backend not responding after 90s. Checking logs..."
    docker compose logs --tail=20 backend
    fail "Backend failed to start. Fix the error above and re-run setup.sh"
  fi
  printf "  checking... ($((i*5))s)\r"
  sleep 5
done

# ── 6. Frontend files ─────────────────────────────────────────
info "Setting up frontend..."

if [ -d "$WEB_ROOT" ] && [ -f "$WEB_ROOT/index.html" ]; then
  ok "Frontend already built at $WEB_ROOT"
else
  if [ -f "$REPO/roserag-frontend.zip" ]; then
    info "Extracting from roserag-frontend.zip..."
    unzip -o $REPO/roserag-frontend.zip -d $REPO > /dev/null
    ok "Frontend extracted"
  else
    fail "No frontend found. Run: cd platform && npm install && npx next build"
  fi
fi

# Always copy widget.html into the web root
cp $REPO/widget.html $WEB_ROOT/widget.html
ok "widget.html → $WEB_ROOT/widget.html"

# ── 7. Caddy ─────────────────────────────────────────────────
info "Configuring Caddy..."

if ! command -v caddy &>/dev/null; then
  info "Installing Caddy..."
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl 2>/dev/null
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q && apt-get install -y caddy
fi

# Stop nginx if it's running (port conflict)
if systemctl is-active --quiet nginx 2>/dev/null; then
  systemctl stop nginx && systemctl disable nginx
  warn "Stopped nginx (Caddy takes over ports 80/443)"
fi

mkdir -p /var/log/caddy

# Write Caddyfile
cat > /etc/caddy/Caddyfile << CADDYEOF
$DOMAIN {

    encode gzip

    handle /api/* {
        reverse_proxy localhost:8000 {
            header_up Host {host}
            header_up X-Real-IP {remote_host}
            flush_interval -1
        }
    }

    handle {
        root * $WEB_ROOT
        try_files {path} {path}/index.html =404
        file_server
    }

    @static {
        path /_next/static/*
    }
    header @static Cache-Control "public, max-age=31536000, immutable"

    log {
        output file /var/log/caddy/roserag.log {
            roll_size 10mb
            roll_keep 5
        }
    }
}
CADDYEOF

caddy validate --config /etc/caddy/Caddyfile
systemctl enable caddy
systemctl restart caddy
ok "Caddy running"

# ── 8. DSpace sync ────────────────────────────────────────────
info "Triggering DARE repository sync (runs in background)..."
curl -sf -X POST http://localhost:8001/api/dspace/sync > /dev/null && \
  ok "DSpace sync started" || warn "DSpace sync skipped (DSPACE_URL not configured in .env)"

# ── 9. Summary ────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}  ✅  RoseRAG is live!${NC}"
echo ""
echo "  Platform:   https://$DOMAIN"
echo "  Widget:     https://$DOMAIN/widget.html"
echo "  API:        https://$DOMAIN/api/health"
echo "  Embed:      https://$DOMAIN/embed"
echo ""
echo "  Backend logs:  docker compose logs -f backend"
echo "  Caddy logs:    tail -f /var/log/caddy/roserag.log"
echo "═══════════════════════════════════════════════════════"
