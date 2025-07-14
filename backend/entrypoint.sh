#!/usr/bin/env sh
# Entrypoint script for running Polygon API with Uvicorn.
# Allows overriding the number of worker processes via UVICORN_WORKERS env var.

set -e

: "${UVICORN_WORKERS:=1}"

exec uvicorn src.main:app \
    --host 0.0.0.0 \
    --port 8080 \
    --workers "$UVICORN_WORKERS" 