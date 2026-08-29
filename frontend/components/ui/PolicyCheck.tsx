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
      <div className={cn(
        "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
        status === "pass" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
        status === "fail" && "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
        status === "warn" && "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
      )}>
        {status === "pass" && <Check className="w-3.5 h-3.5" />}
        {status === "fail" && <X className="w-3.5 h-3.5" />}
        {status === "warn" && <AlertCircle className="w-3.5 h-3.5" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-900 dark:text-text-primary">{name}</p>
          <span className="text-sm text-slate-600 dark:text-text-secondary font-mono bg-slate-50 dark:bg-surface px-2 py-0.5 rounded border border-slate-200 dark:border-border-subtle">
            {value}
          </span>
        </div>
        {description && (
          <p className="text-xs text-slate-500 dark:text-text-muted mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
