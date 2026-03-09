#!/bin/bash
# Run DB migrations via pg (Prisma CLI fails on EB due to missing WASM)
# Use || true so migration failure does NOT fail the deployment
set -e
cd /var/app/current
export $(cat /opt/elasticbeanstalk/deployment/env | xargs -0)
if [ -n "$DATABASE_URL" ]; then
  node scripts/db-migrate-deploy.js || echo "Migration failed, app deployed anyway"
else
  echo "DATABASE_URL not set, skipping migrations"
fi
