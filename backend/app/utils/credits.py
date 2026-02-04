"""
Credits management utilities - Migrated to Supabase REST API.

Handles reserve/debit/refund logic for credits.
"""

from decimal import Decimal
import uuid


# Supabase version of credit functions

def reserve_credits_supabase(client, user_id: str, amount: int) -> dict:
    """
    Reserve credits before generation (Supabase version).
    
    Moves credits from available to reserved.
    
    Args:
        client: SupabaseClient instance
        user_id: User UUID
        amount: Credits to reserve
    
    Returns:
        Transaction record (dict)
    
    Raises:
        ValueError: If insufficient credits
    """
    # Get profile
    profiles = client.select("profiles", filters={"id": user_id}, limit=1)
    
    if not profiles:
        raise ValueError("Profile not found")
    
    profile = profiles[0]
    available = profile["credits"] - profile["credits_reserved"]
    
    if available < amount:
        raise ValueError(
            f"Insufficient credits. Available: {available}, Required: {amount}"
        )
    
    # Update profile
    client.update(
        "profiles",
        {"credits_reserved": profile["credits_reserved"] + amount},
        {"id": user_id}
    )
    
    # Get updated profile
    updated_profiles = client.select("profiles", filters={"id": user_id}, limit=1)
    updated_profile = updated_profiles[0]
    
    # Create transaction record
    transaction = client.insert("transactions", {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": "reserve",
        "amount": amount,
        "status": "completed",
        "metadata": {"action": "reserve_for_generation"}
    })
    
    return transaction


def debit_credits_supabase(client, user_id: str, amount: int, job_id: str = None, metadata: dict = None, from_reserved: bool = True) -> dict:
    """
    Debit credits from user account (Supabase version).

    Args:
        client: SupabaseClient instance
        user_id: User UUID
        amount: Credits to debit
        job_id: Optional job ID (unused)
        metadata: Optional metadata dict
        from_reserved: If True, debit from reserved credits (for completing generation jobs).
                       If False, debit directly from available credits (for instant operations like lyrics).

    Returns:
        Transaction record (dict)

    Raises:
        ValueError: If insufficient credits
    """
    # Get profile
    profiles = client.select("profiles", filters={"id": user_id}, limit=1)

    if not profiles:
        raise ValueError("Profile not found")

    profile = profiles[0]

    if from_reserved:
        # Debit from reserved credits (after reservation)
        if profile["credits_reserved"] < amount:
            raise ValueError(
                f"Insufficient reserved credits. Reserved: {profile['credits_reserved']}, Required: {amount}"
            )

        new_credits = profile["credits"] - amount
        new_reserved = profile["credits_reserved"] - amount
    else:
        # Direct debit from available credits (no prior reservation)
        available = profile["credits"] - profile["credits_reserved"]
        if available < amount:
            raise ValueError(
                f"Insufficient credits. Available: {available}, Required: {amount}"
            )

        new_credits = profile["credits"] - amount
        new_reserved = profile["credits_reserved"]  # unchanged

    new_total_spent = profile["total_credits_spent"] + amount

    client.update(
        "profiles",
        {
            "credits": new_credits,
            "credits_reserved": new_reserved,
            "total_credits_spent": new_total_spent
        },
        {"id": user_id}
    )

    # Create transaction record
    transaction = client.insert("transactions", {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": "debit",
        "amount": amount,
        "status": "completed",
        "metadata": metadata or {}
    })

    return transaction


def refund_credits_supabase(client, user_id: str, amount: int, job_id: str = None, reason: str = None) -> dict:
    """
    Refund credits if generation fails (Supabase version).
    
    Returns reserved credits back to available.
    """
    # Get profile
    profiles = client.select("profiles", filters={"id": user_id}, limit=1)
    
    if not profiles:
        raise ValueError("Profile not found")
    
    profile = profiles[0]
    
    if profile["credits_reserved"] < amount:
        raise ValueError(
            f"Insufficient reserved credits. Reserved: {profile['credits_reserved']}, Required: {amount}"
        )
    
    # Update profile: reduce reserved only
    new_reserved = profile["credits_reserved"] - amount
    
    client.update(
        "profiles",
        {"credits_reserved": new_reserved},
        {"id": user_id}
    )
    
    # Create transaction record
    transaction = client.insert("transactions", {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": "refund",
        # "job_id": job_id, 
        "amount": amount,
        "status": "completed",
        "metadata": {"reason": reason or "generation_failed"}
    })
    
    return transaction


def purchase_credits_supabase(
    client,
    user_id: str,
    amount: int,
    price: Decimal,
    payment_provider: str,
    payment_id: str
) -> dict:
    """Record credit purchase (Supabase version)."""
    # Get profile
    profiles = client.select("profiles", filters={"id": user_id}, limit=1)
    
    if not profiles:
        raise ValueError("Profile not found")
    
    profile = profiles[0]
    
    # Update profile: add credits
    new_credits = profile["credits"] + amount
    
    client.update(
        "profiles",
        {"credits": new_credits},
        {"id": user_id}
    )
    
    # Create transaction record
    transaction = client.insert("transactions", {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": "purchase",
        "amount": amount,
        "price": float(price),
        "payment_provider": payment_provider,
        "payment_id": payment_id,
        "status": "completed",
        "metadata": {
            "payment_provider": payment_provider,
            "payment_id": payment_id
        }
    })
    
    return transaction
