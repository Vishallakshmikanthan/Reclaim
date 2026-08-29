import React from "react";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-text-primary tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-text-muted mt-1">Manage merchant profile and integrations</p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-xl p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-100 dark:bg-surface-elevated text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-text-primary">Settings Configured</h3>
        <p className="text-sm text-slate-500 dark:text-text-muted mt-2 max-w-sm mx-auto">
          API configurations and merchant profiles are currently locked for the Razorpay test environment.
        </p>
      </div>
    </div>
  );
}
