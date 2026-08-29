import React from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { RecoveryTrendChart, FailureTypeChart } from "@/components/Charts";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, cn } from "@/lib/utils";

const RECENT_CASES = [
  { id: "RC-2024-081", customer: "Priya S.", failure: "UPI Timeout", amount: 849900, probability: 0.81, status: "recovered", recovered: 849900, time: "10 mins ago" },
  { id: "RC-2024-082", customer: "Rahul M.", failure: "Card Decline", amount: 1250000, probability: 0.35, status: "inProgress", recovered: 0, time: "25 mins ago" },
  { id: "RC-2024-083", customer: "Anita K.", failure: "Insufficient Funds", amount: 450000, probability: 0.45, status: "escalated", recovered: 0, time: "1 hour ago" },
  { id: "RC-2024-084", customer: "Vikram B.", failure: "Checkout Abandonment", amount: 1899900, probability: 0.30, status: "recovered", recovered: 1899900, time: "2 hours ago" },
  { id: "RC-2024-085", customer: "Neha T.", failure: "Bank Downtime", amount: 350000, probability: 0.80, status: "recovered", recovered: 350000, time: "3 hours ago" },
];

export default function CommandCenter() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-text-primary tracking-tight">Revenue Recovery</h1>
          <p className="text-sm text-slate-500 dark:text-text-muted mt-1">Your recovery command center</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Agent Active
          </span>
          <span className="text-xs text-slate-500 dark:text-text-muted border border-slate-200 dark:border-border-subtle px-2.5 py-1 rounded-md">
            Last updated: Just now
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Revenue at Risk"
          value="₹25,00,000"
          valueClassName="text-status-atRisk"
          subtitle="Detected in last 24h"
        />
        <MetricCard
          title="Revenue Recovered"
          value="₹7,43,200"
          trend="12.5%"
          trendUp={true}
          valueClassName="text-status-recovered"
          subtitle="Successfully captured"
        />
        <MetricCard
          title="Recovery Rate"
          value="67.4%"
          trend="2.1%"
          trendUp={true}
          subtitle="Across all failure types"
        />
        <MetricCard
          title="Cases Resolved"
          value="152 / 225"
          subtitle="68% resolution rate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 dark:text-text-primary">Recovery Performance</h3>
            <select className="text-sm bg-slate-50 dark:bg-surface-elevated border-none text-slate-600 dark:text-text-secondary rounded-md py-1 cursor-pointer outline-none">
              <option>Today</option>
              <option>Last 7 days</option>
              <option>This month</option>
            </select>
          </div>
          <RecoveryTrendChart />
        </div>

        <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 dark:text-text-primary">Cases by Failure Type</h3>
          <FailureTypeChart />
        </div>
      </div>

      <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-200 dark:border-border-subtle flex justify-between items-center">
          <h3 className="text-base font-semibold text-slate-900 dark:text-text-primary">Recent Recovery Activity</h3>
          <button className="text-sm text-brand font-medium hover:text-brand-hover">View all cases &rarr;</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-text-muted bg-slate-50 dark:bg-surface-elevated border-b border-slate-200 dark:border-border-subtle">
              <tr>
                <th className="px-6 py-3 font-medium">Case ID</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Failure</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Probability</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border-subtle">
              {RECENT_CASES.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-surface-highlight/50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-text-primary group-hover:text-brand transition-colors">{row.id}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-text-secondary">{row.customer}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-text-secondary">{row.failure}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-text-primary">{formatCurrency(row.amount)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 dark:bg-surface-elevated rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full", row.probability > 0.6 ? "bg-status-recovered" : row.probability > 0.3 ? "bg-status-inProgress" : "bg-status-atRisk")} 
                          style={{ width: `${row.probability * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-text-muted">{Math.round(row.probability * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={row.status as any} /></td>
                  <td className="px-6 py-4 text-right text-slate-500 dark:text-text-muted whitespace-nowrap">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8 border-t border-slate-200 dark:border-border-subtle pt-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary mb-4">System Health</h3>
        <div className="flex flex-wrap gap-6">
          {["Risk Engine", "Recovery Agent", "Policy Engine", "Razorpay Executor", "Audit Trail"].map((sys) => (
            <div key={sys} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-slate-600 dark:text-text-secondary font-medium">{sys}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
