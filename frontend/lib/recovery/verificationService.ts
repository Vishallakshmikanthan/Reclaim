import { ExecutionResult } from "./recoveryExecutor";

export type VerificationStatus = "SUCCESS" | "FAILED" | "TIMEOUT";

export interface VerificationOutcome {
  status: VerificationStatus;
  transactionId?: string;
  gatewayResponseCode: string;
  telemetryLatencyMs: number;
  message: string;
  settledAt?: string;
}

export interface VerificationService {
  verify(execution: ExecutionResult, forcedScenario?: string): Promise<VerificationOutcome>;
}

/**
 * MockVerificationService simulates gateway telemetry polling & webhook reconciliation.
 */
export class MockVerificationService implements VerificationService {
  async verify(execution: ExecutionResult, forcedScenario?: string): Promise<VerificationOutcome> {
    // Simulate verification telemetry window
    await new Promise((res) => setTimeout(res, 850));

    if (forcedScenario === "timeout" || forcedScenario === "C_TIMEOUT") {
      return {
        status: "TIMEOUT",
        gatewayResponseCode: "GATEWAY_TIMEOUT_504",
        telemetryLatencyMs: 30000,
        message: "Gateway telemetry response unconfirmed after 30s. Bounded safety: duplicate retries prohibited.",
      };
    }

    if (forcedScenario === "failure" || forcedScenario === "D_FAILURE") {
      return {
        status: "FAILED",
        gatewayResponseCode: "ISSUER_HARD_DECLINE_501",
        telemetryLatencyMs: 420,
        message: "Issuing bank declined retry authorization challenge.",
      };
    }

    // Default to verified success
    return {
      status: "SUCCESS",
      transactionId: `txn_rz_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      gatewayResponseCode: "CAPTURED_200_OK",
      telemetryLatencyMs: 640,
      message: "Payment captured successfully by Razorpay gateway.",
      settledAt: new Date().toISOString(),
    };
  }
}

export const defaultVerificationService = new MockVerificationService();
