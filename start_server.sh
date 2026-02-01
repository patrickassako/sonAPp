#!/bin/bash

# Ensure we are in the project root
cd "$(dirname "$0")"

echo "🎵 Starting MusicApp Backend Server..."

# Check which python to use
if [ -d "backend/venv" ]; then
    source backend/venv/bin/activate
    echo "✅ Activated virtual environment."
else
    echo "⚠️  No virtual environment found at backend/venv."
    echo "Please set up the backend first."
    exit 1
fi

# Navigate to backend directory to pick up .env and app module
cd backend

# Start Uvicorn Server
echo "🚀 Starting FastAPI on http://localhost:8000..."
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
