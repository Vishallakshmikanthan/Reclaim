"use client";

import React from "react";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { Drawer } from "@/components/ui/Drawer";
import { AuditEvent } from "@/lib/types";
import { 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  Layers, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Lock,
  ArrowRight,
  FileCheck
} from "lucide-react";

interface AuditEventDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event: AuditEvent | null;
}

export function AuditEventDrawer({ isOpen, onClose, event }: AuditEventDrawerProps) {
  if (!event) return null;

  const isSuccess = event.status === "SUCCESS" || event.event.includes("SUCCEEDED") || event.event.includes("RESOLVED") || event.event.includes("APPROVED");
  const isBlocked = event.status === "BLOCKED" || event.event.includes("BLOCKED") || event.event.includes("FAILED");
  const isTimeout = event.status === "TIMEOUT" || event.event.includes("TIMEOUT");

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Audit Inspection: ${event.id}`}
      subtitle={`${event.layer} • ${event.source || "SYSTEM"} • ${event.event}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        
        {/* 1. Header Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-elevated border border-slate-200/80 dark:border-border-subtle flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-text-primary">
                {event.id}
              </span>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                isSuccess ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40" :
                isBlocked ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40" :
                isTimeout ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40" :
                "bg-indigo-50 text-indigo-700 dark:bg-brand-muted dark:text-brand border border-indigo-200/60"
              )}>
                {event.status || event.event}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-text-muted mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{event.timestamp}</span>
              {event.latency && <span className="font-mono text-slate-400">({event.latency})</span>}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Target Case</span>
            <Link 
              href={`/cases/${event.case}`}
              onClick={onClose}
              className="text-xs font-mono font-bold text-brand hover:underline inline-flex items-center gap-1 mt-0.5"
            >
              {event.case} <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 2. Full Narrative Description */}
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-brand" /> Immutable Event Narrative
          </span>
          <p className="text-xs text-slate-800 dark:text-text-primary leading-relaxed bg-slate-50 dark:bg-surface-elevated/40 p-3 rounded-lg border border-slate-100 dark:border-border-subtle font-medium">
            {event.desc}
          </p>
        </div>

        {/* 3. Responsible System Layer Attribution */}
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface space-y-3">
          <span className="text-xs font-bold text-slate-700 dark:text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand" /> System Architecture Attribution
          </span>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-surface-elevated/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Layer</span>
              <span className="font-bold text-slate-900 dark:text-text-primary">{event.layer}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-surface-elevated/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Responsible Source</span>
              <span className="font-bold text-slate-900 dark:text-text-primary font-mono">{event.source || "AGENT"}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-surface-elevated/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Event Signature</span>
              <span className="font-semibold text-slate-800 dark:text-text-primary font-mono text-[11px]">{event.event}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-surface-elevated/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ledger Integrity</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Immutable
              </span>
            </div>
          </div>
        </div>

        {/* 4. Structured Technical Details (Policy / Gateway / Idempotency) */}
        {event.details && (
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-brand" /> Structured Technical Telemetry
            </span>

            <div className="space-y-2 text-xs">
              {event.details.policyRule && (
                <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-surface-elevated/40">
                  <span className="text-slate-500">Evaluated Rule</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-text-primary">{event.details.policyRule}</span>
                </div>
              )}
              {event.details.threshold && (
                <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-surface-elevated/40">
                  <span className="text-slate-500">Permitted Threshold</span>
                  <span className="font-mono text-slate-800 dark:text-text-primary">{event.details.threshold}</span>
                </div>
              )}
              {event.details.actualValue && (
                <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-surface-elevated/40">
                  <span className="text-slate-500">Observed Value</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-text-primary">{event.details.actualValue}</span>
                </div>
              )}
              {event.details.idempotencyKey && (
                <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-surface-elevated/40">
                  <span className="text-slate-500">Idempotency Token</span>
                  <span className="font-mono text-slate-800 dark:text-text-primary text-[10px] truncate max-w-[200px]">
                    {event.details.idempotencyKey}
                  </span>
                </div>
              )}
              {event.details.gateway && (
                <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-surface-elevated/40">
                  <span className="text-slate-500">Gateway Target</span>
                  <span className="font-semibold text-slate-800 dark:text-text-primary">{event.details.gateway}</span>
                </div>
              )}
              {event.details.transactionId && (
                <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-surface-elevated/40">
                  <span className="text-slate-500">Transaction Ref</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{event.details.transactionId}</span>
                </div>
              )}
              {event.details.amount && (
                <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-surface-elevated/40">
                  <span className="text-slate-500">Transaction Value</span>
                  <span className="font-bold text-slate-900 dark:text-text-primary">{formatCurrency(event.details.amount)}</span>
                </div>
              )}
              {event.details.nextAction && (
                <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-surface-elevated/40">
                  <span className="text-slate-500">Next Action</span>
                  <span className="font-medium text-brand">{event.details.nextAction}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Navigation Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-border-subtle">
          <Link
            href={`/cases/${event.case}`}
            onClick={onClose}
            className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1.5"
          >
            Open Case Workspace <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-text-primary font-medium"
          >
            Close Drawer
          </button>
        </div>

      </div>
    </Drawer>
  );
}
