import React from "react";
import { cn } from "@/lib/utils";
import { Check, X, AlertCircle } from "lucide-react";

interface PolicyCheckProps {
  name: string;
  value: string;
  status: "pass" | "fail" | "warn";
  description?: string;
}

export function PolicyCheck({ name, value, status, description }: PolicyCheckProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-border-subtle last:border-0">
      <div
        className={cn(
          "mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-white",
          status === "pass" && "bg-emerald-500",
          status === "fail" && "bg-rose-500",
          status === "warn" && "bg-amber-500"
        )}
      >
        {status === "pass" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
        {status === "fail" && <X className="w-2.5 h-2.5 stroke-[3]" />}
        {status === "warn" && <AlertCircle className="w-2.5 h-2.5 stroke-[3]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-900 dark:text-text-primary truncate">
            {name}
          </p>
          <span className="text-[11px] font-mono font-medium text-slate-700 dark:text-text-secondary bg-slate-100 dark:bg-surface-elevated px-2 py-0.5 rounded border border-slate-200/80 dark:border-border-subtle whitespace-nowrap">
            {value}
          </span>
        </div>
        {description && (
          <p className="text-[11px] text-slate-500 dark:text-text-muted mt-0.5 leading-snug">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

