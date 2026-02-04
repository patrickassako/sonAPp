#!/bin/bash
# Start RQ worker for music generation
# Usage: ./scripts/start-worker.sh [num_workers]

NUM_WORKERS=${1:-1}
REDIS_URL=${REDIS_URL:-redis://127.0.0.1:6379/0}

echo "Starting $NUM_WORKERS worker(s)..."

# macOS fork safety fix
export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES

for i in $(seq 1 $NUM_WORKERS); do
    echo "Starting worker $i..."
    rq worker music_generation --url "$REDIS_URL" &
done

echo "All workers started. Press Ctrl+C to stop."
wait
