import React from "react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/Tooltip";
import { Info } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  className?: string;
  valueClassName?: string;
  badge?: string;
  tooltip?: string;
}

export function MetricCard({
  title,
  value,
  trend,
  trendUp,
  subtitle,
  className,
  valueClassName,
  badge,
  tooltip,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm",
        "flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-border-subtle/80",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-muted">
            {title}
          </span>
          {tooltip && (
            <Tooltip content={tooltip}>
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-text-secondary cursor-help transition-colors" />
            </Tooltip>
          )}
        </div>
        {badge && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-surface-elevated text-slate-600 dark:text-text-secondary border border-slate-200 dark:border-border-subtle">
            {badge}
          </span>
        )}
      </div>


      <div className="flex items-baseline justify-between gap-3">
        <div
          className={cn(
            "text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-text-primary",
            valueClassName
          )}
        >
          {value}
        </div>
        {trend && (
          <div
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
              trendUp
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
            )}
          >
            <span>{trendUp ? "↑" : "↓"}</span>
            <span>{trend}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-2.5 text-xs text-slate-500 dark:text-text-muted leading-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
}

