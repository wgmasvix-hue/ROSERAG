#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  RoseRAG Backend — Deploy to rag.chengetai.co.zw
#  Run AFTER deploy.sh:
#    chmod +x deploy-backend.sh && ./deploy-backend.sh
# ─────────────────────────────────────────────────────────────

set -e

SERVER="34.68.70.25"
DOMAIN="rag.chengetai.co.zw"
SSH_USER="${SSH_USER:-wgmasvix}"
SSH_PASS="${SSH_PASS:-Cheryl13..}"
BACKEND_DIR="/opt/roserag-backend"

SSH="sshpass -p '${SSH_PASS}' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15"
SCP="sshpass -p '${SSH_PASS}' scp -o StrictHostKeyChecking=no"

echo ""
echo "┌────────────────────────────────────────┐"
echo "│  RoseRAG Backend Deployer              │"
echo "└────────────────────────────────────────┘"

echo "1/4  Uploading backend..."
$SCP roserag-backend.zip ${SSH_USER}@${SERVER}:/tmp/roserag-backend.zip

echo "2/4  Installing backend..."
$SSH ${SSH_USER}@${SERVER} "
  sudo mkdir -p ${BACKEND_DIR}
  cd /tmp
  unzip -o roserag-backend.zip > /dev/null
  sudo cp -r backend/. ${BACKEND_DIR}/
  sudo cp requirements.txt ${BACKEND_DIR}/
  rm -rf /tmp/backend /tmp/requirements.txt /tmp/roserag-backend.zip

  # Install Python if needed
  if ! command -v python3 &>/dev/null; then
    sudo apt-get update -q && sudo apt-get install -y python3 python3-pip python3-venv
  fi

  # Create virtualenv and install deps
  cd ${BACKEND_DIR}
  python3 -m venv venv
  ./venv/bin/pip install -q --upgrade pip
  ./venv/bin/pip install -q -r requirements.txt
  echo '  ✓ Backend installed'
"

echo "3/4  Writing .env config..."
$SSH ${SSH_USER}@${SERVER} "
sudo tee ${BACKEND_DIR}/.env > /dev/null <<'ENV'
LLM_API_BASE=https://api.deepseek.com
LLM_API_KEY=sk-63ec52c1155e4b61989a5861975eae84
CHAT_MODEL=deepseek-chat
REASONER_MODEL=deepseek-reasoner
EMBED_API_BASE=https://api.jina.ai
EMBED_MODEL=jina-embeddings-v5-omni-nano
EMBED_API_KEY=jina_8df55af7a1174c28a050f32acf9d2d0cmEPme0Bvg117iP1gqwrKb0iSmfjc
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_USE_HTTPS=false
COLLECTION_NAME=roserag
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K=5
DATA_DIR=${BACKEND_DIR}/data
INSTITUTION_NAME=RoseRAG
BRAND_PREFIX=ROSE
BRAND_SUFFIX=RAG
ENV
sudo mkdir -p ${BACKEND_DIR}/data
echo '  ✓ Config written'
"

echo "4/4  Creating systemd service..."
$SSH ${SSH_USER}@${SERVER} "
sudo tee /etc/systemd/system/roserag-backend.service > /dev/null <<SERVICE
[Unit]
Description=RoseRAG FastAPI Backend
After=network.target

[Service]
User=${SSH_USER}
WorkingDirectory=${BACKEND_DIR}
EnvironmentFile=${BACKEND_DIR}/.env
ExecStart=${BACKEND_DIR}/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable roserag-backend
sudo systemctl restart roserag-backend
sleep 3
sudo systemctl status roserag-backend --no-pager | head -15
"

echo ""
echo "────────────────────────────────────────────"
echo "  ✅  Backend deployed and running!"
echo ""
echo "  Test the API:"
echo "    curl https://${DOMAIN}/api/health"
echo ""
echo "  View logs:"
echo "    ssh ${SSH_USER}@${SERVER} 'journalctl -u roserag-backend -f'"
echo "────────────────────────────────────────────"
