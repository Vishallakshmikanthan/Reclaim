"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { Drawer } from "@/components/ui/Drawer";
import { PolicyCheck } from "@/components/ui/PolicyCheck";
import { ProbabilityMeter } from "@/components/ui/ProbabilityMeter";
import { StatusBadge, StatusType } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { 
  Play, 
  RotateCcw, 
  ShieldAlert, 
  BrainCircuit, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink,
  Activity,
  AlertTriangle,
  FileCheck
} from "lucide-react";

interface CaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: {
    id: string;
    amount: number;
    failure: string;
    prob: number;
    expected: number;
    status: StatusType;
    paymentId: string;
    customer: string;
    strategy: string;
  } | null;
}

export function CaseDrawer({ isOpen, onClose, caseItem }: CaseDrawerProps) {
  const { toast } = useToast();
  const [executionState, setExecutionState] = useState<"idle" | "authorizing" | "executing" | "verifying" | "success" | "blocked" | "timeout">("idle");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (!caseItem) return null;


  const handleStartExecute = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmExecute = () => {
    setIsConfirmOpen(false);
    setExecutionState("authorizing");
    toast({
      title: "Authorizing Action",
      description: `Evaluating deterministic policies for ${caseItem.id}...`,
      type: "info",
    });

    setTimeout(() => {
      setExecutionState("executing");
      toast({
        title: "Executing Recovery",
        description: `Sending idempotent retry for ${formatCurrency(caseItem.amount)} to Razorpay...`,
        type: "info",
      });

      setTimeout(() => {
        setExecutionState("verifying");
        
        setTimeout(() => {
          setExecutionState("success");
          toast({
            title: "Recovery Successful",
            description: `Captured ${formatCurrency(caseItem.amount)} successfully. Case marked resolved.`,
            type: "success",
          });
        }, 1200);
      }, 1400);
    }, 600);
  };

  const handleReset = () => {
    setExecutionState("idle");
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`Case ${caseItem.id}`}
        subtitle={`Transaction ${caseItem.paymentId} • ${caseItem.customer}`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-6">
          
          {/* Header Metric Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-elevated border border-slate-200/80 dark:border-border-subtle flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
                Money at Risk
              </span>
              <div className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-text-primary mt-0.5">
                {formatCurrency(caseItem.amount)}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge status={executionState === "success" ? "recovered" : caseItem.status} />
              <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400">
                {caseItem.failure}
              </span>
            </div>
          </div>

          {/* Recovery Probability & Expected Value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg border border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Recovery Probability
              </span>
              <div className="mt-1.5">
                <ProbabilityMeter probability={caseItem.prob} />
              </div>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Expected Value
              </span>
              <div className="text-base font-bold text-slate-900 dark:text-text-primary tabular-nums mt-1">
                {formatCurrency(caseItem.expected)}
              </div>
            </div>
          </div>


          {/* AI Recommendation Card */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand uppercase tracking-wider flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5" /> AI Synthesis (Layer 2)
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                High Confidence
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-text-secondary leading-relaxed">
              Recommended action: <strong className="text-slate-900 dark:text-text-primary">{caseItem.strategy}</strong>. The issuing gateway error indicates temporary bank node traffic congestion.
            </p>
          </div>

          {/* Policy Guardrail Checks (Layer 3) */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-border-subtle">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-text-primary uppercase tracking-wider">
                  Deterministic Guardrails (Layer 3)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                ALL RULES PASS
              </span>
            </div>

            <div className="space-y-1">
              <PolicyCheck name="Max Retry Limit" value="1 / 3 attempts" status="pass" />
              <PolicyCheck name="Cooldown Interval" value="45m elapsed" status="pass" description=">= 30m required" />
              <PolicyCheck name="Auto-Action Cap" value={`${formatCurrency(caseItem.amount)} < ₹10k`} status="pass" />
            </div>
          </div>

          {/* Action Area */}
          <div className="space-y-3 pt-2">
            {executionState === "idle" && (
              <button
                onClick={handleStartExecute}
                className="w-full py-3 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                Execute Recovery Action
              </button>
            )}

            {executionState === "authorizing" && (
              <button disabled className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-surface-elevated text-slate-600 dark:text-text-muted text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-border-subtle">
                <Activity className="w-4 h-4 animate-spin text-brand" />
                Validating Deterministic Policy...
              </button>
            )}

            {executionState === "executing" && (
              <button disabled className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-surface-elevated text-slate-600 dark:text-text-muted text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-border-subtle">
                <Activity className="w-4 h-4 animate-spin text-brand" />
                Executing Razorpay Retry (Layer 4)...
              </button>
            )}

            {executionState === "verifying" && (
              <button disabled className="w-full py-3 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center justify-center gap-2 border border-amber-200 dark:border-amber-900/40">
                <Activity className="w-4 h-4 animate-pulse" />
                Verifying Payment Outcome (Layer 5)...
              </button>
            )}

            {executionState === "success" && (
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Recovery Successful: {formatCurrency(caseItem.amount)} Captured
                  </span>
                  <span className="font-mono text-[10px]">200 OK</span>
                </div>
                <button
                  onClick={handleReset}
                  className="w-full py-2 text-xs font-medium text-slate-500 hover:text-brand flex items-center justify-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset State
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Link
                href={`/cases/${caseItem.id}`}
                onClick={onClose}
                className="text-xs font-medium text-brand hover:underline inline-flex items-center gap-1"
              >
                Open Full Decision Workspace <ExternalLink className="w-3 h-3" />
              </Link>
              <button
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-text-primary transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>

        </div>
      </Drawer>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Authorize Recovery Action?"
        description="Verify financial details before triggering automated gateway retry."
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-surface-elevated border border-slate-200/80 dark:border-border-subtle space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Case ID</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-text-primary">{caseItem.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount</span>
              <span className="font-bold text-slate-900 dark:text-text-primary">{formatCurrency(caseItem.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Action</span>
              <span className="font-medium text-brand">{caseItem.strategy}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-border-subtle">
              <span className="text-slate-500">Policy Engine</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 6/6 Invariants Approved
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-border-subtle bg-white dark:bg-surface text-slate-700 dark:text-text-secondary font-medium hover:bg-slate-50 dark:hover:bg-surface-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmExecute}
              className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold transition-colors shadow-sm"
            >
              Authorize & Execute
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
