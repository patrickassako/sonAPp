"""
Configuration settings for MusicApp backend.
Loads environment variables and provides typed settings.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App
    APP_NAME: str = "MusicApp API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # Database (optional - we use Supabase REST API)
    DATABASE_URL: str | None = None
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # SunoAPI
    SUNO_API_KEY: str
    SUNO_BASE_URL: str = "https://api.sunoapi.org"
    
    # LLM (for lyrics generation)
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    
    # Flutterwave
    FLUTTERWAVE_SECRET_KEY: str
    FLUTTERWAVE_PUBLIC_KEY: str
    FLUTTERWAVE_WEBHOOK_SECRET: str
    
    # Security
    JWT_SECRET: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"
    
    # SMTP (for email notifications)
    SMTP_HOST: str = "mail.bimzik.com"
    SMTP_PORT: int = 465
    SMTP_USER: str = "service@bimzik.com"
    SMTP_PASSWORD: str | None = None

    # Frontend URL (for share links in notifications)
    FRONTEND_URL: str = "http://localhost:3000"

    # VAPID (for Web Push notifications)
    VAPID_PUBLIC_KEY: str | None = None
    VAPID_PRIVATE_KEY: str | None = None
    VAPID_CLAIMS_EMAIL: str = "mailto:service@bimzik.com"

    # Storage
    UPLOAD_DIR: str = "./uploads"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins string into list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Singleton instance
settings = Settings()


# ============================================================================
# SUPPORTED COUNTRIES CONFIGURATION
# ============================================================================

SUPPORTED_COUNTRIES = {
    # Pays francophones avec Mobile Money
    "CM": {
        "name": "Cameroun",
        "currency": "XAF",
        "dial_code": "+237",
        "mobile_money": True,
        "networks": ["MTN", "ORANGE"],
        "flw_type": "mobile_money_franco"
    },
    "CI": {
        "name": "Côte d'Ivoire",
        "currency": "XOF",
        "dial_code": "+225",
        "mobile_money": True,
        "networks": ["MTN", "ORANGE", "MOOV"],
        "flw_type": "mobile_money_franco"
    },
    "SN": {
        "name": "Sénégal",
        "currency": "XOF",
        "dial_code": "+221",
        "mobile_money": True,
        "networks": ["ORANGE", "FREE"],
        "flw_type": "mobile_money_franco"
    },
    # Pays anglophones avec Mobile Money
    "GH": {
        "name": "Ghana",
        "currency": "GHS",
        "dial_code": "+233",
        "mobile_money": True,
        "networks": ["MTN", "VODAFONE", "AIRTELTIGO"],
        "flw_type": "mobile_money_ghana"
    },
    "KE": {
        "name": "Kenya",
        "currency": "KES",
        "dial_code": "+254",
        "mobile_money": True,
        "networks": ["MPESA", "AIRTEL"],
        "flw_type": "mpesa"
    },
    "UG": {
        "name": "Uganda",
        "currency": "UGX",
        "dial_code": "+256",
        "mobile_money": True,
        "networks": ["MTN", "AIRTEL"],
        "flw_type": "mobile_money_uganda"
    },
    # Pays avec carte uniquement
    "NG": {
        "name": "Nigeria",
        "currency": "NGN",
        "dial_code": "+234",
        "mobile_money": False,
        "networks": [],
        "flw_type": "card"
    },
    "ZA": {
        "name": "South Africa",
        "currency": "ZAR",
        "dial_code": "+27",
        "mobile_money": False,
        "networks": [],
        "flw_type": "card"
    },
    "OTHER": {
        "name": "Other / International",
        "currency": "USD",
        "dial_code": "",
        "mobile_money": False,
        "networks": [],
        "flw_type": "card"
    }
}
