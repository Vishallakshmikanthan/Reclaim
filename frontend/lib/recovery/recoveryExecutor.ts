import { Case, RecommendedInterventionType } from "../types";

export interface ExecutionRequest {
  caseId: string;
  amount: number; // in paise
  paymentMethod: string;
  intervention: RecommendedInterventionType | string;
  strategy: string;
  idempotencyKey: string;
  isTestMode: boolean;
}

export interface ExecutionResult {
  executionId: string;
  idempotencyKey: string;
  gateway: string;
  status: "EXECUTED" | "FAILED";
  timestamp: string;
  latencyMs: number;
  payloadSent: Record<string, any>;
}

export interface RecoveryExecutor {
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}

/**
 * MockRecoveryExecutor simulates the Razorpay Test Mode execution pipeline.
 * Keeps an explicit boundary that will connect to real Razorpay API in production.
 */
export class MockRecoveryExecutor implements RecoveryExecutor {
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    // Simulate network transmission to Razorpay Test Gateway
    await new Promise((res) => setTimeout(res, 900));

    const latencyMs = Date.now() - startTime;

    return {
      executionId: `rz_exec_${Math.random().toString(36).substring(2, 9)}`,
      idempotencyKey: request.idempotencyKey,
      gateway: "Razorpay Test Gateway (v1/payments/retry)",
      status: "EXECUTED",
      timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
      latencyMs,
      payloadSent: {
        amount: request.amount,
        currency: "INR",
        case_id: request.caseId,
        strategy: request.strategy,
        idempotency_key: request.idempotencyKey,
        mode: "test",
      },
    };
  }
}

export const defaultRecoveryExecutor = new MockRecoveryExecutor();
