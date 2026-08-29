"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  ArrowUpDown, 
  ArrowRight,
  AlertTriangle,
  Download,
  RefreshCw,
  Clock
} from "lucide-react";
import { ProbabilityMeter } from "@/components/ui/ProbabilityMeter";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";

const CASES = [
  { id: "RC-2024-001", customer: "Priya S.", failure: "UPI Timeout", amount: 849900, prob: 0.81, expected: 688400, status: "inProgress", age: "12m", action: "Execute Retry" },
  { id: "RC-2024-002", customer: "Rahul M.", failure: "Card Decline", amount: 1250000, prob: 0.35, expected: 437500, status: "escalated", age: "25m", action: "Review Plan" },
  { id: "RC-2024-003", customer: "Anita K.", failure: "Insufficient Funds", amount: 450000, prob: 0.45, expected: 202500, status: "atRisk", age: "1h", action: "Send Nudge" },
  { id: "RC-2024-004", customer: "Vikram B.", failure: "Checkout Abandonment", amount: 1899900, prob: 0.30, expected: 569900, status: "recovered", age: "2h", action: "View Case" },
  { id: "RC-2024-005", customer: "Neha T.", failure: "Bank Downtime", amount: 350000, prob: 0.80, expected: 280000, status: "recovered", age: "3h", action: "View Case" },
  { id: "RC-2024-006", customer: "Arjun D.", failure: "Fraud Signal", amount: 5500000, prob: 0.02, expected: 110000, status: "stopped", age: "4h", action: "Policy Audit" },
  { id: "RC-2024-007", customer: "Sanjay R.", failure: "UPI Timeout", amount: 120000, prob: 0.75, expected: 90000, status: "inProgress", age: "4h", action: "Execute Retry" },
];

const TABS = [
  { name: "All Cases", count: "225" },
  { name: "High Priority", count: "14" },
  { name: "Recovery Ready", count: "28" },
  { name: "Human Review", count: "8" },
  { name: "Escalated", count: "12" },
  { name: "Stopped", count: "5" },
  { name: "Recovered", count: "158" },
];

export default function AtRiskPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All Cases");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCases = CASES.filter((c) => 
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.failure.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-text-primary">
              At-Risk Cases
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
              ₹25.0L at risk
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-text-muted mt-1 font-normal">
            Operational triage workspace for failed payments and intervention pipelines
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-lg hover:bg-slate-50 dark:hover:bg-surface-elevated transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-lg hover:bg-slate-50 dark:hover:bg-surface-elevated transition-colors shadow-sm">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* 2. Main Workspace Container */}
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[580px]">
        
        {/* Controls Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200/80 dark:border-border-subtle bg-slate-50/50 dark:bg-surface flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by Case ID, Customer, or Failure reason..." 
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-canvas border border-slate-200 dark:border-border-subtle rounded-lg focus:outline-none focus:ring-1 focus:ring-brand text-slate-900 dark:text-text-primary placeholder:text-slate-400 transition-colors shadow-sm"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-lg hover:bg-slate-50 dark:hover:bg-surface-elevated transition-colors shadow-sm whitespace-nowrap">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> Filters
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500 dark:text-text-muted">
            <span>Showing <strong>{filteredCases.length}</strong> of <strong>225</strong> cases</span>
          </div>
        </div>

        {/* Operational Filter Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface px-4 gap-1">
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isSelected
                    ? "border-brand text-brand font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-text-muted dark:hover:text-text-primary"
                }`}
              >
                <span>{tab.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected 
                    ? "bg-brand/10 text-brand dark:bg-brand-muted" 
                    : "bg-slate-100 dark:bg-surface-elevated text-slate-500"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Operational Case Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-border-subtle bg-slate-50/75 dark:bg-surface-elevated/75 text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10">
                <th className="py-3 px-4 sm:px-6">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-800 dark:hover:text-text-primary">
                    Case ID <ArrowUpDown className="w-3 h-3"/>
                  </div>
                </th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Failure Reason</th>
                <th className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1 cursor-pointer hover:text-slate-800 dark:hover:text-text-primary">
                    Amount <ArrowUpDown className="w-3 h-3"/>
                  </div>
                </th>
                <th className="py-3 px-4">Recovery Prob</th>
                <th className="py-3 px-4 text-right">Expected Value</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Age</th>
                <th className="py-3 px-4 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border-subtle text-xs">
              {filteredCases.map((row) => (
                <tr 
                  key={row.id} 
                  onClick={() => router.push(`/cases/${row.id}`)}
                  className="hover:bg-slate-50/80 dark:hover:bg-surface-elevated/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 sm:px-6 font-mono font-medium text-slate-900 dark:text-text-primary group-hover:text-brand transition-colors">
                    {row.id}
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
                  <td className="py-3.5 px-4 text-slate-600 dark:text-text-muted tabular-nums font-mono text-right">
                    {formatCurrency(row.expected)}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={row.status as any} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 dark:text-text-muted whitespace-nowrap">
                    {row.age}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/cases/${row.id}`);
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-hover text-xs group-hover:underline"
                    >
                      {row.action}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200/80 dark:border-border-subtle bg-slate-50/50 dark:bg-surface text-xs text-slate-500 dark:text-text-muted flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Autonomous sync active • Next scan in 45s</span>
          </div>
          <div className="font-mono text-[11px]">
            Triage Priority: Expected Value Descending
          </div>
        </div>

      </div>

    </div>
  );
}

