"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  MessageSquare, 
  Smartphone, 
  Send, 
  CheckCircle2, 
  Copy, 
  Sparkles, 
  PhoneCall, 
  Mail, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  ExternalLink,
  Clock,
  Check,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useReclaim } from "@/lib/context/ReclaimContext";
import { CommunicationMessage, CommunicationChannel } from "@/lib/communications/types";
import { generateRecoveryMessage } from "@/lib/communications/templateEngine";

export default function CommunicationsStudioPage() {
  const { toast } = useToast();
  const { communications, cases, sendCommunicationMessage } = useReclaim();

  const [selectedMsgId, setSelectedMsgId] = useState<string>(communications[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "DELIVERED" | "BLOCKED" | "CONVERTED">("ALL");
  const [selectedLanguage, setSelectedLanguage] = useState<"English" | "Hinglish">("Hinglish");
  const [selectedChannel, setSelectedChannel] = useState<CommunicationChannel>("whatsapp");
  const [copied, setCopied] = useState(false);

  const selectedMsg = useMemo(() => {
    return communications.find((m) => m.id === selectedMsgId) || communications[0];
  }, [communications, selectedMsgId]);

  // Associated live case
  const associatedCase = useMemo(() => {
    if (!selectedMsg) return null;
    return cases.find((c) => c.id === selectedMsg.caseId) || null;
  }, [selectedMsg, cases]);

  // Dynamic preview message based on current studio controls
  const previewContent = useMemo(() => {
    if (!associatedCase) return selectedMsg?.content || "";
    return generateRecoveryMessage(associatedCase, selectedChannel, selectedLanguage, selectedMsg?.campaignName);
  }, [associatedCase, selectedChannel, selectedLanguage, selectedMsg]);

  // Aggregate metrics
  const totalSent = communications.length;
  const deliveredCount = communications.filter(c => c.status === "DELIVERY_CONFIRMED_SIMULATED").length;
  const convertedCount = communications.filter(c => c.recoveredAfter).length;
  const blockedCount = communications.filter(c => c.status === "BLOCKED").length;

  const filteredMessages = useMemo(() => {
    return communications.filter((msg) => {
      const matchesSearch = 
        msg.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.content.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === "DELIVERED") return msg.status === "DELIVERY_CONFIRMED_SIMULATED";
      if (activeFilter === "BLOCKED") return msg.status === "BLOCKED";
      if (activeFilter === "CONVERTED") return msg.recoveredAfter;

      return true;
    });
  }, [communications, searchQuery, activeFilter]);

  const handleCopy = () => {
    navigator.clipboard.writeText(previewContent);
    setCopied(true);
    toast({ title: "Copied to Clipboard", description: "Message template text copied.", type: "info" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateSend = async () => {
    if (!associatedCase) return;
    await sendCommunicationMessage(associatedCase.id, selectedChannel, selectedLanguage);
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
              Personalized Hinglish & English
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-text-muted mt-1 font-normal">
            Autonomous multi-channel recovery messaging with localized tone and contact caps
          </p>
        </div>
      </div>

      {/* 2. Top Analytics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Messages Dispatched</span>
          <span className="text-2xl font-black text-slate-900 dark:text-text-primary font-mono mt-0.5 block">{totalSent}</span>
          <span className="text-[11px] text-slate-400 mt-0.5">Simulated multi-channel</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Delivery Rate</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
            {totalSent > 0 ? Math.round((deliveredCount / totalSent) * 100) : 100}%
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">{deliveredCount} confirmed delivered</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Post-Nudge Recoveries</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">{convertedCount}</span>
          <span className="text-[11px] text-slate-400 mt-0.5">Settled via 1-click link</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Contact Cap Blocks</span>
          <span className="text-2xl font-black text-brand font-mono mt-0.5 block">{blockedCount}</span>
          <span className="text-[11px] text-slate-400 mt-0.5">Spam prevention guardrail</span>
        </div>
      </div>

      {/* 3. Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Message Queue Log (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl shadow-sm overflow-hidden flex flex-col">
          
          <div className="p-4 border-b border-slate-200/80 dark:border-border-subtle bg-slate-50/50 dark:bg-surface space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-text-primary">
                Outbound Message Queue
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {filteredMessages.length} Messages
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search customer, case, or text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-border-subtle bg-white dark:bg-surface-elevated text-slate-800 dark:text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-border-subtle max-h-[560px] overflow-y-auto">
            {filteredMessages.map((msg) => {
              const isSelected = selectedMsg?.id === msg.id;
              return (
                <div 
                  key={msg.id}
                  onClick={() => {
                    setSelectedMsgId(msg.id);
                    setSelectedLanguage(msg.language);
                    setSelectedChannel(msg.channel);
                  }}
                  className={cn(
                    "p-4 cursor-pointer transition-colors relative",
                    isSelected 
                      ? "bg-brand/5 dark:bg-brand-muted/40 border-l-4 border-brand" 
                      : "hover:bg-slate-50 dark:hover:bg-surface-elevated/40"
                  )}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 dark:text-text-primary">
                      {msg.customerName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {formatCurrency(msg.amount)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-text-secondary line-clamp-2 leading-relaxed mb-2">
                    &quot;{msg.content}&quot;
                  </p>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-slate-400 uppercase">
                      {msg.channelName} • {msg.language}
                    </span>
                    <span className={cn(
                      "font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                      msg.recoveredAfter ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" :
                      msg.status === "BLOCKED" ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300" :
                      "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                    )}>
                      {msg.recoveredAfter ? "Recovered" : msg.status.replace("_SIMULATED", "")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Interactive Studio & Live Preview (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl shadow-sm p-6 space-y-6">
          
          {selectedMsg ? (
            <>
              {/* Studio Header & Dynamic Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-border-subtle">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-brand" /> Interactive Message Studio
                  </span>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-text-muted">
                    <span>Target: <strong>{selectedMsg.customerName}</strong></span>
                    <span>•</span>
                    <Link 
                      href={`/cases/${selectedMsg.caseId}`}
                      className="text-brand hover:underline font-mono inline-flex items-center gap-0.5"
                    >
                      {selectedMsg.caseId} <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Language / Tone Toggle */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-surface-elevated rounded-lg text-xs font-semibold self-start sm:self-auto">
                  <button
                    onClick={() => setSelectedLanguage("Hinglish")}
                    className={cn(
                      "px-2.5 py-1 rounded transition-colors",
                      selectedLanguage === "Hinglish" ? "bg-white dark:bg-surface text-brand shadow-xs" : "text-slate-500"
                    )}
                  >
                    🇮🇳 Hinglish
                  </button>
                  <button
                    onClick={() => setSelectedLanguage("English")}
                    className={cn(
                      "px-2.5 py-1 rounded transition-colors",
                      selectedLanguage === "English" ? "bg-white dark:bg-surface text-brand shadow-xs" : "text-slate-500"
                    )}
                  >
                    Standard English
                  </button>
                </div>
              </div>

              {/* Channel Selector */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-700 dark:text-text-secondary uppercase text-[10px] tracking-wider block">
                  Select Dispatch Channel
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setSelectedChannel("whatsapp")}
                    className={cn(
                      "p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all",
                      selectedChannel === "whatsapp" ? "border-brand bg-brand/5 dark:bg-brand-muted/20" : "border-slate-200 dark:border-border-subtle hover:bg-slate-50"
                    )}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-text-primary block text-[11px]">WhatsApp</span>
                      <span className="text-[9px] text-slate-400 font-mono">Verified API</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedChannel("sms")}
                    className={cn(
                      "p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all",
                      selectedChannel === "sms" ? "border-brand bg-brand/5 dark:bg-brand-muted/20" : "border-slate-200 dark:border-border-subtle hover:bg-slate-50"
                    )}
                  >
                    <MessageSquare className="w-4 h-4 text-sky-500" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-text-primary block text-[11px]">SMS Nudge</span>
                      <span className="text-[9px] text-slate-400 font-mono">DLT Registered</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedChannel("email")}
                    className={cn(
                      "p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all",
                      selectedChannel === "email" ? "border-brand bg-brand/5 dark:bg-brand-muted/20" : "border-slate-200 dark:border-border-subtle hover:bg-slate-50"
                    )}
                  >
                    <Mail className="w-4 h-4 text-indigo-500" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-text-primary block text-[11px]">Email</span>
                      <span className="text-[9px] text-slate-400 font-mono">B2B Invoice</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedChannel("in_app")}
                    className={cn(
                      "p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all",
                      selectedChannel === "in_app" ? "border-brand bg-brand/5 dark:bg-brand-muted/20" : "border-slate-200 dark:border-border-subtle hover:bg-slate-50"
                    )}
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-text-primary block text-[11px]">In-App</span>
                      <span className="text-[9px] text-slate-400 font-mono">Checkout Banner</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Live Simulated Device Bubble Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-text-secondary uppercase text-[10px] tracking-wider">
                    Customer Experience Preview ({selectedChannel.toUpperCase()})
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Character Count: {previewContent.length}
                  </span>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-100/70 dark:bg-surface-elevated/80 border border-slate-200/80 dark:border-border-subtle space-y-3">
                  
                  {/* WhatsApp-style bubble */}
                  <div className="max-w-md p-3.5 rounded-2xl rounded-tl-none bg-white dark:bg-surface shadow-xs border border-slate-200/60 dark:border-border-subtle text-xs text-slate-800 dark:text-text-primary leading-relaxed space-y-2">
                    <p>{previewContent}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-border-subtle font-mono">
                      <span>Razorpay Verified Recovery</span>
                      <span>Just now • ✓✓</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Policy & Contact Guardrails Status */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface-elevated/40 border border-slate-200/80 dark:border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Policy: Approved for Dispatch</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="text-slate-600 dark:text-text-secondary">
                    Contact Cap: <strong>{selectedMsg.contactCount} / {selectedMsg.maxContacts}</strong> in 24h
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-border-subtle bg-white dark:bg-surface text-slate-700 dark:text-text-secondary font-medium hover:bg-slate-50 transition-colors flex items-center gap-1 text-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    onClick={handleSimulateSend}
                    className="px-3.5 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold shadow-xs flex items-center gap-1 text-xs active:scale-[0.98] transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Simulate Dispatch</span>
                  </button>
                </div>
              </div>

            </>
          ) : (
            <div className="py-16 text-center text-slate-400">
              Select a message from the queue to inspect.
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
