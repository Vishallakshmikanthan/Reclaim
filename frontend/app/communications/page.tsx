import React from "react";
import { MessageSquare } from "lucide-react";

export default function CommunicationsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-text-primary tracking-tight">Communications</h1>
          <p className="text-sm text-slate-500 dark:text-text-muted mt-1">Review generated Hinglish recovery messages</p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-xl p-6 shadow-sm flex gap-6">
        <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-border-subtle pr-6">
          <div className="font-medium text-sm text-slate-900 dark:text-text-primary mb-4">Message Log</div>
          <div className="space-y-3">
            <div className="p-3 bg-brand/5 dark:bg-brand-muted/30 border-l-2 border-brand rounded-r">
              <div className="text-xs text-slate-500 dark:text-text-muted mb-1">Priya S. • 10 mins ago</div>
              <div className="text-sm font-medium text-slate-900 dark:text-text-primary">Payment Link</div>
            </div>
            <div className="p-3 hover:bg-slate-50 dark:hover:bg-surface-elevated cursor-pointer rounded">
              <div className="text-xs text-slate-500 dark:text-text-muted mb-1">Anita K. • 1 hour ago</div>
              <div className="text-sm font-medium text-slate-900 dark:text-text-primary">Nudge SMS</div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 bg-slate-50 dark:bg-surface-elevated rounded-xl border border-slate-200 dark:border-border-subtle p-8 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute top-4 left-4 text-xs font-medium text-slate-400">PREVIEW (SMS)</div>
          
          <div className="w-full max-w-sm bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-2xl rounded-bl-sm p-4 shadow-sm relative">
            <p className="text-[15px] text-slate-800 dark:text-text-primary leading-relaxed font-sans">
              Hi Priya, aapki Acme Corp pe ₹8,499 ki payment incomplete rahi. Yahan se complete karein: rzp.io/l/x8j92k. Link 24 ghante valid hai. 😊
            </p>
            <div className="text-[10px] text-slate-400 text-right mt-2">Sent via Gupshup</div>
          </div>
        </div>
      </div>
    </div>
  );
}
