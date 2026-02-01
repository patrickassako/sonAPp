#!/usr/bin/env python3
"""
RQ Worker starter script.

Starts worker to process music generation jobs.
"""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from redis import Redis
from rq import Worker, Queue

from app.config import settings

def main():
    """Start RQ worker."""
    print("🎵 MusicApp Worker Starting...")
    print(f"Redis: {settings.REDIS_URL}")
    print("=" * 60)
    
    # Connect to Redis
    redis_conn = Redis.from_url(settings.REDIS_URL)
    
    # Listen to queue
    queue = Queue("music_generation", connection=redis_conn)
    
    print(f"Listening to queue: music_generation")
    print("Worker ready! Waiting for jobs...")
    print("=" * 60)
    
    # Start worker
    worker = Worker([queue], connection=redis_conn)
    worker.work()


if __name__ == "__main__":
    main()
