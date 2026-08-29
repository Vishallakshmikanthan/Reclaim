/**
 * RECLAIM Centralized Environment & App Configuration
 * 
 * Strict Invariant: No API keys, secret tokens, or private credentials in frontend.
 */

export const APP_CONFIG = {
  APP_NAME: "RECLAIM",
  TAGLINE: "Autonomous Revenue Recovery Engine",
  VERSION: "1.0.0-prototype",
  ENVIRONMENT: (process.env.NODE_ENV || "development") as "development" | "production" | "test",
  IS_DEMO_MODE: true, // Deterministic prototype mode
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  DEFAULT_CURRENCY: "INR" as const,
  DEFAULT_TIMEZONE: "Asia/Kolkata" as const,
  DEFAULT_LOCALE: "en-IN" as const,
  STORAGE_PREFIX: "reclaim_v1_",
  DEMO_MERCHANT_ID: "mid_rzp_live_acme_99401",
  DEMO_GATEWAY: "Razorpay Test Gateway",
} as const;
