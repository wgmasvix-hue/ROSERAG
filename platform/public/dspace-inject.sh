#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
#  RoseRAG — DSpace Integration Installer
#
#  Embeds two scripts into your DSpace site via nginx sub_filter:
#
#    1. dspace-home-inject.js  — AI search section on the home page
#       Adds a full-width "Ask AI" banner above the DSpace search bar.
#
#    2. widget-inject.js       — Floating AI assistant on every page
#       A persistent "Ask AI" button in the bottom-right corner.
#
#  One-command install (run on your DSpace server as root):
#    curl -fsSL https://roserag.dare.co.zw/dspace-inject.sh | bash
#
#  Manual install:
#    bash dspace-inject.sh
#
#  Requirements:
#    • nginx with ngx_http_sub_module (nginx-full on Debian/Ubuntu)
#    • Root or sudo access
# ═══════════════════════════════════════════════════════════════════════

set -e

BASE_URL="https://roserag.dare.co.zw"
WIDGET_URL="$BASE_URL/widget-inject.js"
HOME_URL="$BASE_URL/dspace-home-inject.js"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
info() { echo -e "${CYAN}→ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
fail() { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  RoseRAG · DSpace Integration Installer${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "  This will add:"
echo "    • Home page AI search section  (dspace-home-inject.js)"
echo "    • Floating AI widget           (widget-inject.js)"
echo ""

# ── Require root ───────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
  warn "Not running as root. Trying sudo..."
  exec sudo bash "$0" "$@"
fi

# ── Check nginx ────────────────────────────────────────────────────────
command -v nginx &>/dev/null || fail "nginx not found — is this the DSpace server?"
NGINX_VER=$(nginx -v 2>&1 | grep -oP '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
ok "nginx $NGINX_VER"

# ── Check ngx_http_sub_module ──────────────────────────────────────────
info "Checking ngx_http_sub_module..."
if nginx -V 2>&1 | grep -q "http_sub_module"; then
  ok "ngx_http_sub_module present"
else
  warn "ngx_http_sub_module NOT compiled in."
  echo ""
  echo "  Install nginx with sub_filter support:"
  echo "    apt-get install -y nginx-full"
  echo "  Then re-run this script."
  exit 1
fi

# ── Find DSpace nginx config ───────────────────────────────────────────
info "Finding DSpace nginx config..."

CONF=""
CANDIDATES=(
  /etc/nginx/sites-enabled/dspace
  /etc/nginx/sites-enabled/default
  /etc/nginx/conf.d/dspace.conf
  /etc/nginx/conf.d/default.conf
)

# Also search all enabled sites
while IFS= read -r f; do
  CANDIDATES+=("$f")
done < <(ls /etc/nginx/sites-enabled/ 2>/dev/null | sed 's|^|/etc/nginx/sites-enabled/|' || true)
while IFS= read -r f; do
  CANDIDATES+=("$f")
done < <(ls /etc/nginx/conf.d/ 2>/dev/null | sed 's|^|/etc/nginx/conf.d/|' || true)

for f in "${CANDIDATES[@]}"; do
  [ -f "$f" ] || continue
  if grep -qE "8080|dspace" "$f" 2>/dev/null; then
    CONF="$f"
    break
  fi
done

if [ -z "$CONF" ]; then
  echo ""
  echo "  Could not auto-detect DSpace nginx config."
  echo "  Available configs:"
  ls /etc/nginx/sites-enabled/ 2>/dev/null || true
  ls /etc/nginx/conf.d/ 2>/dev/null || true
  echo ""
  read -rp "  Path to your DSpace nginx config: " CONF
  [ -f "$CONF" ] || fail "File not found: $CONF"
fi

ok "Config: $CONF"

# ── Already fully injected? ────────────────────────────────────────────
HAS_HOME=0
HAS_WIDGET=0
grep -q "dspace-home-inject.js" "$CONF" 2>/dev/null && HAS_HOME=1
grep -q "widget-inject.js"      "$CONF" 2>/dev/null && HAS_WIDGET=1

if [ "$HAS_HOME" -eq 1 ] && [ "$HAS_WIDGET" -eq 1 ]; then
  ok "Both scripts already injected — nothing to do."
  echo ""
  echo "  Open your DSpace site to verify the AI section appears."
  echo "  To update the scripts, clear cache: nginx -s reload"
  exit 0
fi

# ── Backup ────────────────────────────────────────────────────────────
BACKUP="${CONF}.bak.$(date +%Y%m%d%H%M%S)"
cp "$CONF" "$BACKUP"
ok "Backup: $BACKUP"

# ── Build the injection block ──────────────────────────────────────────
#
#  We inject two <script> tags before </head>:
#    1. dspace-home-inject.js  — loads first, handles home page section
#    2. widget-inject.js       — loads second, floating widget everywhere
#
HEAD_INJECT="<script src=\"$HOME_URL\" defer><\\/script><script src=\"$WIDGET_URL\" defer><\\/script>"

info "Injecting script tags before </head>..."

python3 - "$CONF" "$HEAD_INJECT" << 'PYEOF'
import sys, re

conf_path   = sys.argv[1]
inject_tags = sys.argv[2]

with open(conf_path) as f:
    text = f.read()

already_has = 'dspace-home-inject.js' in text or 'widget-inject.js' in text

if already_has:
    # Partial — ensure both are present
    if 'dspace-home-inject.js' not in text:
        # Add before existing widget tag
        text = text.replace('widget-inject.js', 'dspace-home-inject.js" defer></script><script src="https://roserag.dare.co.zw/widget-inject.js')
    if 'widget-inject.js' not in text:
        # Fallback: inject before </head>
        text = re.sub(r'(</head>)', inject_tags + r'\1', text, count=1)
else:
    # Fresh injection: add sub_filter block before </head>
    sub_block = (
        '\n    sub_filter_once on;'
        '\n    sub_filter \'</head>\' \'' + inject_tags + '</head>\';'
    )
    # Try to insert after proxy_pass line
    n = 0
    new_text, n = re.subn(r'(proxy_pass\s+[^\n]+;)', r'\1' + sub_block, text, count=1)
    if n == 0:
        # No proxy_pass found — inject at end of first server block
        new_text, n = re.subn(r'(server\s*\{[^}]*?)(\n\})', r'\1' + sub_block + r'\2', text, count=1, flags=re.DOTALL)
    if n > 0:
        text = new_text

with open(conf_path, 'w') as f:
    f.write(text)

print("Done.")
PYEOF

ok "Injection written"

# ── Validate & reload ──────────────────────────────────────────────────
info "Validating nginx config..."
nginx -t 2>&1 || {
  warn "nginx config invalid — restoring backup"
  cp "$BACKUP" "$CONF"
  fail "Restored from backup. Check $CONF and run manually."
}
ok "Config valid"

info "Reloading nginx..."
systemctl reload nginx 2>/dev/null || nginx -s reload
ok "nginx reloaded"

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  ✅  RoseRAG integrated into DSpace!${NC}"
echo ""
echo "  Visit your DSpace home page to see the AI search section."
echo ""
echo "  Home page  — AI search banner above the DSpace search bar"
echo "  All pages  — floating 'Ask AI' button (bottom-right)"
echo ""
echo "  Rollback:"
echo "    cp $BACKUP $CONF && nginx -t && systemctl reload nginx"
echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
