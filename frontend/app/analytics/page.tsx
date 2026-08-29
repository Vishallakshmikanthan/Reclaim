import React from "react";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-text-primary tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-text-muted mt-1">Deep dive into recovery metrics and cohort analysis</p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-xl p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-100 dark:bg-surface-elevated text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-text-primary">Advanced Analytics</h3>
        <p className="text-sm text-slate-500 dark:text-text-muted mt-2 max-w-sm mx-auto">
          Detailed metrics are being processed. See the Evaluation Report for held-out baseline comparison results.
        </p>
      </div>
    </div>
  );
}
