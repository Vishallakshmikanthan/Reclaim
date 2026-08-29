"use client";

import React from "react";
import { ShieldCheck, Sliders, AlertCircle, Edit2, CheckCircle2 } from "lucide-react";

const POLICIES = [
  { id: "POL-01", name: "Maximum Retry Count", value: "3 attempts", desc: "No payment may be retried more than the configured maximum number of times.", status: "active" },
  { id: "POL-02", name: "Minimum Retry Interval", value: "30 mins", desc: "Minimum time gap between retry attempts for temporary failures.", status: "active" },
  { id: "POL-03", name: "Customer Contact Limit", value: "2 per 24h", desc: "Maximum recovery communications a customer can receive within 24 hours.", status: "active" },
  { id: "POL-04", name: "Auto-Action Threshold", value: "₹10,000", desc: "Recovery actions above this amount require human approval before execution.", status: "active" },
  { id: "POL-05", name: "Escalation Triggers", value: "Risk / Fraud", desc: "Failure codes that bypass AI recovery and route directly to human review.", status: "active" },
  { id: "POL-06", name: "Cooling Period", value: "48 hours", desc: "Automated actions are paused after a case has been escalated to human review.", status: "active" },
];

export default function PolicyCenterPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-text-primary tracking-tight">Policy Center</h1>
          <p className="text-sm text-slate-500 dark:text-text-muted mt-1">AI can recommend. Policies determine what can happen.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-brand rounded-md hover:bg-slate-800 dark:hover:bg-brand-hover transition-colors shadow-sm">
            <Sliders className="w-4 h-4" /> Adjust Limits
          </button>
        </div>
      </div>

      <div className="bg-indigo-50/50 dark:bg-brand-muted/20 border border-indigo-100 dark:border-brand/20 rounded-xl p-6 shadow-sm flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-brand flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-indigo-900 dark:text-brand">Deterministic Guardrails Active</h3>
          <p className="text-sm text-indigo-700/80 dark:text-text-secondary mt-1 max-w-3xl leading-relaxed">
            These policies represent hard boundaries. The LangGraph agent cannot override these rules. Any recovery plan proposed by the AI that violates a policy will be deterministically blocked and escalated.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {POLICIES.map((policy) => (
          <div key={policy.id} className="bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-xl p-6 shadow-sm group hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 dark:bg-border-subtle group-hover:bg-brand transition-colors" />
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-text-primary group-hover:text-brand transition-colors">{policy.name}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded mt-2">
                  <CheckCircle2 className="w-3 h-3" /> {policy.status}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle px-3 py-1.5 rounded-md font-mono text-sm font-medium text-slate-700 dark:text-text-primary">
                {policy.value}
              </div>
            </div>
            
            <p className="text-sm text-slate-500 dark:text-text-muted leading-relaxed">
              {policy.desc}
            </p>
            
            <div className="mt-6 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand dark:text-text-muted dark:hover:text-brand transition-colors">
                <Edit2 className="w-3.5 h-3.5" /> Edit Rule
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
