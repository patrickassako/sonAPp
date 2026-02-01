"""
Pydantic schemas for API requests and responses.
"""

from pydantic import BaseModel, EmailStr, UUID4
from typing import Optional, List, Union
from datetime import datetime
from decimal import Decimal


# ============================================================================
# AUTH & USER SCHEMAS
# ============================================================================

class ProfileResponse(BaseModel):
    """User profile response."""
    id: Union[str, UUID4]
    email: EmailStr
    created_at: datetime
    credits: int
    credits_reserved: int
    total_credits_spent: int
    total_spent_money: Decimal
    
    class Config:
        from_attributes = True


class WalletResponse(BaseModel):
    """User wallet/credits info."""
    credits: int
    credits_reserved: int
    credits_available: int  # credits - credits_reserved
    total_spent: int
    total_spent_money: Decimal


# ============================================================================
# STYLE SCHEMAS
# ============================================================================

class StyleResponse(BaseModel):
    """Musical style response."""
    id: str
    label: str
    category: str
    bpm_range: List[int]
    energy: str
    instrumentation: List[str]
    prompt_template_fr: str
    prompt_template_en: str


class CategoryResponse(BaseModel):
    """Style category response."""
    id: str
    label_fr: str
    label_en: str


class StylesListResponse(BaseModel):
    """List of styles grouped by category."""
    styles: List[StyleResponse]
    categories: List[CategoryResponse]


# ============================================================================
# PROJECT SCHEMAS
# ============================================================================

class ProjectCreate(BaseModel):
    """Create new project."""
    title: str
    mode: str  # "TEXT" or "CONTEXT"
    language: str = "fr"  # "fr" or "en"
    style_id: str
    context_input: Optional[str] = None  # For CONTEXT mode
    lyrics_final: Optional[str] = None   # For TEXT mode


class ProjectResponse(BaseModel):
    """Project response."""
    id: Union[str, UUID4]
    user_id: Union[str, UUID4]
    title: str
    mode: str
    language: str
    style_id: str
    context_input: Optional[str]
    lyrics_final: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# GENERATION SCHEMAS
# ============================================================================

class GenerateRequest(BaseModel):
    """Request to generate music for a project."""
    project_id: str


class GenerateLyricsRequest(BaseModel):
    """Request to generate lyrics."""
    title: Optional[str] = None
    description: str
    style: Optional[str] = None
    language: str = "fr"


class LyricsResponse(BaseModel):
    """Generated lyrics response."""
    lyrics: Optional[str] = None
    candidates: Optional[List[str]] = None


class JobStatusResponse(BaseModel):
    """Generation job status."""
    id: Union[str, UUID4]
    project_id: Union[str, UUID4]
    status: str
    credits_cost: int
    error_message: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class AudioFileResponse(BaseModel):
    """Audio file response."""
    id: Union[str, UUID4]
    file_url: Optional[str]
    stream_url: Optional[str]
    image_url: Optional[str]
    duration: Optional[int]
    version_number: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# PAYMENT SCHEMAS
# ============================================================================

class CreditPackage(BaseModel):
    """Credit package for purchase."""
    id: str
    name: str
    credits: int
    price: Decimal
    currency: str = "XAF"  # Central African Franc


class InitiatePaymentRequest(BaseModel):
    """Request to initiate payment."""
    package_id: str


class InitiatePaymentResponse(BaseModel):
    """Payment initialization response."""
    payment_link: str
    transaction_id: str


# ============================================================================
# GENERIC RESPONSES
# ============================================================================

class SuccessResponse(BaseModel):
    """Generic success response."""
    success: bool = True
    message: str


class ErrorResponse(BaseModel):
    """Generic error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None
