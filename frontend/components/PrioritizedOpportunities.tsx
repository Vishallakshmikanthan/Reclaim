"use client";

import React from "react";
import Link from "next/link";
import { PrioritizedOpportunity } from "@/lib/metrics/metricsService";
import { Case } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";
import { ProbabilityMeter } from "@/components/ui/ProbabilityMeter";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import { 
  Sparkles, 
  ArrowUpRight, 
  Clock, 
  ShieldCheck, 
  Zap, 
  ChevronRight,
  HelpCircle,
  TrendingUp
} from "lucide-react";

interface PrioritizedOpportunitiesProps {
  opportunities: PrioritizedOpportunity[];
  onSelectCase: (caseItem: Case) => void;
}

export function PrioritizedOpportunities({ opportunities, onSelectCase }: PrioritizedOpportunitiesProps) {
  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 shadow-sm text-center text-xs text-slate-500">
        All high-priority opportunities are currently resolved or queued for human review.
      </div>
    );
  }

  const topOpps = opportunities.slice(0, 5);

  return (
    <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 sm:px-6 border-b border-slate-200/80 dark:border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
              Highest Recovery Opportunities
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-muted/30 text-brand border border-brand/20">
              Prioritized Queue
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
            Ranked deterministically by Expected Value (<code className="font-mono text-[10px]">Amount × Prob</code>) and Freshness Urgency
          </p>
        </div>

        <Link
          href="/at-risk"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-hover transition-colors"
        >
          View All Recovery Ready ({opportunities.length})
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-border-subtle bg-slate-50/75 dark:bg-surface-elevated/75 text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
              <th className="py-3 px-4 sm:px-6">Case & Customer</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4">Recovery Prob.</th>
              <th className="py-3 px-4 text-right">Expected Value</th>
              <th className="py-3 px-4">Priority Tier</th>
              <th className="py-3 px-4">Why Prioritized?</th>
              <th className="py-3 px-4 sm:px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-border-subtle text-xs">
            {topOpps.map((opp) => {
              const c = opp.caseItem;
              const isHigh = opp.priorityTier === "High Priority";

              return (
                <tr
                  key={c.id}
                  onClick={() => onSelectCase(c)}
                  className="hover:bg-slate-50/80 dark:hover:bg-surface-elevated/40 transition-colors group cursor-pointer"
                >
                  <td className="py-3.5 px-4 sm:px-6 font-medium">
                    <div className="flex items-center gap-1.5 font-mono text-slate-900 dark:text-text-primary group-hover:text-brand transition-colors">
                      {c.id}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-brand" />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-text-muted font-sans mt-0.5">
                      {c.customer} • {c.paymentMethod}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-text-primary tabular-nums text-right">
                    {formatCurrency(c.amount)}
                  </td>

                  <td className="py-3.5 px-4">
                    <ProbabilityMeter probability={c.prob} />
                  </td>

                  <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-right">
                    {formatCurrency(opp.expectedValue)}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                      isHigh 
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40"
                        : "bg-indigo-50 text-indigo-700 dark:bg-brand-muted dark:text-brand border border-indigo-200/60"
                    )}>
                      {opp.priorityTier}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 dark:text-text-secondary max-w-xs text-[11px] leading-snug">
                    {opp.whyPrioritized}
                  </td>

                  <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(c);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand hover:text-white hover:bg-brand bg-brand-muted/30 dark:bg-brand-muted rounded-md transition-all active:scale-[0.98]"
                    >
                      <Zap className="w-3 h-3" /> Quick Intervene
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
