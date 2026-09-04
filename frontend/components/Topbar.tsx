"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  Search, 
  Menu, 
  LayoutDashboard, 
  AlertTriangle, 
  Briefcase, 
  Sparkles, 
  BarChart3, 
  History, 
  ShieldCheck, 
  Megaphone, 
  MessageSquare, 
  Settings, 
  ChevronDown, 
  Activity, 
  Bell, 
  Moon, 
  Sun, 
  Zap, 
  FileText, 
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";
import { useReclaim } from "@/lib/context/ReclaimContext";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || "/";
  const { cases, auditEvents, metrics, isBackendUnavailable, setSelectedCaseId } = useReclaim();
  const { toast } = useToast();

  // Interactive UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [testMode, setTestMode] = useState(!isBackendUnavailable);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut (⌘K or Ctrl+K) to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
        setIsMoreMenuOpen(false);
        setIsProfileOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch (e) {}
  };

  const handleToggleMode = () => {
    const newMode = !testMode;
    setTestMode(newMode);
    toast({
      title: newMode ? "Deterministic Demo Mode" : "Live Backend Engine",
      description: newMode 
        ? "Operating in safe deterministic evaluation mode with full benchmark dataset." 
        : "Connected to real-time FastAPI recovery backend & Razorpay webhook processor.",
      type: "info"
    });
  };

  // Filter cases for live search
  const filteredCases = searchQuery.trim() === "" ? [] : cases.filter(c => 
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.failureType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setSearchQuery("");
    setIsSearchOpen(false);
    router.push(`/cases/${caseId}`);
  };

  const recentAudit = auditEvents.slice(0, 4);

  return (
    <header className="w-full bg-[#0c1017] text-slate-200 border-b border-[#1c2333] z-40 flex-shrink-0 select-none shadow-sm relative">
      <div className="h-14 px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2">
        {/* Left: Brand Logo & Functional Reclaim Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 min-w-0">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors"
            aria-label="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Project Reclaim Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0 pr-1 sm:pr-2" title="Reclaim - Autonomous Revenue Recovery">
            <div className="bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg flex items-center justify-center shadow-sm border border-slate-200/20 transition-all group-hover:scale-105">
              <img 
                src="/logo.png" 
                alt="Reclaim Logo" 
                className="h-6 sm:h-7 w-auto object-contain"
              />
            </div>
          </Link>

          {/* Project-Relevant Top Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 text-[13px] font-medium text-slate-300">
            {/* Command Center */}
            <Link 
              href="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                currentPath === "/" 
                  ? "bg-[#1e293b] text-white font-semibold border border-slate-700 shadow-sm" 
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              <span>Command Center</span>
            </Link>

            {/* At-Risk Subscriptions */}
            <Link 
              href="/at-risk"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                currentPath.startsWith("/at-risk")
                  ? "bg-[#1e293b] text-white font-semibold border border-slate-700 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>At-Risk</span>
              {metrics.activeAtRiskCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {metrics.activeAtRiskCount}
                </span>
              )}
            </Link>

            {/* Cases */}
            <Link 
              href="/cases"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                currentPath.startsWith("/cases")
                  ? "bg-[#1e293b] text-white font-semibold border border-slate-700 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Briefcase className="w-4 h-4 text-sky-400" />
              <span>Cases</span>
            </Link>

            {/* Evaluation */}
            <Link 
              href="/evaluation"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                currentPath.startsWith("/evaluation")
                  ? "bg-[#1e293b] text-white font-semibold border border-slate-700 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Evaluation</span>
            </Link>

            {/* Analytics */}
            <Link 
              href="/analytics"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                currentPath.startsWith("/analytics")
                  ? "bg-[#1e293b] text-white font-semibold border border-slate-700 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Analytics</span>
            </Link>

            {/* Audit Log */}
            <Link 
              href="/audit"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                currentPath.startsWith("/audit")
                  ? "bg-[#1e293b] text-white font-semibold border border-slate-700 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <History className="w-4 h-4 text-purple-400" />
              <span>Audit Trail</span>
            </Link>

            {/* More Functional Dropdown */}
            <div className="relative" ref={moreRef}>
              <button 
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors ${
                  isMoreMenuOpen || ["/campaigns", "/communications", "/policy", "/settings"].some(p => currentPath.startsWith(p))
                    ? "text-white bg-slate-800"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isMoreMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute left-0 mt-2 w-52 rounded-xl bg-[#141a27] border border-slate-700/80 shadow-2xl py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                  <Link
                    href="/campaigns"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <Megaphone className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-semibold">Campaigns</div>
                      <div className="text-[10px] text-slate-400">Multi-channel recovery outreach</div>
                    </div>
                  </Link>

                  <Link
                    href="/communications"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-semibold">Communications</div>
                      <div className="text-[10px] text-slate-400">AI drafted WhatsApp & SMS</div>
                    </div>
                  </Link>

                  <div className="my-1 border-t border-slate-700/60" />

                  <Link
                    href="/policy"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold">Policy Center</div>
                      <div className="text-[10px] text-slate-400">Risk boundaries & recovery rules</div>
                    </div>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="font-semibold">Settings</div>
                      <div className="text-[10px] text-slate-400">API keys & model config</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Center: Interactive Mode Notch & Quick Execution Shortcuts */}
        <div className="hidden xl:flex items-center justify-center">
          <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#131926] border border-[#252f44] text-xs shadow-inner">
            {/* Interactive Mode Toggle */}
            <button 
              onClick={handleToggleMode}
              className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide hover:opacity-90 transition-opacity"
              title="Click to toggle between Live Backend and Safe Demo Mode"
            >
              <span className={`w-6 h-3.5 rounded-full flex items-center p-0.5 transition-colors ${testMode ? "bg-[#10b981] justify-end" : "bg-blue-600 justify-end"}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm animate-pulse"></span>
              </span>
              <span className={testMode ? "text-emerald-400 font-mono text-[10px]" : "text-blue-400 font-mono text-[10px]"}>
                {testMode ? "TEST MODE" : "LIVE ENGINE"}
              </span>
            </button>

            <span className="text-slate-700">|</span>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 text-slate-400">
              <button 
                onClick={() => {
                  searchInputRef.current?.focus();
                  setIsSearchOpen(true);
                }}
                className="hover:text-slate-200 transition-colors p-0.5" 
                title="Quick Search Cases (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              <button 
                onClick={() => router.push("/evaluation")}
                className="hover:text-amber-300 transition-colors p-0.5" 
                title="Launch Batch AI Evaluation"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400/80" />
              </button>

              <button 
                onClick={() => router.push("/policy")}
                className="hover:text-emerald-300 transition-colors p-0.5" 
                title="View Active Policy Rules"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Working Search Dropdown, Analytics Button, Notifications Dropdown, Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Interactive Search Bar with Live Case Filtering */}
          <div className="relative hidden md:block" ref={searchRef}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-56 lg:w-72 pl-8 pr-8 py-1.5 text-xs rounded-lg bg-[#141a27] border border-[#263147] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] transition-all"
              placeholder="Search cases, customers, failure..."
            />
            {searchQuery ? (
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-500 bg-[#1c2438] border border-slate-700/60 rounded">
                  ⌘K
                </kbd>
              </div>
            )}

            {/* Live Search Results Dropdown */}
            {isSearchOpen && searchQuery.trim() !== "" && (
              <div className="absolute right-0 mt-2 w-80 lg:w-96 rounded-xl bg-[#141a27] border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Matching Recovery Cases ({filteredCases.length})
                </div>
                {filteredCases.length > 0 ? (
                  <div className="space-y-1 mt-1">
                    {filteredCases.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCase(c.id)}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white truncate">{c.customer}</span>
                            <span className="font-mono text-[10px] text-slate-400">{c.id}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                            <span className="text-amber-400">{c.failureType}</span>
                            <span>•</span>
                            <span>{c.paymentMethod}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-mono font-bold text-xs text-emerald-400">
                            {formatCurrency(c.amount)}
                          </div>
                          <div className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 mt-0.5">
                            {c.status}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No cases matching &quot;{searchQuery}&quot;
                  </div>
                )}
                <div className="border-t border-slate-700/60 mt-2 pt-2 px-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Press <kbd className="bg-slate-800 px-1 py-0.5 rounded">ESC</kbd> to exit</span>
                  <Link 
                    href="/cases" 
                    onClick={() => setIsSearchOpen(false)}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                  >
                    View all cases <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Performance Analytics Button */}
          <button 
            onClick={() => router.push("/analytics")}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
              currentPath === "/analytics"
                ? "bg-slate-800 text-emerald-400 border-emerald-500/50"
                : "bg-[#141a27] border-[#263147] text-slate-400 hover:text-white hover:bg-[#1e2638]"
            }`}
            title="Performance Analytics & Telemetry"
            aria-label="Analytics"
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Audit & Recovery Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`relative w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                isNotificationsOpen
                  ? "bg-slate-800 text-white border-slate-600"
                  : "bg-[#141a27] border-[#263147] text-slate-400 hover:text-white hover:bg-[#1e2638]"
              }`}
              title="Audit Alerts & Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {recentAudit.length > 0 && (
                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-[#0c1017] animate-pulse" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#141a27] border border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 mb-2">
                  <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Recent Audit Events</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Live Stream</span>
                </div>

                <div className="space-y-2">
                  {recentAudit.map((evt) => (
                    <div key={evt.id} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 text-[11px] truncate">{evt.event}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {evt.desc || `Action executed for case ${evt.case}`}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/60 text-center">
                  <Link 
                    href="/audit"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1"
                  >
                    Open Immutable Audit Trail <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg bg-[#141a27] border border-[#263147] flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1e2638] transition-colors"
            title="Toggle Light / Dark Mode"
            aria-label="Toggle Theme"
          >
            <Sun className="h-3.5 w-3.5 hidden dark:block text-amber-400" />
            <Moon className="h-3.5 w-3.5 block dark:hidden text-slate-400" />
          </button>

          {/* User Profile Dropdown Menu */}
          <div className="relative pl-1" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="h-8 px-2 rounded-lg bg-[#141a27] border border-[#263147] flex items-center gap-1.5 hover:bg-[#1e2638] transition-colors"
              title="Vishal Lakshmikanthan (Admin Profile)"
            >
              <div className="w-5 h-5 rounded bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white tracking-tighter shadow-sm">
                VL
              </div>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Profile Menu Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-xl bg-[#141a27] border border-slate-700 shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-700/60 mb-1">
                  <div className="font-bold text-white">Vishal Lakshmikanthan</div>
                  <div className="text-[10px] text-slate-400 truncate">vishal@reclaim-recovery.ai</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-semibold text-emerald-400">Razorpay Live Admin</span>
                  </div>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Account & Integrations</span>
                </Link>

                <Link
                  href="/policy"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Recovery Policy Center</span>
                </Link>

                <div className="my-1 border-t border-slate-700/60" />

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    toast({
                      title: "Telemetry Refreshed",
                      description: "Session telemetry synchronized with FastAPI recovery backend.",
                      type: "success"
                    });
                  }}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <span>Refresh Telemetry Cache</span>
                  <span className="text-[10px] font-mono text-emerald-400">OK</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

