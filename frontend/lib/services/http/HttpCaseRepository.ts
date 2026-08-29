import { Case, CaseStatus } from "../../types";
import { ICaseRepository } from "../caseRepository";
import { apiClient } from "../../api/client";

interface CaseListResponse {
  items: Case[];
  page: number;
  page_size: number;
  total: number;
}

export class HttpCaseRepository implements ICaseRepository {
  public async getAllCases(): Promise<Case[]> {
    // Fallback for context initialization if needed, fetches first 100 cases
    const response = await apiClient.get<CaseListResponse>("/api/v1/cases?page=1&page_size=100");
    return response.items;
  }

  public async getCaseById(id: string): Promise<Case | undefined> {
    try {
      return await apiClient.get<Case>(`/api/v1/cases/${id}`);
    } catch (e: any) {
      if (e.code === 'CASE_NOT_FOUND') return undefined;
      throw e;
    }
  }

  public async saveCase(caseItem: Case): Promise<Case> {
    // Note: API only supports creating a case, not updating the whole case.
    // For specific updates, backend actions (recovery/decision) should be used.
    return await apiClient.post<Case>("/api/v1/cases", caseItem);
  }

  public async updateCaseStatus(
    id: string, 
    targetStatus: CaseStatus, 
    updates: Partial<Case> = {}
  ): Promise<Case | undefined> {
    // The backend does not expose a generic status update endpoint for cases.
    // Status transitions happen via actions/policies.
    // We fetch the case to ensure it exists.
    return await this.getCaseById(id);
  }

  public async resetToInitial(): Promise<Case[]> {
    return this.getAllCases();
  }
}
