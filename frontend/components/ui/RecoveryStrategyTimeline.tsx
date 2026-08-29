"use client";

import React from "react";
import { RecoveryStrategy, StrategyStep } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  GitFork, 
  ArrowDown, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  Sparkles,
  Zap,
  Info,
  StopCircle,
  HelpCircle
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface RecoveryStrategyTimelineProps {
  strategy: RecoveryStrategy;
  currentExecutionStep?: string;
}

export function RecoveryStrategyTimeline({ strategy, currentExecutionStep }: RecoveryStrategyTimelineProps) {
  if (!strategy) return null;

  const isCritical = strategy.urgency === "CRITICAL";
  const isHigh = strategy.urgency === "HIGH";

  return (
    <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
      
      {/* 1. Header & Urgency Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-text-primary">
              Intelligent Recovery Orchestration Strategy
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
            Multi-step fallback chain bounded by deterministic policy guardrails and stopping rules
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Strategy Status Badge */}
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
            strategy.status === "RECOVERED" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60" :
            strategy.status === "EXECUTING" ? "bg-indigo-50 text-indigo-700 dark:bg-brand-muted dark:text-brand border border-indigo-200 animate-pulse" :
            strategy.status === "FALLBACK_AVAILABLE" ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200" :
            strategy.status === "STOPPED" ? "bg-slate-100 text-slate-700 dark:bg-surface-elevated dark:text-text-muted" :
            strategy.status === "ESCALATED" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200" :
            "bg-slate-100 text-slate-700 dark:bg-surface-elevated dark:text-text-secondary"
          )}>
            Strategy: {strategy.status.replace("_", " ")}
          </span>

          {/* Urgency Badge */}
          <Tooltip content={strategy.urgencyReason}>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 cursor-help",
              isCritical ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 animate-pulse" :
              isHigh ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60" :
              "bg-slate-100 text-slate-600 dark:bg-surface-elevated dark:text-text-muted"
            )}>
              <Clock className="w-3 h-3" />
              {strategy.urgency} Urgency
            </span>
          </Tooltip>
        </div>
      </div>

      {/* 2. Visual Multi-Step Fallback Chain */}
      <div className="space-y-4">
        <span className="text-[11px] font-bold text-slate-500 dark:text-text-muted uppercase tracking-wider block">
          Fallback Execution Sequence
        </span>

        <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-border-subtle before:z-0">
          {strategy.steps.map((step, idx) => {
            const isPrimary = step.type === "PRIMARY";
            const isFallback = step.type === "FALLBACK";
            const isEscalation = step.type === "ESCALATION";
            const isNoAction = step.intervention === "NO_ACTION";

            return (
              <div 
                key={idx}
                className={cn(
                  "relative z-10 p-3.5 sm:p-4 rounded-xl border transition-all",
                  isPrimary ? "bg-indigo-50/40 dark:bg-brand-muted/20 border-indigo-200 dark:border-brand/40 shadow-sm" :
                  isFallback ? "bg-slate-50/70 dark:bg-surface-elevated/40 border-slate-200 dark:border-border-subtle" :
                  "bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/30"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white",
                      isPrimary ? "bg-brand" :
                      isFallback ? "bg-sky-600" :
                      "bg-amber-600"
                    )}>
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-text-primary">
                      {step.label}
                    </span>
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                      isPrimary ? "bg-brand-muted/40 text-brand dark:bg-brand-muted dark:text-brand" :
                      isFallback ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" :
                      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    )}>
                      {step.type}
                    </span>
                  </div>

                  {step.expectedRecovery > 0 && (
                    <div className="text-xs font-semibold text-slate-700 dark:text-text-secondary self-start sm:self-auto">
                      Expected: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(step.expectedRecovery)}</strong>
                      <span className="text-[10px] text-slate-400 font-normal ml-1">({Math.round(step.recoveryProbability * 100)}% prob)</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-text-secondary leading-relaxed pl-7">
                  {step.rationale}
                </p>

                {/* Policy check notice for step */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-border-subtle/60 flex items-center justify-between text-[11px] pl-7">
                  <span className="text-slate-500 dark:text-text-muted flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    {isPrimary ? "Policy Check: Evaluated before action" : "Policy Check: Evaluated on fallback trigger"}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    Channel: {step.channel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bounded Automation Budget & Stopping Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        
        {/* Left: Bounded Budget */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-surface-elevated/40 border border-slate-200/80 dark:border-border-subtle space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-text-primary uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-brand" /> Bounded Automation Budget
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-text-primary">
              {strategy.budget.currentInterventions} / {strategy.budget.maxInterventions} Used
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-surface rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-brand h-full rounded-full transition-all duration-300"
              style={{ width: `${(strategy.budget.currentInterventions / strategy.budget.maxInterventions) * 100}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-text-muted leading-tight">
            Financial safety limit: Maximum 3 autonomous intervention attempts allowed per incident.
          </p>
        </div>

        {/* Right: Explicit Stopping Rules Checklist */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-surface-elevated/40 border border-slate-200/80 dark:border-border-subtle space-y-2">
          <span className="font-bold text-slate-800 dark:text-text-primary uppercase text-[10px] tracking-wider flex items-center gap-1.5">
            <StopCircle className="w-3.5 h-3.5 text-amber-500" /> Active Stopping Rules
          </span>

          <div className="space-y-1 text-xs">
            {strategy.stoppingRules.slice(0, 3).map((rule, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 dark:text-text-secondary truncate pr-2">
                  • {rule.description}
                </span>
                <span className={cn(
                  "font-mono text-[10px] font-bold px-1.5 rounded",
                  rule.triggered ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                )}>
                  {rule.triggered ? "Triggered" : "Clear"}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
