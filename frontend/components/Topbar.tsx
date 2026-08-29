"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Moon, Sun } from "lucide-react";

function getPageTitle(pathname: string) {
  if (pathname === "/") return "Command Center";
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "";
  return segments[0].charAt(0).toUpperCase() + segments[0].slice(1).replace("-", " ");
}

export function Topbar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch (e) {}
  };

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-slate-200 dark:border-border-subtle bg-white dark:bg-surface transition-colors">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-text-primary">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-64 pl-10 pr-3 py-1.5 border border-slate-200 dark:border-border-subtle rounded-md leading-5 bg-slate-50 dark:bg-canvas-subtle text-slate-900 dark:text-text-primary placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand sm:text-sm transition-colors"
            placeholder="Search cases, customers..."
          />
        </div>

        <button 
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-text-secondary dark:hover:text-text-primary rounded-full hover:bg-slate-100 dark:hover:bg-surface-elevated transition-colors"
          onClick={toggleTheme}
          title="Toggle Theme"
        >
          <Sun className="h-5 w-5 hidden dark:block" />
          <Moon className="h-5 w-5 block dark:hidden" />
        </button>

        <button className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-text-secondary dark:hover:text-text-primary rounded-full hover:bg-slate-100 dark:hover:bg-surface-elevated transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-2 block h-2 w-2 rounded-full bg-brand ring-2 ring-white dark:ring-surface"></span>
        </button>
      </div>
    </header>
  );
}
