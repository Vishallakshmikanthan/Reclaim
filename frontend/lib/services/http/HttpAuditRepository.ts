import { IAuditRepository } from "../auditRepository";
import { AuditEvent } from "../../types";
import { apiClient } from "../../api/client";

interface BackendAuditEvent {
  event_id: string;
  event_type: string;
  case_id?: string;
  campaign_id?: string;
  policy_version?: string;
  timestamp: string;
  actor: string;
  metadata?: any;
}

interface AuditEventListResponse {
  items: BackendAuditEvent[];
  total: number;
}

function mapBackendAuditToFrontend(backendEvent: BackendAuditEvent): AuditEvent {
  return {
    id: backendEvent.event_id,
    timestamp: backendEvent.timestamp,
    layer: "ORCHESTRATION" as any, // Mock layer mapping since backend doesn't provide it
    event: (backendEvent.event_type || "") as any,
    case: backendEvent.case_id || "",
    desc: `Action by ${backendEvent.actor}: ${backendEvent.event_type}`,
    status: backendEvent.event_type.includes("SUCCESS") ? "SUCCESS" : 
            backendEvent.event_type.includes("FAILED") ? "FAILED" : "INFO",
    details: backendEvent.metadata || {}
  };
}

export class HttpAuditRepository implements IAuditRepository {
  public async getAllEvents(): Promise<AuditEvent[]> {
    const res = await apiClient.get<AuditEventListResponse>("/api/v1/audit/events?page=1&page_size=100");
    return (res.items || []).map(mapBackendAuditToFrontend);
  }

  public async getCaseEvents(caseId: string): Promise<AuditEvent[]> {
    const res = await apiClient.get<AuditEventListResponse>(`/api/v1/cases/${caseId}/audit?page=1&page_size=100`);
    return (res.items || []).map(mapBackendAuditToFrontend);
  }

  public async addEvent(event: Omit<AuditEvent, "id" | "timestamp">): Promise<AuditEvent> {
    return {
      ...event,
      id: "DUMMY",
      timestamp: new Date().toISOString()
    } as AuditEvent;
  }

  public async resetToInitial(): Promise<any> {
    return this.getAllEvents();
  }
}
