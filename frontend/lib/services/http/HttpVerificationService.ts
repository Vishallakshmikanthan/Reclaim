import { VerificationService, VerificationOutcome } from "../../recovery/verificationService";
import { apiClient } from "../../api/client";
import { Case } from "../../types";
import { ExecutionResult } from "../../recovery/recoveryExecutor";

export class HttpVerificationService implements VerificationService {
  public async verify(execution: ExecutionResult, forcedScenario?: string): Promise<VerificationOutcome> {
    // The backend does this as part of the action, or we can poll the case.
    // For this frontend HTTP stub, we assume if execution was SUCCESS, it's verified.
    
    if (forcedScenario === "timeout" || execution.status === "FAILED") {
      return {
        status: "FAILED",
        gatewayResponseCode: "UNKNOWN",
        telemetryLatencyMs: 100,
        message: "Failed"
      };
    }
    
    return {
      status: "SUCCESS",
      gatewayResponseCode: "200_OK",
      telemetryLatencyMs: 100,
      message: "Verified"
    };
  }
}
