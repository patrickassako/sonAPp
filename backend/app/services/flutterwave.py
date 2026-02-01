
import httpx
import hashlib
import os
import uuid
from typing import Dict, Optional, Any
from app.config import settings

class FlutterwaveService:
    """
    Service to handle Flutterwave payment integrations.
    Docs: https://developer.flutterwave.com/docs/collecting-payments/standard/
    """
    
    BASE_URL = "https://api.flutterwave.com/v3"
    
    def __init__(self):
        self.secret_key = settings.FLUTTERWAVE_SECRET_KEY
        self.public_key = settings.FLUTTERWAVE_PUBLIC_KEY
        self.webhook_secret = settings.FLUTTERWAVE_WEBHOOK_SECRET
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }

    async def initiate_payment(
        self, 
        user_email: str, 
        amount: float, 
        currency: str = "XAF",
        tx_ref: str = None,
        redirect_url: str = None,
        meta: Dict = None
    ) -> Dict[str, Any]:
        """
        Initiate a standard payment link.
        """
        if not tx_ref:
            tx_ref = str(uuid.uuid4())
            
        payload = {
            "tx_ref": tx_ref,
            "amount": str(amount),
            "currency": currency,
            "redirect_url": redirect_url,
            "payment_options": "card,mobilemoney,ussd",
            "customer": {
                "email": user_email,
                # "name": user_name  # Optional if we had it
            },
            "customizations": {
                "title": settings.APP_NAME,
                "description": "Credits Purchase",
                "logo": "https://musicapp.com/logo.png" # Replace with actual logo URL
            },
            "meta": meta or {}
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/payments",
                json=payload,
                headers=self.headers
            )
            data = response.json()
            
            if data.get("status") != "success":
                raise Exception(f"Flutterwave Error: {data.get('message')}")
                
            return {
                "payment_link": data["data"]["link"],
                "tx_ref": tx_ref
            }

    async def verify_transaction(self, transaction_id: str) -> Dict[str, Any]:
        """
        Verify a transaction by ID (Flutterwave ID, not tx_ref).
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/transactions/{transaction_id}/verify",
                headers=self.headers
            )
            data = response.json()
            
            if data.get("status") != "success":
                raise Exception(f"Verification Failed: {data.get('message')}")
                
            return data["data"]

    def verify_webhook_signature(self, signature: str, payload: bytes) -> bool:
        """
        Verify webhook signature from Flutterwave.
        """
        if not signature:
            return False
            
        hashed = hashlib.sha256(self.webhook_secret.encode("utf-8") + payload).hexdigest()
        # Note: Flutterwave documentation specifies different verification methods depending on version.
        # This is a generic hash verification. 
        # For v3, they often use the 'verif-hash' header which matches the secret hash.
        return signature == self.webhook_secret 
