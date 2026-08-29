import { Case } from "../types";

/**
 * RECLAIM Centralized Financial Calculation & Minor Unit (Paise) Domain
 * 
 * Guarantees integer arithmetic for monetary units to prevent floating-point drift.
 */

export function formatINR(amountPaise: number): string {
  const inr = amountPaise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(inr);
}

export function calculateExpectedRecovery(amountPaise: number, probability: number): number {
  return Math.round(amountPaise * Math.max(0, Math.min(1, probability)));
}

export function calculateRecoveryRate(recoveredCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  return Number(((recoveredCount / totalCount) * 100).toFixed(1));
}

export function calculateRecoveredRevenue(cases: Case[]): number {
  return cases
    .filter((c) => c.status === "recovered")
    .reduce((acc, curr) => acc + (curr.resolutionDetails?.recoveredAmount || curr.amount), 0);
}

export function calculateRevenueAtRisk(cases: Case[]): number {
  return cases
    .filter((c) => c.status === "atRisk" || c.status === "inProgress" || c.status === "executing" || c.status === "blocked")
    .reduce((acc, curr) => acc + curr.amount, 0);
}

export function calculateUnrecoveredRevenue(cases: Case[]): number {
  return cases
    .filter((c) => c.status === "failed" || c.status === "stopped")
    .reduce((acc, curr) => acc + curr.amount, 0);
}
