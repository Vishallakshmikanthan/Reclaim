"use client";

import React from "react";
import { FunnelStage } from "@/lib/metrics/metricsService";
import { formatCurrency, cn } from "@/lib/utils";
import { TrendingDown, ShieldCheck, Zap, CheckCircle2, ArrowRight } from "lucide-react";

interface RecoveryFunnelProps {
  stages: FunnelStage[];
}

export function RecoveryFunnel({ stages }: RecoveryFunnelProps) {
  if (!stages || stages.length === 0) return null;

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
          100% Deterministic Flow
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        {stages.map((stage, idx) => {
          const isAtRisk = stage.id === "at_risk";
          const isRecovered = stage.id === "recovered";
          const isEligible = stage.id === "eligible";
          const isIntervened = stage.id === "intervened";
          const isEscalated = stage.id === "escalated";

          return (
            <div 
              key={stage.id}
              className={cn(
                "p-4 rounded-xl border flex flex-col justify-between transition-all relative group",
                isAtRisk ? "bg-slate-50/70 dark:bg-surface-elevated/40 border-slate-200 dark:border-border-subtle" :
                isEligible ? "bg-indigo-50/40 dark:bg-brand-muted/20 border-indigo-200/70 dark:border-brand/30" :
                isIntervened ? "bg-sky-50/40 dark:bg-sky-950/20 border-sky-200/70 dark:border-sky-800/40" :
                isRecovered ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 shadow-sm" :
                "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/40"
              )}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider text-[10px]">
                    Stage 0{idx + 1}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                    isRecovered ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300" :
                    isAtRisk ? "bg-slate-200 dark:bg-surface text-slate-700 dark:text-text-secondary" :
                    "bg-white dark:bg-surface text-slate-700 dark:text-text-secondary"
                  )}>
                    {stage.percentageOfTotal}%
                  </span>
                </div>

                <div className="font-bold text-xs text-slate-800 dark:text-text-primary mb-1">
                  {stage.name}
                </div>

                <div className={cn(
                  "text-lg sm:text-xl font-bold tabular-nums tracking-tight",
                  isRecovered ? "text-emerald-600 dark:text-emerald-400" :
                  isAtRisk ? "text-rose-600 dark:text-rose-400" :
                  "text-slate-900 dark:text-text-primary"
                )}>
                  {formatCurrency(stage.amount)}
                </div>

                <div className="text-[11px] text-slate-500 dark:text-text-muted mt-0.5">
                  {stage.casesCount} cases
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-border-subtle/60 text-[10px] text-slate-500 dark:text-text-muted leading-tight">
                {stage.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
