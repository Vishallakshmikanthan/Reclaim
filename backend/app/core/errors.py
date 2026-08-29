from typing import Any
from fastapi import Request
from fastapi.responses import JSONResponse
class AppError(Exception):
    status_code, code, message = 400, "APPLICATION_ERROR", "The request could not be completed."
    def __init__(self, message: str | None = None, details: dict[str, Any] | None = None): self.message, self.details = message or self.message, details or {}
class CaseNotFoundError(AppError): status_code, code, message = 404, "CASE_NOT_FOUND", "Case not found."
class PolicyValidationError(AppError): status_code, code, message = 422, "POLICY_VALIDATION_FAILED", "Policy validation failed."
class RecoveryExecutionError(AppError): status_code, code, message = 409, "RECOVERY_EXECUTION_FAILED", "Recovery action cannot be executed."
class VerificationError(AppError): status_code, code, message = 409, "VERIFICATION_UNRESOLVED", "Recovery verification is unresolved."
class DuplicateActionError(AppError): status_code, code, message = 409, "DUPLICATE_ACTION", "A recovery action already exists."
class PermissionError(AppError): status_code, code, message = 403, "PERMISSION_DENIED", "Permission denied."
class ServiceUnavailableError(AppError): status_code, code, message = 503, "SERVICE_UNAVAILABLE", "A required service is unavailable."
async def app_error_handler(_: Request, exc: AppError) -> JSONResponse: return JSONResponse(status_code=exc.status_code, content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}})
