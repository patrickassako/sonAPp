"""
Pydantic schemas for API requests and responses.
"""

from pydantic import BaseModel, EmailStr, UUID4, model_validator
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
    custom_style_text: Optional[str] = None  # For custom style mode
    context_input: Optional[str] = None  # For CONTEXT mode
    lyrics_final: Optional[str] = None   # For TEXT mode
    audio_url: Optional[str] = None      # For AUDIO_INPUT mode or idea
    generate_video: bool = False

    @model_validator(mode="after")
    def validate_custom_style(self):
        # Parse base style_id (strip voice suffix like ":male")
        base_style = self.style_id.split(":")[0] if self.style_id else ""
        if base_style == "custom" and not self.custom_style_text:
            raise ValueError("custom_style_text is required when style_id is 'custom'")
        if base_style != "custom":
            self.custom_style_text = None  # Ignore for preset styles
        return self


class ProjectResponse(BaseModel):
    """Project response."""
    id: Union[str, UUID4]
    user_id: Union[str, UUID4]
    title: str
    mode: str
    language: str
    style_id: str
    custom_style_text: Optional[str] = None
    context_input: Optional[str]
    lyrics_final: Optional[str]
    audio_url: Optional[str]
    generate_video: bool = False
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
    video_status: Optional[str] = None
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
    video_url: Optional[str] = None
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
    currency: str = "XAF"
    features: List[str] = []
    is_popular: bool = False


class CreditPackageResponse(CreditPackage):
    """Response for credit package."""
    pass


class InitiatePaymentRequest(BaseModel):
    """Request to initiate payment."""
    package_id: str
    customer_name: Optional[str] = None
    phone_number: Optional[str] = None
    country_code: Optional[str] = None
    payment_method: Optional[str] = "card"  # "card" or "mobile_money"
    network: Optional[str] = None  # MTN, ORANGE, MPESA, etc.

    @model_validator(mode="after")
    def validate_mobile_money_fields(self):
        import re
        if self.payment_method == "mobile_money":
            if not self.phone_number:
                raise ValueError("Phone number is required for Mobile Money")
            # Allow digits, optional leading +, spaces/dashes stripped
            cleaned = re.sub(r"[\s\-]", "", self.phone_number)
            if not re.match(r"^\+?\d{7,15}$", cleaned):
                raise ValueError("Invalid phone number format")
            self.phone_number = cleaned
            if not self.network:
                raise ValueError("Network is required for Mobile Money")
            if not self.country_code:
                raise ValueError("Country code is required for Mobile Money")
        return self


class InitiatePaymentResponse(BaseModel):
    """Payment initialization response."""
    payment_link: Optional[str] = None
    transaction_id: str
    payment_method: str = "card"
    status: str = "pending"
    instructions: Optional[str] = None  # For Mobile Money: "Enter your PIN on your phone"


class MobileMoneyChargeResponse(BaseModel):
    """Response for Mobile Money direct charge."""
    status: str  # "pending", "successful", "failed"
    message: str
    tx_ref: str
    flw_ref: Optional[str] = None
    instructions: Optional[str] = None


class CountryInfo(BaseModel):
    """Country information with payment options."""
    code: str
    name: str
    currency: str
    dial_code: str
    mobile_money: bool
    networks: List[str]


class CountriesListResponse(BaseModel):
    """List of supported countries."""
    countries: List[CountryInfo]


class ChargeStatusResponse(BaseModel):
    """Response for charge status check."""
    status: str  # "pending", "successful", "failed"
    message: str
    tx_ref: str


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
