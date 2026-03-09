#!/bin/bash
# Reinstall Prisma to restore WASM files (prisma migrate deploy fails without them)
set -e
cd /var/app/staging
npm install prisma --no-save --legacy-peer-deps
