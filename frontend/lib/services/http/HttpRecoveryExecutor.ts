import { RecoveryExecutor, ExecutionRequest, ExecutionResult } from "../../recovery/recoveryExecutor";
import { apiClient } from "../../api/client";

export class HttpRecoveryExecutor implements RecoveryExecutor {
  public async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const payload: any = {
      action_type: request.strategy,
      amount: request.amount,
      scheduled_for: new Date().toISOString()
    };
    
    try {
      const result = await apiClient.post<any>(
        `/api/v1/cases/${request.caseId}/recovery/actions`, 
        payload,
        { headers: { "Idempotency-Key": request.idempotencyKey } }
      );
      
      return {
        executionId: result.action_id || "DUMMY",
        idempotencyKey: request.idempotencyKey,
        gateway: "Backend API",
        status: "EXECUTED",
        timestamp: new Date().toISOString(),
        latencyMs: 100,
        payloadSent: payload
      };
    } catch (e: any) {
      return {
        executionId: "FAILED",
        idempotencyKey: request.idempotencyKey,
        gateway: "Backend API",
        status: "FAILED",
        timestamp: new Date().toISOString(),
        latencyMs: 100,
        payloadSent: payload
      };
    }
  }
}
