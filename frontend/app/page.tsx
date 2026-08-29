import React from "react";
import Link from "next/link";
import { MetricCard } from "@/components/ui/MetricCard";
import { RecoveryTrendChart, FailureTypeChart } from "@/components/Charts";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProbabilityMeter } from "@/components/ui/ProbabilityMeter";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  ArrowUpRight, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ChevronRight
} from "lucide-react";

const RECENT_CASES = [
  { id: "RC-2024-081", customer: "Priya S.", failure: "UPI Timeout", amount: 849900, probability: 0.81, status: "recovered", recovered: 849900, time: "10m ago" },
  { id: "RC-2024-082", customer: "Rahul M.", failure: "Card Decline", amount: 1250000, probability: 0.35, status: "inProgress", recovered: 0, time: "25m ago" },
  { id: "RC-2024-083", customer: "Anita K.", failure: "Insufficient Funds", amount: 450000, probability: 0.45, status: "escalated", recovered: 0, time: "1h ago" },
  { id: "RC-2024-084", customer: "Vikram B.", failure: "Checkout Abandonment", amount: 1899900, probability: 0.30, status: "recovered", recovered: 1899900, time: "2h ago" },
  { id: "RC-2024-085", customer: "Neha T.", failure: "Bank Downtime", amount: 350000, probability: 0.80, status: "recovered", recovered: 350000, time: "3h ago" },
];

export default function CommandCenter() {
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
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-text-muted">
          <Clock className="w-3.5 h-3.5" />
          <span>Last evaluated: Just now</span>
        </div>
      </div>

      {/* 2. Dominant KPI Cards Grid */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <MetricCard
            title="Money at Risk"
            value="₹25,00,000"
            valueClassName="text-status-atRisk"
            subtitle="Detected in the last 24h across 225 cases"
            badge="Live Stream"
          />
          <MetricCard
            title="Money Recovered"
            value="₹7,43,200"
            trend="12.5%"
            trendUp={true}
            valueClassName="text-status-recovered"
            subtitle="Captured via autonomous actions"
            badge="Razorpay"
          />
          <MetricCard
            title="Recovery Rate"
            value="67.4%"
            trend="2.1%"
            trendUp={true}
            subtitle="Across all recoverable payment types"
            badge="High Precision"
          />
          <MetricCard
            title="Cases Resolved"
            value="152 / 225"
            subtitle="68% completed without escalation"
            badge="Automated"
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
              <select className="text-xs font-medium bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle text-slate-700 dark:text-text-secondary rounded-lg px-2.5 py-1.5 cursor-pointer outline-none hover:bg-slate-100 transition-colors">
                <option>Today</option>
                <option>Last 7 days</option>
                <option>This month</option>
              </select>
            </div>
          </div>
          <RecoveryTrendChart />
        </div>

        {/* Secondary Chart: Failure Types */}
        <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                Cases by Failure Type
              </h3>
              <span className="text-xs font-medium text-slate-500 dark:text-text-muted">
                Last 24h
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
              Distribution of root causes
            </p>
          </div>
          <FailureTypeChart />
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
              Latest payment events processed by the LangGraph triage pipeline
            </p>
          </div>
          <Link 
            href="/at-risk" 
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover transition-colors"
          >
            View all 225 cases <ChevronRight className="w-3.5 h-3.5" />
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
              {RECENT_CASES.map((row) => (
                <tr 
                  key={row.id} 
                  className="hover:bg-slate-50/80 dark:hover:bg-surface-elevated/40 transition-colors group cursor-pointer"
                >
                  <td className="py-3.5 px-4 sm:px-6 font-mono font-medium text-slate-900 dark:text-text-primary group-hover:text-brand transition-colors">
                    <Link href={`/cases/${row.id}`} className="flex items-center gap-1.5">
                      {row.id}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-brand" />
                    </Link>
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
                    <ProbabilityMeter probability={row.probability} />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={row.status as any} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right text-slate-400 dark:text-text-muted whitespace-nowrap">
                    {row.time}
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
              { name: "Risk Scorer", status: "Operational", ping: "12ms" },
              { name: "Recovery Agent", status: "Active", ping: "45ms" },
              { name: "Policy Guardrails", status: "Deterministic", ping: "100% pass" },
              { name: "Razorpay Test API", status: "Connected", ping: "Live" },
              { name: "Audit Trail Ledger", status: "Synced", ping: "99k events" },
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

    </div>
  );
}

