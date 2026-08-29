"use client";

import React, { useState } from "react";
import { 
  Settings, 
  Key, 
  Webhook, 
  ShieldCheck, 
  Building, 
  Bell, 
  Check, 
  Copy,
  ExternalLink,
  Lock
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const copyToClipboard = (text: string, type: "key" | "webhook") => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      toast({
        title: "API Key Copied",
        description: "Razorpay Key ID copied to clipboard.",
        type: "success",
      });
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedWebhook(true);
      toast({
        title: "Webhook Endpoint Copied",
        description: "Layer 0 Webhook URL copied to clipboard.",
        type: "success",
      });
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16 max-w-5xl">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-text-primary">
              Merchant Settings
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
              Test Environment
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-text-muted mt-1 font-normal">
            Configure gateway connectivity, webhook listeners, and recovery engine parameters
          </p>
        </div>
      </div>

      {/* 2. Merchant Profile Section */}
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-border-subtle">
          <Building className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
            Merchant Entity
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-500 dark:text-text-muted font-medium">Business Name</label>
            <input 
              disabled 
              value="Acme Corp India Pvt Ltd" 
              className="mt-1 w-full bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 text-slate-800 dark:text-text-primary font-medium"
            />
          </div>
          <div>
            <label className="text-slate-500 dark:text-text-muted font-medium">Merchant ID (MID)</label>
            <input 
              disabled 
              value="mid_rzp_live_99401" 
              className="mt-1 w-full bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 font-mono text-slate-800 dark:text-text-primary font-medium"
            />
          </div>
        </div>
      </div>

      {/* 3. Razorpay API Gateway Credentials */}
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-border-subtle">
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
              Razorpay API Connectivity
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
            Connected (200 OK)
          </span>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-500 dark:text-text-muted font-medium">Key ID</label>
            <div className="mt-1 flex items-center gap-2">
              <input 
                disabled 
                value="rzp_test_9048aK921xLm0Q" 
                className="flex-1 bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 font-mono text-slate-800 dark:text-text-primary"
              />
              <button 
                onClick={() => copyToClipboard("rzp_test_9048aK921xLm0Q", "key")}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-border-subtle bg-white dark:bg-surface text-slate-600 hover:text-brand transition-colors text-xs font-medium flex items-center gap-1"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-500 dark:text-text-muted font-medium">Key Secret</label>
            <input 
              disabled 
              type="password"
              value="••••••••••••••••••••••••••••••••" 
              className="mt-1 w-full bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 font-mono text-slate-800 dark:text-text-primary"
            />
          </div>
        </div>
      </div>

      {/* 4. Ingestion Webhook Listener */}
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-border-subtle">
          <div className="flex items-center gap-2.5">
            <Webhook className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
              Webhook Endpoint (Layer 0 Ingestion)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Events: payment.failed, order.paid
          </span>
        </div>

        <div className="text-xs space-y-2">
          <label className="text-slate-500 dark:text-text-muted font-medium">Webhook URL</label>
          <div className="flex items-center gap-2">
            <input 
              disabled 
              value="https://reclaim-api.acme.corp/api/v1/webhooks/razorpay" 
              className="flex-1 bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-lg px-3 py-2 font-mono text-slate-800 dark:text-text-primary text-[11px]"
            />
            <button 
              onClick={() => copyToClipboard("https://reclaim-api.acme.corp/api/v1/webhooks/razorpay", "webhook")}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-border-subtle bg-white dark:bg-surface text-slate-600 hover:text-brand transition-colors text-xs font-medium flex items-center gap-1"
            >
              {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedWebhook ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

