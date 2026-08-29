/**
 * RECLAIM Structured Domain & Application Error Model
 */

export type ErrorCode = 
  | "POLICY_VIOLATION"
  | "EXECUTION_ERROR"
  | "VERIFICATION_TIMEOUT"
  | "VERIFICATION_FAILED"
  | "PERMISSION_DENIED"
  | "DUPLICATE_ACTION"
  | "SYSTEM_UNAVAILABLE"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "INVALID_STATE_TRANSITION"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, any>;
  public readonly userFacingMessage: string;

  constructor(code: ErrorCode, message: string, userFacingMessage?: string, details?: Record<string, any>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.userFacingMessage = userFacingMessage || message;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class PolicyError extends AppError {
  constructor(message: string, userFacingMessage?: string, details?: Record<string, any>) {
    super("POLICY_VIOLATION", message, userFacingMessage || "Action blocked by deterministic policy guardrails.", details);
    this.name = "PolicyError";
  }
}

export class ExecutionError extends AppError {
  constructor(message: string, userFacingMessage?: string, details?: Record<string, any>) {
    super("EXECUTION_ERROR", message, userFacingMessage || "Recovery action failed at gateway dispatch.", details);
    this.name = "ExecutionError";
  }
}

export class VerificationError extends AppError {
  constructor(message: string, userFacingMessage?: string, details?: Record<string, any>) {
    super("VERIFICATION_FAILED", message, userFacingMessage || "Settlement verification could not be confirmed.", details);
    this.name = "VerificationError";
  }
}

export class PermissionError extends AppError {
  constructor(message: string, userFacingMessage?: string, details?: Record<string, any>) {
    super("PERMISSION_DENIED", message, userFacingMessage || "Your current operator role does not have permission for this action.", details);
    this.name = "PermissionError";
  }
}

export class DuplicateActionError extends AppError {
  constructor(message: string, userFacingMessage?: string, details?: Record<string, any>) {
    super("DUPLICATE_ACTION", message, userFacingMessage || "Duplicate request suppressed by active idempotency lock.", details);
    this.name = "DuplicateActionError";
  }
}

export class SystemUnavailableError extends AppError {
  constructor(serviceName: string, details?: Record<string, any>) {
    super(
      "SYSTEM_UNAVAILABLE", 
      `Service ${serviceName} is currently unavailable or degraded.`, 
      `Recovery paused for safety: ${serviceName} is degraded. Zero unverified actions allowed.`, 
      details
    );
    this.name = "SystemUnavailableError";
  }
}

export class InvalidStateTransitionError extends AppError {
  constructor(fromState: string, toState: string) {
    super(
      "INVALID_STATE_TRANSITION",
      `Cannot transition case from '${fromState}' to '${toState}'.`,
      `Invalid case lifecycle transition: cannot move from ${fromState} to ${toState}.`
    );
    this.name = "InvalidStateTransitionError";
  }
}
