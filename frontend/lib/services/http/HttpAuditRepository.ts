import { IAuditRepository } from "../auditRepository";
import { AuditEvent, AuditLayer, AuditLayerSource, AuditEventType } from "../../types";
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

function resolveLayer(eventType: string): AuditLayer {
  if (eventType.includes("POLICY")) return "LAYER 3";
  if (eventType.includes("ACTION") || eventType.includes("COMMUNICATION") || eventType.includes("RECOVERY_ACTION")) return "LAYER 4";
  if (eventType.includes("VERIF") || eventType.includes("RESOLVED")) return "LAYER 5";
  if (eventType.includes("RISK") || eventType.includes("DETECT")) return "LAYER 1";
  if (eventType.includes("DECISION") || eventType.includes("STRATEGY")) return "LAYER 2";
  return "LAYER 3";
}

function resolveSource(eventType: string): AuditLayerSource {
  if (eventType.includes("POLICY")) return "POLICY_ENGINE";
  if (eventType.includes("ACTION") || eventType.includes("COMMUNICATION")) return "EXECUTOR";
  if (eventType.includes("VERIF")) return "VERIFICATION";
  if (eventType.includes("RISK")) return "RISK_ENGINE";
  if (eventType.includes("DECISION") || eventType.includes("STRATEGY")) return "AGENT";
  return "AUDIT";
}

function resolveStatus(eventType: string): "SUCCESS" | "INFO" | "BLOCKED" | "FAILED" {
  if (eventType.includes("BLOCKED")) return "BLOCKED";
  if (eventType.includes("FAILED")) return "FAILED";
  if (eventType.includes("SUCCESS") || eventType.includes("VERIFIED") || eventType.includes("RESOLVED")) return "SUCCESS";
  return "INFO";
}

function mapBackendAuditToFrontend(backendEvent: BackendAuditEvent): AuditEvent {
  const layer = resolveLayer(backendEvent.event_type || "");
  const source = resolveSource(backendEvent.event_type || "");
  const status = resolveStatus(backendEvent.event_type || "");

  const dateObj = new Date(backendEvent.timestamp);
  const formattedTimestamp = isNaN(dateObj.getTime())
    ? backendEvent.timestamp
    : `${dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${dateObj.toLocaleTimeString("en-IN", { hour12: false })} IST`;

  return {
    id: backendEvent.event_id,
    timestamp: formattedTimestamp,
    layer,
    source,
    event: (backendEvent.event_type || "ACTION_EXECUTED") as AuditEventType,
    case: backendEvent.case_id || backendEvent.campaign_id || backendEvent.policy_version || "SYSTEM",
    desc: `[${backendEvent.actor}] ${backendEvent.event_type.replace(/_/g, " ")}${backendEvent.case_id ? ` for ${backendEvent.case_id}` : ""}`,
    status,
    details: {
      ...(backendEvent.metadata || {}),
      policyRule: backendEvent.policy_version,
      gateway: backendEvent.metadata?.gateway || "FastAPI PostgreSQL Engine",
      transactionId: backendEvent.metadata?.action_id || backendEvent.metadata?.transaction_id,
    },
  };
}

export class HttpAuditRepository implements IAuditRepository {
  public async getAllEvents(): Promise<AuditEvent[]> {
    const res = await apiClient.get<AuditEventListResponse>("/api/v1/audit/events?page=1&page_size=100");
    const items = (res.items || []).map(mapBackendAuditToFrontend);
    return items;
  }

  public async getCaseEvents(caseId: string): Promise<AuditEvent[]> {
    const res = await apiClient.get<AuditEventListResponse>(`/api/v1/cases/${caseId}/audit?page=1&page_size=100`);
    const items = (res.items || []).map(mapBackendAuditToFrontend);
    return items;
  }

  public async addEvent(event: Omit<AuditEvent, "id" | "timestamp">): Promise<AuditEvent> {
    return {
      ...event,
      id: `EVT-${Date.now()}`,
      timestamp: new Date().toISOString(),
    } as AuditEvent;
  }

  public async resetToInitial(): Promise<any> {
    return this.getAllEvents();
  }
}
