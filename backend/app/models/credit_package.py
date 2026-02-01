from sqlalchemy import Column, String, Integer, Boolean, Numeric, DateTime, text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

import uuid

class CreditPackage(Base):
    __tablename__ = "credit_packages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    credits = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, nullable=False, default="XAF")
    features = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    is_popular = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "credits": self.credits,
            "price": float(self.price),
            "currency": self.currency,
            "features": self.features,
            "is_popular": self.is_popular
        }
