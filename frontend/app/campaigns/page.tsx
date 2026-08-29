"use client";

import React, { useState } from "react";
import { Megaphone, Plus, Play, Pause, ArrowUpRight, Clock, Users, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

const INITIAL_CAMPAIGNS = [
  {
    id: "CMP-001",
    name: "VIP Checkout Abandonment Recovery",
    segment: "Cart value > ₹5,000",
    channel: "WhatsApp & Dynamic Link",
    status: "Active",
    recovered: 420000,
    conversion: "64.2%",
    cases: 48,
  },
  {
    id: "CMP-002",
    name: "Temporary Bank Outage Re-engagement",
    segment: "HDFC & SBI Timeout errors",
    channel: "Automated Delayed Retry (45m)",
    status: "Active",
    recovered: 285000,
    conversion: "78.5%",
    cases: 92,
  },
  {
    id: "CMP-003",
    name: "Card Decline Second-Chance Nudge",
    segment: "Insufficient Funds / 3DS drop",
    channel: "Hinglish SMS + UPI QR Link",
    status: "Paused",
    recovered: 135000,
    conversion: "42.0%",
    cases: 31,
  },
];

export default function CampaignsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS);

  const toggleCampaign = (id: string) => {
    setCampaigns((prev) => 
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === "Active" ? "Paused" : "Active";
          toast({
            title: nextStatus === "Active" ? "Campaign Resumed" : "Campaign Paused",
            description: `${c.name} is now ${nextStatus.toLowerCase()}.`,
            type: nextStatus === "Active" ? "success" : "info"
          });
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const handleNewCampaign = () => {
    toast({
      title: "Campaign Creator",
      description: "Opening target cohort definition builder...",
      type: "info"
    });
  };

  const activeCount = campaigns.filter(c => c.status === "Active").length;

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
              {activeCount} Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-text-muted mt-1 font-normal">
            Automated cohort recovery workflows and targeted merchant intervention policies
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleNewCampaign}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-hover rounded-lg transition-all shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>
      </div>

      {/* 2. Active Campaigns Cards */}
      <div className="space-y-4">
        {campaigns.map((cmp) => (
          <div 
            key={cmp.id}
            className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-slate-400 dark:text-text-muted font-semibold">{cmp.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  cmp.status === "Active" 
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40" 
                    : "bg-slate-100 text-slate-600 dark:bg-surface-elevated dark:text-text-muted"
                }`}>
                  {cmp.status}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-text-primary">
                {cmp.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-text-muted">
                Segment: <strong className="text-slate-700 dark:text-text-secondary">{cmp.segment}</strong> • Channel: <span className="text-brand font-medium">{cmp.channel}</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 sm:gap-8 border-t md:border-t-0 md:border-l border-slate-100 dark:border-border-subtle pt-4 md:pt-0 md:pl-8">
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400 dark:text-text-muted">Recovered</span>
                <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                  {formatCurrency(cmp.recovered)}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400 dark:text-text-muted">Conversion</span>
                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-text-primary tabular-nums mt-0.5">
                  {cmp.conversion}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400 dark:text-text-muted">Cases</span>
                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-text-primary tabular-nums mt-0.5">
                  {cmp.cases}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              {cmp.status === "Active" ? (
                <button 
                  onClick={() => toggleCampaign(cmp.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-surface-elevated transition-colors active:scale-[0.95]" 
                  title="Pause Campaign"
                >
                  <Pause className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={() => toggleCampaign(cmp.id)}
                  className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-surface-elevated transition-colors active:scale-[0.95]" 
                  title="Resume Campaign"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}


