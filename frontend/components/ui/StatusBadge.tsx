import React from "react";
import { cn } from "@/lib/utils";

export type StatusType = 
  | "recovered" 
  | "atRisk" 
  | "inProgress" 
  | "escalated" 
  | "stopped"
  | "failed"
  | "blocked"
  | "executing"
  | "pending";

const statusConfig: Record<StatusType, { label: string; bg: string; text: string; dot: string }> = {
  recovered: {
    label: "Recovered",
    bg: "bg-status-recovered-soft",
    text: "text-status-recovered",
    dot: "bg-status-recovered",
  },
  atRisk: {
    label: "At Risk",
    bg: "bg-status-atRisk-soft",
    text: "text-status-atRisk",
    dot: "bg-status-atRisk",
  },
  inProgress: {
    label: "In Progress",
    bg: "bg-status-inProgress-soft",
    text: "text-status-inProgress",
    dot: "bg-status-inProgress",
  },
  escalated: {
    label: "Escalated",
    bg: "bg-status-escalated-soft",
    text: "text-status-escalated",
    dot: "bg-status-escalated",
  },
  stopped: {
    label: "Stopped",
    bg: "bg-status-stopped-soft",
    text: "text-status-stopped",
    dot: "bg-status-stopped",
  },
  failed: {
    label: "Failed",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  blocked: {
    label: "Policy Blocked",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  executing: {
    label: "Executing",
    bg: "bg-indigo-50 dark:bg-brand-muted/40",
    text: "text-brand",
    dot: "bg-brand animate-pulse",
  },
  pending: {
    label: "Pending",
    bg: "bg-slate-100 dark:bg-surface-elevated",
    text: "text-slate-600 dark:text-text-muted",
    dot: "bg-slate-400",
  },
};

export function StatusBadge({ 
  status, 
  className,
  size = "md",
}: { 
  status: StatusType; 
  className?: string;
  size?: "sm" | "md";
}) {
  const config = statusConfig[status] || statusConfig.inProgress;
  
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium tracking-tight rounded-md whitespace-nowrap transition-colors",
        size === "sm" ? "gap-1 px-2 py-0.5 text-[11px]" : "gap-1.5 px-2.5 py-1 text-xs",
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn("rounded-full flex-shrink-0", size === "sm" ? "w-1 h-1" : "w-1.5 h-1.5", config.dot)} />
      {config.label}
    </span>
  );
}


