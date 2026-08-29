import React from "react";
import { LucideIcon, Search, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Search,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "p-12 text-center flex flex-col items-center justify-center rounded-xl bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-surface-elevated text-slate-400 dark:text-text-muted flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
        {title}
      </h4>
      <p className="text-xs text-slate-500 dark:text-text-muted mt-1 max-w-sm leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-brand hover:text-brand-hover bg-brand/10 hover:bg-brand/15 dark:bg-brand-muted dark:hover:bg-brand-muted/80 rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
