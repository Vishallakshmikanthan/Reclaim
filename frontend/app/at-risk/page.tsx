"use client";

import React, { useState, useMemo } from "react";
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
  Clock, 
  X, 
  RotateCcw,
  Sparkles,
  ChevronDown
} from "lucide-react";
import { ProbabilityMeter } from "@/components/ui/ProbabilityMeter";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CaseDrawer } from "@/components/CaseDrawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import { useReclaim } from "@/lib/context/ReclaimContext";
import { Case, FailureType } from "@/lib/types";

export default function AtRiskPage() {
  const { cases, metrics, resetDemoData } = useReclaim();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("All Cases");
  const [searchTerm, setSearchTerm] = useState("");
  const [failureFilter, setFailureFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"expected_desc" | "amount_desc" | "amount_asc" | "prob_desc" | "newest">("expected_desc");
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Dynamic tab counts based on live context
  const tabCounts = useMemo(() => {
    return {
      all: cases.length,
      highPriority: cases.filter((c) => c.prob >= 0.7 && c.status !== "recovered").length,
      recoveryReady: cases.filter((c) => c.status === "inProgress").length,
      humanReview: cases.filter((c) => c.status === "atRisk").length,
      escalated: cases.filter((c) => c.status === "escalated").length,
      stopped: cases.filter((c) => c.status === "stopped").length,
      recovered: cases.filter((c) => c.status === "recovered").length,
    };
  }, [cases]);

  const tabs = useMemo(() => [
    { name: "All Cases", count: tabCounts.all.toString() },
    { name: "High Priority", count: tabCounts.highPriority.toString() },
    { name: "Recovery Ready", count: tabCounts.recoveryReady.toString() },
    { name: "Human Review", count: tabCounts.humanReview.toString() },
    { name: "Escalated", count: tabCounts.escalated.toString() },
    { name: "Stopped", count: tabCounts.stopped.toString() },
    { name: "Recovered", count: tabCounts.recovered.toString() },
  ], [tabCounts]);

  const filteredCases = useMemo(() => {
    let result = cases.filter((c) => {
      // Search filter
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        c.id.toLowerCase().includes(term) ||
        c.customer.toLowerCase().includes(term) ||
        c.failure.toLowerCase().includes(term) ||
        c.failureReason.toLowerCase().includes(term) ||
        c.paymentId.toLowerCase().includes(term) ||
        c.paymentMethod.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      // Failure type filter
      if (failureFilter !== "ALL" && c.failureType !== failureFilter) {
        return false;
      }

      // Tab filter
      if (activeTab === "High Priority") return c.prob >= 0.7 && c.status !== "recovered";
      if (activeTab === "Recovery Ready") return c.status === "inProgress";
      if (activeTab === "Human Review") return c.status === "atRisk";
      if (activeTab === "Escalated") return c.status === "escalated";
      if (activeTab === "Stopped") return c.status === "stopped";
      if (activeTab === "Recovered") return c.status === "recovered";

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "expected_desc") return b.expected - a.expected;
      if (sortBy === "amount_desc") return b.amount - a.amount;
      if (sortBy === "amount_asc") return a.amount - b.amount;
      if (sortBy === "prob_desc") return b.prob - a.prob;
      return 0; // newest
    });

    return result;
  }, [cases, searchTerm, activeTab, failureFilter, sortBy]);

  const handleRowClick = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsDrawerOpen(true);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setActiveTab("All Cases");
    setFailureFilter("ALL");
    setSortBy("expected_desc");
    toast({
      title: "Filters Cleared",
      description: "Showing all active cases in the workspace.",
      type: "info",
    });
  };

  const handleExportCSV = () => {
    const headers = "Case ID,Customer,Amount (INR),Failure Type,Probability,Status,Payment ID\n";
    const rows = filteredCases.map(c => 
      `${c.id},"${c.customer}",${c.amount / 100},"${c.failure}",${c.prob},${c.status},${c.paymentId}`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reclaim_cases_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Completed",
      description: `Exported ${filteredCases.length} cases to CSV.`,
      type: "success",
    });
  };

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
              {formatCurrency(metrics.revenueAtRisk)} at risk
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-text-muted mt-1 font-normal">
            Operational triage workspace for failed payments and autonomous intervention pipelines
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={resetDemoData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-lg hover:bg-slate-50 dark:hover:bg-surface-elevated transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset State
          </button>
          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-lg hover:bg-slate-50 dark:hover:bg-surface-elevated transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* 2. Main Workspace Container */}
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[580px]">
        
        {/* Controls Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200/80 dark:border-border-subtle bg-slate-50/50 dark:bg-surface flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search Input */}
          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Case ID, Customer, Payment ID, Reason..." 
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-white dark:bg-canvas border border-slate-200 dark:border-border-subtle rounded-lg focus:outline-none focus:ring-1 focus:ring-brand text-slate-900 dark:text-text-primary placeholder:text-slate-400 transition-colors shadow-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Dropdowns & Sorters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Failure Type Filter */}
            <select
              value={failureFilter}
              onChange={(e) => setFailureFilter(e.target.value)}
              aria-label="Filter by Failure Type"
              className="text-xs font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-lg px-2.5 py-1.5 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="ALL">All Failure Types</option>
              <option value="UPI Timeout">UPI Timeout</option>
              <option value="Card Decline">Card Decline</option>
              <option value="Insufficient Funds">Insufficient Funds</option>
              <option value="Bank Downtime">Bank Downtime</option>
              <option value="Network Drop">Network Drop</option>
              <option value="Checkout Abandonment">Checkout Abandonment</option>
              <option value="Subscription Failure">Subscription Failure</option>
              <option value="Overdue Invoice">Overdue Invoice</option>
              <option value="Fraud Signal">Fraud Signal</option>
            </select>

            {/* Sort Sorter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort Cases By"
              className="text-xs font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-lg px-2.5 py-1.5 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="expected_desc">Sort: Highest Expected Value</option>
              <option value="amount_desc">Sort: Highest Amount</option>
              <option value="amount_asc">Sort: Lowest Amount</option>
              <option value="prob_desc">Sort: Highest Probability</option>
            </select>

            {(searchTerm || activeTab !== "All Cases" || failureFilter !== "ALL") && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 ml-1"
              >
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            )}

            <span className="text-slate-500 dark:text-text-muted ml-1">
              <strong>{filteredCases.length}</strong> cases
            </span>
          </div>
        </div>

        {/* Operational Filter Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface px-4 gap-1">
          {tabs.map((tab) => {
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

        {/* Operational Case Table or Empty State */}
        {filteredCases.length === 0 ? (
          <div className="p-12 flex-1 flex items-center justify-center">
            <EmptyState
              title="No cases match your filters"
              description="Try modifying your search keywords or switching back to 'All Cases'."
              action={{
                label: "Clear All Filters",
                onClick: handleClearFilters
              }}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-border-subtle bg-slate-50/75 dark:bg-surface-elevated/75 text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10">
                  <th className="py-3 px-4 sm:px-6">Case ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Failure Reason</th>
                  <th className="py-3 px-4 text-right">Amount</th>
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
                    onClick={() => handleRowClick(row)}
                    className="hover:bg-slate-50/80 dark:hover:bg-surface-elevated/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-medium text-slate-900 dark:text-text-primary group-hover:text-brand transition-colors">
                      <div className="flex items-center gap-1.5">
                        {row.id}
                        {row.demoScenario && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-brand/10 text-brand font-bold uppercase">
                            Demo {row.demoScenario.slice(0, 1)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-text-primary">
                      {row.customer}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-text-secondary">
                      <span className="font-semibold text-slate-800 dark:text-text-primary">{row.failure}</span>
                      <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">{row.failureReason}</span>
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
                      <StatusBadge status={row.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 dark:text-text-muted whitespace-nowrap">
                      {row.age}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(row);
                        }}
                        className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-hover text-xs group-hover:underline"
                      >
                        {row.status === "recovered" ? "View Case" : "Review & Execute"}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200/80 dark:border-border-subtle bg-slate-50/50 dark:bg-surface text-xs text-slate-500 dark:text-text-muted flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Click any case to inspect recovery context & execute actions</span>
          </div>
          <div className="font-mono text-[11px]">
            Sorted by: {sortBy.replace("_", " ").toUpperCase()}
          </div>
        </div>

      </div>

      {/* Case Quick Slide-Over Drawer */}
      <CaseDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        caseItem={selectedCase}
      />

    </div>
  );
}
