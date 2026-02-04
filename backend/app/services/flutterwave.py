import httpx
import hmac
import logging
import uuid
from typing import Dict, Optional, Any
from app.config import settings, SUPPORTED_COUNTRIES

logger = logging.getLogger(__name__)

class FlutterwaveService:
    """
    Service to handle Flutterwave payment integrations.
    Docs: https://developer.flutterwave.com/docs/collecting-payments/standard/
    Uses a persistent AsyncClient to reuse connections and avoid TLS handshake overhead.
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
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create the persistent HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers=self.headers,
                timeout=httpx.Timeout(30.0, connect=10.0),
            )
        return self._client

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

        client = await self._get_client()
        response = await client.post(
            f"{self.BASE_URL}/payments",
            json=payload,
        )
        data = response.json()
            
        if data.get("status") != "success":
            raise Exception(f"Flutterwave Error: {data.get('message')}")

        return {
            "payment_link": data["data"]["link"],
            "tx_ref": tx_ref
        }

    async def verify_transaction(self, transaction_id: str = None, tx_ref: str = None) -> Dict[str, Any]:
        """
        Verify a transaction by ID (Flutterwave ID) or TX_REF.
        """
        if not transaction_id and not tx_ref:
             raise ValueError("Must provide either transaction_id or tx_ref")

        client = await self._get_client()
        if transaction_id and str(transaction_id) != str(tx_ref):
            endpoint = f"{self.BASE_URL}/transactions/{transaction_id}/verify"
        else:
            endpoint = f"{self.BASE_URL}/transactions?tx_ref={tx_ref or transaction_id}"

        response = await client.get(endpoint)
        data = response.json()

        if data.get("status") != "success":
            raise Exception(f"Verification Failed: {data.get('message')}")

        # If using ?tx_ref, result is a LIST in data['data']
        if "?tx_ref" in endpoint:
            if isinstance(data["data"], list) and len(data["data"]) > 0:
                return data["data"][0]
            elif isinstance(data["data"], list) and len(data["data"]) == 0:
                raise Exception("Transaction not found for this Ref")
            else:
                return data["data"]

        return data["data"]

    def verify_webhook_signature(self, signature: str) -> bool:
        """
        Verify webhook signature from Flutterwave v3.
        Flutterwave sends the webhook secret in the 'verif-hash' header.
        Uses timing-safe comparison to prevent timing attacks.
        """
        if not signature or not self.webhook_secret:
            return False

        return hmac.compare_digest(signature, self.webhook_secret)

    async def charge_mobile_money(
        self,
        phone_number: str,
        amount: float,
        currency: str,
        country: str,
        network: str,
        email: str,
        tx_ref: str,
        customer_name: str
    ) -> Dict[str, Any]:
        """
        Charge direct Mobile Money sans redirection.
        Endpoint: POST /v3/charges?type={flw_type}

        Args:
            phone_number: Numéro de téléphone (format local sans indicatif)
            amount: Montant à charger
            currency: Devise (XAF, XOF, GHS, KES, UGX)
            country: Code pays (CM, CI, SN, GH, KE, UG)
            network: Réseau mobile (MTN, ORANGE, MPESA, etc.)
            email: Email du client
            tx_ref: Référence de transaction unique
            customer_name: Nom complet du client

        Returns:
            Dict avec status, message, instructions
        """
        country_config = SUPPORTED_COUNTRIES.get(country)
        if not country_config or not country_config.get("mobile_money"):
            raise ValueError(f"Mobile Money not supported for country: {country}")

        flw_type = country_config["flw_type"]

        # Build payload based on flw_type
        payload = {
            "phone_number": phone_number,
            "amount": str(amount),
            "currency": currency,
            "email": email,
            "tx_ref": tx_ref,
            "fullname": customer_name,
        }

        # Specific configurations per charge type
        if flw_type == "mobile_money_franco":
            # Francophone Africa (Cameroon, Ivory Coast, Senegal)
            payload["country"] = country
            payload["network"] = network.upper()
        elif flw_type == "mobile_money_ghana":
            # Ghana
            payload["network"] = network.upper()
            payload["voucher"] = ""  # Optional voucher for Vodafone
        elif flw_type == "mpesa":
            # Kenya M-Pesa
            pass  # M-Pesa doesn't need network param
        elif flw_type == "mobile_money_uganda":
            # Uganda
            payload["network"] = network.upper()

        logger.debug("Mobile Money charge initiated for type: %s", flw_type)

        client = await self._get_client()
        response = await client.post(
            f"{self.BASE_URL}/charges?type={flw_type}",
            json=payload,
        )
        data = response.json()

        logger.debug("Flutterwave charge response status: %s", data.get("status"))

        if data.get("status") == "error":
            return {
                "status": "failed",
                "message": data.get("message", "Unknown error"),
                "tx_ref": tx_ref,
                "flw_ref": None,
                "instructions": None
            }

        charge_data = data.get("data", {})
        return {
            "status": charge_data.get("status", "pending"),
            "message": data.get("message", "Charge initiated"),
            "tx_ref": tx_ref,
            "flw_ref": charge_data.get("flw_ref"),
            "instructions": self._get_instructions(flw_type, network)
        }

    def _get_instructions(self, flw_type: str, network: str) -> str:
        """Get user-friendly instructions for Mobile Money validation."""
        instructions = {
            "mobile_money_franco": {
                "MTN": "Composez *126# et validez le paiement avec votre code PIN MTN Mobile Money.",
                "ORANGE": "Validez le paiement sur votre téléphone avec votre code PIN Orange Money."
            },
            "mobile_money_ghana": {
                "MTN": "Dial *170# and authorize the payment with your MoMo PIN.",
                "VODAFONE": "Dial *110# and authorize the payment with your Vodafone Cash PIN.",
                "AIRTELTIGO": "Authorize the payment with your AirtelTigo Money PIN."
            },
            "mpesa": {
                "MPESA": "Enter your M-Pesa PIN on your phone to complete the payment.",
                "AIRTEL": "Enter your Airtel Money PIN on your phone."
            },
            "mobile_money_uganda": {
                "MTN": "Dial *165# and authorize the payment with your MoMo PIN.",
                "AIRTEL": "Enter your Airtel Money PIN on your phone."
            }
        }

        type_instructions = instructions.get(flw_type, {})
        return type_instructions.get(network.upper(), "Validez le paiement sur votre téléphone.")

    async def get_charge_status(self, tx_ref: str, flw_ref: str = None) -> Dict[str, Any]:
        """
        Check the status of a Mobile Money charge.
        Uses multiple methods to verify the transaction status.

        Args:
            tx_ref: Transaction reference
            flw_ref: Flutterwave reference (optional, from charge response)

        Returns:
            Dict with status (pending, successful, failed)
        """
        client = await self._get_client()
        # Method 1: Try verify by reference endpoint first
        try:
            verify_response = await client.get(
                f"{self.BASE_URL}/transactions/verify_by_reference?tx_ref={tx_ref}",
            )
            verify_data = verify_response.json()
            logger.debug("Verify by reference status: %s", verify_data.get("status"))

            if verify_data.get("status") == "success":
                tx = verify_data.get("data", {})
                tx_status = tx.get("status", "pending").lower()

                if tx_status == "successful":
                    return {
                        "status": "successful",
                        "message": "Payment successful",
                        "tx_ref": tx_ref,
                        "flw_id": tx.get("id")
                    }
                elif tx_status in ["failed", "cancelled"]:
                    return {
                        "status": "failed",
                        "message": tx.get("processor_response", "Payment failed"),
                        "tx_ref": tx_ref,
                        "flw_id": tx.get("id")
                    }
        except Exception as e:
            logger.debug("Verify by reference failed: %s", e)

        # Method 2: Try transactions list endpoint
        try:
            response = await client.get(
                f"{self.BASE_URL}/transactions?tx_ref={tx_ref}",
            )
            data = response.json()
            logger.debug("Transactions list status: %s", data.get("status"))

            if data.get("status") == "success":
                transactions = data.get("data", [])
                if transactions and len(transactions) > 0:
                    tx = transactions[0] if isinstance(transactions, list) else transactions
                    tx_status = tx.get("status", "pending").lower()

                    if tx_status == "successful":
                        return {
                            "status": "successful",
                            "message": "Payment successful",
                            "tx_ref": tx_ref,
                            "flw_id": tx.get("id")
                        }
                    elif tx_status in ["failed", "cancelled"]:
                        return {
                            "status": "failed",
                            "message": tx.get("processor_response", "Payment failed"),
                            "tx_ref": tx_ref,
                            "flw_id": tx.get("id")
                        }
        except Exception as e:
            logger.debug("Transactions list lookup failed: %s", e)

        # Still pending
        return {
            "status": "pending",
            "message": "Payment is being processed",
            "tx_ref": tx_ref
        }
