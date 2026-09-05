"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Search, 
  ShieldCheck, 
  Brain, 
  CreditCard, 
  Webhook, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ExternalLink, 
  Copy, 
  Check, 
  HelpCircle,
  FileText,
  Terminal,
  Activity,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  id: string;
  q: string;
  a: string;
  tag: string;
}

interface LevelSection {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: any;
  items: FAQItem[];
}

const DOCS_DATA: LevelSection[] = [
  {
    id: "level1",
    title: "Level 1: What Exactly is RECLAIM?",
    subtitle: "Core problem statement, involuntary churn, payment states, and ecosystem placement",
    badge: "Level 1",
    icon: ShieldCheck,
    items: [
      {
        id: "l1-1",
        q: "What exact problem is RECLAIM solving?",
        a: "In digital commerce and SaaS subscriptions, 10% to 25% of all recurring transactions fail due to soft declines, transient bank downtime, network timeouts, or expired credentials. When a payment fails, merchants suffer both direct revenue loss and customer churn. RECLAIM is an autonomous payment recovery and safety orchestration engine that rescues at-risk revenue using diagnostic AI, smart multi-rail recovery, and strict deterministic policy guardrails.",
        tag: "Core Problem"
      },
      {
        id: "l1-2",
        q: "What does 'revenue at risk' actually mean?",
        a: "Revenue at risk represents the total monetary value of legitimate customer transactions that have entered a failed, past-due, or payment-broken state, which will permanently convert into lost revenue and involuntary churn if not resolved before the merchant's grace period expires.",
        tag: "Economics"
      },
      {
        id: "l1-3",
        q: "What is a recovery case?",
        a: "A recovery case is a stateful entity created in RECLAIM representing a single failed transaction incident. It tracks the customer context, failure codes, attempts, deterministic policy checks, AI recommendations, human audit logs, and provider reconciliation status.",
        tag: "Data Model"
      },
      {
        id: "l1-4",
        q: "What is the difference between a failed, abandoned, pending, and recovered payment?",
        a: "• Failed Payment: An authorized charge attempt explicitly declined or timed out by the gateway/bank.\n• Abandoned Payment: A checkout session where the user dropped off before initiating authorization.\n• Pending Payment: A recovery action initiated (e.g. Razorpay order created, UPI mandate dispatched) awaiting capture confirmation.\n• Recovered Payment: A previously failed payment where funds have been successfully debited, captured by the provider, and cryptographically verified.",
        tag: "State Machine"
      },
      {
        id: "l1-5",
        q: "What happens in a business when a customer tries to pay but the payment fails?",
        a: "1. The customer loses service access or enters an anxious grace period.\n2. The business incurs dunning overhead and customer support tickets.\n3. Gateway decline penalties or card-network retry fees accrue.\n4. The customer often churns without ever intending to cancel.",
        tag: "Business Impact"
      },
      {
        id: "l1-6",
        q: "Why can't a merchant simply retry every failed payment?",
        a: "Blindly retrying every failed payment causes high failure rates, angers customers with repeated bank SMS alerts, damages the merchant's reputation score with card networks (Visa/Mastercard fraud thresholds), and can trigger bank blacklisting.",
        tag: "Payments"
      },
      {
        id: "l1-7",
        q: "Why can aggressive retries actually make the situation worse?",
        a: "Card networks (Visa/Mastercard) and banking switches enforce strict decline thresholds. Retrying repeatedly on hard declines (like lost cards or closed accounts) incurs penalty fees, lowers the merchant's authorization health score, and can trigger merchant account suspension.",
        tag: "Compliance"
      },
      {
        id: "l1-8",
        q: "What does RECLAIM do that a simple retry payment button cannot?",
        a: "• Predictive Diagnostics: Analyzes root-cause failure codes (distinguishing soft declines from terminal hard declines).\n• Multi-Rail Recovery: Selects between smart timed retries, customer update links, UPI Intent links, or human escalation.\n• Deterministic Guardrails: Strictly enforces retry limits, risk thresholds, and financial limits before any charge can be executed.",
        tag: "Value Prop"
      },
      {
        id: "l1-9",
        q: "Where does RECLAIM sit in a merchant's payment architecture?",
        a: "RECLAIM sits as an orchestration and recovery layer between the Payment Gateway (Razorpay, Stripe), the Internal Billing Ledger, and Customer Communication Channels (WhatsApp, SMS, Email).",
        tag: "Architecture"
      },
      {
        id: "l1-10",
        q: "Who is actually using RECLAIM — customer, merchant, finance team, or payment ops?",
        a: "• Payment Operations & Risk Teams: For monitoring health, setting recovery policies, and approving manual queues.\n• Finance Teams: For reviewing recovered revenue metrics, reconciliation audit logs, and ledger integrity.\n• Autonomous Workers: Running in the background to ingest webhooks, execute approved retries, and dispatch notifications.",
        tag: "Personas"
      }
    ]
  },
  {
    id: "level2",
    title: "Level 2: Webhook Ingestion & Detection",
    subtitle: "How RECLAIM detects failures, webhooks, UPI timeouts, and reconciliation",
    badge: "Level 2",
    icon: Webhook,
    items: [
      {
        id: "l2-1",
        q: "Where does RECLAIM get information about a failed payment?",
        a: "Directly from payment gateway webhook events (e.g., Razorpay's 'payment.failed') or periodic background API reconciliation jobs.",
        tag: "Ingestion"
      },
      {
        id: "l2-2",
        q: "Does RECLAIM continuously watch someone's bank account?",
        a: "No. RECLAIM has zero connection or visibility into private customer bank accounts or balances. It is purely event-driven based on gateway transaction responses.",
        tag: "Privacy"
      },
      {
        id: "l2-3",
        q: "Does RECLAIM directly communicate with the customer's UPI app?",
        a: "No. RECLAIM interacts strictly via the payment gateway API (triggering Autopay debits) or by dispatching standard UPI deep links (upi://pay?...) via messaging channels that open inside the customer's mobile OS.",
        tag: "UPI"
      },
      {
        id: "l2-4",
        q: "What system actually knows that a payment failed?",
        a: "The payment gateway (Razorpay) and the issuing bank/NPCI network switch. RECLAIM learns about the failure only when notified by the gateway.",
        tag: "Infrastructure"
      },
      {
        id: "l2-5",
        q: "What information does a payment gateway send when a payment fails?",
        a: "Payment ID, Order ID, failure code (e.g., BAD_REQUEST_ERROR, GATEWAY_TIMEOUT), error description, amount, currency, payment method details (card brand, UPI VPA handle), and customer identifier.",
        tag: "Payload"
      },
      {
        id: "l2-6",
        q: "What is a webhook? Who sends it and when?",
        a: "A webhook is an automated HTTP POST request. The payment gateway sends it to RECLAIM's endpoint immediately after a transaction attempt is finalized as failed or captured.",
        tag: "Webhooks"
      },
      {
        id: "l2-7",
        q: "How does RECLAIM convert a payment event into a recovery case?",
        a: "1. Verifies the incoming cryptographic signature (HMAC-SHA256).\n2. Extracts payment metadata and normalizes the failure code.\n3. Checks for existing idempotency keys.\n4. Persists a new case record in PostgreSQL with status 'atRisk'.",
        tag: "Pipeline"
      },
      {
        id: "l2-8",
        q: "What happens if the webhook never arrives?",
        a: "RECLAIM runs scheduled reconciliation workers that query the payment gateway API for unpaid/past-due invoices to detect out-of-sync states.",
        tag: "Resilience"
      },
      {
        id: "l2-9",
        q: "Why trust the gateway's payment status rather than AI opinion?",
        a: "Payment gateways are regulated financial intermediaries that have cryptographic confirmation of actual fund settlement. AI is an advisory engine; financial truth belongs exclusively to the gateway ledger.",
        tag: "Ledger"
      },
      {
        id: "l2-10",
        q: "The UPI Timeout Example: How does RECLAIM handle it?",
        a: "1. Customer tries UPI → transaction times out on bank handle.\n2. NPCI/bank reports timeout → Razorpay sends 'payment.failed' with error_code: 'GATEWAY_TIMEOUT'.\n3. RECLAIM stores case.failure_type = 'UPI_TIMEOUT'.\n4. ContextSanitizer strips customer PII (phone, email, VPA).\n5. Nemotron receives only sanitized telemetry (failure reason, retry count, plan tier).",
        tag: "Deep Dive"
      }
    ]
  },
  {
    id: "level3",
    title: "Level 3: Case Lifecycle & State Transitions",
    subtitle: "State machines, amount_minor precision, pending state, and permanent failures",
    badge: "Level 3",
    icon: Layers,
    items: [
      {
        id: "l3-1",
        q: "What is the lifecycle of a case from creation to recovery?",
        a: "1. Ingested ('atRisk'): Failed transaction recorded.\n2. Evaluation: AI generates advisory recommendation → PolicyEngine verifies rules.\n3. Execution ('pending'): Recovery order created or payment link sent.\n4. Resolution ('recovered' or 'failed'): Gateway webhook/reconciliation confirms final status.",
        tag: "State Machine"
      },
      {
        id: "l3-2",
        q: "Why does the case store amount_minor rather than float ₹ amount?",
        a: "Floating-point numbers in computer arithmetic suffer from rounding imprecision (e.g., 0.1 + 0.2 = 0.30000000000000004). Financial systems strictly store currency in integer minor units (e.g., ₹50.00 is stored as 5000 paise) to prevent monetary leakage.",
        tag: "Precision"
      },
      {
        id: "l3-3",
        q: "What does status = atRisk mean? What does pending mean?",
        a: "• atRisk: Payment is broken and unpaid. Revenue is at risk of permanent loss.\n• pending: A recovery action has been dispatched (e.g. Razorpay order generated), but funds have not yet been captured.",
        tag: "States"
      },
      {
        id: "l3-4",
        q: "Can a case go directly from atRisk → recovered?",
        a: "No. Every recovery must first transition through pending while awaiting payment gateway capture confirmation. This state locks the case and prevents double charging.",
        tag: "Safety"
      },
      {
        id: "l3-5",
        q: "Can a case become recovered without provider confirmation?",
        a: "Never. RECLAIM never marks a case recovered based solely on AI recommendation or local UI actions. Only an authenticated provider confirmation (HMAC webhook or API reconciliation) transitions a case to recovered.",
        tag: "Ledger Rule"
      },
      {
        id: "l3-6",
        q: "What happens when a payment permanently fails or violates policy?",
        a: "The case transitions to 'failed' (terminal state), retry attempts are halted to protect merchant reputation, and the incident is logged in the audit trail.",
        tag: "Terminal"
      }
    ]
  },
  {
    id: "level4_5",
    title: "Levels 4-5: Nemotron AI & Context Sanitization",
    subtitle: "Why AI, advisory-only guardrails, PII stripping, prompt injection defense, and Pydantic validation",
    badge: "Levels 4 & 5",
    icon: Brain,
    items: [
      {
        id: "l4-1",
        q: "Why can't a deterministic rule engine handle everything?",
        a: "Deterministic rules are rigid. When dealing with multi-factor scenarios (customer tenure, plan tiers, historical decline patterns, error codes, and customer text feedback), an LLM excels at holistic diagnostic reasoning, nuanced priority ranking, and multi-channel messaging copy.",
        tag: "AI Value"
      },
      {
        id: "l4-2",
        q: "What does Nemotron actually contribute?",
        a: "Nemotron analyzes sanitized telemetry and customer context to produce an advisory structured recommendation: suggested action (RETRY_PAYMENT, SEND_PAYMENT_LINK, REQUEST_HUMAN_REVIEW), confidence score (0.0-1.0), expected recovery amount, and do_not_do guardrail guidance.",
        tag: "Intelligence"
      },
      {
        id: "l4-3",
        q: "What information is intentionally stripped before calling Nemotron?",
        a: "All PII: customer email, full name, phone number, physical address, card numbers, CVVs, bank account credentials, and merchant API keys.",
        tag: "PII Stripping"
      },
      {
        id: "l4-4",
        q: "What does 'advisory-only AI' mean? Can Nemotron move money?",
        a: "Advisory-only means Nemotron has zero database write access, zero gateway API credentials, and zero authority to execute financial transactions. It outputs JSON advice that must pass through the deterministic PolicyEngine.",
        tag: "Guardrails"
      },
      {
        id: "l4-5",
        q: "What is ContextSanitizer and why is it executed before the API request?",
        a: "ContextSanitizer is a deterministic preprocessor that cleans incoming event payloads, strips all sensitive PII, formats telemetry into strict JSON, and wraps untrusted user text in isolating delimiter tags.",
        tag: "Sanitization"
      },
      {
        id: "l4-6",
        q: "What is <customer_text> and how does RECLAIM defend against prompt injection?",
        a: "Customer notes or dispute feedback are enclosed within <customer_text>...</customer_text> tags. Because customer text is untrusted, RECLAIM instructs the model to treat content inside tags as data only. Furthermore, Pydantic schema validation and backend policy checks ensure that injected text cannot alter system policies or recovery amounts.",
        tag: "Security"
      },
      {
        id: "l4-7",
        q: "Why do we validate AI output with Pydantic?",
        a: "Pydantic guarantees strict type adherence. If Nemotron returns malformed JSON, invalid action enums, or amounts greater than the case amount, Pydantic validation rejects the response and triggers the deterministic fallback.",
        tag: "Validation"
      },
      {
        id: "l4-8",
        q: "What happens if NVIDIA API is completely down or times out?",
        a: "RECLAIM automatically activates its deterministic fallback provider (rule-based recovery), ensuring 100% operational uptime without interruption.",
        tag: "Resilience"
      }
    ]
  },
  {
    id: "level6_7",
    title: "Levels 6-7: PolicyEngine & Human Authorization",
    subtitle: "Who is in control, deterministic rules, SafetyController, and HITL authorization",
    badge: "Levels 6 & 7",
    icon: UserCheck,
    items: [
      {
        id: "l6-1",
        q: "If Nemotron recommends RETRY_PAYMENT, must RECLAIM execute it?",
        a: "No. The AI recommendation is strictly advisory. The deterministic PolicyEngine evaluates the recommendation against merchant policies and can reject or downgrade it.",
        tag: "Authority"
      },
      {
        id: "l6-2",
        q: "Who has final authority — Nemotron or PolicyEngine?",
        a: "The PolicyEngine (deterministic code) and Human Operators hold 100% of the final authority.",
        tag: "Governance"
      },
      {
        id: "l6-3",
        q: "What does the PolicyEngine check?",
        a: "• Has retry_count reached the merchant's configured maximum limit?\n• Does amount_minor exceed the autonomous execution threshold (e.g., > ₹10,000)?\n• Does the customer risk score or dispute flag mandate human approval?\n• Is the recommended action permitted under the merchant's active safety policy?",
        tag: "Rule Engine"
      },
      {
        id: "l6-4",
        q: "What is the purpose of SafetyController?",
        a: "SafetyController is the gatekeeper between decision engines and execution providers. It verifies policy compliance, validates idempotency keys, and halts any action that fails boundary checks.",
        tag: "Safety"
      },
      {
        id: "l6-5",
        q: "Why does RECLAIM need Human-in-the-Loop (HITL) authorization?",
        a: "High-value recoveries, high-risk accounts, and edge cases carry financial and relationship risks that demand human discretion. HITL ensures accountability for sensitive actions.",
        tag: "HITL"
      },
      {
        id: "l6-6",
        q: "What does the human operator see before authorizing?",
        a: "The operator views the sanitized failure timeline, policy boundary flags, AI advisory rationale, alternative options, and a mandatory audit notes field.",
        tag: "Operator UI"
      },
      {
        id: "l6-7",
        q: "What is the difference between AI recommendation, policy approval, and human authorization?",
        a: "• AI Recommendation: Advisory diagnostic suggestion.\n• Policy Approval: Deterministic verification that rules are satisfied.\n• Human Authorization: Cryptographic sign-off by a named human operator for high-risk cases.",
        tag: "Distinction"
      }
    ]
  },
  {
    id: "level8_9",
    title: "Levels 8-9: Razorpay Integration & Webhook Security",
    subtitle: "Provider abstractions, test mode, HMAC-SHA256 cryptography, and replay attack prevention",
    badge: "Levels 8 & 9",
    icon: Lock,
    items: [
      {
        id: "l8-1",
        q: "What exactly is Razorpay's role in RECLAIM?",
        a: "Razorpay serves as the payment gateway infrastructure handling actual order creation, card/UPI network dispatch, recurring mandate debits, and fund capture.",
        tag: "Payments"
      },
      {
        id: "l8-2",
        q: "Why do we use a Provider Abstraction?",
        a: "The PaymentProviderInterface decouples business logic from gateway SDKs. RECLAIM can switch between RazorpayTestProvider, RazorpayLiveProvider, StripeProvider, or SimulatedProvider without changing core business logic.",
        tag: "Architecture"
      },
      {
        id: "l8-3",
        q: "Why does creating a Razorpay order NOT mean revenue is recovered?",
        a: "An order is merely an authorization intent. Revenue is only recovered when the gateway captures real funds and returns a cryptographically authenticated 'payment.captured' confirmation.",
        tag: "Accounting"
      },
      {
        id: "l8-4",
        q: "How does HMAC-SHA256 signature verification protect webhooks?",
        a: "Razorpay signs the raw request payload using the merchant's private webhook secret. RECLAIM computes HMAC-SHA256 over raw bytes and compares using constant-time comparison (hmac.compare_digest) to prevent timing attacks and request forgery.",
        tag: "Cryptography"
      },
      {
        id: "l8-5",
        q: "What is a replay attack and how does RECLAIM prevent it?",
        a: "An attacker intercepts a genuine 'payment.captured' webhook and resends it later to fool the app. RECLAIM prevents this by recording processed payment IDs with unique database constraints and idempotency keys.",
        tag: "Security"
      },
      {
        id: "l8-6",
        q: "What happens if a malicious person sends a fake payment.captured webhook?",
        a: "The HMAC-SHA256 signature check fails immediately, the request is rejected with HTTP 400, a security audit alert is logged, and zero revenue is credited.",
        tag: "Threat Model"
      }
    ]
  },
  {
    id: "level10_12",
    title: "Levels 10-12: Ledger, Concurrency & Security",
    subtitle: "Integer accounting, double-recovery prevention, row locking, and idempotency",
    badge: "Levels 10-12",
    icon: CreditCard,
    items: [
      {
        id: "l10-1",
        q: "Why does pending have recovered_amount = 0?",
        a: "Because funds have not been captured by the gateway. Incrementing recovered revenue before settlement causes false accounting and phantom balances.",
        tag: "Ledger"
      },
      {
        id: "l10-2",
        q: "What is Double Accounting and how is it prevented?",
        a: "Double accounting happens when the same recovery is credited twice. RECLAIM prevents this using: 1) Idempotency keys, 2) PostgreSQL row-level locking (SELECT FOR UPDATE), and 3) Strict state machine transitions.",
        tag: "Accounting"
      },
      {
        id: "l10-3",
        q: "What is an idempotency key and why is it required?",
        a: "An idempotency key is a unique token generated per recovery action. If the server receives the same key twice (due to network retries or double clicks), it returns the cached result without re-executing the financial action.",
        tag: "Idempotency"
      },
      {
        id: "l10-4",
        q: "Give a real-world example of a race condition in payment recovery.",
        a: "Two operators open the same failed case simultaneously and both click 'Recover'. Without row-level locking, two charge attempts could be dispatched to the gateway, charging the customer twice. RECLAIM's backend locks the case record in PostgreSQL to serialize execution.",
        tag: "Concurrency"
      },
      {
        id: "l10-5",
        q: "What is the single source of truth for dashboard revenue?",
        a: "The immutable transaction ledger of gateway-confirmed recovery records stored in PostgreSQL.",
        tag: "Truth"
      }
    ]
  },
  {
    id: "level13_16",
    title: "Levels 13-16: Evaluation Lab, Architecture & Judge Q&A",
    subtitle: "Benchmark science, tech stack choices, disaster recovery, and hackathon judge questions",
    badge: "Levels 13-16",
    icon: Cpu,
    items: [
      {
        id: "l13-1",
        q: "What is the Evaluation Lab actually measuring?",
        a: "It benchmarks recovery effectiveness by running a standardized 50-case realistic synthetic test dataset through: 1) Baseline Engine (traditional naive retries) vs 2) Nemotron-Assisted Arm (intelligent routing + policy guardrails).",
        tag: "Benchmark"
      },
      {
        id: "l13-2",
        q: "What are the key benchmark results?",
        a: "• Total Cases: 50\n• Cases Attempted: 45 (5 safely blocked by PolicyEngine due to fraud/terminal decline)\n• Relative Revenue Lift: +5.3%\n• Policy Violations: 0 (100% deterministic safety adherence across all runs).",
        tag: "Lift Metrics"
      },
      {
        id: "l13-3",
        q: "Why is RECLAIM novel compared to standard dunning software?",
        a: "Traditional dunning systems rely on static cron jobs and dumb retries. RECLAIM fuses LLM diagnostic intelligence with zero-trust deterministic safety guardrails, cryptographic ledger verification, and human-in-the-loop oversight.",
        tag: "Innovation"
      },
      {
        id: "l13-4",
        q: "Can this work with another payment gateway?",
        a: "Yes. Thanks to the PaymentProviderInterface abstraction, adding Stripe, Adyen, or Cashfree requires implementing just one provider interface file without modifying core logic.",
        tag: "Extensibility"
      },
      {
        id: "l13-5",
        q: "What is the single most important safety mechanism in RECLAIM?",
        a: "The strict architectural separation of Advisory Intelligence (Nemotron) from Financial & Transactional Authority (PolicyEngine + Gateway Verification).",
        tag: "Architecture"
      }
    ]
  }
];

export default function DocsPage() {
  const [selectedLevelId, setSelectedLevelId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openQuestions, setOpenQuestions] = useState<Record<string, boolean>>({
    "l1-1": true,
    "l1-8": true,
    "l2-1": true,
    "l2-10": true,
    "l4-4": true,
    "l6-1": true,
    "l13-5": true
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleQuestion = (id: string) => {
    setOpenQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allOpen: Record<string, boolean> = {};
    DOCS_DATA.forEach((lvl) => {
      lvl.items.forEach((item) => {
        allOpen[item.id] = true;
      });
    });
    setOpenQuestions(allOpen);
  };

  const collapseAll = () => {
    setOpenQuestions({});
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSections = useMemo(() => {
    return DOCS_DATA.map((section) => {
      const isLevelMatch = selectedLevelId === "all" || section.id === selectedLevelId;
      if (!isLevelMatch && !searchQuery) return null;

      const matchingItems = section.items.filter((item) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q) ||
          item.tag.toLowerCase().includes(q)
        );
      });

      if (matchingItems.length === 0) return null;

      return {
        ...section,
        items: matchingItems
      };
    }).filter(Boolean) as LevelSection[];
  }, [selectedLevelId, searchQuery]);

  const totalQuestions = DOCS_DATA.reduce((acc, curr) => acc + curr.items.length, 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0d1424] to-slate-900 border border-slate-800/80 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Project Knowledge Base & Technical Docs</span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">
                {totalQuestions} Deep Q&As
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              RECLAIM Architecture & Deep Understanding
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-3xl leading-relaxed">
              The authoritative 16-level technical reference on payment recovery orchestration, Nemotron AI guardrails, webhook cryptography, ledger accounting, and hackathon judge questions.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700/60"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700/60"
            >
              Collapse All
            </button>
            <Link
              href="/evaluation"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition border border-emerald-500/30 flex items-center gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>View Evaluation Lab</span>
            </Link>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative mt-6">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions across all 16 levels (e.g. 'UPI Timeout', 'Nemotron', 'HMAC', 'double charging', 'PolicyEngine')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs bg-slate-800 text-slate-400 hover:text-white px-2 py-1 rounded"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Level Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar border-b border-slate-800/80">
        <button
          onClick={() => setSelectedLevelId("all")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all",
            selectedLevelId === "all"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>All 16 Levels</span>
        </button>

        {DOCS_DATA.map((lvl) => {
          const Icon = lvl.icon;
          const active = selectedLevelId === lvl.id;
          return (
            <button
              key={lvl.id}
              onClick={() => setSelectedLevelId(lvl.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all",
                active
                  ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{lvl.badge}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Sections */}
      <div className="space-y-8">
        {filteredSections.length > 0 ? (
          filteredSections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-xl"
              >
                {/* Section Header */}
                <div className="p-5 sm:p-6 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                        {section.badge}
                      </span>
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        {section.title}
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      {section.subtitle}
                    </p>
                  </div>
                </div>

                {/* Section Items */}
                <div className="divide-y divide-slate-800/60 p-2 sm:p-4 space-y-2">
                  {section.items.map((item) => {
                    const isOpen = !!openQuestions[item.id];
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-xl border transition-all duration-150 overflow-hidden",
                          isOpen 
                            ? "bg-slate-800/40 border-slate-700/80 shadow-md" 
                            : "bg-slate-900/40 border-slate-800/50 hover:bg-slate-800/20 hover:border-slate-700/60"
                        )}
                      >
                        {/* Question Header */}
                        <button
                          onClick={() => toggleQuestion(item.id)}
                          className="w-full p-4 flex items-start justify-between gap-4 text-left transition"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                {item.tag}
                              </span>
                              <span className="text-[11px] font-mono text-slate-500">{item.id}</span>
                            </div>
                            <h3 className="font-semibold text-white text-sm sm:text-base leading-snug">
                              {item.q}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {/* Answer Body */}
                        {isOpen && (
                          <div className="px-4 pb-4 pt-1 text-slate-300 text-xs sm:text-sm leading-relaxed border-t border-slate-800/60 bg-slate-950/40 space-y-3">
                            <p className="whitespace-pre-line text-slate-200">
                              {item.a}
                            </p>

                            {/* Copy Action */}
                            <div className="flex justify-end pt-2">
                              <button
                                onClick={() => copyToClipboard(`Q: ${item.q}\n\nA: ${item.a}`, item.id)}
                                className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-emerald-400 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/60 transition"
                              >
                                {copiedId === item.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>Copied to Clipboard</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Q&A</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No matching questions found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try searching with different keywords like &quot;UPI&quot;, &quot;Nemotron&quot;, &quot;Razorpay&quot;, &quot;HMAC&quot;, or &quot;Idempotency&quot;.
            </p>
          </div>
        )}
      </div>

      {/* Judge Cheat-Sheet Card */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider mb-2">
          <Terminal className="w-4 h-4" />
          <span>Hackathon Judge Quick Reference</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-3">
          30-Second Elevator Pitch & Core Architectural Truths
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 leading-relaxed mt-4">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1">
            <div className="font-bold text-white text-sm text-amber-300">1. Autonomous yet Zero-Trust</div>
            <p>Nemotron AI provides advisory diagnostic intelligence, but the deterministic PolicyEngine holds 100% of transaction authority.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1">
            <div className="font-bold text-white text-sm text-emerald-300">2. Cryptographic Ledger Truth</div>
            <p>Revenue is only recovered when Razorpay returns an HMAC-SHA256 authenticated webhook. Creating orders or AI predictions never counts as revenue.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1">
            <div className="font-bold text-white text-sm text-sky-300">3. Proven Benchmark Lift</div>
            <p>On a standardized 50-case benchmark, RECLAIM achieved a +5.3% relative revenue lift over naive retries with 0 policy violations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

