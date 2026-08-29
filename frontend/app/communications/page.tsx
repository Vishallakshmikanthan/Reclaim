"use client";

import React, { useState } from "react";
import { MessageSquare, Smartphone, Send, CheckCircle2, Copy, Sparkles, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";

const MESSAGES = [
  {
    id: "MSG-001",
    customer: "Priya S.",
    time: "10 mins ago",
    type: "SMS Payment Link",
    channel: "Gupshup SMS",
    status: "Delivered",
    content: "Hi Priya, aapki Acme Corp pe ₹8,499 ki payment incomplete rahi. Yahan se complete karein: rzp.io/l/x8j92k. Link 24 ghante valid hai. 😊",
    intent: "Temporary Gateway Timeout",
    language: "Hinglish"
  },
  {
    id: "MSG-002",
    customer: "Anita K.",
    time: "1 hour ago",
    type: "UPI Nudge",
    channel: "WhatsApp Business",
    status: "Delivered & Read",
    content: "Namaste Anita ji, aapka ₹4,500 ka order pending hai due to insufficient balance. Aap alternate UPI app se payment complete kar sakte hain: rzp.io/l/a9k21w",
    intent: "Insufficient Funds",
    language: "Hinglish"
  },
  {
    id: "MSG-003",
    customer: "Vikram B.",
    time: "2 hours ago",
    type: "Checkout Recovery",
    channel: "WhatsApp Business",
    status: "Converted (Paid)",
    content: "Hi Vikram, looks like you left something behind! Complete your ₹18,999 checkout with 1-click Razorpay link: rzp.io/l/v7b91q. Valid for next 2 hours.",
    intent: "Cart Abandonment",
    language: "English"
  }
];

export default function CommunicationsPage() {
  const [selectedMsg, setSelectedMsg] = useState(MESSAGES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedMsg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-text-primary">
              AI Communications Studio
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand dark:bg-brand-muted border border-brand/20">
              Personalized Hinglish
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-text-muted mt-1 font-normal">
            Autonomous multi-channel recovery messaging with localized tone of voice
          </p>
        </div>
      </div>

      {/* 2. Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Message Dispatch Log */}
        <div className="lg:col-span-5 bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200/80 dark:border-border-subtle bg-slate-50/50 dark:bg-surface flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
              Outbound Message Queue
            </h3>
            <span className="text-xs text-slate-500 font-mono">3 Recent</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-border-subtle">
            {MESSAGES.map((msg) => {
              const isSelected = selectedMsg.id === msg.id;
              return (
                <div 
                  key={msg.id}
                  onClick={() => setSelectedMsg(msg)}
                  className={cn(
                    "p-4 cursor-pointer transition-colors relative",
                    isSelected 
                      ? "bg-brand/5 dark:bg-brand-muted/40 border-l-4 border-brand" 
                      : "hover:bg-slate-50 dark:hover:bg-surface-elevated/40"
                  )}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-900 dark:text-text-primary">
                      {msg.customer}
                    </span>
                    <span className="text-slate-400 dark:text-text-muted text-[11px]">
                      {msg.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-text-secondary">
                    <span className="font-medium text-brand">{msg.type}</span>
                    <span>•</span>
                    <span className="text-slate-500">{msg.channel}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-text-muted line-clamp-1">
                    {msg.content}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Phone Device Frame Preview */}
        <div className="lg:col-span-7 bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-6 sm:p-8 shadow-sm flex flex-col items-center justify-center">
          
          <div className="w-full flex items-center justify-between mb-6 pb-3 border-b border-slate-100 dark:border-border-subtle">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              <span className="text-xs font-semibold text-slate-900 dark:text-text-primary uppercase tracking-wider">
                Live Customer Screen Preview
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-slate-400">{selectedMsg.language}</span>
              <button 
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-brand px-2 py-1 rounded bg-slate-100 dark:bg-surface-elevated transition-colors"
              >
                <Copy className="w-3 h-3" />
                {copied ? "Copied!" : "Copy Payload"}
              </button>
            </div>
          </div>

          {/* Smartphone Frame */}
          <div className="w-full max-w-sm rounded-[28px] border-4 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-surface-elevated p-4 shadow-xl">
            {/* Speaker bar */}
            <div className="w-16 h-1 bg-slate-400 dark:bg-slate-600 rounded-full mx-auto mb-4" />
            
            {/* Header info */}
            <div className="text-center pb-3 mb-4 border-b border-slate-200 dark:border-border-subtle">
              <div className="w-10 h-10 rounded-full bg-brand text-white font-bold flex items-center justify-center mx-auto text-sm shadow-sm mb-1.5">
                R
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-text-primary">
                Acme Corp (RECLAIM Verified)
              </div>
              <div className="text-[10px] text-slate-500">
                Official Recovery Channel
              </div>
            </div>

            {/* Chat Bubble */}
            <div className="space-y-3">
              <div className="bg-white dark:bg-surface rounded-2xl rounded-tl-sm p-4 border border-slate-200/80 dark:border-border-subtle shadow-sm space-y-2">
                <p className="text-xs sm:text-sm text-slate-800 dark:text-text-primary leading-relaxed font-sans">
                  {selectedMsg.content}
                </p>
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-1">
                  <span>14:32</span>
                  <CheckCircle2 className="w-3 h-3 text-brand" />
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-[10px] text-slate-400">
              Protected by 256-bit Razorpay encryption
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

