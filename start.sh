#!/bin/bash
# Start cyber-club-app with correct environment
# Unset system-level DATABASE_URL that overrides the project .env

unset DATABASE_URL
unset DIRECT_URL

cd /home/z/my-project/cyber-club-app

echo "Starting cyber-club-app..."
echo "DATABASE_URL from .env: $(grep DATABASE_URL .env | head -1 | cut -c1-50)..."

exec npx next start -p 3000
