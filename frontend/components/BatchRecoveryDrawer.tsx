"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RotateCw, 
  ArrowRight, 
  Lock, 
  FileText, 
  Layers, 
  Zap,
  Info,
  ExternalLink
} from "lucide-react";
import { 
  BatchPreviewResponse, 
  BatchExecutionResponse, 
  QueueItem,
  BatchExecutionRequest,
  RecoveryBatchStatus 
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/components/ui/Toast";
import { useReclaim } from "@/lib/context/ReclaimContext";

interface BatchRecoveryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCaseIds: string[];
  onBatchExecuted?: () => void;
}

export function BatchRecoveryDrawer({
  isOpen,
  onClose,
  selectedCaseIds,
  onBatchExecuted,
}: BatchRecoveryDrawerProps) {
  const { toast } = useToast();
  const { refreshData } = useReclaim();
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [previewData, setPreviewData] = useState<BatchPreviewResponse | null>(null);
  const [executionResult, setExecutionResult] = useState<BatchExecutionResponse | null>(null);
  const [scenario, setScenario] = useState<string>("STANDARD");
  const [error, setError] = useState<string | null>(null);

  // Fetch preview data when drawer opens with selected cases
  useEffect(() => {
    if (isOpen && selectedCaseIds.length > 0 && !executionResult) {
      fetchPreview();
    } else if (!isOpen) {
      // Reset state on close if completed
      if (executionResult) {
        setExecutionResult(null);
        setPreviewData(null);
      }
    }
  }, [isOpen, selectedCaseIds]);

  const fetchPreview = async () => {
    setIsPreviewLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<BatchPreviewResponse>("/api/v1/recovery/batches/preview", {
        case_ids: selectedCaseIds,
        max_batch_size: 50,
      });
      setPreviewData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to generate batch recovery preview.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleAuthorizeBatch = async () => {
    if (!previewData || previewData.eligible_count === 0) return;
    setIsExecuting(true);
    setError(null);

    const idempotencyKey = `batch_exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    try {
      const res = await apiClient.post<BatchExecutionResponse>(
        "/api/v1/recovery/batches",
        {
          case_ids: selectedCaseIds,
          max_batch_size: 50,
          scenario: scenario !== "STANDARD" ? scenario : undefined,
        },
        {
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        }
      );
      setExecutionResult(res);
      refreshData();
      toast({
        title: `Batch Recovery ${res.status.replace("_", " ")}`,
        description: `Recovered ₹${(res.recovered_revenue_minor / 100).toLocaleString("en-IN")} across ${res.cases_recovered} cases.`,
        type: res.status === "COMPLETED" ? "success" : "info",
      });
      if (onBatchExecuted) {
        onBatchExecuted();
      }
    } catch (err: any) {
      setError(err?.message || "Batch recovery execution failed.");
      toast({
        title: "Execution Error",
        description: err?.message || "Failed to execute recovery batch.",
        type: "error",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-canvas border-l border-slate-200 dark:border-border-subtle shadow-2xl flex flex-col h-full z-10 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-border-subtle bg-slate-50/80 dark:bg-surface flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-brand/10 text-brand dark:bg-brand/20">
                <Layers className="w-3 h-3" /> Batch Orchestration
              </span>
              {previewData?.ai_analysis?.decision_source && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-2.5 h-2.5" />
                  {previewData.ai_analysis.decision_source === "AI_NEMOTRON" ? "Nemotron 70B" : "Mock AI Advisory"}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-text-primary mt-1.5">
              {executionResult ? "Batch Execution Results" : "Batch Recovery Intelligence & Preview"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
              {executionResult 
                ? `Authoritative settlement accounting for Batch ID ${executionResult.batch_id}`
                : "Server-authoritative prioritization with deterministic policy validation"}
            </p>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-text-primary hover:bg-slate-100 dark:hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Error:</span> {error}
              </div>
            </div>
          )}

          {isPreviewLoading && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <RotateCw className="w-8 h-8 text-brand animate-spin" />
              <div className="text-sm font-semibold text-slate-800 dark:text-text-primary">
                Evaluating Batch Intelligence & Policy Gates...
              </div>
              <p className="text-xs text-slate-500 max-w-xs">
                Computing deterministic yield scores, ranking at-risk cases, and validating merchant guardrails.
              </p>
            </div>
          )}

          {/* Phase 1: Preview View */}
          {!isPreviewLoading && !executionResult && previewData && (
            <>
              {/* Financial Metrics Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface border border-slate-200/80 dark:border-border-subtle">
                  <div className="text-[11px] text-slate-500 dark:text-text-muted font-medium">Selected Cases</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-text-primary mt-0.5">
                    {previewData.selected_count}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {formatCurrency(previewData.total_revenue_at_risk_minor)} at risk
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Est. Recoverable</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatCurrency(previewData.estimated_recoverable_minor)}
                  </div>
                  <div className="text-[10px] text-emerald-600/75 dark:text-emerald-500 font-mono mt-0.5">
                    Yield estimate (Prob × Amt)
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface border border-slate-200/80 dark:border-border-subtle">
                  <div className="text-[11px] text-slate-500 dark:text-text-muted font-medium">Policy Eligible</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-text-primary mt-0.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    {previewData.eligible_count}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {formatCurrency(previewData.eligible_revenue_minor)}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40">
                  <div className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">Policy Blocked</div>
                  <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    {previewData.blocked_count}
                  </div>
                  <div className="text-[10px] text-rose-600/75 dark:text-rose-400 font-mono mt-0.5">
                    {formatCurrency(previewData.blocked_revenue_minor)}
                  </div>
                </div>
              </div>

              {/* Advisory AI Batch Intelligence Card */}
              {previewData.ai_analysis && (
                <div className="rounded-xl border border-brand/20 bg-brand/5 dark:bg-brand/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-brand">
                      <Sparkles className="w-3.5 h-3.5" />
                      Nemotron Batch Intelligence Summary
                    </div>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand/10 text-brand">
                      Advisory Layer
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-text-secondary leading-relaxed">
                    {previewData.ai_analysis.summary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                    <div className="bg-white/80 dark:bg-surface/80 p-2.5 rounded-lg border border-slate-200/60 dark:border-border-subtle">
                      <div className="font-semibold text-slate-900 dark:text-text-primary text-[11px] flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" /> Dominant Failure Modes:
                      </div>
                      <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-text-muted mt-1 space-y-0.5">
                        {previewData.ai_analysis.dominant_failure_patterns.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white/80 dark:bg-surface/80 p-2.5 rounded-lg border border-slate-200/60 dark:border-border-subtle">
                      <div className="font-semibold text-slate-900 dark:text-text-primary text-[11px] flex items-center gap-1">
                        <Lock className="w-3 h-3 text-rose-500" /> Operational Guardrails:
                      </div>
                      <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-text-muted mt-1 space-y-0.5">
                        {previewData.ai_analysis.do_not_do.map((d, idx) => (
                          <li key={idx}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Advisory Disclaimer */}
                  <div className="pt-1 flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-text-muted border-t border-brand/10 mt-2">
                    <Info className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                    <span>
                      <strong>Deterministic Guarantee:</strong> AI recommendations are advisory and cannot move money. 
                      Backend policy engine revalidates every case with row locks at execution time.
                    </span>
                  </div>
                </div>
              )}

              {/* Selected Cases Prioritization Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-text-primary">
                  <span>Prioritized Candidate Cases ({previewData.cases.length})</span>
                  <span className="text-[11px] text-slate-400 font-normal">Sorted by Yield & Probability</span>
                </div>

                <div className="border border-slate-200 dark:border-border-subtle rounded-lg overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-border-subtle text-xs">
                  {previewData.cases.map((c) => (
                    <div key={c.case_id} className="p-2.5 flex items-center justify-between bg-white dark:bg-surface hover:bg-slate-50 dark:hover:bg-surface-elevated transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-900 dark:text-text-primary">{c.case_id}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            c.priority_tier === "Critical" ? "bg-rose-500/10 text-rose-600" :
                            c.priority_tier === "High" ? "bg-amber-500/10 text-amber-600" :
                            "bg-blue-500/10 text-blue-600"
                          }`}>
                            Score: {c.priority_score} ({c.priority_tier})
                          </span>
                          <span className="text-[11px] text-slate-500">{c.customer}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{c.failure_type}</span>
                          <span>•</span>
                          <span>{c.age}</span>
                          <span>•</span>
                          <span>{c.recommended_intervention}</span>
                        </div>
                      </div>

                      <div className="text-right space-y-0.5">
                        <div className="font-semibold text-slate-900 dark:text-text-primary">
                          {formatCurrency(c.amount)}
                        </div>
                        <div>
                          {c.policy_allowed ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
                              <ShieldCheck className="w-3 h-3" /> Eligible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-600">
                              <ShieldAlert className="w-3 h-3" /> {c.policy_blocked_rules[0] || "Blocked"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Demo Scenario Picker */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-border-subtle bg-slate-50/50 dark:bg-surface flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-text-primary">Provider Execution Mode</div>
                  <div className="text-[11px] text-slate-500">Select test mode simulation behavior</div>
                </div>
                <select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  aria-label="Provider Execution Mode"
                  className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-canvas border border-slate-200 dark:border-border-subtle rounded-md focus:outline-none"
                >
                  <option value="STANDARD">Standard (Authoritative Verified)</option>
                  <option value="FAILURE">Simulate Provider Decline</option>
                  <option value="TIMEOUT">Simulate Gateway Timeout (Pending)</option>
                </select>
              </div>
            </>
          )}

          {/* Phase 2: Execution Results View */}
          {executionResult && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Status Header */}
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">
                    Execution Outcome
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-text-primary mt-0.5">
                    Batch {executionResult.status.replace("_", " ")}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                    {executionResult.cases_recovered} of {executionResult.cases_attempted} attempted cases recovered
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-mono">Batch ID</div>
                  <div className="font-mono text-xs font-bold text-slate-800 dark:text-text-primary">{executionResult.batch_id}</div>
                </div>
              </div>

              {/* Financial Accounting Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                  <div className="text-slate-500 dark:text-text-muted font-medium text-[11px]">Authoritative Recovered</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatCurrency(executionResult.recovered_revenue_minor)}
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-500 mt-0.5">
                    Verified settlement only
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface border border-slate-200/80 dark:border-border-subtle">
                  <div className="text-slate-500 dark:text-text-muted font-medium text-[11px]">Attempted Exposure</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-text-primary mt-0.5">
                    {formatCurrency(executionResult.attempted_recovery_minor)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {executionResult.cases_attempted} transactions
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                  <div className="text-amber-700 dark:text-amber-400 font-medium text-[11px]">Pending / Timeout</div>
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {formatCurrency(executionResult.pending_recovery_minor)}
                  </div>
                  <div className="text-[10px] text-amber-600/75 dark:text-amber-400 mt-0.5">
                    Awaiting webhook/reconciliation
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40">
                  <div className="text-rose-700 dark:text-rose-400 font-medium text-[11px]">Blocked / Failed</div>
                  <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                    {formatCurrency(executionResult.blocked_revenue_minor + executionResult.failed_recovery_minor)}
                  </div>
                  <div className="text-[10px] text-rose-600/75 dark:text-rose-400 mt-0.5">
                    {executionResult.cases_blocked} blocked, {executionResult.cases_failed} failed
                  </div>
                </div>
              </div>

              {/* Item by Item Execution Summary */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-800 dark:text-text-primary">
                  Case Execution Outlines ({executionResult.items.length})
                </div>

                <div className="border border-slate-200 dark:border-border-subtle rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-border-subtle text-xs max-h-60 overflow-y-auto">
                  {executionResult.items.map((it) => (
                    <div key={it.case_id} className="p-2.5 flex items-center justify-between bg-white dark:bg-surface">
                      <div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-medium text-slate-900 dark:text-text-primary">{it.case_id}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            it.status === "RECOVERED" ? "bg-emerald-500/10 text-emerald-600" :
                            it.status === "PENDING" ? "bg-amber-500/10 text-amber-600" :
                            it.status === "BLOCKED" ? "bg-slate-200 text-slate-700 dark:bg-surface-elevated dark:text-text-muted" :
                            "bg-rose-500/10 text-rose-600"
                          }`}>
                            {it.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Strategy: {it.strategy} {it.action_id ? `• Action: ${it.action_id}` : ""}
                          {it.blocked_rules?.length > 0 && ` • Reason: ${it.blocked_rules[0]}`}
                        </div>
                      </div>

                      <div className="font-semibold text-slate-900 dark:text-text-primary">
                        {formatCurrency(it.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit trail link */}
              <div className="p-3 bg-slate-50 dark:bg-surface rounded-lg border border-slate-200/80 dark:border-border-subtle flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-text-secondary">
                  <FileText className="w-4 h-4 text-brand" />
                  <span>Immutable audit logs written to authoritative ledger</span>
                </div>
                <a 
                  href="/audit" 
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                >
                  View in Audit Trail <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-border-subtle bg-slate-50/80 dark:bg-surface flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-text-secondary hover:bg-slate-200 dark:hover:bg-surface-elevated rounded-lg transition-colors"
          >
            {executionResult ? "Close" : "Dismiss"}
          </button>

          {!executionResult && previewData && (
            <button
              onClick={handleAuthorizeBatch}
              disabled={isExecuting || previewData.eligible_count === 0}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg shadow-sm transition-all active:scale-[0.98] ${
                previewData.eligible_count > 0 && !isExecuting
                  ? "bg-brand text-white hover:bg-brand-hover"
                  : "bg-slate-200 text-slate-400 dark:bg-surface-elevated dark:text-text-muted cursor-not-allowed"
              }`}
            >
              {isExecuting ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  Executing Batch Under Policy Locks...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Authorize Batch Recovery ({previewData.eligible_count} Eligible)
                </>
              )}
            </button>
          )}

          {executionResult && (
            <button
              onClick={() => {
                setExecutionResult(null);
                fetchPreview();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" /> Re-evaluate Batch
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
