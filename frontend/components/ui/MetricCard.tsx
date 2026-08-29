import React from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  className?: string;
  valueClassName?: string;
}

export function MetricCard({
  title,
  value,
  trend,
  trendUp,
  subtitle,
  className,
  valueClassName,
}: MetricCardProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-xl p-6 shadow-sm",
      "flex flex-col transition-all duration-200 hover:shadow-md",
      className
    )}>
      <h3 className="text-sm font-medium text-slate-500 dark:text-text-secondary mb-2">
        {title}
      </h3>
      <div className="flex items-baseline gap-3">
        <span className={cn(
          "text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-text-primary",
          valueClassName
        )}>
          {value}
        </span>
        {trend && (
          <span className={cn(
            "text-sm font-medium flex items-center",
            trendUp ? "text-status-recovered" : "text-status-atRisk"
          )}>
            {trendUp ? "↑" : "↓"} {trend}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-2 text-sm text-slate-500 dark:text-text-muted">
          {subtitle}
        </p>
      )}
    </div>
  );
}
