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
  Settings 
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "At Risk", href: "/at-risk", icon: AlertTriangle },
  { name: "Cases", href: "/cases", icon: Briefcase },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Communications", href: "/communications", icon: MessageSquare },
  { name: "Evaluation", href: "/evaluation", icon: BarChart3 },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Audit Trail", href: "/audit", icon: History },
  { name: "Policy Center", href: "/policy", icon: ShieldCheck },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-border-subtle bg-white dark:bg-surface transition-colors">
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-border-subtle">
        <div className="flex items-center gap-2 text-brand font-bold text-xl tracking-tight">
          <div className="w-6 h-6 rounded-md bg-brand flex items-center justify-center">
            <span className="text-white text-xs">R</span>
          </div>
          RECLAIM
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-brand/10 dark:bg-brand-muted text-brand" 
                  : "text-slate-600 dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-surface-elevated hover:text-slate-900 dark:hover:text-text-primary"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-surface-elevated border border-slate-300 dark:border-border-subtle flex items-center justify-center overflow-hidden">
            <span className="text-sm font-medium text-slate-600 dark:text-text-secondary">VK</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-text-primary truncate">
              Vishal K.
            </p>
            <p className="text-xs text-slate-500 dark:text-text-muted truncate">
              Admin
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
