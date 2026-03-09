#!/bin/bash
# Run DB migrations via pg (Prisma CLI fails on EB due to missing WASM)
set -e
cd /var/app/current
export $(cat /opt/elasticbeanstalk/deployment/env | xargs -0)
if [ -n "$DATABASE_URL" ]; then
  node scripts/db-migrate-deploy.js
else
  echo "DATABASE_URL not set, skipping migrations"
fi
