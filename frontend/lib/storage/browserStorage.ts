/**
 * RECLAIM Centralized Browser Storage Abstraction
 * 
 * Protects components from raw localStorage interactions and enables
 * zero-friction swapping with API clients in Phase 4.
 */

import { APP_CONFIG } from "../config/env";

export const STORAGE_KEYS = {
  CASES: `${APP_CONFIG.STORAGE_PREFIX}cases`,
  AUDIT_EVENTS: `${APP_CONFIG.STORAGE_PREFIX}audit`,
  CAMPAIGNS: `${APP_CONFIG.STORAGE_PREFIX}campaigns`,
  COMMUNICATIONS: `${APP_CONFIG.STORAGE_PREFIX}communications`,
  SERVICE_HEALTH: `${APP_CONFIG.STORAGE_PREFIX}service_health`,
  MERCHANT_PROFILE: `${APP_CONFIG.STORAGE_PREFIX}merchant_profile`,
  MERCHANT_POLICY: `${APP_CONFIG.STORAGE_PREFIX}merchant_policy`,
  POLICY_HISTORY: `${APP_CONFIG.STORAGE_PREFIX}policy_history`,
} as const;

export class BrowserStorage {
  public static getItem<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") {
      return fallback;
    }
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      return JSON.parse(item) as T;
    } catch (e) {
      console.warn(`[BrowserStorage] Failed to read key: ${key}`, e);
      return fallback;
    }
  }

  public static setItem<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`[BrowserStorage] Failed to write key: ${key}`, e);
    }
  }

  public static removeItem(key: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`[BrowserStorage] Failed to remove key: ${key}`, e);
    }
  }

  public static clearAll(): void {
    if (typeof window === "undefined") return;
    Object.values(STORAGE_KEYS).forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // silent fail
      }
    });
  }
}
