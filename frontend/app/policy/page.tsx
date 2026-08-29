"use client";

import React from "react";
import { 
  ShieldCheck, 
  Sliders, 
  AlertCircle, 
  Edit2, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal
} from "lucide-react";

const POLICIES = [
  { 
    id: "POL-01", 
    name: "Maximum Retry Count", 
    value: "3 Attempts", 
    unit: "hard ceiling",
    desc: "Strictly caps automatic gateway retries per failed payment to prevent card blocking and merchant fraud penalty flags.", 
    status: "Active & Enforced",
    layer: "Layer 3 • Gateway Guard"
  },
  { 
    id: "POL-02", 
    name: "Minimum Retry Interval", 
    value: "30 Minutes", 
    unit: "backoff delay",
    desc: "Enforces a mandatory temporal cooling gap between retry attempts for temporary bank downtime and network timeouts.", 
    status: "Active & Enforced",
    layer: "Layer 3 • Gateway Guard"
  },
  { 
    id: "POL-03", 
    name: "Customer Contact Cap", 
    value: "2 Messages / 24h", 
    unit: "spam prevention",
    desc: "Limits outbound recovery notifications (WhatsApp & SMS) to protect brand reputation and prevent user fatigue.", 
    status: "Active & Enforced",
    layer: "Layer 3 • Channel Guard"
  },
  { 
    id: "POL-04", 
    name: "Autonomous Action Value Cap", 
    value: "₹10,000", 
    unit: "financial threshold",
    desc: "Transactions above this threshold require human operations desk authorization before triggering automated debits or concessions.", 
    status: "Active & Enforced",
    layer: "Layer 3 • Risk Guard"
  },
  { 
    id: "POL-05", 
    name: "Escalation Triggers", 
    value: "Risk / Fraud Signals", 
    unit: "instant block",
    desc: "Stops AI intervention immediately when cyber fraud or stolen card signals are reported by the gateway.", 
    status: "Active & Enforced",
    layer: "Layer 3 • Security Guard"
  },
  { 
    id: "POL-06", 
    name: "Dispute Cooling Period", 
    value: "48 Hours", 
    unit: "pause period",
    desc: "Freezes all automated outreach and retries if the user initiates a chargeback inquiry or support ticket.", 
    status: "Active & Enforced",
    layer: "Layer 3 • Support Guard"
  },
];

export default function PolicyCenterPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-text-primary">
              Deterministic Policy Center
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Hard Invariants
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-text-muted mt-1 font-normal">
            AI can propose recovery strategies, but deterministic policies dictate what is allowed to execute
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-brand rounded-lg hover:bg-slate-800 dark:hover:bg-brand-hover transition-colors shadow-sm">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust Invariants
          </button>
        </div>
      </div>

      {/* 2. Core Architecture Differentiator Banner */}
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand/10 dark:bg-brand-muted text-brand flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                AI Proposes → Deterministic Guardrails Validate → Razorpay Executes
              </h3>
              <p className="text-xs text-slate-600 dark:text-text-secondary leading-relaxed max-w-2xl">
                The LangGraph agent cannot override these rules. Every proposed action is intercepted at Layer 3. If any policy check fails, the action is rejected and queued for human audit.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
              6 Rules Active
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-surface-elevated text-slate-700 dark:text-text-secondary border border-slate-200 dark:border-border-subtle font-mono">
              0 Violations
            </span>
          </div>
        </div>
      </div>

      {/* 3. Policy Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {POLICIES.map((policy) => (
          <div 
            key={policy.id} 
            className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-border-subtle/80 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-[10px] font-mono font-semibold uppercase text-slate-400 dark:text-text-muted">
                    {policy.layer}
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-text-primary group-hover:text-brand transition-colors mt-0.5">
                    {policy.name}
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-text-primary bg-slate-100 dark:bg-surface-elevated px-2.5 py-1 rounded-md border border-slate-200/80 dark:border-border-subtle whitespace-nowrap">
                  {policy.value}
                </span>
              </div>
              
              <p className="text-xs text-slate-600 dark:text-text-secondary leading-relaxed mt-2">
                {policy.desc}
              </p>
            </div>
            
            <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-border-subtle flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> {policy.status}
              </span>
              <button className="text-xs font-medium text-slate-400 group-hover:text-brand flex items-center gap-1 transition-colors">
                <Edit2 className="w-3 h-3" /> Edit Threshold
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

