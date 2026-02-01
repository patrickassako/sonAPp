"""
MusicApp FastAPI Application - Main Entry Point

Epic 1+2: Foundation & Auth
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG,
    description="Platform de création musicale personnalisée avec styles africains"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "running",
        "environment": settings.ENVIRONMENT
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",  # TODO: Add actual DB check
        "redis": "connected"       # TODO: Add actual Redis check
    }


# ============================================================================
# API ROUTES
# ============================================================================

from app.api.v1 import auth, users, styles, projects, generate, payments

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(styles.router, prefix="/api/v1/styles", tags=["Styles"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(generate.router, prefix="/api/v1/generate", tags=["Generation"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Payments"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
