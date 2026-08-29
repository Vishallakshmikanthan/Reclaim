"use client";

import React from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";

export default function EvaluationPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-text-primary tracking-tight">Evaluation</h1>
          <p className="text-sm text-slate-500 dark:text-text-muted mt-1">Held-out test set performance against baseline</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-surface-elevated px-2.5 py-1 rounded-md border border-slate-200 dark:border-border-subtle">
            N = 150 Held-Out Cases
          </span>
        </div>
      </div>

      {/* Hero Result */}
      <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-brand/10 dark:to-surface border border-indigo-100 dark:border-brand/20 rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-indigo-600 dark:text-brand uppercase tracking-wider">Overall Impact</h2>
            <div className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-text-primary tabular-nums tracking-tight">
              +₹4,25,000 <span className="text-xl font-medium text-slate-500 dark:text-text-muted">recovered</span>
            </div>
            <p className="text-slate-600 dark:text-text-secondary max-w-md mt-2 leading-relaxed">
              RECLAIM outperformed naive baseline retry by identifying non-retryable cases, executing smart fallbacks, and preventing policy violations.
            </p>
          </div>
          <div className="flex gap-6 w-full md:w-auto">
            <div className="flex-1 bg-white dark:bg-surface-elevated p-5 rounded-xl border border-slate-200 dark:border-border-subtle shadow-sm">
              <div className="text-sm text-slate-500 dark:text-text-muted mb-1">Recovery Uplift</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+42%</div>
            </div>
            <div className="flex-1 bg-white dark:bg-surface-elevated p-5 rounded-xl border border-slate-200 dark:border-border-subtle shadow-sm">
              <div className="text-sm text-slate-500 dark:text-text-muted mb-1">Unnecessary Actions</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">-85%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-border-subtle bg-slate-50 dark:bg-surface-elevated flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-text-primary">Naive Retry vs RECLAIM</h3>
          <span className="text-xs text-slate-500 dark:text-text-muted flex items-center gap-1"><ShieldCheck className="w-4 h-4"/> Verified Results</span>
        </div>
        
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-text-muted border-b border-slate-100 dark:border-border-subtle">
            <tr>
              <th className="px-6 py-4 font-medium w-1/3">Metric</th>
              <th className="px-6 py-4 font-medium">Naive Baseline</th>
              <th className="px-6 py-4 font-medium bg-indigo-50/50 dark:bg-brand/5 border-x border-indigo-50 dark:border-brand/10">RECLAIM</th>
              <th className="px-6 py-4 font-medium text-right">Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-border-subtle">
            <tr className="hover:bg-slate-50 dark:hover:bg-surface-highlight/30">
              <td className="px-6 py-4 font-medium text-slate-900 dark:text-text-primary">Total Cases Evaluated</td>
              <td className="px-6 py-4 text-slate-600 dark:text-text-secondary">150</td>
              <td className="px-6 py-4 font-medium text-slate-900 dark:text-text-primary bg-indigo-50/50 dark:bg-brand/5 border-x border-indigo-50 dark:border-brand/10">150</td>
              <td className="px-6 py-4 text-right text-slate-400">-</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-surface-highlight/30">
              <td className="px-6 py-4 font-medium text-slate-900 dark:text-text-primary">Recovery Rate</td>
              <td className="px-6 py-4 text-slate-600 dark:text-text-secondary">41% (61/150)</td>
              <td className="px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400 bg-indigo-50/50 dark:bg-brand/5 border-x border-indigo-50 dark:border-brand/10">68% (102/150)</td>
              <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">+27%</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-surface-highlight/30">
              <td className="px-6 py-4 font-medium text-slate-900 dark:text-text-primary">Recovery Value Rate</td>
              <td className="px-6 py-4 text-slate-600 dark:text-text-secondary">38% (₹8.2L)</td>
              <td className="px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400 bg-indigo-50/50 dark:bg-brand/5 border-x border-indigo-50 dark:border-brand/10">62% (₹12.45L)</td>
              <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">+₹4.25L</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-surface-highlight/30">
              <td className="px-6 py-4 font-medium text-slate-900 dark:text-text-primary">Intervention Success Rate</td>
              <td className="px-6 py-4 text-slate-600 dark:text-text-secondary">41% (all retried)</td>
              <td className="px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400 bg-indigo-50/50 dark:bg-brand/5 border-x border-indigo-50 dark:border-brand/10">88% (smart routing)</td>
              <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">+47%</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-surface-highlight/30">
              <td className="px-6 py-4 font-medium text-slate-900 dark:text-text-primary flex items-center gap-2">False Intervention Rate <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></td>
              <td className="px-6 py-4 text-slate-600 dark:text-text-secondary">100% (blind retry)</td>
              <td className="px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400 bg-indigo-50/50 dark:bg-brand/5 border-x border-indigo-50 dark:border-brand/10">4% (fraud avoided)</td>
              <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">-96%</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-surface-highlight/30">
              <td className="px-6 py-4 font-medium text-slate-900 dark:text-text-primary">Policy Compliance</td>
              <td className="px-6 py-4 text-slate-600 dark:text-text-secondary">0% (unbounded)</td>
              <td className="px-6 py-4 font-medium text-slate-900 dark:text-text-primary flex items-center gap-2 bg-indigo-50/50 dark:bg-brand/5 border-x border-indigo-50 dark:border-brand/10"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> 100%</td>
              <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">+100%</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-surface-highlight/30">
              <td className="px-6 py-4 font-medium text-slate-900 dark:text-text-primary">Audit Coverage</td>
              <td className="px-6 py-4 text-slate-600 dark:text-text-secondary">None</td>
              <td className="px-6 py-4 font-medium text-slate-900 dark:text-text-primary flex items-center gap-2 bg-indigo-50/50 dark:bg-brand/5 border-x border-indigo-50 dark:border-brand/10"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> 100%</td>
              <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">Complete</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Footer Notes */}
      <div className="text-xs text-slate-500 dark:text-text-muted text-center max-w-2xl mx-auto pt-4">
        * Demo data representation of evaluating RECLAIM on a standard 150-event validation hold-out set drawn from synthetic 1k batch.
      </div>
    </div>
  );
}
