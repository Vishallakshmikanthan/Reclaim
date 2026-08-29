"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useReclaim } from "@/lib/context/ReclaimContext";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  Building, 
  Sliders, 
  ShieldCheck, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Lock,
  ArrowRight
} from "lucide-react";
import { simulatePolicyImpact } from "@/lib/merchant/policySimulator";
import { MerchantPolicy } from "@/lib/merchant/types";

interface MerchantOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MerchantOnboardingModal({ isOpen, onClose }: MerchantOnboardingModalProps) {
  const { 
    merchantProfile, 
    updateMerchantProfile, 
    activePolicy, 
    updatePolicy, 
    cases 
  } = useReclaim();

  const [step, setStep] = useState(1);

  // Form local state
  const [businessName, setBusinessName] = useState(merchantProfile.businessName);
  const [industry, setIndustry] = useState(merchantProfile.industry);
  
  // Recovery preferences
  const [autoRecovery, setAutoRecovery] = useState(activePolicy.recoverySettings.automaticRecoveryEnabled);
  const [paymentRetry, setPaymentRetry] = useState(activePolicy.recoverySettings.paymentRetryEnabled);
  const [paymentLink, setPaymentLink] = useState(activePolicy.recoverySettings.paymentLinkEnabled);
  const [subscriptionRecovery, setSubscriptionRecovery] = useState(activePolicy.recoverySettings.subscriptionRecoveryEnabled);
  
  // Safety guardrails
  const [maxRetries, setMaxRetries] = useState(activePolicy.retryRules.maxRetries);
  const [minProb, setMinProb] = useState(activePolicy.retryRules.minRecoveryProbability);
  const [maxAmountPaise, setMaxAmountPaise] = useState(activePolicy.retryRules.maxAutonomousAmountPaise);

  // Communication
  const [preferredLang, setPreferredLang] = useState<"Hinglish" | "English">(activePolicy.communicationRules.preferredLanguage);
  const [maxContacts, setMaxContacts] = useState(activePolicy.communicationRules.maxContacts24h);

  // Simulated draft policy
  const draftPolicy: MerchantPolicy = {
    ...activePolicy,
    recoverySettings: {
      ...activePolicy.recoverySettings,
      automaticRecoveryEnabled: autoRecovery,
      paymentRetryEnabled: paymentRetry,
      paymentLinkEnabled: paymentLink,
      subscriptionRecoveryEnabled: subscriptionRecovery,
    },
    retryRules: {
      ...activePolicy.retryRules,
      maxRetries,
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

  const handleFinish = () => {
    updateMerchantProfile({ businessName, industry });
    updatePolicy(draftPolicy, "Onboarding setup completed with customized recovery preferences");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Merchant Onboarding & Recovery Setup"
      description="Configure your business profile, safety guardrails, and autonomous recovery preferences."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 text-xs">
        
        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-border-subtle">
          <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider text-slate-400">
            <span>Step {step} of 5</span>
            <span>•</span>
            <span className="text-brand">
              {step === 1 && "Business Profile"}
              {step === 2 && "Recovery Workflows"}
              {step === 3 && "Safety Guardrails"}
              {step === 4 && "Communication Tone"}
              {step === 5 && "Review & Activation"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-5 h-1.5 rounded-full transition-all",
                  step >= i ? "bg-brand" : "bg-slate-200 dark:bg-surface-elevated"
                )}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: BUSINESS PROFILE */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface-elevated border border-slate-200/80 dark:border-border-subtle flex items-start gap-2.5">
              <Building className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 dark:text-text-primary block">Merchant Entity</span>
                <p className="text-[11px] text-slate-500 dark:text-text-muted mt-0.5">
                  Set your trading entity and default Indian settlement parameters.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-text-secondary">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-border-subtle bg-white dark:bg-surface text-slate-900 dark:text-text-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-text-secondary">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-border-subtle bg-white dark:bg-surface text-slate-900 dark:text-text-primary"
                >
                  <option value="E-Commerce & Digital Goods">E-Commerce & Digital Goods</option>
                  <option value="SaaS & Subscriptions">SaaS & Subscriptions</option>
                  <option value="EdTech & Online Courses">EdTech & Online Courses</option>
                  <option value="B2B Wholesale & Logistics">B2B Wholesale & Logistics</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] text-slate-500 font-mono">
              <div>Currency: <strong>INR (₹)</strong></div>
              <div>Timezone: <strong>Asia/Kolkata (IST)</strong></div>
            </div>
          </div>
        )}

        {/* STEP 2: RECOVERY PREFERENCES */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-brand/5 dark:bg-brand-muted/20 border border-brand/20">
              <div>
                <span className="font-bold text-slate-900 dark:text-text-primary text-xs block">
                  Autonomous Recovery Engine (Master Switch)
                </span>
                <p className="text-[11px] text-slate-600 dark:text-text-secondary mt-0.5">
                  When enabled, policy-approved interventions execute automatically.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoRecovery}
                onChange={(e) => setAutoRecovery(e.target.checked)}
                className="w-4 h-4 accent-brand"
              />
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-700 dark:text-text-secondary block text-[10px] uppercase">
                Active Intervention Channels
              </span>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-border-subtle bg-slate-50/50 dark:bg-surface-elevated/40">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-text-primary block">Instant Gateway Retry</span>
                  <span className="text-[10px] text-slate-400">NPCI / Bank downtime retries</span>
                </div>
                <input type="checkbox" checked={paymentRetry} onChange={(e) => setPaymentRetry(e.target.checked)} className="accent-brand" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-border-subtle bg-slate-50/50 dark:bg-surface-elevated/40">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-text-primary block">1-Click Payment Links</span>
                  <span className="text-[10px] text-slate-400">WhatsApp & SMS checkout drops</span>
                </div>
                <input type="checkbox" checked={paymentLink} onChange={(e) => setPaymentLink(e.target.checked)} className="accent-brand" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-border-subtle bg-slate-50/50 dark:bg-surface-elevated/40">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-text-primary block">Subscription Mandate Dunning</span>
                  <span className="text-[10px] text-slate-400">Recurring auto-debit windows</span>
                </div>
                <input type="checkbox" checked={subscriptionRecovery} onChange={(e) => setSubscriptionRecovery(e.target.checked)} className="accent-brand" />
              </label>
            </div>
          </div>
        )}

        {/* STEP 3: SAFETY GUARDRAILS */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface-elevated border border-slate-200/80 dark:border-border-subtle flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 dark:text-text-primary block">Layer 3 Guardrail Limits</span>
                <p className="text-[11px] text-slate-500 dark:text-text-muted mt-0.5">
                  Deterministic thresholds that no AI decision can bypass.
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
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
              </div>

              <div className="space-y-1">
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
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-text-secondary">Autonomous Action Ceiling</label>
                <select
                  value={maxAmountPaise}
                  onChange={(e) => setMaxAmountPaise(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-border-subtle bg-white dark:bg-surface text-slate-900 dark:text-text-primary font-mono"
                >
                  <option value={1000000}>₹10,000 max auto-action</option>
                  <option value={2500000}>₹25,000 max auto-action (Recommended)</option>
                  <option value={5000000}>₹50,000 max auto-action (Aggressive)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: COMMUNICATION TONE */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface-elevated border border-slate-200/80 dark:border-border-subtle flex items-start gap-2.5">
              <MessageSquare className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 dark:text-text-primary block">Communication & Anti-Spam Guard</span>
                <p className="text-[11px] text-slate-500 dark:text-text-muted mt-0.5">
                  Protect brand reputation and avoid customer message fatigue.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-text-secondary">Tone / Language</label>
                <select
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-border-subtle bg-white dark:bg-surface text-slate-900 dark:text-text-primary"
                >
                  <option value="Hinglish">Personalized Hinglish (Recommended)</option>
                  <option value="English">Standard English</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-text-secondary">Max Contacts per Customer (24h)</label>
                <select
                  value={maxContacts}
                  onChange={(e) => setMaxContacts(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-border-subtle bg-white dark:bg-surface text-slate-900 dark:text-text-primary font-mono"
                >
                  <option value={1}>1 Message in 24h (Conservative)</option>
                  <option value={2}>2 Messages in 24h (Optimal)</option>
                  <option value={3}>3 Messages in 24h (Maximum)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & ACTIVATION */}
        {step === 5 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-400 uppercase text-[10px]">
                <Sparkles className="w-3.5 h-3.5" /> Projected Policy Impact on Active Stream
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-500 text-[10px] block">Eligible Cases</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-text-primary text-sm">{impact.eligibleCasesCount} cases</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Potential Recovery</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(impact.expectedRecoverablePaise)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Policy Guarded</span>
                  <span className="font-mono font-bold text-amber-600 text-sm">{impact.blockedCasesCount} cases</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-border-subtle bg-slate-50 dark:bg-surface-elevated text-[11px] space-y-1">
              <div className="font-bold text-slate-900 dark:text-text-primary">Policy Summary (v2 Preview):</div>
              <div className="text-slate-600 dark:text-text-secondary">
                Auto-Recovery: <strong>{autoRecovery ? "ON" : "OFF"}</strong> • Max Retries: <strong>{maxRetries}</strong> • Value Cap: <strong>{formatCurrency(maxAmountPaise)}</strong> • Contacts Cap: <strong>{maxContacts}/24h</strong>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-border-subtle">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-border-subtle text-slate-700 dark:text-text-secondary hover:bg-slate-50 font-medium transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-slate-400 hover:text-slate-600 text-xs font-medium"
            >
              Skip Onboarding
            </button>
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold shadow-xs transition-all flex items-center gap-1 active:scale-[0.98]"
            >
              Next Step <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-all flex items-center gap-1 active:scale-[0.98]"
            >
              Activate Policy & Complete <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </Modal>
  );
}
