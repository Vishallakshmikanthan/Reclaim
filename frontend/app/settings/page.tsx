"use client";

import React, { useState } from "react";
import { 
  Settings, 
  Key, 
  Webhook, 
  ShieldCheck, 
  Building, 
  Bell, 
  Check, 
  Copy,
  ExternalLink,
  Lock,
  SlidersHorizontal,
  UserCheck,
  RotateCcw,
  Sparkles,
  Save,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useReclaim } from "@/lib/context/ReclaimContext";
import { MerchantRole, MerchantPolicy } from "@/lib/merchant/types";
import { formatCurrency, cn } from "@/lib/utils";
import { simulatePolicyImpact } from "@/lib/merchant/policySimulator";
import { MerchantOnboardingModal } from "@/components/MerchantOnboardingModal";

export default function SettingsPage() {
  const { toast } = useToast();
  const { 
    merchantProfile, 
    updateMerchantProfile, 
    activePolicy, 
    updatePolicy, 
    setMerchantRole, 
    cases 
  } = useReclaim();

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Form states initialized with active policy
  const [businessName, setBusinessName] = useState(merchantProfile.businessName);
  const [industry, setIndustry] = useState(merchantProfile.industry);

  const [autoRecovery, setAutoRecovery] = useState(activePolicy.recoverySettings.automaticRecoveryEnabled);
  const [paymentRetry, setPaymentRetry] = useState(activePolicy.recoverySettings.paymentRetryEnabled);
  const [paymentLink, setPaymentLink] = useState(activePolicy.recoverySettings.paymentLinkEnabled);
  const [subscriptionRecovery, setSubscriptionRecovery] = useState(activePolicy.recoverySettings.subscriptionRecoveryEnabled);
  const [customerReminders, setCustomerReminders] = useState(activePolicy.recoverySettings.customerRemindersEnabled);
  const [humanEscalation, setHumanEscalation] = useState(activePolicy.recoverySettings.humanEscalationEnabled);

  const [maxRetries, setMaxRetries] = useState(activePolicy.retryRules.maxRetries);
  const [minRetryInterval, setMinRetryInterval] = useState(activePolicy.retryRules.minRetryIntervalMins);
  const [minProb, setMinProb] = useState(activePolicy.retryRules.minRecoveryProbability);
  const [maxAmountPaise, setMaxAmountPaise] = useState(activePolicy.retryRules.maxAutonomousAmountPaise);

  const [preferredLang, setPreferredLang] = useState<"Hinglish" | "English">(activePolicy.communicationRules.preferredLanguage);
  const [maxContacts, setMaxContacts] = useState(activePolicy.communicationRules.maxContacts24h);

  // Draft policy impact calculation
  const draftPolicy: MerchantPolicy = {
    ...activePolicy,
    recoverySettings: {
      ...activePolicy.recoverySettings,
      automaticRecoveryEnabled: autoRecovery,
      paymentRetryEnabled: paymentRetry,
      paymentLinkEnabled: paymentLink,
      subscriptionRecoveryEnabled: subscriptionRecovery,
      customerRemindersEnabled: customerReminders,
      humanEscalationEnabled: humanEscalation,
    },
    retryRules: {
      ...activePolicy.retryRules,
      maxRetries,
      minRetryIntervalMins: minRetryInterval,
      minRecoveryProbability: minProb,
      maxAutonomousAmountPaise: maxAmountPaise,
    },
    communicationRules: {
      ...activePolicy.communicationRules,
      preferredLanguage: preferredLang,
      maxContacts24h: maxContacts,
    },
  };

  const impact = simulatePolicyImpact(cases, draftPolicy);

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (merchantProfile.currentRole === "VIEWER") {
      toast({
        title: "Permission Denied",
        description: "Viewer role has read-only permissions.",
        type: "error",
      });
      return;
    }

    updateMerchantProfile({ businessName, industry });
    updatePolicy(draftPolicy, `Merchant configuration updated (Max Retries: ${maxRetries}, Max Cap: ${formatCurrency(maxAmountPaise)})`);
  };

  const copyToClipboard = (text: string, type: "key" | "webhook") => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      toast({ title: "API Key Copied", description: "Razorpay Key ID copied to clipboard.", type: "success" });
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedWebhook(true);
      toast({ title: "Webhook URL Copied", description: "Layer 0 Webhook URL copied to clipboard.", type: "success" });
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16 max-w-5xl">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-text-primary">
              Merchant Control & Settings
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 font-mono">
              Policy {activePolicy.version} Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-text-muted mt-1 font-normal">
            Configure business entity, role permissions, deterministic guardrails, and gateway connectivity
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand bg-brand/10 hover:bg-brand/20 rounded-lg transition-colors border border-brand/20"
          >
            <Sparkles className="w-3.5 h-3.5" /> Re-run Setup Wizard
          </button>
        </div>
      </div>

      {/* 2. RBAC Role Switcher Strip */}
      <div className="p-4 rounded-xl bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <UserCheck className="w-4 h-4 text-brand" />
          <div>
            <span className="font-bold text-slate-900 dark:text-text-primary block">Active Operator Role (RBAC)</span>
            <span className="text-[11px] text-slate-500 dark:text-text-muted">
              Current Permissions: {merchantProfile.currentRole === "MERCHANT_ADMIN" ? "Full Policy Configuration & Execution" : merchantProfile.currentRole === "OPERATOR" ? "Recovery Execution Only" : "Read-Only Viewer"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-surface-elevated p-1 rounded-lg font-semibold">
          {(["MERCHANT_ADMIN", "OPERATOR", "VIEWER"] as MerchantRole[]).map((r) => (
            <button
              key={r}
              onClick={() => setMerchantRole(r)}
              className={cn(
                "px-2.5 py-1 rounded transition-colors text-[11px]",
                merchantProfile.currentRole === r ? "bg-white dark:bg-surface text-brand shadow-xs" : "text-slate-500"
              )}
            >
              {r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSavePolicy} className="space-y-6">

        {/* 3. Merchant Entity & Profile */}
        <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-border-subtle">
            <Building className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-text-primary">
              Merchant Entity Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-text-secondary font-semibold">Business Name</label>
              <input 
                value={businessName} 
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 text-slate-900 dark:text-text-primary font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-text-secondary font-semibold">Industry Category</label>
              <input 
                value={industry} 
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 text-slate-900 dark:text-text-primary font-medium"
              />
            </div>
          </div>
        </div>

        {/* 4. Autonomous Recovery Engine Controls */}
        <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-border-subtle">
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-text-primary">
                Autonomous Recovery Workflows
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Layer 2 & 4</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand/5 dark:bg-brand-muted/20 border border-brand/20">
              <div>
                <span className="font-bold text-slate-900 dark:text-text-primary text-xs block">
                  Automatic Recovery Engine (Master Switch)
                </span>
                <p className="text-[11px] text-slate-600 dark:text-text-secondary mt-0.5">
                  If disabled, RECLAIM will recommend actions for manual approval only.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoRecovery}
                onChange={(e) => setAutoRecovery(e.target.checked)}
                className="w-4 h-4 accent-brand"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-border-subtle bg-slate-50/50 dark:bg-surface-elevated/40">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-text-primary block">Payment Retries</span>
                  <span className="text-[10px] text-slate-400">Gateway timeout retries</span>
                </div>
                <input type="checkbox" checked={paymentRetry} onChange={(e) => setPaymentRetry(e.target.checked)} className="accent-brand" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-border-subtle bg-slate-50/50 dark:bg-surface-elevated/40">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-text-primary block">Payment Links</span>
                  <span className="text-[10px] text-slate-400">1-click WhatsApp checkout links</span>
                </div>
                <input type="checkbox" checked={paymentLink} onChange={(e) => setPaymentLink(e.target.checked)} className="accent-brand" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-border-subtle bg-slate-50/50 dark:bg-surface-elevated/40">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-text-primary block">Subscription Dunning</span>
                  <span className="text-[10px] text-slate-400">Recurring auto-debit retries</span>
                </div>
                <input type="checkbox" checked={subscriptionRecovery} onChange={(e) => setSubscriptionRecovery(e.target.checked)} className="accent-brand" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-border-subtle bg-slate-50/50 dark:bg-surface-elevated/40">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-text-primary block">Customer Reminders</span>
                  <span className="text-[10px] text-slate-400">Hinglish / English SMS nudges</span>
                </div>
                <input type="checkbox" checked={customerReminders} onChange={(e) => setCustomerReminders(e.target.checked)} className="accent-brand" />
              </label>
            </div>
          </div>
        </div>

        {/* 5. Safety Guardrails & Thresholds */}
        <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-border-subtle">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-text-primary">
                Layer 3 Policy Guardrails & Safety Caps
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-600">Deterministic Invariants</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold text-slate-700 dark:text-text-secondary">
                <span>Maximum Retries per Case</span>
                <span className="font-mono font-bold text-brand">{maxRetries} Attempts</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={maxRetries}
                onChange={(e) => setMaxRetries(parseInt(e.target.value))}
                className="w-full accent-brand"
              />
              <span className="text-[10px] text-slate-400">Hard ceiling before forced escalation</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold text-slate-700 dark:text-text-secondary">
                <span>Minimum Viability Floor (Probability)</span>
                <span className="font-mono font-bold text-brand">{Math.round(minProb * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.05"
                value={minProb}
                onChange={(e) => setMinProb(parseFloat(e.target.value))}
                className="w-full accent-brand"
              />
              <span className="text-[10px] text-slate-400">Rejects low-probability interventions</span>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-text-secondary font-semibold">Autonomous Action Value Cap</label>
              <select
                value={maxAmountPaise}
                onChange={(e) => setMaxAmountPaise(parseInt(e.target.value))}
                className="w-full bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 text-slate-900 dark:text-text-primary font-mono text-xs"
              >
                <option value={1000000}>₹10,000 max auto-action</option>
                <option value={2500000}>₹25,000 max auto-action (Recommended)</option>
                <option value={5000000}>₹50,000 max auto-action (High)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-text-secondary font-semibold">Customer Contact Ceiling (24h)</label>
              <select
                value={maxContacts}
                onChange={(e) => setMaxContacts(parseInt(e.target.value))}
                className="w-full bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 text-slate-900 dark:text-text-primary font-mono text-xs"
              >
                <option value={1}>1 Message / 24h (Conservative)</option>
                <option value={2}>2 Messages / 24h (Standard)</option>
                <option value={3}>3 Messages / 24h (Ceiling)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 6. Projected Policy Impact Banner */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-elevated/70 border border-slate-200/80 dark:border-border-subtle space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase text-[10px] tracking-wider text-slate-900 dark:text-text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand" /> Projected Policy Impact (Demo Stream)
            </span>
            <span className="font-mono text-[10px] text-slate-400">Zero AI Hallucination</span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div>
              <span className="text-slate-400 text-[10px] block">Eligible Cases</span>
              <span className="font-bold text-slate-900 dark:text-text-primary font-mono text-sm">{impact.eligibleCasesCount} cases</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Expected Yield</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">{formatCurrency(impact.expectedRecoverablePaise)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Policy Guarded</span>
              <span className="font-bold text-amber-600 font-mono text-sm">{impact.blockedCasesCount} cases</span>
            </div>
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={merchantProfile.currentRole === "VIEWER"}
            className="px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold shadow-sm transition-all flex items-center gap-1.5 text-xs active:scale-[0.98] disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Save Policy Changes
          </button>
        </div>

      </form>

      {/* 7. Razorpay API Gateway Credentials (Preserved) */}
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-border-subtle">
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
              Razorpay API Connectivity
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
            Connected (Test Mode)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-500 dark:text-text-muted font-medium">Key ID</label>
            <div className="mt-1 flex rounded-lg shadow-sm">
              <input 
                readOnly 
                value="rzp_test_99x81k2la100" 
                className="w-full bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-l-lg px-3 py-2 font-mono text-slate-800 dark:text-text-primary"
              />
              <button 
                type="button"
                onClick={() => copyToClipboard("rzp_test_99x81k2la100", "key")}
                className="bg-slate-100 dark:bg-surface-elevated border border-l-0 border-slate-200 dark:border-border-subtle rounded-r-lg px-3 hover:bg-slate-200 dark:hover:bg-surface transition-colors flex items-center justify-center text-slate-600 dark:text-text-secondary"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-500 dark:text-text-muted font-medium">Key Secret</label>
            <input 
              disabled 
              type="password" 
              value="••••••••••••••••••••••••" 
              className="mt-1 w-full bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 font-mono text-slate-800 dark:text-text-primary"
            />
          </div>
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
