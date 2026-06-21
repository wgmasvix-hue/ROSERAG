#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
#  RoseRAG — Deploy to www.chengetai.co.zw via cPanel API
#  Run from YOUR local machine:
#    chmod +x deploy-cpanel.sh && ./deploy-cpanel.sh
# ─────────────────────────────────────────────────────────────────
set -e

CPANEL_HOST="cpanel.chengetai.co.zw"
CPANEL_USER="${CPANEL_USER:-wgmasvix}"
CPANEL_TOKEN="${CPANEL_TOKEN:-06DRRLG00HXL6UAU35S86YG1EOX7SP4J}"
WEB_ROOT="public_html"          # change to public_html/rag if deploying subdomain
DIST_ZIP="roserag-dist.zip"
API="https://${CPANEL_HOST}/execute"
AUTH="Authorization: cpanel ${CPANEL_USER}:${CPANEL_TOKEN}"

echo ""
echo "┌──────────────────────────────────────────────┐"
echo "│  RoseRAG → cPanel Deployer                   │"
echo "│  Host : ${CPANEL_HOST}           │"
echo "│  User : ${CPANEL_USER}                       │"
echo "└──────────────────────────────────────────────┘"
echo ""

# ── 1. Verify token ───────────────────────────────────────────────
echo "1/4  Verifying API token..."
resp=$(curl -sf --max-time 15 \
  "${API}/SSL/list_certs" \
  -H "${AUTH}" 2>&1) || {
  echo "  ✗  Cannot reach ${CPANEL_HOST} — check your internet connection."
  exit 1
}
echo "  ✓  Token accepted"

# ── 2. Upload zip ─────────────────────────────────────────────────
echo "2/4  Uploading ${DIST_ZIP}..."
[ -f "${DIST_ZIP}" ] || { echo "  ✗  ${DIST_ZIP} not found — run from the project folder."; exit 1; }

curl -sf --max-time 120 \
  "${API}/Fileman/upload_files" \
  -H "${AUTH}" \
  -F "dir=/${WEB_ROOT}" \
  -F "file-1=@${DIST_ZIP}" > /dev/null
echo "  ✓  Uploaded"

# ── 3. Extract zip in web root ────────────────────────────────────
echo "3/4  Extracting files..."
curl -sf --max-time 60 \
  "${API}/Fileman/extract_file" \
  -H "${AUTH}" \
  --data-urlencode "dir=/${WEB_ROOT}" \
  --data-urlencode "file=${DIST_ZIP}" > /dev/null
echo "  ✓  Extracted"

# ── 4. Move frontend/ contents to web root ────────────────────────
echo "4/4  Moving frontend files to web root..."

# Get list of files inside the extracted frontend/ folder
files=$(curl -sf --max-time 15 \
  "${API}/Fileman/list_files?dir=/${WEB_ROOT}/frontend" \
  -H "${AUTH}" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for f in data.get('data', []):
    print(f['file'])
" 2>/dev/null)

for file in $files; do
  curl -sf --max-time 15 \
    "${API}/Fileman/rename" \
    -H "${AUTH}" \
    --data-urlencode "srcdir=/${WEB_ROOT}/frontend" \
    --data-urlencode "destdir=/${WEB_ROOT}" \
    --data-urlencode "srcname=${file}" \
    --data-urlencode "destname=${file}" > /dev/null 2>&1 || true
done

# Remove the now-empty frontend/ and backend/ dirs and the zip
curl -sf --max-time 15 "${API}/Fileman/delete" -H "${AUTH}" \
  --data-urlencode "files[]=/${WEB_ROOT}/frontend" \
  --data-urlencode "files[]=/${WEB_ROOT}/${DIST_ZIP}" > /dev/null 2>&1 || true

echo "  ✓  Files in place"

echo ""
echo "────────────────────────────────────────────────"
echo "  ✅  Deployed to https://www.chengetai.co.zw"
echo "      Download page: https://www.chengetai.co.zw/download/"
echo "────────────────────────────────────────────────"
