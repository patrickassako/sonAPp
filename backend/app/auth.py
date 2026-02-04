"""
Authentication utilities for JWT token validation with Supabase.
"""

import httpx
import logging
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt, jwk
from jose.utils import base64url_decode
from typing import Optional
import json

from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

security = HTTPBearer()

# Cache for JWKS keys
_jwks_cache: dict = {}
_jwks_client: httpx.Client = None

def _get_jwks_client() -> httpx.Client:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = httpx.Client(timeout=10.0)
    return _jwks_client

async def _get_jwks_keys() -> dict:
    """Fetch JWKS keys from Supabase."""
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache

    # Extract project ref from SUPABASE_URL
    supabase_url = settings.SUPABASE_URL
    jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"

    try:
        client = _get_jwks_client()
        response = client.get(jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
        return _jwks_cache
    except Exception as e:
        logger.error(f"Failed to fetch JWKS: {e}")
        return {}


async def verify_supabase_token(token: str) -> dict:
    """
    Verify Supabase JWT token with full signature validation.
    Supports both ES256 (JWKS) and HS256 (legacy secret).

    Args:
        token: JWT token from Authorization header

    Returns:
        Decoded token payload with user info

    Raises:
        HTTPException: If token is invalid or signature verification fails
    """
    try:
        # Debug: log token info
        logger.info(f"[AUTH] Verifying token (first 50 chars): {token[:50]}...")

        # First, decode header to determine algorithm
        unverified_header = jwt.get_unverified_header(token)
        logger.info(f"[AUTH] Token header: {unverified_header}")
        algorithm = unverified_header.get("alg", "HS256")
        kid = unverified_header.get("kid")

        if algorithm == "ES256" and kid:
            # Use JWKS for ES256 tokens
            logger.info(f"[AUTH] Using ES256 with kid: {kid}")
            jwks = await _get_jwks_keys()
            logger.info(f"[AUTH] JWKS keys fetched: {len(jwks.get('keys', []))} keys")

            if not jwks or "keys" not in jwks:
                raise JWTError("Failed to fetch JWKS keys")

            # Find the key matching the kid
            key_data = None
            for key in jwks["keys"]:
                logger.info(f"[AUTH] Checking key kid: {key.get('kid')}")
                if key.get("kid") == kid:
                    key_data = key
                    break

            if not key_data:
                raise JWTError(f"Key with kid '{kid}' not found in JWKS")

            logger.info(f"[AUTH] Found matching key")

            # Construct the public key from JWK
            public_key = jwk.construct(key_data)

            payload = jwt.decode(
                token,
                public_key,
                algorithms=["ES256"],
                options={
                    "verify_signature": True,
                    "verify_aud": False,
                    "verify_exp": True,
                }
            )
        else:
            # Fallback to HS256 with legacy secret
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=["HS256"],
                options={
                    "verify_signature": True,
                    "verify_aud": False,
                    "verify_exp": True,
                }
            )

        if not payload.get("sub"):
            raise JWTError("Token missing 'sub' claim")

        return payload

    except JWTError as e:
        logger.error(f"JWT verification error: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token"
        )
    except Exception as e:
        logger.error(f"Unexpected auth error: {e}")
        raise HTTPException(
            status_code=401,
            detail="Authentication error"
        )


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> str:
    """
    Extract user ID from JWT token.
    
    Usage:
        @app.get("/protected")
        async def protected_route(user_id: str = Depends(get_current_user_id)):
            return {"user_id": user_id}
    """
    token = credentials.credentials
    payload = await verify_supabase_token(token)
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    return user_id


async def get_current_user_claims(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """
    Get full decoded JWT claims (includes email, sub, etc).
    """
    token = credentials.credentials
    payload = await verify_supabase_token(token)
    # Ensure 'id' key exists for convenience, mapping from 'sub'
    if "sub" in payload and "id" not in payload:
        payload["id"] = payload["sub"]
    return payload


async def get_current_user(
    user_id: str = Depends(get_current_user_id)
) -> str:
    """
    Get current authenticated user ID.
    
    This is now an alias for get_current_user_id for backward compatibility.
    Returns user ID string instead of Profile object.
    
    Usage:
        @app.get("/protected")
        async def protected_route(user_id: str = Depends(get_current_user)):
            # user_id is a string UUID
            return {"user_id": user_id}
    """
    return user_id


class OptionalAuth:
    """Optional authentication - returns None if no token provided."""
    
    async def __call__(
        self,
        credentials: Optional[HTTPAuthorizationCredentials] = Security(
            HTTPBearer(auto_error=False)
        )
    ) -> Optional[str]:
        """Get current user ID if authenticated, None otherwise."""
        if not credentials:
            return None
        
        try:
            return await get_current_user_id(credentials)
        except HTTPException:
            return None


# Instance for optional auth dependency
optional_auth = OptionalAuth()
