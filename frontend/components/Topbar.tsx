"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Moon, Sun, Menu } from "lucide-react";

function getPageTitle(pathname: string) {
  if (pathname === "/") return "Command Center";
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "";
  if (segments[0] === "cases" && segments.length > 1) return `Case Decision / ${segments[1]}`;
  return segments[0].charAt(0).toUpperCase() + segments[0].slice(1).replace("-", " ");
}

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch (e) {}
  };

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 dark:border-border-subtle bg-white/95 dark:bg-surface/95 backdrop-blur-sm z-30 transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-text-secondary dark:hover:text-text-primary hover:bg-slate-100 dark:hover:bg-surface-elevated lg:hidden transition-colors"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-text-primary">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            className="w-56 lg:w-72 pl-9 pr-12 py-1.5 text-xs font-normal border border-slate-200 dark:border-border-subtle rounded-lg bg-slate-50/80 dark:bg-canvas-subtle text-slate-900 dark:text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
            placeholder="Search cases, customers..."
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 dark:text-text-muted bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Theme Toggle */}
        <button 
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-text-secondary dark:hover:text-text-primary rounded-lg hover:bg-slate-100 dark:hover:bg-surface-elevated transition-colors"
          onClick={toggleTheme}
          title="Toggle Theme"
          aria-label="Toggle Theme"
        >
          <Sun className="h-4 w-4 hidden dark:block text-amber-400" />
          <Moon className="h-4 w-4 block dark:hidden text-slate-600" />
        </button>

        {/* Notifications */}
        <button 
          className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-text-secondary dark:hover:text-text-primary rounded-lg hover:bg-slate-100 dark:hover:bg-surface-elevated transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-brand ring-2 ring-white dark:ring-surface animate-pulse"></span>
        </button>
      </div>
    </header>
  );
}

