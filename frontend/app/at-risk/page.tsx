"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { ProbabilityMeter } from "@/components/ui/ProbabilityMeter";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";

const CASES = [
  { id: "RC-2024-001", customer: "Priya S.", failure: "UPI Timeout", amount: 849900, prob: 0.81, expected: 688400, status: "inProgress", age: "12m", action: "Retry" },
  { id: "RC-2024-002", customer: "Rahul M.", failure: "Card Decline", amount: 1250000, prob: 0.35, expected: 437500, status: "escalated", age: "25m", action: "Review" },
  { id: "RC-2024-003", customer: "Anita K.", failure: "Insufficient Funds", amount: 450000, prob: 0.45, expected: 202500, status: "atRisk", age: "1h", action: "Nudge" },
  { id: "RC-2024-004", customer: "Vikram B.", failure: "Checkout Abandonment", amount: 1899900, prob: 0.30, expected: 569900, status: "recovered", age: "2h", action: "View" },
  { id: "RC-2024-005", customer: "Neha T.", failure: "Bank Downtime", amount: 350000, prob: 0.80, expected: 280000, status: "recovered", age: "3h", action: "View" },
  { id: "RC-2024-006", customer: "Arjun D.", failure: "Fraud Signal", amount: 5500000, prob: 0.02, expected: 110000, status: "stopped", age: "4h", action: "Review" },
  { id: "RC-2024-007", customer: "Sanjay R.", failure: "UPI Timeout", amount: 120000, prob: 0.75, expected: 90000, status: "inProgress", age: "4h", action: "Retry" },
];

const TABS = ["All", "High Priority", "Recovery Ready", "Human Review", "Escalated", "Stopped", "Recovered"];

export default function AtRiskPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-text-primary tracking-tight">At Risk</h1>
          <p className="text-sm text-slate-500 dark:text-text-muted mt-1">Revenue requiring recovery attention</p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-xl shadow-sm flex flex-col h-[calc(100vh-12rem)]">
        
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-border-subtle flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search case ID, customer..." 
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-canvas border border-slate-200 dark:border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-brand text-slate-900 dark:text-text-primary placeholder:text-slate-400 transition-colors"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-text-secondary bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-md hover:bg-slate-100 dark:hover:bg-surface-highlight transition-colors">
              <Filter className="w-4 h-4" /> Filters
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-text-secondary bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-md hover:bg-slate-100 dark:hover:bg-surface-highlight transition-colors">
              <SlidersHorizontal className="w-4 h-4" /> Views
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-border-subtle hide-scrollbar">
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                idx === 0 
                  ? "border-brand text-brand" 
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-text-muted dark:hover:text-text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left relative">
            <thead className="text-xs text-slate-500 dark:text-text-muted bg-slate-50/80 dark:bg-surface-elevated/80 sticky top-0 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-border-subtle shadow-sm">
              <tr>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1 cursor-pointer hover:text-slate-800 dark:hover:text-text-primary">Case <ArrowUpDown className="w-3 h-3"/></div></th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Failure</th>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1 cursor-pointer hover:text-slate-800 dark:hover:text-text-primary">Amount <ArrowUpDown className="w-3 h-3"/></div></th>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1 cursor-pointer hover:text-slate-800 dark:hover:text-text-primary">Recovery Prob <ArrowUpDown className="w-3 h-3"/></div></th>
                <th className="px-6 py-4 font-medium">Expected</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Age</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border-subtle">
              {CASES.map((row) => (
                <tr 
                  key={row.id} 
                  onClick={() => router.push(`/cases/${row.id}`)}
                  className="hover:bg-slate-50 dark:hover:bg-surface-highlight/40 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-text-primary group-hover:text-brand transition-colors">{row.id}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-text-secondary">{row.customer}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-text-secondary">{row.failure}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-text-primary tabular-nums">{formatCurrency(row.amount)}</td>
                  <td className="px-6 py-4"><ProbabilityMeter probability={row.prob} /></td>
                  <td className="px-6 py-4 text-slate-500 dark:text-text-muted tabular-nums">{formatCurrency(row.expected)}</td>
                  <td className="px-6 py-4"><StatusBadge status={row.status as any} /></td>
                  <td className="px-6 py-4 text-slate-500 dark:text-text-muted">{row.age}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-brand font-medium hover:text-brand-hover text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      {row.action} &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
