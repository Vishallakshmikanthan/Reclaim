import threading
from typing import Any

class AITelemetry:
    """Thread-safe operational telemetry for AI decision intelligence.
    Tracks invocations, outcomes, latency, validation errors, and policy overrides.
    Note: These are operational health metrics, not unvalidated model 'accuracy' claims.
    """
    def __init__(self):
        self._lock = threading.Lock()
        self.invocation_count = 0
        self.success_count = 0
        self.fallback_count = 0
        self.validation_failure_count = 0
        self.timeout_count = 0
        self.policy_override_count = 0
        self.latencies_ms: list[int] = []

    def record_invocation(self):
        with self._lock:
            self.invocation_count += 1

    def record_success(self, latency_ms: int):
        with self._lock:
            self.success_count += 1
            self.latencies_ms.append(latency_ms)
            if len(self.latencies_ms) > 500:
                self.latencies_ms.pop(0)

    def record_fallback(self, reason: str = "general"):
        with self._lock:
            self.fallback_count += 1
            if reason == "timeout":
                self.timeout_count += 1
            elif reason == "validation_failure":
                self.validation_failure_count += 1

    def record_policy_override(self):
        with self._lock:
            self.policy_override_count += 1

    def get_summary(self) -> dict[str, Any]:
        with self._lock:
            avg_latency = (
                int(sum(self.latencies_ms) / len(self.latencies_ms))
                if self.latencies_ms
                else 0
            )
            return {
                "invocation_count": self.invocation_count,
                "success_count": self.success_count,
                "fallback_count": self.fallback_count,
                "validation_failure_count": self.validation_failure_count,
                "timeout_count": self.timeout_count,
                "policy_override_count": self.policy_override_count,
                "average_latency_ms": avg_latency,
            }

ai_telemetry = AITelemetry()
