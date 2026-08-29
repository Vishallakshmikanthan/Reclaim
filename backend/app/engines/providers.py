import hmac
import hashlib
from abc import ABC, abstractmethod
from typing import Any
from uuid import uuid4
from pydantic import BaseModel, Field
from ..schemas.domain import Case, Strategy

class ProviderExecutionResult(BaseModel):
    status: str
    provider: str
    provider_order_id: str | None = None
    provider_payment_id: str | None = None
    provider_status: str | None = None
    provider_reference: str | None = None
    verification_status: str
    transaction_id: str | None = None
    failure_code: str | None = None
    failure_reason: str | None = None
    order_payload: dict[str, Any] = Field(default_factory=dict)

class RecoveryProvider(ABC):
    @abstractmethod
    def execute_recovery(
        self,
        case: Case,
        strategy: Strategy,
        amount_minor: int,
        idempotency_key: str,
        scenario: str | None = None
    ) -> ProviderExecutionResult:
        ...

    @abstractmethod
    def get_order_status(self, order_id: str) -> dict[str, Any]:
        ...

    @abstractmethod
    def get_payment_status(self, payment_id: str) -> dict[str, Any]:
        ...

    @abstractmethod
    def verify_webhook_signature(self, body: bytes, signature: str, secret: str) -> bool:
        ...

class SimulatedRecoveryProvider(RecoveryProvider):
    def execute_recovery(
        self,
        case: Case,
        strategy: Strategy,
        amount_minor: int,
        idempotency_key: str,
        scenario: str | None = None
    ) -> ProviderExecutionResult:
        order_id = f"order_sim_{uuid4().hex[:12]}"
        ref_id = f"sim_ref_{uuid4().hex[:8]}"
        
        if scenario in {"unknown", "network_timeout", "razorpay_timeout"}:
            return ProviderExecutionResult(
                status="unknown",
                provider="simulated",
                provider_order_id=order_id,
                provider_status="unknown",
                provider_reference=ref_id,
                verification_status="unknown"
            )
        if scenario in {"timeout", "verification_timeout"}:
            return ProviderExecutionResult(
                status="executed",
                provider="simulated",
                provider_order_id=order_id,
                provider_status="created",
                provider_reference=ref_id,
                verification_status="timeout"
            )
        if scenario in {"pending", "webhook_delay"}:
            return ProviderExecutionResult(
                status="executed",
                provider="simulated",
                provider_order_id=order_id,
                provider_status="created",
                provider_reference=ref_id,
                verification_status="pending"
            )
        if scenario in {"failure", "razorpay_failure"}:
            return ProviderExecutionResult(
                status="failed",
                provider="simulated",
                provider_order_id=order_id,
                provider_status="failed",
                provider_reference=ref_id,
                verification_status="failed",
                failure_code="PAYMENT_DECLINED",
                failure_reason="Issuer decline simulation"
            )
        
        # Default success
        payment_id = f"pay_sim_{uuid4().hex[:12]}"
        return ProviderExecutionResult(
            status="executed",
            provider="simulated",
            provider_order_id=order_id,
            provider_payment_id=payment_id,
            provider_status="captured",
            provider_reference=ref_id,
            verification_status="verified",
            transaction_id="txn_demo_verified",
            order_payload={"amount": amount_minor, "currency": "INR", "status": "paid"}
        )

    def get_order_status(self, order_id: str) -> dict[str, Any]:
        return {"id": order_id, "status": "paid", "amount_paid": 100000}

    def get_payment_status(self, payment_id: str) -> dict[str, Any]:
        return {"id": payment_id, "status": "captured"}

    def verify_webhook_signature(self, body: bytes, signature: str, secret: str) -> bool:
        if not signature or not secret:
            return False
        expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

class RazorpayTestProvider(RecoveryProvider):
    def __init__(self, key_id: str, key_secret: str, webhook_secret: str | None = None):
        if not key_id or not key_secret:
            raise ValueError("Razorpay key_id and key_secret are required.")
        if key_id.startswith("rzp_live_"):
            raise ValueError("Live Razorpay credentials ('rzp_live_...') are strictly forbidden. RECLAIM operates in TEST MODE only.")
        if not key_id.startswith("rzp_test_"):
            raise ValueError(f"Invalid Razorpay key ID '{key_id}'. Test mode key must start with 'rzp_test_'.")
        
        self.key_id = key_id
        self.key_secret = key_secret
        self.webhook_secret = webhook_secret
        
        import razorpay
        self.client = razorpay.Client(auth=(self.key_id, self.key_secret))

    def execute_recovery(
        self,
        case: Case,
        strategy: Strategy,
        amount_minor: int,
        idempotency_key: str,
        scenario: str | None = None
    ) -> ProviderExecutionResult:
        if scenario in {"unknown", "network_timeout", "razorpay_timeout"}:
            return ProviderExecutionResult(
                status="unknown",
                provider="razorpay_test",
                provider_status="unknown",
                verification_status="unknown"
            )
        if scenario in {"failure", "razorpay_failure"}:
            return ProviderExecutionResult(
                status="failed",
                provider="razorpay_test",
                provider_status="failed",
                verification_status="failed",
                failure_code="PROVIDER_ERROR",
                failure_reason="Simulated provider failure"
            )

        # Amount validation: integer minor units
        if not isinstance(amount_minor, int) or amount_minor <= 0:
            raise ValueError(f"Invalid amount_minor: {amount_minor}. Must be positive integer.")

        strat_val = strategy.value if hasattr(strategy, "value") else str(strategy)
        order_params = {
            "amount": amount_minor,
            "currency": "INR",
            "receipt": f"rc_{case.id[-16:]}_{idempotency_key[-8:]}",
            "notes": {
                "case_id": case.id,
                "customer": case.customer,
                "strategy": strat_val,
                "idempotency_key": idempotency_key,
                "mode": "test"
            }
        }
        
        try:
            order = self.client.order.create(order_params)
            order_id = order.get("id")
            order_status = order.get("status", "created")
            
            # Note: Order creation != payment success. Payment status is pending until customer pays / webhook arrives.
            return ProviderExecutionResult(
                status="executed",
                provider="razorpay_test",
                provider_order_id=order_id,
                provider_status=order_status,
                provider_reference=order_id,
                verification_status="pending",
                order_payload=order
            )
        except Exception as e:
            return ProviderExecutionResult(
                status="unknown",
                provider="razorpay_test",
                provider_status="unknown",
                verification_status="unknown",
                failure_reason=str(e)
            )

    def get_order_status(self, order_id: str) -> dict[str, Any]:
        return self.client.order.fetch(order_id)

    def get_payment_status(self, payment_id: str) -> dict[str, Any]:
        return self.client.payment.fetch(payment_id)

    def verify_webhook_signature(self, body: bytes, signature: str, secret: str) -> bool:
        if not signature or not secret:
            return False
        try:
            # Official Razorpay webhook signature verification
            body_str = body.decode("utf-8") if isinstance(body, bytes) else body
            self.client.utility.verify_webhook_signature(body_str, signature, secret)
            return True
        except Exception:
            # Fallback direct HMAC verification
            try:
                expected = hmac.new(secret.encode("utf-8"), body if isinstance(body, bytes) else body.encode("utf-8"), hashlib.sha256).hexdigest()
                return hmac.compare_digest(expected, signature)
            except Exception:
                return False

class MockRazorpayTestProvider(RecoveryProvider):
    """Deterministic test double for test suite to simulate Razorpay Test Mode without network calls."""
    def __init__(self, key_id: str = "rzp_test_mock12345", key_secret: str = "mock_secret_key_123"):
        if not key_id.startswith("rzp_test_"):
            raise ValueError("Test mode key must start with 'rzp_test_'.")
        self.key_id = key_id
        self.key_secret = key_secret
        self.orders: dict[str, dict[str, Any]] = {}
        self.payments: dict[str, dict[str, Any]] = {}

    def execute_recovery(
        self,
        case: Case,
        strategy: Strategy,
        amount_minor: int,
        idempotency_key: str,
        scenario: str | None = None
    ) -> ProviderExecutionResult:
        if scenario in {"unknown", "network_timeout", "razorpay_timeout"}:
            return ProviderExecutionResult(
                status="unknown",
                provider="razorpay_test",
                provider_status="unknown",
                verification_status="unknown"
            )
        if scenario in {"failure", "razorpay_failure"}:
            return ProviderExecutionResult(
                status="failed",
                provider="razorpay_test",
                provider_status="failed",
                verification_status="failed",
                failure_code="PROVIDER_ERROR",
                failure_reason="Simulated provider failure"
            )
        
        order_id = f"order_rzp_{uuid4().hex[:14]}"
        order_data = {
            "id": order_id,
            "entity": "order",
            "amount": amount_minor,
            "amount_paid": 0,
            "currency": "INR",
            "receipt": f"rc_{case.id[-16:]}_{idempotency_key[-8:]}",
            "status": "created",
            "notes": {"case_id": case.id, "idempotency_key": idempotency_key}
        }
        self.orders[order_id] = order_data
        
        return ProviderExecutionResult(
            status="executed",
            provider="razorpay_test",
            provider_order_id=order_id,
            provider_status="created",
            provider_reference=order_id,
            verification_status="pending",
            order_payload=order_data
        )

    def get_order_status(self, order_id: str) -> dict[str, Any]:
        return self.orders.get(order_id, {"id": order_id, "status": "created", "amount_paid": 0})

    def get_payment_status(self, payment_id: str) -> dict[str, Any]:
        return self.payments.get(payment_id, {"id": payment_id, "status": "captured"})

    def verify_webhook_signature(self, body: bytes, signature: str, secret: str) -> bool:
        if not signature or not secret:
            return False
        expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)
