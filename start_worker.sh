#!/bin/bash

# Ensure we are in the project root
cd "$(dirname "$0")"

echo "🎵 Starting MusicApp Worker..."

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

# Start RQ Worker
# Fix for macOS fork safety crash
export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
export NO_PROXY="*"

# Run the worker for 'music_generation' queue
# Use SimpleWorker to avoid fork() crashes on macOS
echo "🚀 Listening for jobs on queue: music_generation..."
rq worker music_generation --with-scheduler --worker-class rq.worker.SimpleWorker
