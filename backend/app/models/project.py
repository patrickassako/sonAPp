"""
Project model - User music projects.
"""

from sqlalchemy import Column, String, Text, Enum, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.types import UUID
from app.database import Base
import uuid
import enum


class ProjectMode(str, enum.Enum):
    """Generation mode."""
    TEXT = "TEXT"
    CONTEXT = "CONTEXT"  # With AI assistance


class ProjectStatus(str, enum.Enum):
    """Project status."""
    DRAFT = "draft"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class Project(Base):
    """
    Music generation project.
    """
    __tablename__ = "projects"
    
    id = Column(
        UUID(),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id = Column(UUID(), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String, nullable=False)
    mode = Column(String, nullable=False)  # TEXT or CONTEXT
    language = Column(String, nullable=False, default="fr")  # fr or en
    style_id = Column(String, nullable=False)
    
    # Mode-specific inputs
    context_input = Column(Text, nullable=True)  # For CONTEXT mode
    lyrics_final = Column(Text, nullable=True)   # For TEXT mode or generated
    
    status = Column(String, nullable=False, default="draft")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Project {self.id} - {self.title} ({self.status})>"
