from datetime import datetime, timezone
from enum import Enum
from typing import Any
from pydantic import BaseModel, ConfigDict, Field

def now() -> datetime:
    return datetime.now(timezone.utc)

class DecisionSource(str, Enum):
    ai_nemotron = "AI_NEMOTRON"
    deterministic_fallback = "DETERMINISTIC_FALLBACK"
    mock_ai = "MOCK_AI"

class InterventionEnum(str, Enum):
    RETRY_PAYMENT = "RETRY_PAYMENT"
    WAIT_AND_RETRY = "WAIT_AND_RETRY"
    CUSTOMER_REMINDER = "CUSTOMER_REMINDER"
    ALTERNATIVE_PAYMENT_METHOD = "ALTERNATIVE_PAYMENT_METHOD"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    NO_ACTION = "NO_ACTION"

class EvidenceItem(BaseModel):
    field: str = Field(..., description="Field name in sanitized context")
    value: Any = Field(..., description="Observed value from context")
    reason: str = Field(..., description="How this grounded signal justifies the recommendation")

class AlternativeIntervention(BaseModel):
    intervention: str = Field(..., description="Alternative recovery intervention name")
    reason_not_preferred: str = Field(..., description="Why the alternative was not selected as primary")
    estimated_confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="Estimated viability score")

class AIStructuredRecommendation(BaseModel):
    diagnosis: str = Field(..., min_length=1, description="Root cause diagnosis of the failure")
    recommended_intervention: InterventionEnum = Field(..., description="Specific bounded intervention")
    rationale: str = Field(..., min_length=1, description="Structured explanation grounded in evidence")
    evidence: list[EvidenceItem] = Field(default_factory=list, description="Context-grounded evidence citations")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")
    urgency: str = Field(default="medium", description="Urgency rating (low, medium, high, critical)")
    expected_recovery_minor: int = Field(ge=0, description="Estimated recovered amount in integer minor units (paise)")
    alternatives: list[AlternativeIntervention] = Field(default_factory=list, description="Ranked alternative strategies")
    do_not_do: list[str] = Field(default_factory=list, description="Actions that should NOT be attempted")
    policy_dependencies: list[str] = Field(default_factory=list, description="Policy rules that must be checked")

class SanitizedRecoveryContext(BaseModel):
    case_id: str
    failure_type: str
    amount_minor: int = Field(gt=0, description="Integer minor units (paise)")
    currency: str = "INR"
    payment_age: str = "0 min"
    retry_count: int = Field(default=0, ge=0)
    previous_recovery_attempts: int = Field(default=0, ge=0)
    previous_communication_count: int = Field(default=0, ge=0)
    previous_recovery_outcomes: list[str] = Field(default_factory=list)
    provider_status: str = "atRisk"
    case_priority: str = "Medium"
    merchant_policy_summary: dict[str, Any] = Field(default_factory=dict)
    customer_message: str | None = None
