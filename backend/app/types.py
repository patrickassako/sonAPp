"""
Database-agnostic UUID type for SQLAlchemy.
Works with both PostgreSQL (native UUID) and SQLite (TEXT).
"""
from sqlalchemy import TypeDecorator, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid


class UUID(TypeDecorator):
    """
    Cross-database UUID type.
    - PostgreSQL: Uses native UUID type
    - SQLite: Stores as TEXT (string representation)
    """
    impl = String(36)
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(String(36))
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value if isinstance(value, uuid.UUID) else uuid.UUID(value)
        else:
            return str(value)
    
    def process_result_value(self, value, dialect):
        if value is None:
            return value
        # For PostgreSQL with as_uuid=True, value is already UUID
        # For SQLite, value is string
        return value if isinstance(value, uuid.UUID) else uuid.UUID(value)
