"""
Profile model (links to Supabase auth.users).
"""

from sqlalchemy import Column, String, Integer, DECIMAL, TIMESTAMP, ForeignKey, text
from app.types import UUID
from app.database import Base
import uuid


class Profile(Base):
    """
    User profile model.
    
    Note: id references auth.users from Supabase Auth.
    This table stores business-specific user data (credits, spending, etc.)
    """
    __tablename__ = "profiles"
    
    id = Column(
        UUID(),
        primary_key=True,
        default=uuid.uuid4
    )
    email = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("NOW()")
    )
    
    # Credits system
    credits = Column(Integer, nullable=False, default=0)
    credits_reserved = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Credits reserved for ongoing generations"
    )
    
    # Analytics
    total_credits_spent = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Total credits consumed (not money)"
    )
    total_spent_money = Column(
        DECIMAL(10, 2),
        nullable=False,
        default=0,
        comment="Total money spent on purchases"
    )
    
    def __repr__(self):
        return f"<Profile {self.email} (credits={self.credits})>"
