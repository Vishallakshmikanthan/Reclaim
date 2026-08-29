"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const NAV_SECTIONS = [
  {
    title: "OPERATIONS",
    items: [
      { name: "Command Center", href: "/", icon: LayoutDashboard },
      { name: "At Risk", href: "/at-risk", icon: AlertTriangle, badge: "7" },
      { name: "Cases", href: "/cases", icon: Briefcase },
      { name: "Campaigns", href: "/campaigns", icon: Megaphone },
      { name: "Communications", href: "/communications", icon: MessageSquare },
    ]
  },
  {
    title: "INTELLIGENCE",
    items: [
      { name: "Evaluation", href: "/evaluation", icon: Sparkles, badge: "+42%" },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Audit Trail", href: "/audit", icon: History },
    ]
  },
  {
    title: "CONFIGURATION",
    items: [
      { name: "Policy Center", href: "/policy", icon: ShieldCheck },
      { name: "Settings", href: "/settings", icon: Settings },
    ]
  }
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:shadow-none"
      )}>
        {/* Header / Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200/80 dark:border-border-subtle flex-shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-sm group-hover:bg-brand-hover transition-colors">
              <span className="text-white text-sm font-black tracking-tighter">R</span>
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-text-primary flex items-center gap-1.5">
                RECLAIM
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-brand/10 text-brand dark:bg-brand-muted">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-text-muted font-medium tracking-tight">
                Autonomous Recovery
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 dark:text-text-muted uppercase">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = item.href === "/" 
                    ? pathname === "/" 
                    : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150",
                        isActive 
                          ? "bg-brand text-white font-semibold shadow-sm dark:bg-brand dark:text-white" 
                          : "text-slate-600 dark:text-text-secondary hover:bg-slate-100/80 dark:hover:bg-surface-elevated hover:text-slate-900 dark:hover:text-text-primary"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <item.icon className={cn(
                          "w-4 h-4 flex-shrink-0 transition-transform duration-150 group-hover:scale-110",
                          isActive ? "text-white" : "text-slate-400 dark:text-text-muted group-hover:text-slate-600 dark:group-hover:text-text-secondary"
                        )} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          isActive
                            ? "bg-white/20 text-white"
                            : item.badge.startsWith("+")
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-surface-elevated text-slate-600 dark:text-text-muted"
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

        {/* User / Org Footer */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-border-subtle bg-slate-50/50 dark:bg-surface flex-shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-surface-elevated transition-colors border border-transparent hover:border-slate-200/60 dark:hover:border-border-subtle">
            <div className="w-8 h-8 rounded-full bg-brand/10 dark:bg-brand-muted border border-brand/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              <span className="text-xs font-bold text-brand">VK</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-text-primary truncate">
                Vishal K.
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <p className="text-[10px] font-medium text-slate-500 dark:text-text-muted truncate">
                  Razorpay Live
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

