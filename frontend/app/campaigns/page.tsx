"use client";

import React, { useState } from "react";
import { 
  Megaphone, 
  Plus, 
  Play, 
  Pause, 
  ArrowUpRight, 
  Clock, 
  Users, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Activity,
  ShieldCheck,
  TrendingUp,
  Filter
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useReclaim } from "@/lib/context/ReclaimContext";
import { Campaign } from "@/lib/campaigns/types";
import { NewCampaignModal } from "@/components/NewCampaignModal";
import { CampaignDetailDrawer } from "@/components/CampaignDetailDrawer";

export default function CampaignsPage() {
  const { toast } = useToast();
  const { campaigns, runCampaignBatch, toggleCampaignStatus } = useReclaim();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Aggregate metrics across live campaigns
  const totalRecoveredPaise = campaigns.reduce((acc, c) => acc + c.stats.revenueRecovered, 0);
  const totalProcessedCases = campaigns.reduce((acc, c) => acc + c.stats.processedCases, 0);
  const activeCount = campaigns.filter(c => c.status === "RUNNING" || c.status === "READY").length;

  const handleOpenDetail = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDetailDrawerOpen(true);
  };

  const handleExecute = async (e: React.MouseEvent, campaignId: string) => {
    e.stopPropagation();
    await runCampaignBatch(campaignId);
  };

  const handleToggle = (e: React.MouseEvent, campaignId: string) => {
    e.stopPropagation();
    toggleCampaignStatus(campaignId);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-text-primary">
              Recovery Campaigns
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
              {activeCount} Active Workflows
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-text-muted mt-1 font-normal">
            Automated cohort recovery workflows bounded by deterministic policy guardrails
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-hover rounded-lg transition-all shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>
      </div>

      {/* 2. Top Metric Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white dark:bg-surface p-5 rounded-xl border border-slate-200/80 dark:border-border-subtle shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider block">
              Campaign Revenue Recovered
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {formatCurrency(totalRecoveredPaise)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Across all active batches</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-surface p-5 rounded-xl border border-slate-200/80 dark:border-border-subtle shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider block">
              Total Processed Incidents
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-text-primary font-mono mt-1">
              {totalProcessedCases} cases
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Independently policy validated</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-brand-muted/40 flex items-center justify-center text-brand">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-surface p-5 rounded-xl border border-slate-200/80 dark:border-border-subtle shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider block">
              Policy Compliance
            </span>
            <div className="text-2xl sm:text-3xl font-black text-brand font-mono mt-1">
              100%
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">0 unapproved actions</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-brand-muted/40 flex items-center justify-center text-brand">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 3. Campaign Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-text-primary">
            Active & Configured Campaigns
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {campaigns.length} Configured
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {campaigns.map((c) => {
            const isRunning = c.status === "RUNNING";
            const isCompleted = c.status === "COMPLETED";
            const isPaused = c.status === "PAUSED";

            return (
              <div 
                key={c.id}
                onClick={() => handleOpenDetail(c)}
                className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-4 relative group"
              >
                {/* Top Row: Name & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-surface-elevated px-1.5 py-0.5 rounded">
                        {c.id}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-text-primary group-hover:text-brand transition-colors">
                        {c.config.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-text-muted mt-1 leading-relaxed line-clamp-2">
                      {c.config.description}
                    </p>
                  </div>

                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0",
                    isCompleted ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200" :
                    isRunning ? "bg-indigo-50 text-indigo-700 dark:bg-brand-muted dark:text-brand border border-indigo-200 animate-pulse" :
                    isPaused ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200" :
                    "bg-slate-100 text-slate-700 dark:bg-surface-elevated dark:text-text-secondary"
                  )}>
                    {c.status}
                  </span>
                </div>

                {/* Progress / Cohort Specs */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500 dark:text-text-muted">Execution Progress</span>
                    <span className="font-mono text-slate-900 dark:text-text-primary">
                      {c.stats.processedCases} / {c.stats.totalEligibleCases} cases processed
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-surface-elevated rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-brand h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (c.stats.processedCases / Math.max(1, c.stats.totalEligibleCases)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-border-subtle text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Revenue at Risk</span>
                    <span className="font-bold text-slate-800 dark:text-text-primary font-mono">{formatCurrency(c.stats.revenueAtRisk)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Recovered</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(c.stats.revenueRecovered)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Channels</span>
                    <span className="font-mono text-[10px] uppercase text-slate-600 dark:text-text-secondary">{c.config.allowedChannels.join(", ")}</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-semibold text-brand flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    View Campaign Details <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {!isCompleted && (
                      <button
                        onClick={(e) => handleExecute(e, c.id)}
                        disabled={isRunning}
                        className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {isRunning ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        {isRunning ? "Running..." : "Execute Batch"}
                      </button>
                    )}
                    <button
                      onClick={(e) => handleToggle(e, c.id)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-border-subtle bg-white dark:bg-surface text-slate-600 hover:bg-slate-50 dark:hover:bg-surface-elevated transition-colors"
                      title={isPaused ? "Resume" : "Pause"}
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Modals & Drawers */}
      <NewCampaignModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />

      <CampaignDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        campaign={selectedCampaign}
      />

    </div>
  );
}
