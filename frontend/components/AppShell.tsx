"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ToastProvider } from "./ui/Toast";
import { ReclaimProvider } from "@/lib/context/ReclaimContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ToastProvider>
      <ReclaimProvider>
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-canvas">
          <Topbar 
            onMenuClick={() => {
              if (window.innerWidth < 1024) {
                setSidebarOpen(true);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }} 
          />
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <Sidebar 
              isOpen={sidebarOpen} 
              onClose={() => setSidebarOpen(false)}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="mx-auto max-w-7xl w-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </ReclaimProvider>
    </ToastProvider>
  );
}


