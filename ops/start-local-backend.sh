#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
VENV="$ROOT_DIR/.venv-local"
PYTHON_BIN="${PYTHON_BIN:-python3.11}"
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then echo "需要 Python 3.11+。可通过 PYTHON_BIN 指定解释器。" >&2; exit 1; fi
if [ ! -x "$VENV/bin/python" ]; then
  "$PYTHON_BIN" -m venv "$VENV"
  "$VENV/bin/pip" install -q -r "$ROOT_DIR/backend/requirements.txt"
fi
export DATABASE_URL="sqlite:///$ROOT_DIR/backend/pocketledger.local.db"
export AUTH_SECRET="pocketledger-local-only-change-me"
export DASHSCOPE_API_KEY="${DASHSCOPE_API_KEY:-}"
cd "$ROOT_DIR"
exec "$VENV/bin/uvicorn" app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
