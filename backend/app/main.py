"""
MusicApp FastAPI Application - Main Entry Point
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import settings

# Rate limiter: uses client IP for identification
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "app": settings.APP_NAME,
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check."""
    return {
        "status": "healthy",
    }


@app.get("/health/queue")
async def queue_health():
    """Queue health check - shows worker and job status."""
    try:
        from redis import Redis
        from rq import Queue
        from rq.worker import Worker

        redis_conn = Redis.from_url(settings.REDIS_URL)
        queue = Queue("music_generation", connection=redis_conn)
        workers = Worker.all(connection=redis_conn)

        return {
            "status": "healthy",
            "queue": {
                "name": "music_generation",
                "jobs_queued": queue.count,
                "jobs_failed": queue.failed_job_registry.count,
                "jobs_finished": queue.finished_job_registry.count,
            },
            "workers": {
                "count": len(workers),
                "active": sum(1 for w in workers if w.get_state() == "busy"),
                "idle": sum(1 for w in workers if w.get_state() == "idle"),
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


# ============================================================================
# API ROUTES
# ============================================================================

from app.api.v1 import auth, users, styles, projects, generate, payments, share, notifications

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(styles.router, prefix="/api/v1/styles", tags=["Styles"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(generate.router, prefix="/api/v1/generate", tags=["Generation"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(share.router, prefix="/api/v1/share", tags=["Share"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
