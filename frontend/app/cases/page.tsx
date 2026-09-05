"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Briefcase, 
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
  Square, 
  CheckCircle2, 
  ExternalLink, 
  Eye, 
  Play, 
  ArrowRight,
  User,
  CreditCard,
  Building,
  HelpCircle
} from "lucide-react";
import { ProbabilityMeter } from "@/components/ui/ProbabilityMeter";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CaseDrawer } from "@/components/CaseDrawer";
import { BatchRecoveryDrawer } from "@/components/BatchRecoveryDrawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, cn } from "@/lib/utils";
import { useReclaim } from "@/lib/context/ReclaimContext";
import { Case, FailureType } from "@/lib/types";

function CasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cases, metrics, resetDemoData, executeRecovery } = useReclaim();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("All Cases");
  const [searchTerm, setSearchTerm] = useState("");
  const [failureFilter, setFailureFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"expected_desc" | "amount_desc" | "amount_asc" | "prob_desc" | "newest">("expected_desc");
  
  // Selection state for Batch Recovery Orchestration
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [isBatchDrawerOpen, setIsBatchDrawerOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sync tab from URL if present (e.g. ?status=recovered)
  React.useEffect(() => {
    const statusParam = searchParams?.get("status");
    if (statusParam === "recovered") setActiveTab("Recovered");
    else if (statusParam === "atRisk") setActiveTab("At Risk");
    else if (statusParam === "inProgress") setActiveTab("In Progress");
    else if (statusParam === "escalated") setActiveTab("Escalated");
  }, [searchParams]);

  // Unique failure types for dropdown filter
  const failureTypes = useMemo(() => {
    const types = new Set<string>();
    cases.forEach((c) => {
      if (c.failureType) types.add(c.failureType);
      else if (c.failure) types.add(c.failure);
    });
    return Array.from(types);
  }, [cases]);

  // Filter & Sort Logic
  const filteredCases = useMemo(() => {
    return cases
      .filter((c) => {
        // Tab Filter
        if (activeTab === "At Risk" && c.status !== "atRisk") return false;
        if (activeTab === "In Progress" && c.status !== "inProgress") return false;
        if (activeTab === "Recovered" && c.status !== "recovered") return false;
        if (activeTab === "Escalated" && c.status !== "escalated") return false;
        if (activeTab === "Stopped" && c.status !== "stopped") return false;

        // Failure Type Filter
        if (failureFilter !== "ALL") {
          const type = c.failureType || c.failure;
          if (type !== failureFilter) return false;
        }

        // Search Term Filter
        if (searchTerm.trim() !== "") {
          const term = searchTerm.toLowerCase();
          const matchId = c.id.toLowerCase().includes(term);
          const matchCustomer = c.customer.toLowerCase().includes(term);
          const matchEmail = (c.customerEmail || "").toLowerCase().includes(term);
          const matchFailure = (c.failureType || c.failure || "").toLowerCase().includes(term);
          const matchStrategy = (c.strategy || "").toLowerCase().includes(term);
          if (!matchId && !matchCustomer && !matchEmail && !matchFailure && !matchStrategy) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "expected_desc") {
          const expectedA = a.amount * (a.prob || 0.5);
          const expectedB = b.amount * (b.prob || 0.5);
          return expectedB - expectedA;
        }
        if (sortBy === "amount_desc") return b.amount - a.amount;
        if (sortBy === "amount_asc") return a.amount - b.amount;
        if (sortBy === "prob_desc") return (b.prob || 0) - (a.prob || 0);
        if (sortBy === "newest") {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        }
        return 0;
      });
  }, [cases, activeTab, failureFilter, searchTerm, sortBy]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedCaseIds.length === filteredCases.length) {
      setSelectedCaseIds([]);
    } else {
      setSelectedCaseIds(filteredCases.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedCaseIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleRowClick = (c: Case) => {
    setSelectedCase(c);
    setIsDrawerOpen(true);
  };

  const handleQuickRecover = async (e: React.MouseEvent, caseId: string) => {
    e.stopPropagation();
    toast({
      title: "Executing Recovery Action",
      description: `Dispatching recovery order for ${caseId}...`,
      type: "info"
    });
    await executeRecovery(caseId);
  };

  // Aggregated tab counts
  const counts = useMemo(() => {
    return {
      all: cases.length,
      atRisk: cases.filter((c) => c.status === "atRisk").length,
      inProgress: cases.filter((c) => c.status === "inProgress").length,
      recovered: cases.filter((c) => c.status === "recovered").length,
      escalated: cases.filter((c) => c.status === "escalated").length,
      stopped: cases.filter((c) => c.status === "stopped").length,
    };
  }, [cases]);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-text-primary">
              Cases Registry
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {cases.length} Total Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-text-muted mt-1">
            Authoritative registry of all customer payment incidents, AI diagnostics, policy approvals, and settlement status.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {selectedCaseIds.length > 0 && (
            <button
              onClick={() => setIsBatchDrawerOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Batch Recover ({selectedCaseIds.length})</span>
            </button>
          )}

          <button
            onClick={() => {
              const csvData = "Case ID,Customer,Amount,Failure Type,Status,Probability\n" + 
                filteredCases.map(c => `${c.id},"${c.customer}",${c.amount / 100},"${c.failureType || c.failure}",${c.status},${c.prob}`).join("\n");
              const blob = new Blob([csvData], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `reclaim_cases_${Date.now()}.csv`;
              a.click();
              toast({ title: "CSV Exported", description: `Exported ${filteredCases.length} cases to CSV.`, type: "info" });
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Active At Risk</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5 block">{counts.atRisk}</span>
          <span className="text-[11px] text-slate-400 mt-0.5">{formatCurrency(metrics.revenueAtRisk)} at risk</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">In Progress</span>
          <span className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono mt-0.5 block">{counts.inProgress}</span>
          <span className="text-[11px] text-slate-400 mt-0.5">Dispatched to Razorpay</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Recovered Revenue</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">{formatCurrency(metrics.revenueRecovered)}</span>
          <span className="text-[11px] text-slate-400 mt-0.5">{counts.recovered} successful settlements</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Recovery Rate</span>
          <span className="text-2xl font-black text-slate-900 dark:text-text-primary font-mono mt-0.5 block">{metrics.recoveryRate}%</span>
          <span className="text-[11px] text-emerald-500 font-medium mt-0.5">+5.3% vs baseline</span>
        </div>
      </div>

      {/* 3. Status Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar border-b border-slate-200/80 dark:border-border-subtle">
        {[
          { label: "All Cases", count: counts.all },
          { label: "At Risk", count: counts.atRisk },
          { label: "In Progress", count: counts.inProgress },
          { label: "Recovered", count: counts.recovered },
          { label: "Escalated", count: counts.escalated },
          { label: "Stopped", count: counts.stopped },
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              activeTab === tab.label
                ? "bg-slate-900 dark:bg-slate-800 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            )}
          >
            <span>{tab.label}</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold",
              activeTab === tab.label
                ? "bg-slate-800 dark:bg-slate-700 text-slate-200"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 4. Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-surface p-3 rounded-xl border border-slate-200/80 dark:border-border-subtle shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Case ID, Customer, Email, or Failure Code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand"
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

        {/* Dropdowns */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Failure Type Filter */}
          <select
            value={failureFilter}
            onChange={(e) => setFailureFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="ALL">All Failure Types ({failureTypes.length})</option>
            {failureTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="expected_desc">Sort: Expected Yield (High to Low)</option>
            <option value="amount_desc">Sort: Amount (High to Low)</option>
            <option value="amount_asc">Sort: Amount (Low to High)</option>
            <option value="prob_desc">Sort: Recovery Probability</option>
            <option value="newest">Sort: Newest First</option>
          </select>
        </div>
      </div>

      {/* 5. Cases Table */}
      <div className="rounded-xl border border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-border-subtle bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-10">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {selectedCaseIds.length === filteredCases.length && filteredCases.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Case & Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Failure Code</th>
                <th className="py-3 px-4">Recovery Probability</th>
                <th className="py-3 px-4">AI Recommendation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/60 dark:divide-border-subtle text-xs">
              {filteredCases.length > 0 ? (
                filteredCases.map((c) => {
                  const isSelected = selectedCaseIds.includes(c.id);
                  const failureName = c.failureType || c.failure || "Payment Failed";
                  const planTier = (c as any).customerTier || (c.amount > 2000000 ? "Enterprise" : c.amount > 500000 ? "Pro" : "Standard");

                  return (
                    <tr
                      key={c.id}
                      onClick={() => handleRowClick(c)}
                      className={cn(
                        "group cursor-pointer transition-colors duration-150",
                        isSelected 
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20" 
                          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleSelect(c.id)}
                          className="flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Case ID & Customer */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-text-primary text-xs">
                              {c.id}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {planTier}
                            </span>
                          </div>
                          <div className="text-slate-600 dark:text-slate-300 font-medium">
                            {c.customer}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {c.customerEmail || c.customerPhone || "Direct Payment"}
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-text-primary text-sm">
                          {formatCurrency(c.amount)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {c.amount} paise
                        </div>
                      </td>

                      {/* Failure Code */}
                      <td className="py-3.5 px-4">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border",
                          failureName.includes("Timeout") || failureName.includes("Network")
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : failureName.includes("Insufficient")
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              : failureName.includes("Downtime")
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        )}>
                          {failureName}
                        </span>
                      </td>

                      {/* Probability Meter */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <ProbabilityMeter probability={c.prob || 0.65} />
                      </td>

                      {/* AI Recommendation */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                          <Sparkles className="w-3.5 h-3.5 text-brand" />
                          <span className="font-semibold capitalize">
                            {(c.strategy || "RETRY_PAYMENT").replace(/_/g, " ").toLowerCase()}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Attempt {c.retryCount || 0} of 3
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status === "atRisk" && (
                            <button
                              onClick={(e) => handleQuickRecover(e, c.id)}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition shadow-sm"
                            >
                              Recover
                            </button>
                          )}

                          <button
                            onClick={() => handleRowClick(c)}
                            title="Inspect Case Drawer"
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            href={`/cases/${c.id}`}
                            title="Open Full Decision Studio"
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <EmptyState
                      icon={Briefcase}
                      title="No cases match your filters"
                      description="Try adjusting your status tab, failure type dropdown, or search query."
                      action={{
                        label: "Clear All Filters",
                        onClick: () => {
                          setActiveTab("All Cases");
                          setFailureFilter("ALL");
                          setSearchTerm("");
                        }
                      }}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Drawer for Instant Inspection */}
      <CaseDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        caseItem={selectedCase}
      />

      {/* Batch Recovery Drawer */}
      <BatchRecoveryDrawer
        isOpen={isBatchDrawerOpen}
        onClose={() => setIsBatchDrawerOpen(false)}
        selectedCaseIds={selectedCaseIds}
        onBatchExecuted={() => {
          setSelectedCaseIds([]);
          setIsBatchDrawerOpen(false);
        }}
      />
    </div>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading cases directory...</div>}>
      <CasesContent />
    </Suspense>
  );
}

