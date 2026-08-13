#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  RoseRAG — RASA Training Script
#  Trains the NLU + Core model and saves it to rasa/models/.
#
#  Usage:
#    cd rasa
#    bash train.sh
#
#  Requirements:
#    • Python 3.9-3.10 (RASA 3.6 does not support 3.11+ on all platforms)
#    • pip install rasa==3.6.20
# ═══════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
info() { echo -e "${CYAN}→ $1${NC}"; }
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }

info "Validating RASA project..."
rasa data validate

info "Training NLU + Core model..."
rasa train \
  --config config.yml \
  --domain domain.yml \
  --data data/ \
  --out models/ \
  --fixed-model-name roserag-$(date +%Y%m%d)

ok "Model trained → models/roserag-$(date +%Y%m%d).tar.gz"

echo ""
echo "Next steps:"
echo "  Test interactively:  rasa shell"
echo "  Run action server:   rasa run actions"
echo "  Start RASA server:   rasa run --enable-api --cors '*'"
echo "  Or via Docker:       docker compose up rasa rasa-actions"
