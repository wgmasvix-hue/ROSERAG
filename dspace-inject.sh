#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  RoseRAG — DSpace Widget Injector
#  Run this ONCE on your DSpace server to embed the AI widget.
#
#  What it does:
#    1. Finds your DSpace nginx config automatically
#    2. Adds a sub_filter that injects the widget script tag
#    3. Validates and reloads nginx
#
#  Usage:
#    ssh root@dspace.dare.co.zw
#    curl -fsSL https://roserag.dare.co.zw/dspace-inject.sh | bash
#
#  Or manually:
#    bash dspace-inject.sh
# ═══════════════════════════════════════════════════════════════

set -e

WIDGET_URL="https://roserag.dare.co.zw/widget-inject.js"
SCRIPT_TAG='<script src="'"$WIDGET_URL"'" defer></script>'
INJECT_LINE='sub_filter '"'"'</body>'"'"' '"'"''"$SCRIPT_TAG"'</body>'"'"';'
ONCE_LINE='sub_filter_once on;'

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
info() { echo -e "${CYAN}→ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
fail() { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  RoseRAG · DSpace Widget Injector"
echo "  Widget: $WIDGET_URL"
echo "═══════════════════════════════════════════════════════"
echo ""

# ── Check nginx ────────────────────────────────────────────────
command -v nginx &>/dev/null || fail "nginx not found — is this the DSpace server?"
ok "nginx $(nginx -v 2>&1 | grep -o '[0-9.]*' | head -1)"

# ── Check sub_filter module ────────────────────────────────────
info "Checking ngx_http_sub_module..."
if nginx -V 2>&1 | grep -q "http_sub_module"; then
  ok "ngx_http_sub_module present"
else
  warn "ngx_http_sub_module NOT compiled in."
  echo ""
  echo "  Install nginx with sub_filter support:"
  echo "    apt-get install -y nginx-full"
  echo ""
  echo "  Then re-run this script."
  exit 1
fi

# ── Find DSpace nginx config ───────────────────────────────────
info "Finding DSpace nginx config..."

CONF=""
# Common locations for DSpace's nginx site config
for f in \
  /etc/nginx/sites-enabled/dspace \
  /etc/nginx/sites-enabled/default \
  /etc/nginx/conf.d/dspace.conf \
  /etc/nginx/conf.d/default.conf \
  $(ls /etc/nginx/sites-enabled/ 2>/dev/null) \
  $(ls /etc/nginx/conf.d/ 2>/dev/null)
do
  [ -f "$f" ] || continue
  if grep -q "8080\|dspace" "$f" 2>/dev/null; then
    CONF="$f"
    break
  fi
done

if [ -z "$CONF" ]; then
  echo ""
  echo "  Could not auto-detect DSpace nginx config."
  echo "  Available configs:"
  ls /etc/nginx/sites-enabled/ 2>/dev/null && ls /etc/nginx/conf.d/ 2>/dev/null || true
  echo ""
  read -rp "  Enter path to your DSpace nginx config: " CONF
  [ -f "$CONF" ] || fail "File not found: $CONF"
fi

ok "Found config: $CONF"

# ── Already injected? ──────────────────────────────────────────
if grep -q "roserag.dare.co.zw/widget-inject.js" "$CONF"; then
  ok "Widget already injected in $CONF — nothing to do."
  echo ""
  echo "  To test: open https://dspace.dare.co.zw in your browser."
  echo "  You should see a floating 'Ask AI' button at the bottom-right."
  exit 0
fi

# ── Backup ────────────────────────────────────────────────────
BACKUP="${CONF}.bak.$(date +%Y%m%d%H%M%S)"
cp "$CONF" "$BACKUP"
ok "Backup saved: $BACKUP"

# ── Inject sub_filter into every location / block ─────────────
info "Injecting sub_filter directives..."

# Strategy: insert before the closing brace of any proxy_pass location
# that passes to localhost (DSpace Tomcat/backend)
python3 - "$CONF" "$INJECT_LINE" "$ONCE_LINE" << 'PYEOF'
import sys, re

conf_path = sys.argv[1]
inject    = sys.argv[2]
once      = sys.argv[3]

with open(conf_path) as f:
    text = f.read()

# Insert after the first proxy_pass line inside any location block
# (only if sub_filter not already present)
if 'sub_filter' in text:
    print("sub_filter already present — skipping", file=sys.stderr)
    sys.exit(0)

# Find proxy_pass lines and append sub_filter directives after them
pattern = r'(proxy_pass\s+[^\n]+;)'
replacement = r'\1\n        ' + inject + '\n        ' + once
new_text, n = re.subn(pattern, replacement, text, count=1)

if n == 0:
    # Fallback: inject before the last closing brace of the first server block
    new_text = re.sub(r'(\n\})', '\n    ' + inject + '\n    ' + once + r'\1', text, count=1)

with open(conf_path, 'w') as f:
    f.write(new_text)

print(f"Injected {n} location(s)")
PYEOF

ok "sub_filter injected"

# ── Validate & reload ──────────────────────────────────────────
info "Validating nginx config..."
nginx -t 2>&1 || { warn "nginx config invalid — restoring backup"; cp "$BACKUP" "$CONF"; fail "Restored from backup. Check $CONF manually."; }
ok "Config valid"

info "Reloading nginx..."
systemctl reload nginx
ok "nginx reloaded"

echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}  ✅  Widget injected into DSpace!${NC}"
echo ""
echo "  Open https://dspace.dare.co.zw in your browser."
echo "  You should see a floating 🌸 button at the bottom-right."
echo ""
echo "  To remove the widget later:"
echo "    cp $BACKUP $CONF && nginx -t && systemctl reload nginx"
echo "═══════════════════════════════════════════════════════"
