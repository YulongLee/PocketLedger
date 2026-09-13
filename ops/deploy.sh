#!/usr/bin/env bash
set -euo pipefail
APP_DIR=${APP_DIR:-/srv/apps/pocketledger}
REPO=${REPO:-https://github.com/YulongLee/PocketLedger.git}
mkdir -p "$APP_DIR/source" "$APP_DIR/shared" "$APP_DIR/backups"
if [ ! -d "$APP_DIR/source/.git" ]; then git clone "$REPO" "$APP_DIR/source"; else git -C "$APP_DIR/source" pull --ff-only origin main; fi
cd "$APP_DIR/source"
python3 -m venv .venv
. .venv/bin/activate
pip install -q -r backend/requirements.txt
sudo systemctl restart pocketledger
curl -fsS https://api.pocketledger.cn/api/v1/health
