"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  TrendingDown, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert, 
  Clock, 
  HelpCircle,
  BarChart3,
  Layers
} from "lucide-react";
import { RecoveryFunnelResponse, InterventionPerformance } from "@/lib/types";
import { apiClient } from "@/lib/api/client";

interface RecoveryFunnelProps {
  stages?: any[];
  initialData?: RecoveryFunnelResponse | null;
}

export function RecoveryFunnel({ stages: legacyStages, initialData }: RecoveryFunnelProps) {
  const [funnelData, setFunnelData] = useState<RecoveryFunnelResponse | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    let isMounted = true;
    async function loadFunnel() {
      try {
        const res = await apiClient.get<RecoveryFunnelResponse>("/api/v1/metrics/funnel");
        if (isMounted) {
          setFunnelData(res);
        }
      } catch (err) {
        console.error("Failed to load recovery funnel:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (!initialData) {
      loadFunnel();
    }
    return () => {
      isMounted = false;
    };
  }, [initialData]);

  if (!funnelData && legacyStages && legacyStages.length > 0) {
    return (
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-3 border-b border-slate-100 dark:border-border-subtle">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                End-to-End Recovery Funnel
              </h3>
              <span className="text-[11px] font-medium text-slate-500 dark:text-text-muted">
                (Live Flow Conversion)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
              How incoming transaction failure exposure translates into verified merchant recovery
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-surface-elevated text-slate-600 dark:text-text-secondary self-start sm:self-auto border border-slate-200 dark:border-border-subtle">
            100% Server-Authoritative
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {legacyStages.map((stage: any, idx: number) => (
            <div key={stage.id || idx} className="p-4 rounded-xl border bg-slate-50/70 dark:bg-surface-elevated/40 border-slate-200 dark:border-border-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                    Stage 0{idx + 1}
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-800 dark:text-text-primary mb-1">
                  {stage.name}
                </div>
                <div className="text-lg sm:text-xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-text-primary">
                  {formatCurrency(stage.amount)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {stage.casesCount} cases
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[10px] text-slate-500">
                {stage.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!funnelData) return null;

  return (
    <div className="space-y-6">
      {/* 1. Main Funnel Card */}
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-border-subtle">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-brand/10 text-brand dark:bg-brand/20">
                <BarChart3 className="w-3 h-3" /> Measurement Engine
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-text-primary">
                Server-Authoritative Recovery Funnel
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-text-muted mt-1">
              Grounded end-to-end accounting from gross transaction decline to cryptographic settlement verification
            </p>
          </div>

          {/* Rate Badges with Explicit Denominators */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-right">
              <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                Revenue Recovery Rate
              </div>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {funnelData.revenue_recovery_rate}%
              </div>
              <div className="text-[9px] text-emerald-700/80 dark:text-emerald-500 font-mono">
                {funnelData.revenue_recovery_rate_denominator}
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle text-right">
              <div className="text-[10px] uppercase font-bold text-slate-600 dark:text-text-secondary">
                Case Recovery Rate
              </div>
              <div className="text-base font-bold text-slate-800 dark:text-text-primary tabular-nums">
                {funnelData.case_recovery_rate}%
              </div>
              <div className="text-[9px] text-slate-500 dark:text-text-muted font-mono">
                {funnelData.case_recovery_rate_denominator}
              </div>
            </div>
          </div>
        </div>

        {/* Funnel Stage Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {funnelData.stages.slice(0, 4).map((stage, idx) => {
            const isAtRisk = stage.stage_name === "Revenue At Risk";
            const isEligible = stage.stage_name === "Policy Eligible";
            const isAttempted = stage.stage_name === "Recovery Attempted";
            const isRecovered = stage.stage_name === "Verified Recovered";

            return (
              <div 
                key={stage.stage_name}
                className={cn(
                  "p-4 rounded-xl border flex flex-col justify-between transition-all",
                  isAtRisk ? "bg-slate-50/70 dark:bg-surface-elevated/40 border-slate-200 dark:border-border-subtle" :
                  isEligible ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/70 dark:border-blue-800/40" :
                  isAttempted ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/40" :
                  "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 shadow-sm"
                )}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider text-[10px]">
                      Step 0{idx + 1}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      isRecovered ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300" :
                      "bg-white dark:bg-surface text-slate-700 dark:text-text-secondary border border-slate-200/60 dark:border-border-subtle"
                    )}>
                      {stage.percentage_of_total_revenue}%
                    </span>
                  </div>

                  <div className="font-bold text-xs text-slate-800 dark:text-text-primary mb-1">
                    {stage.stage_name}
                  </div>

                  <div className={cn(
                    "text-lg sm:text-xl font-bold tabular-nums tracking-tight",
                    isRecovered ? "text-emerald-600 dark:text-emerald-400" :
                    isAtRisk ? "text-slate-900 dark:text-text-primary" :
                    "text-slate-900 dark:text-text-primary"
                  )}>
                    {formatCurrency(stage.amount_minor)}
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-text-muted mt-0.5">
                    {stage.case_count} cases
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-border-subtle/60 text-[10px] text-slate-500 dark:text-text-muted leading-tight">
                  {stage.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* Supplementary Terminal Stages (Blocked, Failed, Pending) */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-border-subtle grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50/50 dark:bg-surface border border-slate-200/80 dark:border-border-subtle flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-900 dark:text-text-primary">
                Policy Blocked ({funnelData.policy_blocked_cases} cases)
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-text-primary mt-0.5">
                {formatCurrency(funnelData.policy_blocked_revenue_minor)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Max retries, fraud flags, or autonomous limits
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50/50 dark:bg-surface border border-slate-200/80 dark:border-border-subtle flex items-start gap-2.5">
            <TrendingDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-900 dark:text-text-primary">
                Provider Declined ({funnelData.failed_cases} cases)
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-text-primary mt-0.5">
                {formatCurrency(funnelData.failed_revenue_minor)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Banking switch decline or customer refusal
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-900 dark:text-amber-300">
                Pending Settlement ({funnelData.pending_cases} cases)
              </div>
              <div className="text-sm font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                {formatCurrency(funnelData.pending_revenue_minor)}
              </div>
              <div className="text-[10px] text-amber-700/80 dark:text-amber-400 mt-0.5">
                Awaiting webhook verification (uncredited)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Intervention Performance Table with Explicit Sample Sizes */}
      {funnelData.interventions && funnelData.interventions.length > 0 && (
        <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-border-subtle">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-text-primary flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand" /> Intervention Effectiveness Breakdown
              </h4>
              <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                Measurable performance partitioned by recovery intervention channel with explicit sample sizes
              </p>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Sample size n = total attempts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-border-subtle text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
                  <th className="py-2.5 px-3">Intervention Type</th>
                  <th className="py-2.5 px-3 text-center">Sample Size</th>
                  <th className="py-2.5 px-3 text-center">Successes</th>
                  <th className="py-2.5 px-3 text-center">Failures</th>
                  <th className="py-2.5 px-3 text-center">Pending</th>
                  <th className="py-2.5 px-3 text-right">Attempted (₹)</th>
                  <th className="py-2.5 px-3 text-right">Recovered (₹)</th>
                  <th className="py-2.5 px-3 text-right">Recovery Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border-subtle">
                {funnelData.interventions.map((it) => (
                  <tr key={it.intervention} className="hover:bg-slate-50/60 dark:hover:bg-surface-elevated/40">
                    <td className="py-3 px-3 font-mono font-medium text-slate-900 dark:text-text-primary">
                      {it.intervention}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-700 dark:text-text-secondary">
                      n={it.sample_size}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                      {it.successes}
                    </td>
                    <td className="py-3 px-3 text-center text-rose-500">
                      {it.failures}
                    </td>
                    <td className="py-3 px-3 text-center text-amber-500">
                      {it.pending}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-text-secondary">
                      {formatCurrency(it.revenue_attempted_minor)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(it.revenue_recovered_minor)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-text-primary">
                      {it.recovery_rate}%
                      <div className="text-[10px] text-slate-400 font-normal font-mono">
                        {it.recovery_rate_label}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
