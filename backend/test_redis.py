import redis
import sys

try:
    r = redis.from_url("redis://127.0.0.1:6379/0", socket_connect_timeout=3)
    r.ping()
    print("SUCCESS: Connected to Redis!")
except Exception as e:
    print(f"FAILURE: Could not connect to Redis: {e}")
    sys.exit(1)
