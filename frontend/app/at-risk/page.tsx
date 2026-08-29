"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  ChevronDown,
  Layers,
  ShieldCheck,
  CheckSquare,
  Square
} from "lucide-react";
import { ProbabilityMeter } from "@/components/ui/ProbabilityMeter";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CaseDrawer } from "@/components/CaseDrawer";
import { BatchRecoveryDrawer } from "@/components/BatchRecoveryDrawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import { useReclaim } from "@/lib/context/ReclaimContext";
import { useCasesApi } from "@/lib/hooks/useCasesApi";
import { Case, FailureType } from "@/lib/types";

function AtRiskContent() {
  const { cases, metrics, resetDemoData } = useReclaim();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState("All Cases");
  const [searchTerm, setSearchTerm] = useState("");
  const [failureFilter, setFailureFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"expected_desc" | "amount_desc" | "amount_asc" | "prob_desc" | "newest">("expected_desc");
  
  // Selection state for Batch Recovery Orchestration
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [isBatchDrawerOpen, setIsBatchDrawerOpen] = useState(false);

  // Convert tab and filters to API params
  const apiStatus = activeTab === "Recovery Ready" ? "inProgress" : 
                    activeTab === "Human Review" ? "atRisk" : 
                    activeTab === "Escalated" ? "escalated" : 
                    activeTab === "Stopped" ? "stopped" : 
                    activeTab === "Recovered" ? "recovered" : undefined;
                    
  const apiFailure = failureFilter !== "ALL" ? failureFilter : undefined;
  const apiPriority = activeTab === "High Priority" ? "high" : undefined;

  const { items: apiCases, isLoading: isApiLoading, error: apiError } = useCasesApi({
    status: apiStatus,
    failure_type: apiFailure,
    priority: apiPriority,
    page: 1,
    page_size: 100
  });

  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const failureParam = searchParams.get("failure");
    const tabParam = searchParams.get("tab");
    if (failureParam) {
      setFailureFilter(failureParam);
    }
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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
    let result = apiCases.filter((c) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        c.id.toLowerCase().includes(term) ||
        c.customer.toLowerCase().includes(term) ||
        c.failure.toLowerCase().includes(term) ||
        c.failureReason.toLowerCase().includes(term) ||
        c.paymentId.toLowerCase().includes(term) ||
        c.paymentMethod.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (failureFilter !== "ALL" && c.failureType !== failureFilter && c.failure !== failureFilter) {
        return false;
      }

      if (activeTab === "High Priority") return c.prob >= 0.7 && c.status !== "recovered";
      if (activeTab === "Recovery Ready") return c.status === "inProgress";
      if (activeTab === "Human Review") return c.status === "atRisk";
      if (activeTab === "Escalated") return c.status === "escalated";
      if (activeTab === "Stopped") return c.status === "stopped";
      if (activeTab === "Recovered") return c.status === "recovered";

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === "expected_desc") return b.expected - a.expected;
      if (sortBy === "amount_desc") return b.amount - a.amount;
      if (sortBy === "amount_asc") return a.amount - b.amount;
      if (sortBy === "prob_desc") return b.prob - a.prob;
      return 0;
    });

    return result;
  }, [apiCases, searchTerm, activeTab, failureFilter, sortBy]);

  const handleRowClick = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsDrawerOpen(true);
  };

  const handleToggleSelectCase = (e: React.MouseEvent, caseId: string) => {
    e.stopPropagation();
    setSelectedCaseIds((prev) => 
      prev.includes(caseId) ? prev.filter((id) => id !== caseId) : [...prev, caseId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedCaseIds.length === filteredCases.length) {
      setSelectedCaseIds([]);
    } else {
      setSelectedCaseIds(filteredCases.map((c) => c.id));
    }
  };

  const handleSelectEligible = () => {
    const eligibleIds = filteredCases
      .filter((c) => c.status !== "recovered" && c.amount <= 1000000 && c.retryCount < 3 && c.prob >= 0.2)
      .map((c) => c.id);
    setSelectedCaseIds(eligibleIds);
    toast({
      title: "Eligible Cases Selected",
      description: `Selected ${eligibleIds.length} policy-eligible cases for batch recovery.`,
      type: "info",
    });
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
      description: `Exported ${filteredCases.length} filtered cases to CSV.`,
      type: "success"
    });
  };

  const selectedAmountAtRisk = useMemo(() => {
    return filteredCases
      .filter((c) => selectedCaseIds.includes(c.id))
      .reduce((sum, c) => sum + c.amount, 0);
  }, [filteredCases, selectedCaseIds]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-border-subtle">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-text-primary">
            Revenue at Risk Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-text-muted mt-1 font-normal">
            Autonomous triage queue prioritizing failed transactions by value, probability, and policy eligibility
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
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* 2. Main Case Table Card */}
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[580px]">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200/80 dark:border-border-subtle overflow-x-auto bg-slate-50/50 dark:bg-surface px-2 sm:px-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`py-3 px-3 sm:px-4 text-xs font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                  isActive
                    ? "border-brand text-brand font-semibold"
                    : "border-transparent text-slate-500 dark:text-text-muted hover:text-slate-900 dark:hover:text-text-primary hover:border-slate-300 dark:hover:border-border-subtle"
                }`}
              >
                <span>{tab.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive 
                    ? "bg-brand text-white font-bold" 
                    : "bg-slate-200 dark:bg-surface-elevated text-slate-600 dark:text-text-muted font-normal"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200/80 dark:border-border-subtle bg-slate-50/25 dark:bg-surface flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2.5 flex-1 max-w-lg">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search case ID, customer, payment ID, or failure reason..." 
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-canvas border border-slate-200 dark:border-border-subtle rounded-lg focus:outline-none focus:ring-1 focus:ring-brand text-slate-900 dark:text-text-primary placeholder:text-slate-400 transition-colors shadow-sm"
              />
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-text-secondary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
            {/* Multi-Selection Helpers */}
            <button
              onClick={handleSelectEligible}
              className="text-xs font-semibold px-2.5 py-1.5 text-brand bg-brand/10 hover:bg-brand/20 rounded-lg transition-colors inline-flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Select Eligible
            </button>

            {/* Failure Mode Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Failure:</span>
              <select 
                value={failureFilter}
                onChange={(e) => setFailureFilter(e.target.value)}
                aria-label="Filter by failure mode"
                className="text-xs font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-lg px-2.5 py-1.5 focus:outline-none shadow-sm cursor-pointer"
              >
                <option value="ALL">All Failure Modes</option>
                <option value="UPI Timeout">UPI Timeout</option>
                <option value="Card Decline">Card Decline</option>
                <option value="Insufficient Funds">Insufficient Funds</option>
                <option value="Bank Downtime">Bank Downtime</option>
                <option value="Network Drop">Network Drop</option>
                <option value="Checkout Abandonment">Checkout Abandonment</option>
                <option value="Fraud Signal">Fraud Signal</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Sort:</span>
              <select 
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                aria-label="Sort cases"
                className="text-xs font-medium text-slate-700 dark:text-text-secondary bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-lg px-2.5 py-1.5 focus:outline-none shadow-sm cursor-pointer"
              >
                <option value="expected_desc">Expected Value (High to Low)</option>
                <option value="amount_desc">Amount (High to Low)</option>
                <option value="amount_asc">Amount (Low to High)</option>
                <option value="prob_desc">Recovery Probability</option>
                <option value="newest">Most Recent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Case Table or Empty State */}
        {filteredCases.length === 0 ? (
          <div className="p-8 flex-1 flex items-center justify-center">
            <EmptyState
              title="No cases match your filters"
              description="Try adjusting your search query, switching tabs, or resetting filters."
              action={{
                label: "Clear All Filters",
                onClick: handleClearFilters,
              }}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-border-subtle bg-slate-50/75 dark:bg-surface-elevated/75 text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10">
                  <th className="py-3 px-3 text-center w-10">
                    <input 
                      type="checkbox"
                      checked={selectedCaseIds.length === filteredCases.length && filteredCases.length > 0}
                      onChange={handleToggleSelectAll}
                      aria-label="Select all cases"
                      className="rounded border-slate-300 text-brand focus:ring-brand cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4 sm:px-6">Case & ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Failure Reason</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Recovery Prob.</th>
                  <th className="py-3 px-4 text-right">Expected Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border-subtle text-xs">
                {filteredCases.map((row) => {
                  const isSelected = selectedCaseIds.includes(row.id);
                  return (
                    <tr 
                      key={row.id} 
                      onClick={() => handleRowClick(row)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-surface-elevated/40 transition-colors group cursor-pointer ${
                        isSelected ? "bg-brand/5 dark:bg-brand/10" : ""
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center" onClick={(e) => handleToggleSelectCase(e, row.id)}>
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          aria-label={`Select case ${row.id}`}
                          className="rounded border-slate-300 text-brand focus:ring-brand cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 font-mono font-medium text-slate-900 dark:text-text-primary group-hover:text-brand transition-colors">
                        <div className="flex items-center gap-1.5">
                          {row.id}
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-brand" />
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {row.paymentId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-text-primary">
                        {row.customer}
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          {row.paymentMethod}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-text-secondary max-w-xs">
                        <div className="font-semibold text-slate-900 dark:text-text-primary">
                          {row.failure}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-text-muted truncate mt-0.5">
                          {row.failureReason}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-text-primary tabular-nums text-right">
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <ProbabilityMeter probability={row.prob} />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-right">
                        {formatCurrency(row.expected)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={row.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right text-slate-400 dark:text-text-muted whitespace-nowrap">
                        {row.age}
                      </td>
                    </tr>
                  );
                })}
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

      {/* Floating Action Bar when cases are selected */}
      {selectedCaseIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-4 border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <div className="text-xs">
            <span className="font-bold text-emerald-400">{selectedCaseIds.length} Cases Selected</span>
            <span className="text-slate-400 ml-2">({formatCurrency(selectedAmountAtRisk)} at risk)</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <button
            onClick={() => setIsBatchDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg shadow transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Batch Intelligence & Authorize
          </button>

          <button
            onClick={() => setSelectedCaseIds([])}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Deselect All
          </button>
        </div>
      )}

      {/* Case Quick Slide-Over Drawer */}
      <CaseDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        caseItem={selectedCase}
      />

      {/* Batch Recovery Orchestration Drawer */}
      <BatchRecoveryDrawer
        isOpen={isBatchDrawerOpen}
        onClose={() => setIsBatchDrawerOpen(false)}
        selectedCaseIds={selectedCaseIds}
        onBatchExecuted={() => {
          setSelectedCaseIds([]);
        }}
      />

    </div>
  );
}

export default function AtRiskPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500">Loading case explorer...</div>}>
      <AtRiskContent />
    </Suspense>
  );
}
