import React from "react";
import { Megaphone, Plus } from "lucide-react";

export default function CampaignsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-text-primary tracking-tight">Campaigns</h1>
          <p className="text-sm text-slate-500 dark:text-text-muted mt-1">Automated recovery workflows and batch operations</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-hover transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-xl p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-brand/10 dark:bg-brand-muted text-brand rounded-full flex items-center justify-center mx-auto mb-4">
          <Megaphone className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-text-primary">No active campaigns</h3>
        <p className="text-sm text-slate-500 dark:text-text-muted mt-2 max-w-sm mx-auto">
          Create a campaign to run targeted recovery workflows on segments of failed payments.
        </p>
      </div>
    </div>
  );
}
