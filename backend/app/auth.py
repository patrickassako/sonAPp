"""
Authentication utilities for JWT token validation with Supabase.
"""

from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Optional

from app.config import settings

security = HTTPBearer()


async def verify_supabase_token(token: str) -> dict:
    """
    Verify Supabase JWT token with full signature validation.

    Args:
        token: JWT token from Authorization header

    Returns:
        Decoded token payload with user info

    Raises:
        HTTPException: If token is invalid or signature verification fails
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.ALGORITHM],
            options={
                "verify_signature": True,
                "verify_aud": False,
                "verify_exp": True,
            }
        )

        if not payload.get("sub"):
            raise JWTError("Token missing 'sub' claim")

        return payload

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token"
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
