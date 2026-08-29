"use client";

import React, { useMemo } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { RecoveryTrendChart, FailureTypeChart } from "@/components/Charts";
import { 
  BarChart3, 
  TrendingUp, 
  Layers, 
  CreditCard, 
  Smartphone, 
  MessageSquare,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Filter,
  RotateCcw
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useReclaim } from "@/lib/context/ReclaimContext";

const BANK_PERFORMANCE = [
  { bank: "HDFC Bank UPI", success: "91.2%", avgLatency: "1.4s", riskIndex: "Low" },
  { bank: "State Bank of India", success: "68.4%", avgLatency: "3.8s", riskIndex: "Medium" },
  { bank: "ICICI Bank Cards", success: "84.5%", avgLatency: "1.9s", riskIndex: "Low" },
  { bank: "Axis Bank Netbanking", success: "79.0%", avgLatency: "2.1s", riskIndex: "Low" },
];

export default function AnalyticsPage() {
  const { cases, metrics, resetDemoData } = useReclaim();

  // Dynamic failure type distribution
  const chartFailureData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach((c) => {
      counts[c.failureType] = (counts[c.failureType] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        share: `${Math.round((count / cases.length) * 100)}%`,
      }))
      .sort((a, b) => b.count - a.count);
  }, [cases]);

  // Dynamic channel performance computed from cases
  const channelPerformance = useMemo(() => {
    let retryVol = 0, retryRec = 0, retryVal = 0;
    let smsVol = 0, smsRec = 0, smsVal = 0;
    let waVol = 0, waRec = 0, waVal = 0;

    cases.forEach((c) => {
      const isRecovered = c.status === "recovered";
      const val = isRecovered ? (c.resolutionDetails?.recoveredAmount || c.amount) : 0;

      if (c.strategy.includes("Retry") || c.paymentMethod === "UPI" || c.paymentMethod === "Subscription Mandate") {
        retryVol++;
        if (isRecovered) { retryRec++; retryVal += val; }
      } else if (c.strategy.includes("SMS") || c.paymentMethod === "Netbanking") {
        smsVol++;
        if (isRecovered) { smsRec++; smsVal += val; }
      } else {
        waVol++;
        if (isRecovered) { waRec++; waVal += val; }
      }
    });

    return [
      { 
        channel: "Autonomous Razorpay Retry", 
        volume: retryVol, 
        recovered: retryRec, 
        successRate: retryVol > 0 ? `${Math.round((retryRec / retryVol) * 100)}%` : "0%", 
        value: retryVal, 
        icon: CreditCard, 
        color: "text-brand" 
      },
      { 
        channel: "Hinglish SMS Payment Link", 
        volume: smsVol, 
        recovered: smsRec, 
        successRate: smsVol > 0 ? `${Math.round((smsRec / smsVol) * 100)}%` : "0%", 
        value: smsVal, 
        icon: Smartphone, 
        color: "text-emerald-500" 
      },
      { 
        channel: "WhatsApp Conversational Link", 
        volume: waVol, 
        recovered: waRec, 
        successRate: waVol > 0 ? `${Math.round((waRec / waVol) * 100)}%` : "0%", 
        value: waVal, 
        icon: MessageSquare, 
        color: "text-amber-500" 
      },
    ];
  }, [cases]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-text-primary">
              Analytics & Insights
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-surface-elevated text-slate-700 dark:text-text-secondary border border-slate-200 dark:border-border-subtle">
              Live Cohorts ({cases.length} cases)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-text-muted mt-1 font-normal">
            Multi-dimensional recovery efficiency across payment methods, channels, and issuing gateways
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={resetDemoData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-lg hover:bg-slate-50 dark:hover:bg-surface-elevated transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Demo
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-lg hover:bg-slate-50 dark:hover:bg-surface-elevated transition-colors shadow-sm">
            <Calendar className="w-3.5 h-3.5" /> Live Stream (24h)
          </button>
        </div>
      </div>

      {/* 2. Analytical KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Gross Recovery Yield"
          value={formatCurrency(metrics.revenueRecovered)}
          trend="+18.2%"
          trendUp={true}
          valueClassName="text-status-recovered"
          subtitle={`${metrics.recoveredCount} cases settled`}
        />
        <MetricCard
          title="Mean Time to Recover"
          value="18.4m"
          trend="4.2m faster"
          trendUp={true}
          subtitle="From failure event to successful capture"
        />
        <MetricCard
          title="Channel Efficiency"
          value={`${metrics.recoveryRate}%`}
          trend="+3.1%"
          trendUp={true}
          subtitle="Intervention resolution rate"
        />
        <MetricCard
          title="Bank Uptime Index"
          value="98.2%"
          subtitle="Gateway node reliability score"
        />
      </div>

      {/* 3. Deep Dive Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                Recovery Trajectory
              </h3>
              <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                Intraday throughput of recovered vs attempted revenue
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Live Cycle</span>
          </div>
          <RecoveryTrendChart />
        </div>

        <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
              Failure Root Causes
            </h3>
            <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
              Breakdown by issuing bank error code
            </p>
          </div>
          <FailureTypeChart data={chartFailureData} />
        </div>
      </div>

      {/* 4. Intervention Channel Performance Table */}
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 sm:px-6 border-b border-slate-200/80 dark:border-border-subtle flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
              Intervention Channel Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
              Effectiveness of each autonomous recovery modality in the live stream
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-border-subtle bg-slate-50/75 dark:bg-surface-elevated/75 text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Recovery Channel</th>
                <th className="py-3.5 px-4">Cases Triggered</th>
                <th className="py-3.5 px-4">Recovered</th>
                <th className="py-3.5 px-4">Conversion</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Value Captured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border-subtle text-xs">
              {channelPerformance.map((row) => (
                <tr key={row.channel} className="hover:bg-slate-50/80 dark:hover:bg-surface-elevated/30 transition-colors">
                  <td className="py-4 px-4 sm:px-6 font-medium text-slate-900 dark:text-text-primary flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-surface-elevated flex items-center justify-center flex-shrink-0">
                      <row.icon className={`w-3.5 h-3.5 ${row.color}`} />
                    </div>
                    <span>{row.channel}</span>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-700 dark:text-text-secondary">{row.volume}</td>
                  <td className="py-4 px-4 font-mono font-medium text-emerald-600 dark:text-emerald-400">{row.recovered}</td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                      {row.successRate}
                    </span>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right font-semibold text-slate-900 dark:text-text-primary tabular-nums">
                    {formatCurrency(row.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Gateway & Issuing Bank Health */}
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
              Gateway & Issuing Bank Reliability Index
            </h3>
            <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
              Live network telemetry used by AI to determine optimal retry delays
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> All Gateways Healthy
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BANK_PERFORMANCE.map((bank) => (
            <div key={bank.bank} className="p-4 rounded-lg bg-slate-50 dark:bg-surface-elevated border border-slate-200/80 dark:border-border-subtle">
              <div className="text-xs font-semibold text-slate-900 dark:text-text-primary truncate">
                {bank.bank}
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xl font-bold tabular-nums text-slate-900 dark:text-text-primary">
                  {bank.success}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                  {bank.riskIndex} Risk
                </span>
              </div>
              <div className="mt-1.5 text-[11px] text-slate-500 dark:text-text-muted">
                Latency: <span className="font-mono">{bank.avgLatency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
