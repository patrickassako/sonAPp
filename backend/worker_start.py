"""
Worker starter with health check endpoint for Railway.
Runs RQ worker + a minimal HTTP server on /health.
"""
import os
import subprocess
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"healthy","service":"worker"}')
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass  # Suppress logs


def start_health_server():
    port = int(os.environ.get("PORT", 8080))
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    server.serve_forever()


if __name__ == "__main__":
    # Start health check server in background thread
    t = threading.Thread(target=start_health_server, daemon=True)
    t.start()

    # Start RQ worker as subprocess (not execvp, which would kill the health thread)
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    proc = subprocess.Popen(["rq", "worker", "music_generation", "--url", redis_url])
    proc.wait()
