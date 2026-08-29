import React from "react";
import { cn } from "@/lib/utils";

type StatusType = "recovered" | "atRisk" | "inProgress" | "escalated" | "stopped";

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
};

export function StatusBadge({ status, className }: { status: StatusType; className?: string }) {
  const config = statusConfig[status];
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
      config.bg,
      config.text,
      className
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
