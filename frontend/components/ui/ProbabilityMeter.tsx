import React from "react";
import { cn } from "@/lib/utils";

export function ProbabilityMeter({ probability }: { probability: number }) {
  const isHigh = probability >= 0.6;
  const isMedium = probability >= 0.3 && probability < 0.6;
  
  const width = Math.max(5, Math.min(100, Math.round(probability * 100)));
  
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 h-2 bg-slate-100 dark:bg-surface-elevated rounded-full overflow-hidden shadow-inner">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            isHigh ? "bg-emerald-500" : isMedium ? "bg-amber-500" : "bg-rose-500"
          )} 
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-sm font-medium text-slate-700 dark:text-text-primary tabular-nums">
        {width}%
      </span>
    </div>
  );
}
