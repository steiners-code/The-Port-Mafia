#!/bin/sh

# 1. Run migrations safely
echo "Running database migrations..."
bunx prisma migrate deploy

# 2. Start Elysia
echo "Starting LinkedIn server..."
exec bun run start