"""
GenerationJob model - Tracks async music generation jobs.
"""

from sqlalchemy import Column, String, Integer, Enum, DateTime, ForeignKey, JSON, Text, text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.types import UUID
from app.database import Base
import uuid
import enum


class JobStatus(str, enum.Enum):
    """Generation job status."""
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class GenerationJob(Base):
    """
    Async generation job tracking.
    """
    __tablename__ = "generation_jobs"
    
    id = Column(
        UUID(),
        primary_key=True,
        default=uuid.uuid4
    )
    
    project_id = Column(UUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    
    provider_job_id = Column(String, nullable=True)  # SunoAPI task ID
    status = Column(String, nullable=False, default="queued")
    credits_cost = Column(Integer, nullable=False, default=10)
    
    job_metadata = Column(JSON, nullable=True, default=dict)  # Extra data (renamed from metadata)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<GenerationJob {self.id} - {self.status}>"
