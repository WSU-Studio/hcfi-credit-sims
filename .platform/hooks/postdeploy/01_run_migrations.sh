#!/bin/bash
# Run Prisma migrations (Prisma reinstalled in predeploy to fix WASM)
set -e
cd /var/app/current
export $(cat /opt/elasticbeanstalk/deployment/env | xargs -0)

# RDS requires SSL - add sslmode if not present
if [ -n "$DATABASE_URL" ]; then
  if [[ "$DATABASE_URL" != *"sslmode"* ]]; then
    if [[ "$DATABASE_URL" == *"?"* ]]; then
      export DATABASE_URL="${DATABASE_URL}&sslmode=require"
    else
      export DATABASE_URL="${DATABASE_URL}?sslmode=require"
    fi
  fi
  npx prisma migrate deploy
else
  echo "DATABASE_URL not set, skipping migrations"
fi
