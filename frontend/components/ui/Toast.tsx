"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
}

interface ToastContextType {
  toast: (options: { title: string; description?: string; type?: ToastType; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      title,
      description,
      type = "info",
      duration = 3500,
    }: {
      title: string;
      description?: string;
      type?: ToastType;
      duration?: number;
    }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev.slice(-2), { id, title, description, type }]); // Keep at most 3

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast viewport */}
      <div 
        aria-live="polite" 
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto p-4 rounded-xl border shadow-lg bg-white dark:bg-surface flex items-start gap-3 transition-all duration-200 animate-in slide-in-from-bottom-5 fade-in",
              t.type === "success" && "border-emerald-200 dark:border-emerald-900/40",
              t.type === "error" && "border-rose-200 dark:border-rose-900/40",
              t.type === "warning" && "border-amber-200 dark:border-amber-900/40",
              t.type === "info" && "border-slate-200 dark:border-border-subtle"
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              {t.type === "error" && <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
              {t.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
              {t.type === "info" && <Info className="w-4 h-4 text-brand" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-text-primary">
                {t.title}
              </p>
              {t.description && (
                <p className="text-[11px] text-slate-500 dark:text-text-muted mt-0.5 leading-snug">
                  {t.description}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-text-primary hover:bg-slate-100 dark:hover:bg-surface-elevated transition-colors flex-shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: () => {},
    };
  }
  return context;
}
