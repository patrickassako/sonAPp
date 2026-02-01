"""
Payments API routes using Supabase SDK directly.
"""

from fastapi import APIRouter, Depends, HTTPException, Body, Request
from typing import List, Dict, Any
import uuid

from app.supabase_client import get_supabase_client
from app.auth import get_current_user_claims
from app.services.flutterwave import FlutterwaveService
from app.schemas import (
    InitiatePaymentRequest, 
    InitiatePaymentResponse, 
    SuccessResponse
)
from pydantic import BaseModel

class CreditPackageResponse(BaseModel):
    id: str
    name: str
    credits: int
    price: float
    currency: str
    features: List[str]
    is_popular: bool

router = APIRouter()
flutterwave_service = FlutterwaveService()
supabase = get_supabase_client()

@router.get("/packages", response_model=List[CreditPackageResponse])
async def list_packages():
    """List available active credit packages from Supabase."""
    try:
        packages = supabase.select(
            table="credit_packages",
            filters={"is_active": True},
            order="price"
        )
        return packages
    except Exception as e:
        print(f"Error fetching packages: {e}")
        return []


@router.post("/initiate", response_model=InitiatePaymentResponse)
async def initiate_payment(
    payment_data: InitiatePaymentRequest,
    user: dict = Depends(get_current_user_claims)
):
    """
    Initiate a payment transaction via Flutterwave.
    """
    print(f"DEBUG: User object from auth: {user}")
    
    user_id = user.get("id") or user.get("sub")
    email = user.get("email")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    if not email:
        # Fallback: try to find email in user_metadata if it exists
        if "user_metadata" in user and "email" in user["user_metadata"]:
            email = user["user_metadata"]["email"]
        else:
            print("WARNING: Email not found in token claims. Using placeholder.")
            # For debugging/dev optional:
            # raise HTTPException(status_code=400, detail="Email not found in token")
            email = "updated_user@example.com" # Placeholder if really needed or raise error

    # 1. Validate package
    try:
        packages = supabase.select("credit_packages", filters={"id": payment_data.package_id})
        if not packages:
            raise HTTPException(status_code=400, detail="Invalid package ID")
        package = packages[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    # 2. Create transaction record (pending)
    tx_ref = str(uuid.uuid4())
    transaction_data = {
        "id": tx_ref,
        "user_id": user_id,
        "type": "purchase",
        "amount": int(package["credits"]),
        "price": float(package["price"]),
        "payment_provider": "flutterwave",
        "status": "pending",
        "metadata": {"package_id": str(package["id"]), "package_name": package["name"]}
    }
    
    try:
        print(f"Creating transaction: {transaction_data}")
        supabase.insert("transactions", transaction_data)
        print("Transaction created in Supabase")
    except Exception as e:
        print(f"Supabase INSERT failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create transaction: {str(e)}")
    
    # 3. Call Flutterwave
    try:
        result = await flutterwave_service.initiate_payment(
            user_email=email,
            amount=float(package["price"]),
            currency=package["currency"],
            tx_ref=tx_ref,
            redirect_url=f"http://localhost:3000/credits/processed",
            meta={"user_id": user_id, "package_id": str(package["id"])}
        )
        return InitiatePaymentResponse(
            payment_link=result["payment_link"],
            transaction_id=tx_ref
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"FAILED to initiate payment: {str(e)}")
        # Rollback transaction (delete it)
        try:
            supabase.delete("transactions", filters={"id": tx_ref})
        except:
            pass
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
async def payment_webhook(request: Request):
    """
    Handle Flutterwave webhooks.
    """
    print("DEBUG: Webhook received!")
    signature = request.headers.get("verif-hash")
    payload = await request.body()
    print(f"DEBUG: Webhook Header Signature: {signature}")
    try:
        print(f"DEBUG: Webhook Payload: {payload.decode()}")
    except:
        print(f"DEBUG: Webhook Payload (raw): {payload}")
    
    if not flutterwave_service.verify_webhook_signature(signature, payload):
        raise HTTPException(status_code=401, detail="Invalid signature")
        
    data = await request.json()
    event_type = data.get("event")
    
    if event_type == "charge.completed" and data["data"]["status"] == "successful":
        tx_ref = data["data"]["tx_ref"]
        flw_id = data["data"]["id"]
        
        # Verify transaction
        try:
            transactions = supabase.select("transactions", filters={"id": tx_ref})
            if not transactions:
                 return SuccessResponse(message="Transaction not found but received")
                 
            transaction = transactions[0]
            
            if transaction["status"] == "completed":
                return SuccessResponse(message="Already processed")
                
            # Update transaction
            supabase.update(
                "transactions", 
                {"status": "completed", "payment_id": str(flw_id)},
                {"id": tx_ref}
            )
            
            # Update user credits
            # Fetch current profile
            profiles = supabase.select("profiles", filters={"id": transaction["user_id"]})
            if profiles:
                profile = profiles[0]
                new_credits = profile["credits"] + transaction["amount"]
                new_spent = float(profile["total_spent_money"]) + float(transaction["price"])
                
                supabase.update(
                    "profiles",
                    {"credits": new_credits, "total_spent_money": new_spent},
                    {"id": transaction["user_id"]}
                )
                
        except Exception as e:
            print(f"Webhook processing error: {e}")
            raise HTTPException(status_code=500, detail="Processing error")
        
    return SuccessResponse(message="Webhook processed")
