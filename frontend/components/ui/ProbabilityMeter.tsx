import React from "react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/Tooltip";

export function ProbabilityMeter({ 
  probability, 
  className,
  showTooltip = true,
}: { 
  probability: number; 
  className?: string;
  showTooltip?: boolean;
}) {
  const isHigh = probability >= 0.6;
  const isMedium = probability >= 0.3 && probability < 0.6;
  
  const percent = Math.max(0, Math.min(100, Math.round(probability * 100)));
  const label = isHigh ? "High Recovery Potential" : isMedium ? "Medium Potential (Requires Fallback)" : "Low / Unlikely (Fraud Filtered)";
  
  const content = (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div className="w-16 sm:w-20 h-1.5 bg-slate-100 dark:bg-surface-elevated rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            isHigh 
              ? "bg-emerald-500" 
              : isMedium 
              ? "bg-amber-500" 
              : "bg-rose-500"
          )} 
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={cn(
        "text-xs font-semibold tabular-nums",
        isHigh 
          ? "text-emerald-700 dark:text-emerald-400" 
          : isMedium 
          ? "text-amber-700 dark:text-amber-400" 
          : "text-rose-700 dark:text-rose-400"
      )}>
        {percent}%
      </span>
    </div>
  );

  if (!showTooltip) return content;

  return (
    <Tooltip content={`${percent}% Probability • ${label}`}>
      {content}
    </Tooltip>
  );
}


