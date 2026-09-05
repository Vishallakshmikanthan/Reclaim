"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useReclaim } from "@/lib/context/ReclaimContext";
import {
  LayoutDashboard,
  AlertTriangle,
  Briefcase,
  Megaphone,
  MessageSquare,
  BarChart3,
  History,
  ShieldCheck,
  Settings,
  Sparkles,
  ChevronRight,
  BookOpen
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse: externalOnToggleCollapse
}: SidebarProps) {
  const pathname = usePathname();
  const currentPath = pathname || "/";
  const { metrics } = useReclaim();

  // Support both internal and external collapse state
  const [internalCollapsed, setInternalCollapsed] = React.useState(false);
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalCollapsed;
  const toggleCollapse = externalOnToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const navSections = [
    {
      title: "OPERATIONS",
      items: [
        { name: "Command Center", href: "/", icon: LayoutDashboard, accentColor: "text-indigo-400" },
        { name: "At Risk", href: "/at-risk", icon: AlertTriangle, accentColor: "text-rose-400", badge: metrics.activeAtRiskCount > 0 ? metrics.activeAtRiskCount.toString() : undefined },
        { name: "Cases", href: "/cases", icon: Briefcase, accentColor: "text-sky-400" },
        { name: "Campaigns", href: "/campaigns", icon: Megaphone, accentColor: "text-amber-400" },
        { name: "Communications", href: "/communications", icon: MessageSquare, accentColor: "text-blue-400" },
      ]
    },
    {
      title: "INTELLIGENCE",
      items: [
        { name: "Evaluation", href: "/evaluation", icon: Sparkles, accentColor: "text-amber-400", badge: "Offline n=50" },
        { name: "Analytics", href: "/analytics", icon: BarChart3, accentColor: "text-emerald-400" },
        { name: "Audit Trail", href: "/audit", icon: History, accentColor: "text-purple-400" },
        { name: "Docs & FAQ", href: "/docs", icon: BookOpen, accentColor: "text-emerald-400", badge: "16 Levels" },
      ]
    },
    {
      title: "CONFIGURATION",
      items: [
        { name: "Policy Center", href: "/policy", icon: ShieldCheck, accentColor: "text-emerald-400" },
        { name: "Settings", href: "/settings", icon: Settings, accentColor: "text-slate-400" },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#1c2333] bg-[#0c1017] text-slate-300 transition-all duration-200 ease-in-out lg:static select-none",
        isCollapsed ? "w-16" : "w-64",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0 lg:shadow-none"
      )}>
        {/* Header / Brand (Mobile drawer only) */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#1c2333] flex-shrink-0 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5 group" onClick={onClose}>
            <div className="bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-sm flex items-center justify-center">
              <img src="/logo.png" alt="Reclaim Logo" className="h-6 w-auto object-contain" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                RECLAIM
                <span className="text-[9px] font-mono uppercase font-semibold px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800/60">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                Autonomous Recovery
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
          {navSections.map((section, idx) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  {section.title}
                </div>
              ) : (
                idx > 0 && <div className="my-2 border-t border-[#1c2333] mx-2" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = item.href === "/"
                    ? currentPath === "/"
                    : currentPath.startsWith(item.href);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      title={isCollapsed ? item.name : undefined}
                      className={cn(
                        "group flex items-center rounded-lg text-xs font-medium transition-all duration-150",
                        isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2",
                        isActive
                          ? "bg-[#1e293b] text-white font-semibold border border-slate-700/80 shadow-sm"
                          : "text-slate-400 hover:text-slate-100 hover:bg-[#151c2b] border border-transparent"
                      )}
                    >
                      <div className={cn("flex items-center min-w-0", isCollapsed ? "justify-center" : "gap-2.5")}>
                        <item.icon className={cn(
                          "w-4 h-4 flex-shrink-0 transition-transform duration-150 group-hover:scale-110",
                          isActive ? (item.accentColor || "text-white") : "text-slate-500 group-hover:text-slate-300"
                        )} />
                        {!isCollapsed && <span className="truncate">{item.name}</span>}
                      </div>
                      {!isCollapsed && item.badge && (
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          isActive
                            ? "bg-slate-700 text-white"
                            : item.badge.startsWith("+") || section.title === "OPERATIONS"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-slate-800 text-slate-400 border border-slate-700/60"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: User Profile & Collapse Toggle */}
        <div className="p-2 border-t border-[#1c2333] bg-[#090d14] flex-shrink-0 space-y-1">
          {/* User Profile Card */}
          <Link
            href="/settings"
            onClick={onClose}
            title={isCollapsed ? "Vishal Lakshmikanthan. (Settings)" : undefined}
            className={cn(
              "flex items-center rounded-lg hover:bg-[#151c2b] transition-colors border border-transparent hover:border-slate-800 group",
              isCollapsed ? "justify-center p-2" : "gap-2.5 p-2"
            )}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm flex-shrink-0">
              VL
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                  Vishal Lakshmikanthan.
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] font-medium text-slate-400 truncate">
                    Razorpay Live
                  </p>
                </div>
              </div>
            )}
          </Link>

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "hidden lg:flex items-center w-full rounded-lg text-slate-400 hover:text-white hover:bg-[#151c2b] transition-colors text-xs font-medium",
              isCollapsed ? "justify-center py-2" : "justify-between px-2.5 py-1.5"
            )}
          >
            {!isCollapsed && <span className="text-[11px] text-slate-400">Collapse sidebar</span>}
            <ChevronRight className={cn("w-4 h-4 transition-transform duration-200", !isCollapsed && "rotate-180")} />
          </button>
        </div>
      </aside>
    </>
  );
}
