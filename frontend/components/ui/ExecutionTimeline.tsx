"use client";

import React from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { ExecutionProgress, Case } from "@/lib/types";
import { calculateMoneyImpact } from "@/lib/metrics/metricsService";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Activity, 
  ShieldCheck, 
  CreditCard, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  Lock
} from "lucide-react";

interface ExecutionTimelineProps {
  caseItem: Case;
  progress: ExecutionProgress;
}

export function ExecutionTimeline({ caseItem, progress }: ExecutionTimelineProps) {
  const step = progress.step;
  const isRecovered = caseItem.status === "recovered" || step === "success";
  const isBlocked = step === "blocked";
  const isTimeout = step === "timeout";
  const isFailed = step === "failed";
  const isRunning = ["authorizing", "executing", "verifying"].includes(step);

  const impact = calculateMoneyImpact(caseItem);

  const steps = [
    {
      id: "policy",
      label: "1. Policy Check",
      layer: "Layer 3 Policy Engine",
      isDone: ["executing", "verifying", "success", "timeout", "failed"].includes(step) || isRecovered,
      isCurrent: step === "authorizing",
      isFailed: isBlocked,
      failedLabel: "Policy Blocked",
    },
    {
      id: "action",
      label: "2. Action Created",
      layer: "Idempotency Lock Engaged",
      isDone: ["executing", "verifying", "success", "timeout", "failed"].includes(step) || isRecovered,
      isCurrent: step === "authorizing",
    },
    {
      id: "executing",
      label: "3. Razorpay Test Action",
      layer: "Layer 4 Gateway Dispatch",
      isDone: ["verifying", "success", "timeout", "failed"].includes(step) || isRecovered,
      isCurrent: step === "executing",
      isFailed: isFailed,
      failedLabel: "Issuer Decline",
    },
    {
      id: "verifying",
      label: "4. Gateway Telemetry",
      layer: "Layer 5 Verification",
      isDone: step === "success" || isRecovered,
      isCurrent: step === "verifying",
      isFailed: isTimeout,
      failedLabel: "Timeout (30s)",
    },
    {
      id: "outcome",
      label: "5. Ledger Outcome",
      layer: isRecovered ? "Settled ✓" : isBlocked ? "Escalated" : isTimeout ? "Escalated" : isFailed ? "Failed" : "Pending",
      isDone: isRecovered,
      isCurrent: false,
      isFailed: isBlocked || isTimeout || isFailed,
      failedLabel: isBlocked ? "Escalated" : isTimeout ? "Escalated" : "Failed",
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Step by Step Pipeline */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-elevated/70 border border-slate-200/80 dark:border-border-subtle space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-border-subtle">
          <span className="text-[11px] font-bold text-slate-700 dark:text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-brand" /> Execution & Verification Pipeline
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {isRunning ? "Live Stream Active" : isRecovered ? "Settled (200 OK)" : "Deterministic Flow"}
          </span>
        </div>

        <div className="space-y-2">
          {steps.map((st) => (
            <div 
              key={st.id} 
              className={cn(
                "p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all duration-200",
                st.isDone ? "bg-emerald-50/50 border-emerald-200/80 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-300" :
                st.isCurrent ? "bg-brand/10 border-brand/40 text-brand animate-pulse font-semibold" :
                st.isFailed ? "bg-rose-50/50 border-rose-200/80 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-300" :
                "bg-white dark:bg-surface border-slate-200/60 dark:border-border-subtle text-slate-400 dark:text-text-muted"
              )}
            >
              <div className="flex items-center gap-2">
                {st.isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                ) : st.isCurrent ? (
                  <Activity className="w-4 h-4 text-brand animate-spin flex-shrink-0" />
                ) : st.isFailed ? (
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-border-subtle flex-shrink-0" />
                )}
                <span className="font-semibold text-slate-800 dark:text-text-primary text-[11px]">
                  {st.label}
                </span>
              </div>
              <span className="text-[10px] font-mono">
                {st.isFailed ? st.failedLabel : st.layer}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Simulated Razorpay Test Mode Card */}
      <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface space-y-2 text-xs">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-border-subtle">
          <span className="font-bold text-slate-800 dark:text-text-primary flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-brand" /> Razorpay Test Mode Gateway
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-surface-elevated text-slate-600 dark:text-text-secondary border border-slate-200 dark:border-border-subtle">
            API v1 Test
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Action Target</span>
            <span className="font-medium text-slate-800 dark:text-text-primary">{caseItem.strategy}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Idempotency Key</span>
            <span className="font-mono text-slate-600 dark:text-text-secondary text-[10px] truncate block">
              {progress.idempotencyKey || `rz_rec_${caseItem.id}_demo`}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Amount Captured</span>
            <span className="font-bold text-slate-900 dark:text-text-primary">{formatCurrency(caseItem.amount)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reference Ref</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[10px]">
              {caseItem.resolutionDetails?.transactionId || progress.transactionId || "Pending Verification"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Financial Impact & Variance (Expected vs Actual) */}
      {isRecovered && (
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-emerald-100 dark:border-emerald-900/30">
            <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3.5 h-3.5" /> Money Impact & Variance
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
              {impact.outcomeLabel}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
            <div>
              <span className="text-slate-400 text-[10px] block">Expected</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-text-secondary">
                {formatCurrency(impact.expectedRecovery)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Actual Captured</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(impact.actualRecovery)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Variance</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(Math.max(0, impact.variance))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
