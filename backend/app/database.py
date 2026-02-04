"""
Database connection and session management.
Note: This app primarily uses Supabase REST API.
Direct database access is optional and only needed for specific use cases.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator, Optional

from app.config import settings

# Create Base class for models (always available for model definitions)
Base = declarative_base()

# Database engine and session (only if DATABASE_URL is configured)
engine = None
SessionLocal = None

database_url = settings.DATABASE_URL
if database_url:
    # Use postgresql+psycopg (not psycopg2)
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        echo=settings.DEBUG
    )

    # Create SessionLocal class
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Optional[Session], None, None]:
    """
    Dependency for getting database session.
    Returns None if DATABASE_URL is not configured.

    Usage in FastAPI:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            if db is None:
                raise HTTPException(500, "Database not configured")
            ...
    """
    if SessionLocal is None:
        yield None
        return

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
