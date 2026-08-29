"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
  SlidersHorizontal,
  RotateCcw,
  Clock,
  Check,
  XCircle,
  ExternalLink,
  Layers,
  History,
  FileCheck
} from "lucide-react";
import { useReclaim } from "@/lib/context/ReclaimContext";
import { formatCurrency, cn } from "@/lib/utils";
import { testPolicyOnCase, simulatePolicyImpact } from "@/lib/merchant/policySimulator";
import { MerchantOnboardingModal } from "@/components/MerchantOnboardingModal";

export default function PolicyCenterPage() {
  const { 
    activePolicy, 
    policyHistory, 
    rollbackPolicy, 
    cases,
    merchantProfile
  } = useReclaim();

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || "RC-2024-081");

  const selectedCase = useMemo(() => {
    return cases.find((c) => c.id === selectedCaseId) || cases[0];
  }, [cases, selectedCaseId]);

  // Live simulation on the selected case
  const caseTestResult = useMemo(() => {
    if (!selectedCase) return null;
    return testPolicyOnCase(selectedCase, activePolicy);
  }, [selectedCase, activePolicy]);

  const policyImpact = useMemo(() => {
    return simulatePolicyImpact(cases, activePolicy);
  }, [cases, activePolicy]);

  const POLICIES_DISPLAY = [
    { 
      id: "POL-01", 
      name: "Maximum Retry Count", 
      value: `${activePolicy.retryRules.maxRetries} Attempts`, 
      unit: "hard ceiling",
      desc: `Strictly caps automatic gateway retries at ${activePolicy.retryRules.maxRetries} attempts to prevent card blocking and merchant fraud penalty flags.`, 
      status: "Active & Enforced",
      layer: "Layer 3 • Gateway Guard"
    },
    { 
      id: "POL-02", 
      name: "Minimum Retry Interval", 
      value: `${activePolicy.retryRules.minRetryIntervalMins} Minutes`, 
      unit: "backoff delay",
      desc: `Enforces a mandatory temporal cooling gap of ${activePolicy.retryRules.minRetryIntervalMins}m between retry attempts for temporary bank downtime and network timeouts.`, 
      status: "Active & Enforced",
      layer: "Layer 3 • Gateway Guard"
    },
    { 
      id: "POL-03", 
      name: "Customer Contact Cap", 
      value: `${activePolicy.communicationRules.maxContacts24h} Messages / 24h`, 
      unit: "spam prevention",
      desc: `Limits outbound recovery notifications (WhatsApp & SMS) to max ${activePolicy.communicationRules.maxContacts24h} messages per customer in 24h.`, 
      status: "Active & Enforced",
      layer: "Layer 3 • Channel Guard"
    },
    { 
      id: "POL-04", 
      name: "Autonomous Action Value Cap", 
      value: formatCurrency(activePolicy.retryRules.maxAutonomousAmountPaise), 
      unit: "financial threshold",
      desc: `Transactions above ${formatCurrency(activePolicy.retryRules.maxAutonomousAmountPaise)} require human operations desk authorization before triggering automated debits.`, 
      status: "Active & Enforced",
      layer: "Layer 3 • Risk Guard"
    },
    { 
      id: "POL-05", 
      name: "Fraud & Cyber Risk Gate", 
      value: "Risk Score < 60%", 
      unit: "instant block",
      desc: "Stops AI intervention immediately when cyber fraud, dispute or stolen card signals are reported by the gateway (Non-bypassable).", 
      status: "Active & Enforced",
      layer: "Layer 3 • Security Guard"
    },
    { 
      id: "POL-06", 
      name: "Recovery Viability Floor", 
      value: `${Math.round(activePolicy.retryRules.minRecoveryProbability * 100)}% Probability`, 
      unit: "economic floor",
      desc: `Prevents wasteful gateway calls when estimated probability is below ${Math.round(activePolicy.retryRules.minRecoveryProbability * 100)}%.`, 
      status: "Active & Enforced",
      layer: "Layer 3 • Economic Guard"
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-text-primary">
              Deterministic Policy Center
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-1 font-mono">
              <Lock className="w-3 h-3" /> Policy {activePolicy.version} Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-text-muted mt-1 font-normal">
            AI can propose recovery strategies, but deterministic policies dictate what is allowed to execute
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust Invariants
          </Link>
          <button 
            onClick={() => setIsOnboardingOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand rounded-lg hover:bg-brand-hover transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" /> Policy Wizard
          </button>
        </div>
      </div>

      {/* 2. Interactive Policy Test Simulator */}
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-border-subtle">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-text-primary">
              Live Policy Simulator & Evaluator
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Test Against Incident:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-border-subtle bg-slate-50 dark:bg-surface-elevated text-slate-900 dark:text-text-primary font-mono text-xs"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.customer} ({formatCurrency(c.amount)} • {c.failureType})
                </option>
              ))}
            </select>
          </div>
        </div>

        {caseTestResult && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Case Snapshot (4 cols) */}
            <div className="md:col-span-4 p-3.5 rounded-lg bg-slate-50 dark:bg-surface-elevated/60 border border-slate-200/60 dark:border-border-subtle space-y-1.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Incident Context</span>
              <div className="flex justify-between">
                <span className="text-slate-500">Case ID:</span>
                <strong className="font-mono text-slate-900 dark:text-text-primary">{caseTestResult.caseId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <strong className="font-mono text-slate-900 dark:text-text-primary">{caseTestResult.amountStr}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Failure:</span>
                <span className="font-medium text-slate-800 dark:text-text-primary">{caseTestResult.failure}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recovery Probability:</span>
                <span className="font-mono font-bold text-brand">{caseTestResult.prob}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Past Retries:</span>
                <span className="font-mono text-slate-700 dark:text-text-secondary">{caseTestResult.retryCount} recorded</span>
              </div>
            </div>

            {/* Policy Evaluation Verdict (8 cols) */}
            <div className="md:col-span-8 p-4 rounded-xl border border-slate-200/80 dark:border-border-subtle bg-slate-50/40 dark:bg-surface space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Evaluation Verdict under Policy {activePolicy.version}
                </span>
                <span className={cn(
                  "font-bold text-xs px-2.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1",
                  caseTestResult.isApproved 
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200" 
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200"
                )}>
                  {caseTestResult.isApproved ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {caseTestResult.isApproved ? "Approved for Execution" : "Action Blocked by Guardrail"}
                </span>
              </div>

              <p className="text-xs text-slate-700 dark:text-text-secondary leading-relaxed">
                {caseTestResult.summary}
              </p>

              <div className="pt-1.5 border-t border-slate-200/60 dark:border-border-subtle flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Deterministic Next Action:</span>
                <strong className="text-brand font-mono">{caseTestResult.nextAction}</strong>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 3. Core Policy Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {POLICIES_DISPLAY.map((pol) => (
          <div 
            key={pol.id}
            className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-surface-elevated px-1.5 py-0.5 rounded">
                  {pol.id}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {pol.layer}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-text-primary mt-1">
                {pol.name}
              </h3>
              
              <div className="my-2.5 p-2 rounded-lg bg-slate-50 dark:bg-surface-elevated/70 border border-slate-100 dark:border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-brand">
                  {pol.value}
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  {pol.unit}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-text-muted leading-relaxed">
                {pol.desc}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-border-subtle flex items-center justify-between text-[11px]">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
              </span>
              <Link 
                href="/settings" 
                className="text-slate-400 hover:text-brand transition-colors text-[10px] font-medium"
              >
                Configure →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Policy Version History & Rollback Table */}
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 sm:px-6 border-b border-slate-200/80 dark:border-border-subtle bg-slate-50/50 dark:bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-text-primary">
              Policy Version History & Traceability Ledger
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {policyHistory.length} Recorded Versions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-border-subtle bg-slate-50/70 dark:bg-surface-elevated/40 text-[10px] font-bold text-slate-400 uppercase">
                <th className="py-2.5 px-4 sm:px-6">Version</th>
                <th className="py-2.5 px-3">Effective Timestamp</th>
                <th className="py-2.5 px-3">Configured By</th>
                <th className="py-2.5 px-3">Change Summary</th>
                <th className="py-2.5 px-4 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border-subtle text-slate-700 dark:text-text-secondary">
              {policyHistory.map((item) => {
                const isCurrent = item.version === activePolicy.version;

                return (
                  <tr key={item.version} className="hover:bg-slate-50/80 dark:hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-4 sm:px-6 font-mono font-bold text-slate-900 dark:text-text-primary">
                      {item.version} {isCurrent && <span className="text-[10px] ml-1 px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">ACTIVE</span>}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {item.timestamp}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800 dark:text-text-primary">
                      {item.actor}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-text-secondary">
                      {item.summary}
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-right">
                      {!isCurrent && (
                        <button
                          onClick={() => rollbackPolicy(item.version)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-brand hover:bg-brand/10 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" /> Rollback
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboarding Wizard Modal */}
      <MerchantOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

    </div>
  );
}
