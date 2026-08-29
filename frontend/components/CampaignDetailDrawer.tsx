"use client";

import React from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Campaign } from "@/lib/campaigns/types";
import { formatCurrency, cn } from "@/lib/utils";
import { useReclaim } from "@/lib/context/ReclaimContext";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldAlert, 
  Activity, 
  Sparkles,
  Layers,
  StopCircle,
  Megaphone,
  Smartphone,
  Mail,
  MessageSquare
} from "lucide-react";

interface CampaignDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
}

export function CampaignDetailDrawer({ isOpen, onClose, campaign }: CampaignDetailDrawerProps) {
  const { runCampaignBatch, toggleCampaignStatus } = useReclaim();

  if (!campaign) return null;

  const isRunning = campaign.status === "RUNNING";
  const isCompleted = campaign.status === "COMPLETED";
  const isPaused = campaign.status === "PAUSED";

  const handleRun = async () => {
    await runCampaignBatch(campaign.id);
  };

  const handleToggle = () => {
    toggleCampaignStatus(campaign.id);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={campaign.config.name}
      subtitle={`Campaign ${campaign.id} • ${campaign.config.type.replace("_", " ")}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-6 text-xs">
        
        {/* 1. Header Scorecard */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-elevated border border-slate-200/80 dark:border-border-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
              {isCompleted ? "Recovered Revenue" : "Revenue at Risk"}
            </span>
            <div className={cn(
              "text-2xl sm:text-3xl font-black tabular-nums mt-0.5",
              isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-text-primary"
            )}>
              {formatCurrency(isCompleted ? campaign.stats.revenueRecovered : campaign.stats.revenueAtRisk)}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className={cn(
              "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider",
              campaign.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200" :
              campaign.status === "RUNNING" ? "bg-indigo-50 text-indigo-700 dark:bg-brand-muted dark:text-brand border border-indigo-200 animate-pulse" :
              campaign.status === "PAUSED" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200" :
              "bg-slate-100 text-slate-700 dark:bg-surface-elevated dark:text-text-secondary"
            )}>
              {campaign.status}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Window: {campaign.config.operatingWindow}
            </span>
          </div>
        </div>

        {/* 2. Batch Execution Controls */}
        <div className="flex items-center gap-2.5">
          {!isCompleted && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold transition-all shadow-sm active:scale-[0.98] disabled:opacity-70"
            >
              {isRunning ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Campaign Batch</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleToggle}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border-subtle bg-white dark:bg-surface text-slate-700 dark:text-text-secondary font-semibold hover:bg-slate-50 dark:hover:bg-surface-elevated transition-colors"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>

        {/* 3. Performance Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-elevated/70 border border-slate-100 dark:border-border-subtle">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Processed</span>
            <span className="font-bold text-slate-900 dark:text-text-primary text-sm font-mono">
              {campaign.stats.processedCases} / {campaign.stats.totalEligibleCases}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-elevated/70 border border-slate-100 dark:border-border-subtle">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Recovered</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">
              {campaign.stats.recoveredCases} cases
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-elevated/70 border border-slate-100 dark:border-border-subtle">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Policy Blocks</span>
            <span className="font-bold text-amber-600 text-sm font-mono">
              {campaign.stats.policyBlocks} blocks
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-elevated/70 border border-slate-100 dark:border-border-subtle">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Comms Sent</span>
            <span className="font-bold text-slate-900 dark:text-text-primary text-sm font-mono">
              {campaign.stats.communicationsSent}
            </span>
          </div>
        </div>

        {/* 4. Configuration Details */}
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-border-subtle space-y-2.5">
          <span className="font-bold text-slate-900 dark:text-text-primary uppercase text-[10px] tracking-wider block">
            Campaign Workflow Rules
          </span>
          <div className="space-y-1.5 text-slate-600 dark:text-text-secondary">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Failures</span>
              <span className="font-medium text-slate-800 dark:text-text-primary">{campaign.config.eligibleFailureTypes.join(", ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Allowed Channels</span>
              <span className="font-mono uppercase font-semibold text-emerald-600">{campaign.config.allowedChannels.join(" • ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tone of Voice</span>
              <span className="font-semibold text-brand">{campaign.config.preferredLanguage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Min Probability Floor</span>
              <span className="font-mono font-bold">{Math.round(campaign.config.minProbability * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Stopping Rule</span>
              <span className="text-slate-800 dark:text-text-primary">{campaign.config.stoppingRules.join(" | ")}</span>
            </div>
          </div>
        </div>

        {/* 5. Live Activity Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-border-subtle">
            <span className="font-bold text-slate-900 dark:text-text-primary uppercase text-[10px] tracking-wider">
              Live Campaign Activity
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {campaign.recentActivity.length} Events Logged
            </span>
          </div>

          {campaign.recentActivity.length === 0 ? (
            <div className="text-center py-6 text-slate-400 bg-slate-50 dark:bg-surface-elevated/40 rounded-xl border border-dashed border-slate-200 dark:border-border-subtle">
              No activity recorded yet. Click &quot;Execute Campaign Batch&quot; to start.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {campaign.recentActivity.map((act) => (
                <div key={act.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-surface-elevated/60 border border-slate-100 dark:border-border-subtle flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        act.status === "SUCCESS" ? "bg-emerald-500" :
                        act.status === "BLOCKED" ? "bg-rose-500" :
                        "bg-amber-500"
                      )} />
                      <strong className="text-slate-900 dark:text-text-primary">{act.customerName}</strong>
                      <span className="font-mono text-slate-400 text-[10px]">({act.caseId})</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-text-secondary mt-0.5">{act.detail}</p>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 flex-shrink-0">{act.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Drawer>
  );
}
