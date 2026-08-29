"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { MetricCard } from "@/components/ui/MetricCard";
import { RecoveryTrendChart, FailureTypeChart } from "@/components/Charts";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProbabilityMeter } from "@/components/ui/ProbabilityMeter";
import { CaseDrawer } from "@/components/CaseDrawer";
import { formatCurrency, cn } from "@/lib/utils";
import { useReclaim } from "@/lib/context/ReclaimContext";
import { Case } from "@/lib/types";
import { 
  ArrowUpRight, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ChevronRight,
  RotateCcw,
  Zap,
  Play
} from "lucide-react";

export default function CommandCenter() {
  const { cases, metrics, resetDemoData } = useReclaim();
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Compute dynamic chart data from live cases dataset
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

  const chartTrendData = useMemo(() => {
    // Dynamic cumulative recovered vs at risk points
    const recoveredRupees = Math.round(metrics.revenueRecovered / 100);
    const atRiskRupees = Math.round(metrics.revenueAtRisk / 100);
    
    return [
      { time: "00:00", recovered: Math.round(recoveredRupees * 0.15), atRisk: Math.round(atRiskRupees * 0.3) },
      { time: "04:00", recovered: Math.round(recoveredRupees * 0.25), atRisk: Math.round(atRiskRupees * 0.45) },
      { time: "08:00", recovered: Math.round(recoveredRupees * 0.45), atRisk: Math.round(atRiskRupees * 0.65) },
      { time: "12:00", recovered: Math.round(recoveredRupees * 0.70), atRisk: Math.round(atRiskRupees * 0.85) },
      { time: "16:00", recovered: Math.round(recoveredRupees * 0.85), atRisk: Math.round(atRiskRupees * 0.95) },
      { time: "20:00", recovered: Math.round(recoveredRupees * 0.95), atRisk: atRiskRupees },
      { time: "Now", recovered: recoveredRupees, atRisk: atRiskRupees },
    ];
  }, [metrics.revenueRecovered, metrics.revenueAtRisk]);

  const handleRowClick = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsDrawerOpen(true);
  };

  const recentCases = useMemo(() => {
    return cases.slice(0, 6);
  }, [cases]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-text-primary">
              Revenue Recovery
            </h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Agent Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-text-muted mt-1 font-normal">
            Autonomous decision engine monitoring live Razorpay payment streams
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetDemoData}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-text-secondary hover:text-brand bg-white dark:bg-surface px-3 py-1.5 rounded-lg border border-slate-200 dark:border-border-subtle shadow-sm transition-colors"
            title="Reset dataset to default demo state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-text-muted">
            <Clock className="w-3.5 h-3.5" />
            <span>Last evaluated: Just now</span>
          </div>
        </div>
      </div>

      {/* 2. Dominant KPI Cards Grid */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <MetricCard
            title="Money at Risk"
            value={formatCurrency(metrics.revenueAtRisk)}
            valueClassName="text-status-atRisk"
            subtitle={`Detected across ${metrics.activeAtRiskCount} active cases`}
            badge="Live Stream"
            tooltip="Total volume of failed transactions in the live stream currently eligible for recovery"
          />
          <MetricCard
            title="Money Recovered"
            value={formatCurrency(metrics.revenueRecovered)}
            trend="+12.5%"
            trendUp={true}
            valueClassName="text-status-recovered"
            subtitle={`${metrics.recoveredCount} cases successfully recovered`}
            badge="Razorpay"
            tooltip="Gross transaction volume captured through autonomous retry and multi-channel links"
          />
          <MetricCard
            title="Recovery Rate"
            value={`${metrics.recoveryRate}%`}
            trend="+2.1%"
            trendUp={true}
            subtitle="Across all recoverable payment types"
            badge="High Precision"
            tooltip="Percentage of recoverable failed transactions successfully captured"
          />
          <MetricCard
            title="Cases Resolved"
            value={metrics.casesResolvedRatio}
            subtitle={`${Math.round((metrics.casesResolvedCount / metrics.totalCasesCount) * 100)}% resolved without breach`}
            badge="Automated"
            tooltip="Proportion of cases brought to resolution through bounded autonomous action or safe escalation"
          />
        </div>
      </section>

      {/* 3. Visualizations Section (2/3 + 1/3 layout) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Chart: Recovery Performance */}
        <div className="lg:col-span-2 bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                  Recovery Performance
                </h3>
                <span className="text-xs text-slate-400 dark:text-text-muted font-normal">
                  (Recovered vs At-Risk)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                Intraday cumulative recovery trajectory in INR
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-text-muted mr-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-status-recovered" /> Recovered
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-status-atRisk" /> At Risk
                </span>
              </div>
              <select 
                aria-label="Select timeframe"
                className="text-xs font-medium bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle text-slate-700 dark:text-text-secondary rounded-lg px-2.5 py-1.5 cursor-pointer outline-none hover:bg-slate-100 transition-colors"
              >
                <option>Today (Live)</option>
                <option>Last 7 days</option>
                <option>This month</option>
              </select>
            </div>
          </div>
          <RecoveryTrendChart data={chartTrendData} />
        </div>

        {/* Secondary Chart: Failure Types */}
        <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                Cases by Failure Type
              </h3>
              <span className="text-xs font-medium text-slate-500 dark:text-text-muted">
                {cases.length} Total Cases
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
              Distribution of root causes
            </p>
          </div>
          <FailureTypeChart data={chartFailureData} />
        </div>
      </section>

      {/* 4. Recent Activity / Cases Requiring Attention */}
      <section className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 sm:px-6 border-b border-slate-200/80 dark:border-border-subtle flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
              Recent Recovery Activity
            </h3>
            <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
              Latest payment events processed by the RECLAIM triage pipeline (Click row to inspect & execute)
            </p>
          </div>
          <Link 
            href="/at-risk" 
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover transition-colors"
          >
            View all {cases.length} cases <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-border-subtle bg-slate-50/75 dark:bg-surface-elevated/75 text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Case ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Failure Reason</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Recovery Prob</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border-subtle text-xs">
              {recentCases.map((row) => (
                <tr 
                  key={row.id} 
                  onClick={() => handleRowClick(row)}
                  className="hover:bg-slate-50/80 dark:hover:bg-surface-elevated/40 transition-colors group cursor-pointer"
                >
                  <td className="py-3.5 px-4 sm:px-6 font-mono font-medium text-slate-900 dark:text-text-primary group-hover:text-brand transition-colors">
                    <div className="flex items-center gap-1.5">
                      {row.id}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-brand" />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-text-primary">
                    {row.customer}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-text-secondary">
                    {row.failure}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-text-primary tabular-nums text-right">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className="py-3.5 px-4">
                    <ProbabilityMeter probability={row.prob} />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={row.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right text-slate-400 dark:text-text-muted whitespace-nowrap">
                    {row.age}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. System Health & Infrastructure Status */}
      <section className="bg-slate-50/50 dark:bg-surface/50 border border-slate-200/80 dark:border-border-subtle rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-slate-900 dark:text-text-primary uppercase tracking-wider">
              System Architecture & Health
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            {[
              { name: "Layer 0 Ingest", status: "Operational", ping: "8ms" },
              { name: "Layer 1 ML Scorer", status: "Active", ping: "15ms" },
              { name: "Layer 2 AI Decision", status: "Operational", ping: "420ms" },
              { name: "Layer 3 Policy Engine", status: "Deterministic", ping: "100% pass" },
              { name: "Layer 4 Razorpay Test API", status: "Connected", ping: "Live" },
              { name: "Layer 5 Audit Ledger", status: "Synced", ping: "Immutable" },
            ].map((sys) => (
              <div key={sys.name} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-700 dark:text-text-secondary font-medium">
                  {sys.name}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-text-muted font-mono">
                  ({sys.ping})
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Drawer */}
      <CaseDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        caseItem={selectedCase}
      />
    </div>
  );
}
