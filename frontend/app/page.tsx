"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { MetricCard } from "@/components/ui/MetricCard";
import { RecoveryTrendChart, FailureTypeChart } from "@/components/Charts";
import { RecoveryFunnel } from "@/components/RecoveryFunnel";
import { PrioritizedOpportunities } from "@/components/PrioritizedOpportunities";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProbabilityMeter } from "@/components/ui/ProbabilityMeter";
import { CaseDrawer } from "@/components/CaseDrawer";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatCurrency, cn } from "@/lib/utils";
import { useReclaim } from "@/lib/context/ReclaimContext";
import { 
  calculateRecoveryFunnel, 
  calculateFailureTypeAnalysis, 
  calculateInterventionPerformance, 
  calculatePaymentMethodAnalysis, 
  calculateCaseSizeDistribution, 
  calculatePrioritizedOpportunities, 
  generateMerchantInsights 
} from "@/lib/metrics/metricsService";
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
  TrendingUp,
  History,
  ExternalLink,
  Info,
  SlidersHorizontal,
  Layers,
  ArrowRight
} from "lucide-react";

export default function CommandCenter() {
  const { cases, auditEvents, metrics, resetDemoData } = useReclaim();
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [trendWindow, setTrendWindow] = useState<"24h" | "7d" | "30d" | "90d">("24h");

  // Deterministic calculations derived strictly from the live dataset
  const funnelStages = useMemo(() => calculateRecoveryFunnel(cases), [cases]);
  const failureAnalysis = useMemo(() => calculateFailureTypeAnalysis(cases), [cases]);
  const interventionAnalysis = useMemo(() => calculateInterventionPerformance(cases), [cases]);
  const paymentMethodAnalysis = useMemo(() => calculatePaymentMethodAnalysis(cases), [cases]);
  const caseSizeDistribution = useMemo(() => calculateCaseSizeDistribution(cases), [cases]);
  const prioritizedOpportunities = useMemo(() => calculatePrioritizedOpportunities(cases), [cases]);
  const merchantInsights = useMemo(() => generateMerchantInsights(cases), [cases]);

  // Compute dynamic chart data from live metrics and selected trend window
  const chartTrendData = useMemo(() => {
    const recoveredRupees = Math.round(metrics.revenueRecovered / 100);
    const atRiskRupees = Math.round(metrics.revenueAtRisk / 100);

    if (trendWindow === "7d") {
      return [
        { time: "Mon", recovered: Math.round(recoveredRupees * 0.35), atRisk: Math.round(atRiskRupees * 0.5) },
        { time: "Tue", recovered: Math.round(recoveredRupees * 0.48), atRisk: Math.round(atRiskRupees * 0.62) },
        { time: "Wed", recovered: Math.round(recoveredRupees * 0.60), atRisk: Math.round(atRiskRupees * 0.75) },
        { time: "Thu", recovered: Math.round(recoveredRupees * 0.72), atRisk: Math.round(atRiskRupees * 0.85) },
        { time: "Fri", recovered: Math.round(recoveredRupees * 0.85), atRisk: Math.round(atRiskRupees * 0.92) },
        { time: "Sat", recovered: Math.round(recoveredRupees * 0.94), atRisk: Math.round(atRiskRupees * 0.98) },
        { time: "Today", recovered: recoveredRupees, atRisk: atRiskRupees },
      ];
    }

    if (trendWindow === "30d") {
      return [
        { time: "Week 1", recovered: Math.round(recoveredRupees * 0.22), atRisk: Math.round(atRiskRupees * 0.40) },
        { time: "Week 2", recovered: Math.round(recoveredRupees * 0.50), atRisk: Math.round(atRiskRupees * 0.68) },
        { time: "Week 3", recovered: Math.round(recoveredRupees * 0.78), atRisk: Math.round(atRiskRupees * 0.86) },
        { time: "Week 4", recovered: recoveredRupees, atRisk: atRiskRupees },
      ];
    }

    if (trendWindow === "90d") {
      return [
        { time: "Month 1", recovered: Math.round(recoveredRupees * 0.28), atRisk: Math.round(atRiskRupees * 0.45) },
        { time: "Month 2", recovered: Math.round(recoveredRupees * 0.65), atRisk: Math.round(atRiskRupees * 0.80) },
        { time: "Month 3", recovered: recoveredRupees, atRisk: atRiskRupees },
      ];
    }

    // Default 24h Intraday Window
    return [
      { time: "00:00", recovered: Math.round(recoveredRupees * 0.15), atRisk: Math.round(atRiskRupees * 0.3) },
      { time: "04:00", recovered: Math.round(recoveredRupees * 0.25), atRisk: Math.round(atRiskRupees * 0.45) },
      { time: "08:00", recovered: Math.round(recoveredRupees * 0.45), atRisk: Math.round(atRiskRupees * 0.65) },
      { time: "12:00", recovered: Math.round(recoveredRupees * 0.70), atRisk: Math.round(atRiskRupees * 0.85) },
      { time: "16:00", recovered: Math.round(recoveredRupees * 0.85), atRisk: Math.round(atRiskRupees * 0.95) },
      { time: "20:00", recovered: Math.round(recoveredRupees * 0.95), atRisk: atRiskRupees },
      { time: "Now", recovered: recoveredRupees, atRisk: atRiskRupees },
    ];
  }, [metrics.revenueRecovered, metrics.revenueAtRisk, trendWindow]);

  const chartFailureData = useMemo(() => {
    return failureAnalysis.map(f => ({
      name: f.name,
      count: f.casesCount,
      share: `${f.shareOfAtRisk}%`,
    }));
  }, [failureAnalysis]);

  const handleRowClick = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsDrawerOpen(true);
  };

  // Derived Recent Activity Stream from live state
  const recentActivities = useMemo(() => {
    return auditEvents.slice(0, 4);
  }, [auditEvents]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-text-primary">
              Revenue Recovery Command Center
            </h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Agent Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-text-muted mt-1 font-normal">
            Autonomous decision engine monitoring live Razorpay payment streams with deterministic policy controls
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetDemoData}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-text-secondary hover:text-brand bg-white dark:bg-surface px-3 py-1.5 rounded-lg border border-slate-200 dark:border-border-subtle shadow-sm transition-colors"
            title="Reset dataset to default demo state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-text-muted">
            <Clock className="w-3.5 h-3.5" />
            <span>Last evaluated: Just now</span>
          </div>
        </div>
      </div>

      {/* 2. Dominant Financial Story KPI Cards (Money First) */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">Key Financial Indicators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <MetricCard
            title="Revenue At Risk"
            value={formatCurrency(metrics.revenueAtRisk)}
            valueClassName="text-rose-600 dark:text-rose-400"
            subtitle={`Detected across ${metrics.activeAtRiskCount} active cases`}
            badge="Live Stream"
            tooltip="Total volume of failed transactions in the live stream currently eligible for recovery."
          />
          <MetricCard
            title="Revenue Recovered"
            value={formatCurrency(metrics.revenueRecovered)}
            trend="+14.2%"
            trendUp={true}
            valueClassName="text-emerald-600 dark:text-emerald-400"
            subtitle={`${metrics.recoveredCount} cases settled • avg ${formatCurrency(metrics.averageRecoveredAmount)}`}
            badge="Razorpay Test"
            tooltip="Verified transaction volume captured through autonomous retry and multi-channel links."
          />
          <MetricCard
            title="Recovery Rate"
            value={`${metrics.recoveryRate}%`}
            trend="+2.1%"
            trendUp={true}
            subtitle={`Across ${metrics.recoveredCount + metrics.escalatedCount + metrics.stoppedCount} terminal cases`}
            badge="Observed Rate"
            tooltip="Percentage of eligible recovery cases successfully recovered."
          />
          <MetricCard
            title="Unrecovered Revenue"
            value={formatCurrency(metrics.unrecoveredRevenue)}
            subtitle={`${metrics.activeAtRiskCount + metrics.inProgressCount} cases awaiting intervention`}
            badge="Actionable"
            tooltip="Eligible revenue that remains unresolved and actively monitored by the decision engine."
          />
        </div>
      </section>

      {/* 3. Dataset-Backed Merchant Insights Banner */}
      {merchantInsights.length > 0 && (
        <section className="bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 dark:from-surface dark:via-surface-elevated/40 dark:to-surface border border-indigo-100 dark:border-border-subtle rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-brand" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-text-secondary">
              Merchant Revenue Intelligence
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-text-muted font-mono">
              (Live Dataset Observations)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {merchantInsights.map((insight) => (
              <div 
                key={insight.id}
                className="p-3 rounded-lg bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-text-primary mb-1">
                    <span className="truncate pr-2">{insight.title}</span>
                    {insight.metricHighlight && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-muted/30 text-brand whitespace-nowrap">
                        {insight.metricHighlight}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-text-muted leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. End-to-End Recovery Funnel */}
      <section>
        <RecoveryFunnel stages={funnelStages} />
      </section>

      {/* 5. Visualizations Section (Recovery Trend + Failure Root Causes) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Primary Chart: Recovery Performance & Time Horizon */}
        <div className="lg:col-span-2 bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                  Recovery Throughput & Exposure Trend
                </h3>
                <span className="text-xs text-slate-400 dark:text-text-muted font-normal">
                  (Recovered vs At-Risk)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                Observed recovery velocity relative to baseline incoming transaction failure exposure
              </p>
            </div>

            {/* Time Window Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-surface-elevated p-1 rounded-lg border border-slate-200/60 dark:border-border-subtle self-start sm:self-auto">
              {(["24h", "7d", "30d", "90d"] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setTrendWindow(w)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                    trendWindow === w 
                      ? "bg-white dark:bg-surface text-brand shadow-sm" 
                      : "text-slate-500 dark:text-text-muted hover:text-slate-900 dark:hover:text-text-primary"
                  )}
                >
                  {w.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <RecoveryTrendChart data={chartTrendData} />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-text-muted">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Recovered: <strong>{formatCurrency(metrics.revenueRecovered)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>At Risk: <strong>{formatCurrency(metrics.revenueAtRisk)}</strong></span>
              </div>
            </div>
            <div>
              Avg Time to Recovery: <strong>{metrics.averageTimeToRecoveryMin} min</strong> (Median: {metrics.medianTimeToRecoveryMin} min)
            </div>
          </div>
        </div>

        {/* Secondary Chart: Failure Causes Breakdown */}
        <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                Failure Root Causes
              </h3>
              <Link 
                href="/at-risk" 
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
              >
                Explorer <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
              Volume distribution across active failure modes
            </p>
          </div>

          <div className="mt-4">
            <FailureTypeChart data={chartFailureData} />
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-border-subtle text-[11px] text-slate-500 dark:text-text-muted">
            Click any failure category in Case Explorer to filter active interventions.
          </div>
        </div>

      </section>

      {/* 6. Deep Financial Breakdown: Failure Types & Intervention Performance */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Table 1: Revenue Lost by Failure Type */}
        <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-border-subtle flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                Revenue Lost by Failure Type
              </h3>
              <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                Where merchant revenue is being lost across gateways
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500">
              {failureAnalysis.length} Categories
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-border-subtle bg-slate-50/75 dark:bg-surface-elevated/75 text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
                  <th className="py-2.5 px-4">Failure Type</th>
                  <th className="py-2.5 px-3 text-right">Cases</th>
                  <th className="py-2.5 px-3 text-right">At Risk</th>
                  <th className="py-2.5 px-3 text-right">Recovered</th>
                  <th className="py-2.5 px-4 text-right">Recovery Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border-subtle text-xs">
                {failureAnalysis.map((f) => (
                  <tr key={f.name} className="hover:bg-slate-50/80 dark:hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-text-primary">
                      <Link 
                        href={`/at-risk?failure=${encodeURIComponent(f.name)}`}
                        className="hover:text-brand hover:underline inline-flex items-center gap-1"
                      >
                        {f.name}
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-text-secondary font-mono">
                      {f.casesCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-text-primary tabular-nums">
                      {formatCurrency(f.revenueAtRisk)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(f.recoveredAmount)}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        f.observedRecoveryRate >= 70 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                        f.observedRecoveryRate >= 40 ? "bg-indigo-50 text-indigo-700 dark:bg-brand-muted dark:text-brand" :
                        "bg-slate-100 text-slate-600 dark:bg-surface-elevated dark:text-text-muted"
                      )}>
                        {f.observedRecoveryRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Intervention Performance */}
        <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-border-subtle flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                Intervention Performance
              </h3>
              <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                Observed recovery rate by synthesized recovery strategy
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500">
              {interventionAnalysis.length} Strategies
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-border-subtle bg-slate-50/75 dark:bg-surface-elevated/75 text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
                  <th className="py-2.5 px-4">Intervention</th>
                  <th className="py-2.5 px-3 text-right">Cases</th>
                  <th className="py-2.5 px-3 text-right">Recovered Vol.</th>
                  <th className="py-2.5 px-4 text-right">Observed Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border-subtle text-xs">
                {interventionAnalysis.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50/80 dark:hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-text-primary">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-text-secondary font-mono">
                      {item.casesCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(item.recoveredRevenue)}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        item.observedRecoveryRate >= 70 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                        item.observedRecoveryRate >= 40 ? "bg-indigo-50 text-indigo-700 dark:bg-brand-muted dark:text-brand" :
                        "bg-slate-100 text-slate-600 dark:bg-surface-elevated dark:text-text-muted"
                      )}>
                        {item.observedRecoveryRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </section>

      {/* 7. Highest Recovery Opportunities (Prioritized Queue) */}
      <section>
        <PrioritizedOpportunities 
          opportunities={prioritizedOpportunities} 
          onSelectCase={handleRowClick} 
        />
      </section>

      {/* 8. Live Recovery Activity Stream Banner */}
      <section className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-border-subtle">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
              Live Recovery Stream Activity
            </h3>
          </div>
          <Link href="/audit" className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1">
            Full Audit Ledger <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
          {recentActivities.map((act) => {
            const isSuccess = act.event.includes("SUCCEEDED") || act.event.includes("RESOLVED") || act.event.includes("APPROVED");
            const isBlocked = act.event.includes("BLOCKED") || act.event.includes("FAILED");
            const isTimeout = act.event.includes("TIMEOUT") || act.event.includes("ESCALATED");

            return (
              <div 
                key={act.id} 
                className="p-3 rounded-lg bg-slate-50 dark:bg-surface-elevated/60 border border-slate-200/60 dark:border-border-subtle space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.2 rounded uppercase",
                    isSuccess ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                    isBlocked ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" :
                    isTimeout ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" :
                    "bg-slate-200 text-slate-700 dark:bg-surface dark:text-text-secondary"
                  )}>
                    {act.layer}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{act.timestamp}</span>
                </div>
                <div className="font-semibold text-slate-900 dark:text-text-primary truncate">
                  {act.case} • {act.event}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-text-muted line-clamp-2 leading-snug">
                  {act.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. System Health & Infrastructure Status */}
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
