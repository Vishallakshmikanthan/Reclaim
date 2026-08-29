import { RecoveryExecutor, ExecutionRequest, ExecutionResult } from "../../recovery/recoveryExecutor";
import { apiClient, APIError } from "../../api/client";

export interface BackendRecoveryActionResponse {
  action_id: string;
  case_id: string;
  strategy: string;
  status: string;
  policy_version: string;
  idempotency_key: string;
  verification_status: string;
  created_at: string;
  transaction_id: string | null;
}

export class HttpRecoveryExecutor implements RecoveryExecutor {
  public async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const payload: any = {
      strategy: request.strategy || undefined,
    };
    
    const startTime = Date.now();
    try {
      const result = await apiClient.post<BackendRecoveryActionResponse>(
        `/api/v1/cases/${request.caseId}/recovery/actions`, 
        payload,
        { headers: { "Idempotency-Key": request.idempotencyKey } }
      );
      
      const isSuccess = result.verification_status === "verified" || result.status === "verified" || result.status === "executed";
      
      return {
        executionId: result.action_id,
        idempotencyKey: result.idempotency_key || request.idempotencyKey,
        gateway: "FastAPI Orchestration Engine",
        status: isSuccess ? "EXECUTED" : "FAILED",
        timestamp: result.created_at || new Date().toISOString(),
        latencyMs: Date.now() - startTime,
        payloadSent: {
          ...payload,
          verification_status: result.verification_status,
          transaction_id: result.transaction_id,
        }
      };
    } catch (e: any) {
      const errorMsg = e instanceof APIError ? e.message : (e.message || "Recovery execution failed");
      return {
        executionId: "FAILED",
        idempotencyKey: request.idempotencyKey,
        gateway: "FastAPI Orchestration Engine",
        status: "FAILED",
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
        payloadSent: { error: errorMsg, code: e?.code, details: e?.details }
      };
    }
  }
}
