import { AuditEvent } from "../types";
import { BrowserStorage, STORAGE_KEYS } from "../storage/browserStorage";
import { INITIAL_AUDIT_EVENTS } from "../mock-data/mockAuditEvents";

export interface IAuditRepository {
  getAllEvents(): Promise<AuditEvent[]>;
  getCaseEvents(caseId: string): Promise<AuditEvent[]>;
  addEvent(event: Omit<AuditEvent, "id" | "timestamp">): Promise<AuditEvent>;
  resetToInitial(): Promise<AuditEvent[]>;
}

export class MockAuditRepository implements IAuditRepository {
  public async getAllEvents(): Promise<AuditEvent[]> {
    return BrowserStorage.getItem<AuditEvent[]>(STORAGE_KEYS.AUDIT_EVENTS, INITIAL_AUDIT_EVENTS);
  }

  public async getCaseEvents(caseId: string): Promise<AuditEvent[]> {
    const events = await this.getAllEvents();
    return events.filter((e) => e.case === caseId);
  }

  public async addEvent(event: Omit<AuditEvent, "id" | "timestamp">): Promise<AuditEvent> {
    const events = await this.getAllEvents();
    const now = new Date();
    const formattedTimestamp = `${now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${now.toLocaleTimeString("en-IN", { hour12: false })} IST`;

    const newEvent: AuditEvent = {
      ...event,
      id: `EVT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      timestamp: formattedTimestamp,
    };

    const updated = [newEvent, ...events];
    BrowserStorage.setItem(STORAGE_KEYS.AUDIT_EVENTS, updated);
    return newEvent;
  }

  public async resetToInitial(): Promise<AuditEvent[]> {
    BrowserStorage.setItem(STORAGE_KEYS.AUDIT_EVENTS, INITIAL_AUDIT_EVENTS);
    return INITIAL_AUDIT_EVENTS;
  }
}
