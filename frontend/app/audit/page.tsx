"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, Download, ArrowUpDown, ShieldCheck, Clock, ExternalLink, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { useReclaim } from "@/lib/context/ReclaimContext";

export default function AuditTrailPage() {
  const { auditEvents, resetDemoData } = useReclaim();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [layerFilter, setLayerFilter] = useState("ALL");

  const filteredEvents = useMemo(() => {
    return auditEvents.filter((e) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        e.id.toLowerCase().includes(term) ||
        e.case.toLowerCase().includes(term) ||
        e.event.toLowerCase().includes(term) ||
        e.desc.toLowerCase().includes(term);
      
      const matchesLayer = layerFilter === "ALL" || e.layer === layerFilter;
      return matchesSearch && matchesLayer;
    });
  }, [auditEvents, searchTerm, layerFilter]);

  const handleExportCSV = () => {
    const headers = "Event ID,Timestamp,Layer,Event Type,Case ID,Latency,Description\n";
    const rows = filteredEvents.map(e => 
      `${e.id},"${e.timestamp}","${e.layer}","${e.event}","${e.case}","${e.latency || ''}","${e.desc.replace(/"/g, '""')}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reclaim_audit_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Audit Export Completed",
      description: `Exported ${filteredEvents.length} cryptographic audit events to CSV.`,
      type: "success"
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-text-primary">
              Audit Trail Ledger
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Immutable
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-text-muted mt-1 font-normal">
            Every risk score, AI synthesis, policy evaluation, and payment retry is recorded deterministically
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={resetDemoData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-lg hover:bg-slate-50 dark:hover:bg-surface-elevated transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Demo
          </button>
          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-lg hover:bg-slate-50 dark:hover:bg-surface-elevated transition-colors shadow-sm active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" /> Export Audit CSV
          </button>
        </div>
      </div>

      {/* 2. Main Ledger Container */}
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
                placeholder="Search event ID, case, reason..." 
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-canvas border border-slate-200 dark:border-border-subtle rounded-lg focus:outline-none focus:ring-1 focus:ring-brand text-slate-900 dark:text-text-primary placeholder:text-slate-400 transition-colors shadow-sm"
              />
            </div>
            <select 
              value={layerFilter}
              onChange={(e) => setLayerFilter(e.target.value)}
              aria-label="Filter by Layer"
              className="text-xs font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-lg px-2.5 py-1.5 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="ALL">All Layers (0–5)</option>
              <option value="LAYER 0">Layer 0 (Ingest)</option>
              <option value="LAYER 1">Layer 1 (Risk Score)</option>
              <option value="LAYER 2">Layer 2 (AI Decision)</option>
              <option value="LAYER 3">Layer 3 (Policy Check)</option>
              <option value="LAYER 4">Layer 4 (Execution)</option>
              <option value="LAYER 5">Layer 5 (Resolution)</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 dark:text-text-muted self-end sm:self-auto">
            Showing <strong>{filteredEvents.length}</strong> events
          </div>
        </div>

        {/* Ledger Table or Empty State */}
        {filteredEvents.length === 0 ? (
          <div className="p-8 flex-1 flex items-center justify-center">
            <EmptyState
              title="No audit events found"
              description="Try modifying your search term or switching to 'All Layers (0–5)'."
              action={{
                label: "Reset Audit Filters",
                onClick: () => {
                  setSearchTerm("");
                  setLayerFilter("ALL");
                }
              }}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-border-subtle bg-slate-50/75 dark:bg-surface-elevated/75 text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10">
                  <th className="py-3 px-4 sm:px-6">Timestamp</th>
                  <th className="py-3 px-4">Layer</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Execution Summary & Evidence</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border-subtle text-xs">
                {filteredEvents.map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-surface-elevated/30 transition-colors group"
                  >
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-slate-500 dark:text-text-muted whitespace-nowrap text-[11px]">
                      {row.timestamp}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-surface-elevated text-slate-600 dark:text-text-secondary border border-slate-200 dark:border-border-subtle">
                        {row.layer}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[11px]",
                        row.event.includes("APPROVED") || row.event.includes("SUCCEEDED") || row.event.includes("RESOLVED") 
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" 
                          : row.event.includes("BLOCKED") || row.event.includes("FAILED") 
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" 
                          : row.event.includes("ESCALATED") || row.event.includes("TIMEOUT")
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" 
                          : "bg-indigo-50 text-indigo-700 dark:bg-brand-muted dark:text-brand"
                      )}>
                        {row.event}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-brand hover:underline">
                      <Link href={`/cases/${row.case}`} className="flex items-center gap-1">
                        {row.case}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-text-secondary max-w-lg leading-relaxed">
                      {row.desc}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right font-mono text-[11px] text-slate-400 dark:text-text-muted whitespace-nowrap">
                      {row.latency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-slate-200/80 dark:border-border-subtle bg-slate-50/50 dark:bg-surface text-xs text-slate-500 dark:text-text-muted flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Audit retention period: 7 Years (PCI-DSS & RBI FinTech Compliance)</span>
          </div>
          <div className="font-mono text-[11px]">
            Immutable Ledger ({auditEvents.length} total events)
          </div>
        </div>

      </div>

    </div>
  );
}
