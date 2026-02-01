"""
Transaction model - Credit transactions history.
"""

from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.types import UUID
import uuid
import enum

from app.database import Base


class TransactionType(str, enum.Enum):
    """Transaction type enum."""
    PURCHASE = "purchase"
    RESERVE = "reserve"
    DEBIT = "debit"
    REFUND = "refund"


class TransactionStatus(str, enum.Enum):
    """Transaction status enum."""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class Transaction(Base):
    """
    Credit transaction.
    
    Tracks all credit movements:
    - PURCHASE: User buys credits (payment)
    - RESERVE: Credits reserved before generation
    - DEBIT: Credits charged after successful generation
    - REFUND: Credits returned on failed generation
    """
    __tablename__ = "transactions"
    
    id = Column(
        UUID(),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id = Column(UUID(), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    
    type = Column(String, nullable=False)  # purchase, reserve, debit, refund
    amount = Column(Integer, nullable=False)  # Credits amount
    price = Column(Numeric(10, 2), nullable=True)  # Money amount (for purchases)
    balance_after = Column(Integer, nullable=False)  # Balance after transaction
    
    payment_provider = Column(String, nullable=True)  # flutterwave, etc.
    payment_id = Column(String, nullable=True)  # External payment ID
    
    status = Column(String, nullable=False, default="pending")
    transaction_metadata = Column(JSON, nullable=True, default=dict)  # Renamed from metadata
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Transaction {self.id} - {self.type} {self.amount} credits>"
