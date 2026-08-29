import { EVALUATION_DATASET } from "./dataset";
import { runBaselineEvaluation } from "./baseline";
import { runReclaimEvaluation } from "./evaluator";
import { calculateBatchMetrics } from "./metrics";
import { EvaluationRunReport } from "./types";

/**
 * Generates an end-to-end Evaluation Run Report from the held-out batch.
 */
export function generateEvaluationReport(): EvaluationRunReport {
  const dataset = EVALUATION_DATASET;
  const baselineOutcomes = runBaselineEvaluation(dataset);
  const reclaimOutcomes = runReclaimEvaluation(dataset);
  const metrics = calculateBatchMetrics(dataset, baselineOutcomes, reclaimOutcomes);

  const caseOutcomes = dataset.map((c, idx) => ({
    evaluationCase: c,
    baselineOutcome: baselineOutcomes[idx],
    reclaimOutcome: reclaimOutcomes[idx],
  }));

  const now = new Date();
  const timestamp = `${now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${now.toLocaleTimeString("en-IN", { hour12: false })} IST`;

  return {
    runId: "RUN-EVAL-2026-081",
    timestamp,
    datasetVersion: "heldout-v1.4",
    datasetSize: dataset.length,
    engineVersion: "reclaim-orchestrator-v1.2",
    policyVersion: "policy-engine-v1.0",
    deterministicSeed: "SEED-428192",
    metrics,
    caseOutcomes,
  };
}

/**
 * Export Evaluation Results as CSV
 */
export function exportEvaluationAsCSV(report: EvaluationRunReport): string {
  const headers = [
    "Case ID",
    "Customer",
    "Amount (INR)",
    "Payment Method",
    "Failure Type",
    "Ground Truth Recoverable",
    "Baseline Action",
    "Baseline Recovered",
    "Baseline Policy Breach",
    "RECLAIM Strategy Step",
    "RECLAIM Action",
    "RECLAIM Recovered",
    "False Intervention",
    "Missed Opportunity",
    "Safe Restraint",
    "Policy Allowed"
  ];

  const rows = report.caseOutcomes.map(({ evaluationCase: c, baselineOutcome: b, reclaimOutcome: r }) => [
    c.id,
    `"${c.customerName}"`,
    (c.amount / 100).toFixed(2),
    `"${c.paymentMethod}"`,
    `"${c.failureType}"`,
    c.groundTruth.recoverable ? "YES" : "NO",
    b.actionTaken,
    b.recovered ? "YES" : "NO",
    b.policyBreach ? "YES" : "NO",
    r.strategyStep,
    `"${r.actionTaken}"`,
    r.recovered ? "YES" : "NO",
    r.isFalseIntervention ? "YES" : "NO",
    r.isMissedOpportunity ? "YES" : "NO",
    r.isSafeRestraint ? "YES" : "NO",
    r.policyAllowed ? "YES" : "NO",
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Client-Side File Downloader helper
 */
export function downloadFile(content: string, filename: string, contentType: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
