"use client";

import React, { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { useReclaim } from "@/lib/context/ReclaimContext";
import { CampaignConfig, CampaignType } from "@/lib/campaigns/types";
import { evaluateCampaignEligibility } from "@/lib/campaigns/campaignService";
import { FailureType } from "@/lib/types";
import { CommunicationChannel } from "@/lib/communications/types";
import { formatCurrency, cn } from "@/lib/utils";
import { Sparkles, ShieldCheck, AlertTriangle, Play, Lock, CheckCircle2, ChevronRight } from "lucide-react";

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_FAILURE_TYPES: FailureType[] = [
  "UPI Timeout",
  "Card Decline",
  "Insufficient Funds",
  "Bank Downtime",
  "Checkout Abandonment",
  "Subscription Failure",
  "Overdue Invoice"
];

export function NewCampaignModal({ isOpen, onClose }: NewCampaignModalProps) {
  const { cases, createCampaign } = useReclaim();

  const [name, setName] = useState("High-Yield Payment Recovery Cohort");
  const [type, setType] = useState<CampaignType>("PAYMENT_RECOVERY");
  const [description, setDescription] = useState("Targeted multi-step autonomous recovery on high-probability gateway timeouts.");
  const [selectedFailures, setSelectedFailures] = useState<FailureType[]>(["UPI Timeout", "Bank Downtime"]);
  const [minProbability, setMinProbability] = useState(0.35);
  const [maxInterventions, setMaxInterventions] = useState(2);
  const [allowedChannels, setAllowedChannels] = useState<CommunicationChannel[]>(["whatsapp", "sms"]);
  const [preferredLanguage, setPreferredLanguage] = useState<"English" | "Hinglish">("Hinglish");
  const [operatingWindow, setOperatingWindow] = useState("09:00 - 21:00 IST");

  // Dynamic preview evaluation
  const previewConfig: CampaignConfig = useMemo(() => ({
    id: `CMP-${Date.now().toString().slice(-3)}`,
    name,
    type,
    description,
    eligibleFailureTypes: selectedFailures,
    minProbability,
    maxInterventionsPerCase: maxInterventions,
    allowedChannels,
    preferredLanguage,
    operatingWindow,
    escalationRule: "Escalate after max automated interventions",
    stoppingRules: ["Customer contact cap (2/2)", "Fraud Radar > 70%"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }), [name, type, description, selectedFailures, minProbability, maxInterventions, allowedChannels, preferredLanguage, operatingWindow]);

  const eligibilityPreview = useMemo(() => {
    return evaluateCampaignEligibility(cases, previewConfig);
  }, [cases, previewConfig]);

  const toggleFailure = (f: FailureType) => {
    setSelectedFailures((prev) => 
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const toggleChannel = (ch: CommunicationChannel) => {
    setAllowedChannels((prev) =>
      prev.includes(ch) ? prev.filter((x) => x !== ch) : [...prev, ch]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaign(previewConfig);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Autonomous Recovery Campaign"
      description="Configure target failure cohort, deterministic policy thresholds, and allowed communication channels."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        
        {/* 1. Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-text-secondary">Campaign Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-border-subtle bg-slate-50 dark:bg-surface-elevated text-slate-900 dark:text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-text-secondary">Recovery Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CampaignType)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-border-subtle bg-slate-50 dark:bg-surface-elevated text-slate-900 dark:text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="PAYMENT_RECOVERY">Payment Recovery (Gateways)</option>
              <option value="CHECKOUT_ABANDONMENT">Checkout Abandonment (Cart Drops)</option>
              <option value="SUBSCRIPTION_RECOVERY">Subscription Recovery (E-Mandates)</option>
              <option value="RECEIVABLES_RECOVERY">Receivables Recovery (B2B Invoices)</option>
            </select>
          </div>
        </div>

        {/* 2. Failure Types Multi-Select */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 dark:text-text-secondary block">
            Target Failure Types
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_FAILURE_TYPES.map((f) => {
              const isSelected = selectedFailures.includes(f);
              return (
                <button
                  type="button"
                  key={f}
                  onClick={() => toggleFailure(f)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors",
                    isSelected
                      ? "bg-brand text-white border-brand shadow-xs"
                      : "bg-slate-50 dark:bg-surface-elevated text-slate-600 dark:text-text-muted border-slate-200 dark:border-border-subtle"
                  )}
                >
                  {isSelected ? "✓ " : ""}{f}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Channels & Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-text-secondary block">
              Allowed Channels
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(["whatsapp", "sms", "email", "in_app"] as CommunicationChannel[]).map((ch) => {
                const isSelected = allowedChannels.includes(ch);
                return (
                  <button
                    type="button"
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className={cn(
                      "px-2 py-1 rounded text-[11px] font-semibold uppercase font-mono border transition-colors",
                      isSelected
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-slate-50 dark:bg-surface-elevated text-slate-500 border-slate-200 dark:border-border-subtle"
                    )}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-text-secondary">Message Tone / Language</label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-border-subtle bg-slate-50 dark:bg-surface-elevated text-slate-900 dark:text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="Hinglish">Personalized Hinglish (Higher Indian Conversion)</option>
              <option value="English">Standard English</option>
            </select>
          </div>
        </div>

        {/* 4. Thresholds & Bounds */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex justify-between font-semibold text-slate-700 dark:text-text-secondary">
              <span>Min Probability</span>
              <span>{Math.round(minProbability * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={minProbability}
              onChange={(e) => setMinProbability(parseFloat(e.target.value))}
              className="w-full accent-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-text-secondary">Max Attempts</label>
            <select
              value={maxInterventions}
              onChange={(e) => setMaxInterventions(parseInt(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-border-subtle bg-slate-50 dark:bg-surface-elevated text-slate-900 dark:text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value={1}>1 Attempt (Conservative)</option>
              <option value={2}>2 Attempts (Standard)</option>
              <option value={3}>3 Attempts (Aggressive Ceiling)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-text-secondary">Operating Window</label>
            <select
              value={operatingWindow}
              onChange={(e) => setOperatingWindow(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-border-subtle bg-slate-50 dark:bg-surface-elevated text-slate-900 dark:text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="24/7 Realtime">24/7 Realtime (Gateways)</option>
              <option value="09:00 - 21:00 IST">09:00 - 21:00 IST (Customer Hours)</option>
              <option value="04:00 - 08:00 IST Batch">04:00 - 08:00 IST (Settlement Batch)</option>
            </select>
          </div>
        </div>

        {/* 5. Live Deterministic Eligibility & Revenue Preview Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-elevated/70 border border-slate-200/80 dark:border-border-subtle space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-border-subtle">
            <span className="font-bold text-slate-900 dark:text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand" /> Live Cohort Preview (Evaluated on Current Pool)
            </span>
            <span className="font-mono text-[10px] text-slate-400">Zero AI Hallucination</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">Eligible Cases</span>
              <span className="font-bold text-slate-900 dark:text-text-primary font-mono text-sm">{eligibilityPreview.eligibleCases.length} cases</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Revenue at Risk</span>
              <span className="font-bold text-slate-900 dark:text-text-primary font-mono text-sm">{formatCurrency(eligibilityPreview.totalAtRisk)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Est. Recoverable</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">{formatCurrency(eligibilityPreview.estimatedRecoverable)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Policy Excluded</span>
              <span className="font-bold text-amber-600 font-mono text-sm">{eligibilityPreview.blockedByPolicy.length} cases</span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-border-subtle text-slate-700 dark:text-text-secondary hover:bg-slate-50 dark:hover:bg-surface-elevated font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold shadow-sm transition-all active:scale-[0.98]"
          >
            Save & Activate Campaign
          </button>
        </div>

      </form>
    </Modal>
  );
}
