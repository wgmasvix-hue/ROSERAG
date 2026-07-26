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

echo "3/4  Uploading .env config..."
if [ ! -f ".env" ]; then
  echo "  ERROR: .env not found in the current directory."
  echo "  Copy .env.example to .env and fill in your API keys first."
  exit 1
fi
$SCP .env ${SSH_USER}@${SERVER}:/tmp/roserag.env
$SSH ${SSH_USER}@${SERVER} "
  sudo mv /tmp/roserag.env ${BACKEND_DIR}/.env
  sudo chmod 600 ${BACKEND_DIR}/.env
  sudo chown ${SSH_USER}:${SSH_USER} ${BACKEND_DIR}/.env
  sudo mkdir -p ${BACKEND_DIR}/data
  echo '  ✓ .env installed'
"

echo "3b/4 Installing Qdrant..."
$SSH ${SSH_USER}@${SERVER} "
  if curl -sf http://127.0.0.1:6333/health > /dev/null 2>&1; then
    echo '  ✓ Qdrant already running'
  else
    # Install Docker just for Qdrant (lightest approach)
    if ! command -v docker &>/dev/null; then
      curl -fsSL https://get.docker.com | sh
      sudo usermod -aG docker ${SSH_USER} || true
    fi
    # Run Qdrant as a Docker container (persistent volume)
    docker rm -f roserag-qdrant 2>/dev/null || true
    docker run -d --name roserag-qdrant --restart unless-stopped \
      -p 127.0.0.1:6333:6333 \
      -v roserag-qdrant-data:/qdrant/storage \
      qdrant/qdrant:latest
    sleep 5
    curl -sf http://127.0.0.1:6333/health > /dev/null && echo '  ✓ Qdrant started' || echo '  WARNING: Qdrant health check failed'
  fi
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
