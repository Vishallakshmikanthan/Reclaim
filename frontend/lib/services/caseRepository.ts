import { Case, CaseStatus } from "../types";
import { BrowserStorage, STORAGE_KEYS } from "../storage/browserStorage";
import { INITIAL_MOCK_CASES } from "../mock-data/mockCases";
import { transitionCase } from "../domain/caseStateMachine";

export interface ICaseRepository {
  getAllCases(): Promise<Case[]>;
  getCaseById(id: string): Promise<Case | undefined>;
  saveCase(caseItem: Case): Promise<Case>;
  updateCaseStatus(id: string, targetStatus: CaseStatus, updates?: Partial<Case>): Promise<Case | undefined>;
  resetToInitial(): Promise<Case[]>;
}

export class MockCaseRepository implements ICaseRepository {
  public async getAllCases(): Promise<Case[]> {
    return BrowserStorage.getItem<Case[]>(STORAGE_KEYS.CASES, INITIAL_MOCK_CASES);
  }

  public async getCaseById(id: string): Promise<Case | undefined> {
    const cases = await this.getAllCases();
    return cases.find((c) => c.id === id);
  }

  public async saveCase(caseItem: Case): Promise<Case> {
    const cases = await this.getAllCases();
    const index = cases.findIndex((c) => c.id === caseItem.id);
    let updatedCases: Case[];
    if (index >= 0) {
      updatedCases = [...cases];
      updatedCases[index] = caseItem;
    } else {
      updatedCases = [caseItem, ...cases];
    }
    BrowserStorage.setItem(STORAGE_KEYS.CASES, updatedCases);
    return caseItem;
  }

  public async updateCaseStatus(
    id: string, 
    targetStatus: CaseStatus, 
    updates: Partial<Case> = {}
  ): Promise<Case | undefined> {
    const caseItem = await this.getCaseById(id);
    if (!caseItem) return undefined;

    const transitioned = transitionCase(caseItem, targetStatus, updates);
    await this.saveCase(transitioned);
    return transitioned;
  }

  public async resetToInitial(): Promise<Case[]> {
    BrowserStorage.setItem(STORAGE_KEYS.CASES, INITIAL_MOCK_CASES);
    return INITIAL_MOCK_CASES;
  }
}
