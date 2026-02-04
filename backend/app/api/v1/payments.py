"""
Payments API routes using Supabase SDK directly.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import List
import logging
import uuid

from app.supabase_client import get_supabase_client
from app.auth import get_current_user_claims
from app.services.flutterwave import FlutterwaveService
from app.config import settings, SUPPORTED_COUNTRIES
from app.schemas import (
    InitiatePaymentRequest,
    InitiatePaymentResponse,
    SuccessResponse,
    CreditPackageResponse,
    CountryInfo,
    CountriesListResponse,
    ChargeStatusResponse
)

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()
flutterwave_service = FlutterwaveService()
supabase = get_supabase_client()


def _complete_transaction_and_credit(tx_ref: str, payment_id: str) -> bool:
    """
    Atomically mark a transaction as completed and add credits.
    Uses status=pending filter to prevent double-credit race condition.

    Returns True if credits were added, False if already processed.
    """
    # Atomic update: only update if status is still "pending"
    updated = supabase.update(
        "transactions",
        {"status": "completed", "payment_id": str(payment_id)},
        {"id": tx_ref, "status": "pending"}
    )

    if not updated:
        # Transaction was already completed by another path (webhook/verify/poll)
        logger.info("Transaction %s already completed, skipping credit update", tx_ref)
        return False

    transaction = updated[0]

    # Update user credits
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

    logger.info("Credits added for transaction %s", tx_ref)
    return True


@router.get("/countries", response_model=CountriesListResponse)
async def list_countries():
    """List supported countries with their payment options."""
    countries = [
        CountryInfo(
            code=code,
            name=config["name"],
            currency=config["currency"],
            dial_code=config["dial_code"],
            mobile_money=config["mobile_money"],
            networks=config["networks"]
        )
        for code, config in SUPPORTED_COUNTRIES.items()
    ]
    return CountriesListResponse(countries=countries)


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
        logger.error("Error fetching packages: %s", e)
        return []


@router.post("/initiate", response_model=InitiatePaymentResponse)
@limiter.limit("10/minute")
async def initiate_payment(
    request: Request,
    payment_data: InitiatePaymentRequest,
    user: dict = Depends(get_current_user_claims)
):
    """
    Initiate a payment transaction via Flutterwave.
    Supports both card (redirect) and mobile_money (direct charge) flows.
    """
    user_id = user.get("id") or user.get("sub")
    email = user.get("email")

    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    if not email:
        if "user_metadata" in user and "email" in user["user_metadata"]:
            email = user["user_metadata"]["email"]
        else:
            raise HTTPException(status_code=400, detail="Email not found in token")

    # 1. Validate package
    try:
        packages = supabase.select("credit_packages", filters={"id": payment_data.package_id})
        if not packages:
            raise HTTPException(status_code=400, detail="Invalid package ID")
        package = packages[0]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to validate package")

    # Determine currency based on country or package
    country_code = payment_data.country_code or "OTHER"
    country_config = SUPPORTED_COUNTRIES.get(country_code, SUPPORTED_COUNTRIES["OTHER"])
    currency = country_config["currency"] if country_code != "OTHER" else package["currency"]

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
        "metadata": {
            "package_id": str(package["id"]),
            "package_name": package["name"],
            "payment_method": payment_data.payment_method,
            "country_code": country_code,
            "network": payment_data.network,
            "customer_name": payment_data.customer_name,
            "phone_number": payment_data.phone_number
        }
    }

    try:
        supabase.insert("transactions", transaction_data)
    except Exception as e:
        logger.error("Failed to create transaction: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create transaction")

    # 3. Handle payment based on method
    try:
        if payment_data.payment_method == "mobile_money":
            # Direct Mobile Money charge
            if not payment_data.phone_number:
                raise HTTPException(status_code=400, detail="Phone number required for Mobile Money")
            if not payment_data.network:
                raise HTTPException(status_code=400, detail="Network required for Mobile Money")
            if not country_config.get("mobile_money"):
                raise HTTPException(status_code=400, detail="Mobile Money not supported for this country")

            result = await flutterwave_service.charge_mobile_money(
                phone_number=payment_data.phone_number,
                amount=float(package["price"]),
                currency=currency,
                country=country_code,
                network=payment_data.network,
                email=email,
                tx_ref=tx_ref,
                customer_name=payment_data.customer_name or "Customer"
            )

            # Store flw_ref in transaction metadata for status checking
            if result.get("flw_ref"):
                try:
                    updated_metadata = transaction_data["metadata"].copy()
                    updated_metadata["flw_ref"] = result.get("flw_ref")
                    supabase.update(
                        "transactions",
                        {"metadata": updated_metadata},
                        {"id": tx_ref}
                    )
                except Exception as e:
                    logger.warning("Failed to update flw_ref: %s", e)

            return InitiatePaymentResponse(
                payment_link=None,
                transaction_id=tx_ref,
                payment_method="mobile_money",
                status=result.get("status", "pending"),
                instructions=result.get("instructions")
            )
        else:
            # Card payment - redirect to Flutterwave page
            # Build redirect URL from configured CORS origin
            frontend_url = settings.cors_origins_list[0] if settings.cors_origins_list else "https://app.musicapp.com"
            result = await flutterwave_service.initiate_payment(
                user_email=email,
                amount=float(package["price"]),
                currency=currency,
                tx_ref=tx_ref,
                redirect_url=f"{frontend_url}/credits/processed",
                meta={
                    "user_id": user_id,
                    "package_id": str(package["id"]),
                    "customer_name": payment_data.customer_name
                }
            )
            return InitiatePaymentResponse(
                payment_link=result["payment_link"],
                transaction_id=tx_ref,
                payment_method="card",
                status="pending"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to initiate payment for tx %s: %s", tx_ref, e)
        # Rollback transaction
        try:
            supabase.delete("transactions", filters={"id": tx_ref})
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="Payment initiation failed")


@router.get("/charge-status/{tx_ref}", response_model=ChargeStatusResponse)
async def get_charge_status(
    tx_ref: str,
    user: dict = Depends(get_current_user_claims)
):
    """
    Check the status of a Mobile Money charge.
    Used for polling during Mobile Money payment flow.
    Requires authentication to prevent unauthorized status checks.
    """
    user_id = user.get("id") or user.get("sub")

    try:
        # First check our local transaction
        transactions = supabase.select("transactions", filters={"id": tx_ref})
        if not transactions:
            raise HTTPException(status_code=404, detail="Transaction not found")

        transaction = transactions[0]

        # Verify ownership
        if transaction["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        # If already completed locally, return success
        if transaction["status"] == "completed":
            return ChargeStatusResponse(
                status="successful",
                message="Payment completed",
                tx_ref=tx_ref
            )

        # Get flw_ref from metadata if available
        metadata = transaction.get("metadata", {})
        flw_ref = metadata.get("flw_ref") if isinstance(metadata, dict) else None

        # Check with Flutterwave
        result = await flutterwave_service.get_charge_status(tx_ref, flw_ref)

        # If successful, atomically update transaction and credits
        if result["status"] == "successful":
            _complete_transaction_and_credit(tx_ref, str(result.get("flw_id", "")))

        return ChargeStatusResponse(
            status=result["status"],
            message=result["message"],
            tx_ref=tx_ref
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Charge status check failed for %s: %s", tx_ref, e)
        return ChargeStatusResponse(
            status="pending",
            message="Unable to check status",
            tx_ref=tx_ref
        )


@router.get("/verify/{tx_ref}", response_model=SuccessResponse)
@limiter.limit("20/minute")
async def verify_payment(
    request: Request,
    tx_ref: str,
    transaction_id: str = None,
    user: dict = Depends(get_current_user_claims)
):
    """
    Verify transaction status (called by frontend on redirect).
    Requires authentication to prevent unauthorized verification.
    """
    user_id = user.get("id") or user.get("sub")

    try:
        # 1. Check if already completed
        transactions = supabase.select("transactions", filters={"id": tx_ref})
        if not transactions:
            raise HTTPException(status_code=404, detail="Transaction not found")

        transaction = transactions[0]

        # Verify ownership
        if transaction["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        if transaction["status"] == "completed":
            return SuccessResponse(message="Transaction already completed")

        # 2. Verify with Flutterwave
        fw_id = transaction_id or transaction.get("payment_id")

        if fw_id:
            verified_data = await flutterwave_service.verify_transaction(transaction_id=fw_id)
        else:
            verified_data = await flutterwave_service.verify_transaction(tx_ref=tx_ref)

        if not verified_data:
            raise HTTPException(status_code=502, detail="Empty response from payment provider")

        if verified_data["status"] == "successful" and verified_data["amount"] >= transaction["price"]:
            _complete_transaction_and_credit(tx_ref, str(verified_data["id"]))
            return SuccessResponse(message="Payment verified and credits added")
        else:
            return SuccessResponse(message="Payment pending or failed")

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Verification failed for %s: %s", tx_ref, e)
        raise HTTPException(status_code=400, detail="Payment verification failed")


@router.post("/webhook")
@limiter.limit("30/minute")
async def payment_webhook(request: Request):
    """
    Handle Flutterwave webhooks.
    """
    signature = request.headers.get("verif-hash")

    if not flutterwave_service.verify_webhook_signature(signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    data = await request.json()
    event_type = data.get("event")

    if event_type == "charge.completed" and data["data"]["status"] == "successful":
        tx_ref = data["data"]["tx_ref"]
        flw_id = data["data"]["id"]

        try:
            transactions = supabase.select("transactions", filters={"id": tx_ref})
            if not transactions:
                return SuccessResponse(message="Transaction not found but acknowledged")

            _complete_transaction_and_credit(tx_ref, str(flw_id))

        except Exception as e:
            logger.error("Webhook processing error for %s: %s", tx_ref, e)
            raise HTTPException(status_code=500, detail="Processing error")

    return SuccessResponse(message="Webhook processed")
