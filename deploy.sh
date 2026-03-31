#!/bin/bash
set -e

echo "==> Pulling latest code..."
git pull origin main

echo "==> Building image..."
docker compose build app

echo "==> Running migrations..."
docker compose run --rm app npx prisma migrate deploy

echo "==> Restarting app..."
docker compose up -d app

echo "==> Done. App running on port 3000."
