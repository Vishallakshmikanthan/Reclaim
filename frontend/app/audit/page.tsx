"use client";

import React from "react";
import { Search, Filter, Download, ArrowUpDown } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

const AUDIT_EVENTS = [
  { id: "EV-99234", timestamp: "Oct 24, 14:32:05", layer: "LAYER 5", event: "CASE_RESOLVED", case: "RC-2024-081", desc: "₹8,499 recovered successfully via Razorpay Retry" },
  { id: "EV-99233", timestamp: "Oct 24, 14:32:04", layer: "LAYER 4", event: "ACTION_SUCCEEDED", case: "RC-2024-081", desc: "Razorpay POST /payments/pay_P4qX92vLmK0/retry succeeded" },
  { id: "EV-99232", timestamp: "Oct 24, 14:32:02", layer: "LAYER 4", event: "ACTION_EXECUTED", case: "RC-2024-081", desc: "Executing Primary Action: Retry Payment" },
  { id: "EV-99231", timestamp: "Oct 24, 14:32:01", layer: "LAYER 3", event: "POLICY_APPROVED", case: "RC-2024-081", desc: "All 6 policy rules passed for primary action" },
  { id: "EV-99230", timestamp: "Oct 24, 14:31:59", layer: "LAYER 2", event: "AGENT_DECISION", case: "RC-2024-081", desc: "Recovery plan generated: Retry → Payment Link" },
  { id: "EV-99229", timestamp: "Oct 24, 14:31:58", layer: "LAYER 1", event: "RISK_SCORED", case: "RC-2024-081", desc: "Probability 0.81, Expected ₹6,884. Passed triage." },
  { id: "EV-99228", timestamp: "Oct 24, 14:31:55", layer: "LAYER 0", event: "CASE_CREATED", case: "RC-2024-081", desc: "Payment failure webhook received from Razorpay" },
  { id: "EV-99227", timestamp: "Oct 24, 14:15:02", layer: "LAYER 3", event: "POLICY_BLOCKED", case: "RC-2024-075", desc: "Action blocked: Maximum Retry Count Exceeded (3/3)" },
  { id: "EV-99226", timestamp: "Oct 24, 14:15:03", layer: "LAYER 5", event: "CASE_ESCALATED", case: "RC-2024-075", desc: "Case escalated due to policy block on primary action" },
];

export default function AuditTrailPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-text-primary tracking-tight">Audit Trail</h1>
          <p className="text-sm text-slate-500 dark:text-text-muted mt-1">Every recovery decision is traceable.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-md hover:bg-slate-50 dark:hover:bg-surface-highlight transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-xl shadow-sm flex flex-col h-[calc(100vh-14rem)]">
        
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-border-subtle flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-canvas-subtle/50 rounded-t-xl">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search event ID, case, description..." 
                className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-brand text-slate-900 dark:text-text-primary placeholder:text-slate-400 transition-colors shadow-sm"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-md hover:bg-slate-50 dark:hover:bg-surface-highlight transition-colors shadow-sm">
              <Filter className="w-4 h-4" /> Layer Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left relative">
            <thead className="text-xs text-slate-500 dark:text-text-muted bg-slate-50 dark:bg-surface-elevated sticky top-0 border-b border-slate-200 dark:border-border-subtle shadow-sm z-10">
              <tr>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1 cursor-pointer hover:text-slate-800 dark:hover:text-text-primary">Timestamp <ArrowUpDown className="w-3 h-3"/></div></th>
                <th className="px-6 py-4 font-medium">Event</th>
                <th className="px-6 py-4 font-medium">Layer</th>
                <th className="px-6 py-4 font-medium">Case</th>
                <th className="px-6 py-4 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border-subtle font-mono text-xs">
              {AUDIT_EVENTS.map((row) => (
                <tr 
                  key={row.id} 
                  className="hover:bg-slate-50 dark:hover:bg-surface-highlight/30 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 text-slate-500 dark:text-text-muted whitespace-nowrap">{row.timestamp}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded font-medium",
                      row.event.includes("APPROVED") || row.event.includes("SUCCEEDED") || row.event.includes("RESOLVED") ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" :
                      row.event.includes("BLOCKED") || row.event.includes("FAILED") ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" :
                      row.event.includes("ESCALATED") ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" :
                      "bg-indigo-50 text-indigo-600 dark:bg-brand-muted dark:text-brand"
                    )}>
                      {row.event}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-text-muted">{row.layer}</td>
                  <td className="px-6 py-4 font-medium text-brand hover:underline">{row.case}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-text-secondary truncate max-w-md">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
