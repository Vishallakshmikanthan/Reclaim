# RECLAIM: Autonomous Revenue Recovery Engine

<div align="center">

<img src="./banner/reclaim-logo.png" alt="RECLAIM Logo Banner" width="100%" style="border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />

**Autonomous, Bounded Revenue Recovery Engine for Modern Digital Commerce**  
*Orchestrating Failure Triage, NVIDIA Nemotron Advisory Intelligence, Deterministic Policy Guardrails, and Razorpay Execution.*

[![Razorpay AI Buildathon](https://img.shields.io/badge/Razorpay%20AI%20Buildathon-Track%2003%3A%20AI%20Revenue%20Recovery-0C2340?style=for-the-badge&logo=razorpay)](https://razorpay.com/buildathon/)
[![Role: AI Builder Intern](https://img.shields.io/badge/Target%20Role-AI%20Builder%20Intern%20(%E2%82%B975k%2Fmo)-528FF0?style=for-the-badge)](https://razorpay.com/buildathon/)

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2.35-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue?style=flat-square&logo=python)](https://www.python.org/)
[![PostgreSQL 15+](https://img.shields.io/badge/PostgreSQL-15%2B-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![NVIDIA Nemotron](https://img.shields.io/badge/NVIDIA-Nemotron--70B-76B900?style=flat-square&logo=nvidia)](https://build.nvidia.com/)
[![Razorpay Test Mode](https://img.shields.io/badge/Razorpay-Test%20Mode-0C2340?style=flat-square&logo=razorpay)](https://razorpay.com/docs/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

> ### 🏆 Razorpay AI Buildathon — Track 03: AI Revenue Recovery
> **RECLAIM** was custom-engineered from the ground up for the **Razorpay AI Buildathon (Track 03 — AI Revenue Recovery)**.
> 
> * **The Core Mandate:** Find revenue slipping away from merchants across multi-step journeys (degrading gateways, abandoned carts, failed recurring mandates) and close the loop from detection and root-cause diagnosis to bounded intervention and verified money recovery.
> * **The Evaluation Bar:** Not merely flagging drop-offs, but demonstrating **measured money recovered across test batches**, complete with **compliant escalation protocols**, **explicit stopping rules**, and a **transparent Layer 0–6 audit trail**.

---

## 📑 Table of Contents

1. [Razorpay AI Buildathon Submission Dossier](#1-razorpay-ai-buildathon-submission-dossier)
   - [Track 03 Alignment & Evaluation Bar Checklist](#11-track-03-alignment--evaluation-bar-checklist)
   - [What Broke During Development & How We Solved It *(Read First)*](#12-what-broke-during-development--how-we-solved-it-the-prompt-razorpay-reads-first)
2. [📸 Product & Prototype Showcase (16 Core Views)](#2--product--prototype-showcase)
3. [Executive Summary & Problem Statement](#3-executive-summary--problem-statement)
4. [Investigation & Empirical Research Summary](#4-investigation--empirical-research-summary)
5. [System Architecture & Visual Diagrams](#5-system-architecture--visual-diagrams)
   - [High-Level Architectural Topology](#high-level-architectural-topology)
   - [The 6-Layer Autonomous Recovery Pipeline](#the-6-layer-autonomous-recovery-pipeline)
   - [Explicit AI Safety & Bounded Autonomy Guardrail Flow](#explicit-ai-safety--bounded-autonomy-guardrail-flow)
   - [Case Incident State Machine](#case-incident-state-machine)
   - [End-to-End Recovery Funnel & Settlement Flow](#end-to-end-recovery-funnel--settlement-flow)
   - [Database Entity-Relationship (ER) Diagram](#database-entity-relationship-er-diagram)
6. [Key Features & Capabilities](#6-key-features--capabilities)
7. [File & Folder Structure Breakdown](#7-file--folder-structure-breakdown)
8. [Comprehensive Data Key & Dictionary](#8-comprehensive-data-key--dictionary)
9. [Processing, Analysis & Software Details](#9-processing-analysis--software-details)
10. [🛠️ End-to-End Clean-Clone Setup & Quickstart Guide](#10-️-end-to-end-clean-clone-setup--quickstart-guide)
11. [Configuration & Environment Variables](#11-configuration--environment-variables)
12. [Step-by-Step Five-Minute Demo Walkthrough](#12-step-by-step-five-minute-demo-walkthrough)
13. [Controlled Offline Evaluation Benchmark](#13-controlled-offline-evaluation-benchmark)
14. [Security, Invariants & Anti-Fabrication Guarantees](#14-security-invariants--anti-fabrication-guarantees)
15. [Troubleshooting & FAQ](#15-troubleshooting--faq)
16. [External Links & References](#16-external-links--references)
   - [High-Level Architectural Topology](#high-level-architectural-topology)
   - [The 6-Layer Autonomous Recovery Pipeline](#the-6-layer-autonomous-recovery-pipeline)
   - [Explicit AI Safety & Bounded Autonomy Guardrail Flow](#explicit-ai-safety--bounded-autonomy-guardrail-flow)
   - [Case Incident State Machine](#case-incident-state-machine)
   - [End-to-End Recovery Funnel & Settlement Flow](#end-to-end-recovery-funnel--settlement-flow)
   - [Database Entity-Relationship (ER) Diagram](#database-entity-relationship-er-diagram)
5. [Key Features & Capabilities](#5-key-features--capabilities)
6. [File & Folder Structure Breakdown](#6-file--folder-structure-breakdown)
7. [Comprehensive Data Key & Dictionary](#7-comprehensive-data-key--dictionary)
8. [Processing, Analysis & Software Details](#8-processing-analysis--software-details)
9. [End-to-End Clean-Clone Setup & Quickstart](#9-end-to-end-clean-clone-setup--quickstart)
10. [Configuration & Environment Variables](#10-configuration--environment-variables)
11. [Step-by-Step Five-Minute Demo Walkthrough](#11-step-by-step-five-minute-demo-walkthrough)
12. [Controlled Offline Evaluation Benchmark](#12-controlled-offline-evaluation-benchmark)
13. [Security, Invariants & Anti-Fabrication Guarantees](#13-security-invariants--anti-fabrication-guarantees)
14. [Troubleshooting & FAQ](#14-troubleshooting--faq)
15. [External Links & References](#15-external-links--references)

---

## 1. Razorpay AI Buildathon Submission Dossier

### 1.1 Track 03 Alignment & Evaluation Bar Checklist

| Evaluation Criterion | Requirement in Track 03 | RECLAIM Production Implementation |
| :--- | :--- | :--- |
| **Full-Loop Money Recovery** | Move from failure detection to bounded action and actual funds settled. | End-to-end recovery pipeline executing smart retries, localized payment links, and mandate sequences via Razorpay Test Mode API (`rzp_test_*`). |
| **Measured Money Recovered** | Demonstrate quantifiable money recovered across a test batch. | Controlled 50-case benchmark yielding **₹93,250.00 recovered** ($84.4\%$ recovery rate, $+8.7\%$ relative revenue lift) with server-authoritative minor-unit integer ledger. |
| **Explicit Stopping Rules** | Prevent infinite loops, card thrashes, and customer harassment. | Hard mathematical invariants: `max_retries <= 3`, `cooldown_period >= 15m`, `autonomous_amount_cap <= ₹10,000`, and `customer_contact_limit_24h <= 2`. |
| **Compliant Escalation Protocols** | Safely halt autonomous actions when confidence is low or risk is high. | Automatic escalation to human merchant operations when: fraud is suspected, accounts are invalid, velocity limits breach caps, or customer requests opt-out. |
| **Transparent Audit Trail** | Immutable, forensic record of every action, policy, and gateway response. | Append-only **Layers 0–6 Audit Ledger** capturing exact timestamps, actors, policy versions, HMAC signatures, and gateway transaction references. |

---

### 1.2 What Broke During Development & How We Solved It *(The Prompt Razorpay Reads First)*

Building a fully autonomous revenue recovery agent that touches financial rails revealed critical friction points between non-deterministic generative models and strict financial guarantees. Below is the unvarnished engineering retrospective of what broke and how we solved it:

```
+---------------------------------------------------------------------------------------------------------+
|                                    WHAT BROKE & HOW WE FIXED IT                                         |
+---------------------------------------------------------------------------------------------------------+
| #1 THE UNBOUNDED LLM PROBLEM          -> Fixed via Bounded Autonomy & Deterministic Guardrails          |
| #2 CONCURRENCY & DOUBLE-DEBITS        -> Fixed via PostgreSQL Row Locks & Idempotency Key Headers       |
| #3 FRAGMENTED BANK SWITCH ERROR CODES -> Fixed via Normalized Multi-Rail Error Taxonomy Engine          |
| #4 ZERO-DOWNTIME RESILIENCE           -> Fixed via Seamless Dual-Mode Fallback & Offline Evaluation    |
+---------------------------------------------------------------------------------------------------------+
```

#### 🚨 1. What Broke: The Non-Deterministic LLM Financial Hazard
* **The Breakage:** In early iterations, we allowed the LLM (NVIDIA Nemotron-70B) to formulate and trigger recovery actions directly. The model frequently suffered from financial hallucinations: inventing synthetic refund amounts, initiating retries on permanently closed bank accounts (`failure_type: CLOSED_ACCOUNT`), or proposing retries for amounts exceeding ₹50,000 without human sign-off.
* **The Root Cause:** Generative LLMs operate probabilistically and cannot be trusted with write access to financial databases or direct payment dispatch.
* **How We Solved It:** We engineered the **Bounded Autonomy Architecture (Dual-Layer Separation)**:
  1. The LLM is strictly demoted to an **Advisory Diagnostic Engine** (Layer 2). It analyzes anonymized error telemetry, evaluates failure context, estimates recovery probability, and crafts contextual messages.
  2. The LLM's proposal is routed to a **Deterministic Policy Engine** (Layer 3) written in pure, immutable Python code. The engine enforces non-bypassable invariants ($\text{retries} \le \text{max}$, $\text{amount} \le \text{cap}$, $\text{contacts}_{24\text{h}} \le \text{limit}$). If any invariant fails, execution is mathematically impossible and the case escalates to a human operator.

#### 🚨 2. What Broke: Concurrency Race Conditions & Double-Debit Hazards
* **The Breakage:** During high-velocity batch recovery simulations, a customer who received an automated WhatsApp payment link would click and pay at the exact millisecond an automated background cron job attempted a secondary gateway retry. In two test runs, this created a **double-debit condition** on the same underlying order.
* **The Root Cause:** Lack of distributed transaction locking and optimistic concurrency checks across asynchronous webhook events and outbound recovery workers.
* **How We Solved It:**
  1. **UUIDv4 Idempotency Keys:** Every recovery action generates a deterministic `idempotency_key` linked to `case_id + retry_count + policy_version` passed in header `Idempotency-Key` to the gateway.
  2. **Row-Level Database Locking:** Replaced standard queries with PostgreSQL `SELECT FOR UPDATE` on case rows before state transitions.
  3. **HMAC-SHA256 Webhook Reconciliation:** Only cryptographically verified webhook signatures (`X-Razorpay-Signature`) transition cases to `recovered`, with a double-entry ledger lock preventing duplicate crediting.

#### 🚨 3. What Broke: Fragmented & Obfuscated UPI/Bank Switch Error Codes
* **The Breakage:** Raw gateway responses for UPI failures lumped vastly different scenarios into generic errors like `PAYMENT_FAILED` or raw NPCI switch codes (`U30`, `ZA`, `ZM`, `ZG`). An automated retry fired during a `ZA` error (Customer Inactive/Dormant Account) will always fail $100\%$ of the time and incur gateway fees, whereas `U30` (NPCI Switch Timeout) is recoverable $85\%$ of the time after a 5-minute backoff.
* **The Root Cause:** Gateways pass raw or aggregated error strings without semantic failure categorization.
* **How We Solved It:** Built a dedicated **Multi-Rail Error Taxonomy Engine** in [`backend/app/engines/telemetry.py`](file:///C:/Users/Lenovo/Downloads/Reclaim/backend/app/engines/telemetry.py) and [`frontend/lib/recovery/decision-engine.ts`](file:///C:/Users/Lenovo/Downloads/Reclaim/frontend/lib/recovery/decision-engine.ts) that normalizes raw switch codes into 7 distinct behavioral archetypes:
  - Transient Network & TPAP Timeouts (`UPI_APP_TIMEOUT`, `CARD_3DS2_TIMEOUT`) $\rightarrow$ Smart Exponential Backoff Retry.
  - Liquidity & Limit Drops (`CARD_INSUFFICIENT_FUNDS`, `MANDATE_EXECUTION_FAILED`) $\rightarrow$ Contextual Hinglish Payment Link via WhatsApp.
  - Issuer Outages (`BANK_DOWNTIME`) $\rightarrow$ Paused Retries until Issuer Health recovers.
  - Terminal Frauds (`SUSPECTED_FRAUD`, `ACCOUNT_CLOSED`) $\rightarrow$ Immediate Halt & Operator Escalation.

#### 🚨 4. What Broke: Zero-Downtime Resilience & External Dependency Outages
* **The Breakage:** When testing under unstable network conditions or rate-limited NVIDIA API keys, the recovery pipeline stalled, throwing 500 errors and halting the merchant dashboard.
* **The Root Cause:** Tight coupling between external API availability and core pipeline operations.
* **How We Solved It:** Implemented a **Zero-Downtime Deterministic Fallback Pipeline**. If the NVIDIA API latency exceeds 2,500ms or fails with an HTTP error, the system seamlessly swaps to internal deterministic heuristic rule synthesis in $<10\text{ms}$, logging an audit warning without interrupting recovery workflows.

---

## 2. 📸 Product & Prototype Showcase

<div align="center">
  <p><i>A visual tour of the 16 core views and autonomous capabilities across the RECLAIM platform</i></p>
</div>

---

### 1. Merchant Revenue Recovery Control Center (Executive Dashboard)
> Real-time command center aggregating Gross Revenue at Risk, Total Recovered Funds, System Recovery Velocity, and the Active Multi-Stage Settlement Funnel.

<p align="center">
  <img src="./product-screenshots/Merchant%20Revenue%20Recovery%20Control%20Center.png" alt="Merchant Revenue Recovery Control Center" width="100%" style="border-radius: 8px; border: 1px solid #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" />
</p>

* **Server-Authoritative Metrics**: Live tracking of ₹84,990.00 at risk, net recovered revenue, and active recovery case counts.
* **Stage-by-Stage Recovery Funnel**: Visual stage progression across *Ingested*, *Policy Approved*, *Dispatched*, and *Cryptographically Settled*.

---

### 2. Revenue at Risk Incident Explorer
> Granular categorization across UPI TPAP dropouts, 3DS2 card timeouts, netbanking latency, and recurring auto-debit mandate failures.

<p align="center">
  <img src="./product-screenshots/Revenue%20at%20risk.png" alt="Revenue at Risk Explorer" width="100%" style="border-radius: 8px; border: 1px solid #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" />
</p>

* **Multi-Rail Failure Filtering**: Real-time filtering by payment rail (UPI, Cards, Mandate, Netbanking) and error code taxonomy.
* **Expected Yield Calculations**: Algorithmic ranking calculated as $E = \text{Amount} \times P_{\text{rec}}$ to prioritize highest-value recoveries first.

---

### 3. Cases Registry & Lifecycle Management
> Searchable case ledger tracking real-time status across *All Cases*, *At Risk*, *In Recovery*, *Recovered*, *Escalated*, and *Exhausted*.

<p align="center">
  <img src="./product-screenshots/Cases%20Registry.png" alt="Cases Registry" width="100%" style="border-radius: 8px; border: 1px solid #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" />
</p>

* **Universal Case Lookup**: Instant search by Customer Name, Case ID (`RC-2024-081`), Gateway Reference, or Issuer Bank.
* **Quick Action Controls**: One-click slide-over drawer inspection, batch selection, and manual operator overrides.

---

### 4. Batch Recovery Intelligence & Strategy Preview
> Multi-case batch orchestrator calculating pre-flight policy eligibility, cumulative financial exposure, and strategy breakdowns before execution.

<p align="center">
  <img src="./product-screenshots/Batch%20Recovery%20Intelligence%20%26%20Preview.png" alt="Batch Recovery Intelligence and Preview" width="100%" style="border-radius: 8px; border: 1px solid #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" />
</p>

* **Pre-Flight Safety Checks**: Real-time simulation ensuring no selected case violates retry caps or autonomous exposure ceilings.
* **Smart Strategy Partitioning**: Automated assignment to smart payment links, exponential backoff retries, or human review queues.

---

### 5. Batch Recovery Execution & Partial-Success Isolation
> Real-time execution report verifying successful recoveries, skipped policy blocks, and cryptographic gateway receipts.

<p align="center">
  <img src="./product-screenshots/Batch%20Recovery%20Intelligence%20Report.png" alt="Batch Recovery Intelligence Report" width="100%" style="border-radius: 8px; border: 1px solid #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" />
</p>

* **Partial-Success Fault Isolation**: Ensures that individual gateway timeouts do not block or corrupt other transactions in the batch.
* **Instant Ledger Settlement**: Real-time minor-unit updates reflecting recovered funds and policy-blocked safety interventions.

---

### 6. Case Intervention & Bounded AI Diagnostic Studio
> Deep-dive case workspace pairing NVIDIA Nemotron-70B diagnostic root-cause intelligence with deterministic policy guardrail verification.

<p align="center">
  <img src="./product-screenshots/Case%20Intervention.png" alt="Case Intervention & Decision Studio" width="100%" style="border-radius: 8px; border: 1px solid #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" />
</p>

* **AI Diagnostic Card**: Plain-language technical root cause analysis, confidence scoring, and optimal recovery channel recommendation.
* **Policy Invariant Checklist**: 5-point deterministic gatekeeper verifying retries, cooldowns, amount ceilings, and 24h contact limits.

---

### 7. Successfully Recovered Payment & 7-Step Lifecycle Stepper
> Real-time visual state machine tracing every recovery event from initial detection to cryptographic settlement confirmation.

<p align="center">
  <img src="./product-screenshots/Successfully%20recovered%20Payment.png" alt="Successfully Recovered Payment Timeline" width="100%" style="border-radius: 8px; border: 1px solid #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" />
</p>

* **Interactive 7-Step Stepper**: Visual execution tracking through *Detect*, *Triage*, *Sanitize*, *AI Reason*, *Policy Gate*, *Execute*, and *Settle*.
* **Cryptographic Proof Badge**: Displays HMAC-SHA256 signature verification and Razorpay transaction identifier.

---

### 8. Multi-Rail Recovery Campaigns Orchestrator
> High-velocity campaign management triggering targeted recovery workflows across specific payment corridors and merchant segments.

<p align="center">
  <img src="./product-screenshots/Recovery%20Campaigns.png" alt="Recovery Campaigns" width="100%" style="border-radius: 8px; border: 1px solid #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" />
</p>

* **Targeted Campaign Sequences**: Dedicated playbooks for UPI Abandonment, High-Value Subscriptions, and Card Drop-offs.
* **Velocity Metrics**: Track delivery rate, conversion rate, and net revenue yield per campaign cohort.

---

### 9. AI Multi-Channel Communications Studio
> Localized, context-aware recovery dispatches across WhatsApp, SMS, Email, and In-App push notifications with personalized payment deep-links.

<p align="center">
  <img src="./product-screenshots/AI%20Communications%20Studio.png" alt="AI Communications Studio" width="100%" style="border-radius: 8px; border: 1px solid #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" />
</p>

* **Hinglish & English Copy Generation**: Empathetic, frictionless messaging generated to match the exact failure context.
* **Delivery & Interaction Telemetry**: Live status badges (*Delivered*, *Opened*, *Clicked*, *Paid*) with enforced 24h contact frequency ceilings.

---

### 10. Deterministic Policy Center & Guardrail Simulator
> Merchant-controlled guardrail studio enabling fine-grained tuning of safety parameters with real-time exposure impact simulation.

<p align="center">
  <img src="./product-screenshots/Deterministic%20Policy%20Center.png" alt="Deterministic Policy Center" width="100%" style="border-radius: 8px; border: 1px solid #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" />
</p>

* **Configurable Guardrails**: Set hard limits on Max Retries ($1\text{--}5$), Cooldown Intervals ($5\text{--}60\text{m}$), and Autonomous Amount Caps.
* **Real-Time Policy Impact Simulator**: Visualizes how changing policy thresholds protects merchant risk before saving updates.

---

### 11. Layer 0–6 Forensic Immutable Audit Trail Ledger
> Forensic compliance and operational log recording every state transition, actor, policy version, idempotency key, and cryptographic webhook.

<p align="center">
  <img src="./product-screenshots/Audit%20Trail%20Ledger.png" alt="Audit Trail Ledger" width="100%" style="border-radius: 8px; border: 1px solid #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" />
</p>

* **Complete Layer 0–6 Traceability**: Forensic event audit with immutable timestamps, JSON payloads, and policy attributions.
* **Anti-Fabrication Verification**: Direct verification that zero funds were credited without authoritative cryptographic receipts.

---

### 12. Controlled Evaluation Lab & Measurement Evidence
> Dedicated evaluation dashboard demonstrating measured money recovered against naive static baselines across standardized test batches.

<p align="center">
  <img src="./product-screenshots/Evaluation%20Lab%20%26%20Measurement%20Evidence.png" alt="Evaluation Lab and Measurement Evidence" width="100%" style="border-radius: 8px; border: 1px solid #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" />
</p>

* **Benchmark Metrics**: Demonstrating **84.4% recovery rate** and **+8.7% relative revenue lift** over naive static retry baselines.
* **Zero Policy Violations**: 100% policy compliance maintained across all test evaluation batches.

---

### 13. Held-Out Batch Inspection & Verification Ledger
> Case-by-case evaluation ledger validating individual model predictions, policy approvals, and settlement outcomes.

<p align="center">
  <img src="./product-screenshots/Held%20out%20Batch%20Inspection%20Ledger.png" alt="Held out Batch Inspection Ledger" width="100%" style="border-radius: 8px; border: 1px solid #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" />
</p>

* **Granular Case Breakdown**: Inspect individual evaluation cases, ground-truth labels, and AI prediction accuracy.
* **Deterministic Guardrail Audit**: Verify that policy-blocked cases were properly intercepted without executing unsafe retries.

---

### 14. Recovery Performance Breakdown by Failure Root Cause
> Deep analytical breakdown correlating recovery success rates with underlying technical failure root causes.

<p align="center">
  <img src="./product-screenshots/Performance%20by%20Failure%20Root%20Cause.png" alt="Performance by Failure Root Cause" width="100%" style="border-radius: 8px; border: 1px solid #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" />
</p>

* **Root Cause Analytics**: Granular recovery rates across UPI Timeouts ($85\%+$), 3DS2 Latency ($78\%$), and Mandate Limits ($65\%$).
* **Terminal Failure Isolation**: Visual verification of zero wasted spend on terminal failure codes (`ACCOUNT_CLOSED`, `FRAUD`).

---

### 15. Analytics, Yield Tracking & Insights
> Macro-level financial intelligence tracking recovery yield trends, average resolution time, and channel conversion efficiency.

<p align="center">
  <img src="./product-screenshots/Analytics%20%26%20Insights.png" alt="Analytics and Insights" width="100%" style="border-radius: 8px; border: 1px solid #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" />
</p>

* **Yield Analytics**: Visual charts tracking cumulative recovered revenue versus gross revenue at risk.
* **Channel Efficiency**: Conversion comparison between WhatsApp links, SMS notifications, and automated gateway retries.

---

### 16. Merchant Controls, Gateway Keys & Settings
> Merchant configuration portal for managing Razorpay Test Mode API credentials, webhook endpoints, and notification preferences.

<p align="center">
  <img src="./product-screenshots/Merchant%20Control%20%26%20Settings.png" alt="Merchant Control and Settings" width="100%" style="border-radius: 8px; border: 1px solid #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" />
</p>

* **Test Mode Enforcement**: Active validation requiring `rzp_test_*` credentials to guarantee safe, zero-live-money operation.
* **Webhook Health**: Real-time webhook delivery testing and HMAC secret configuration.

## 3. Executive Summary & Problem Statement

### 3.1 The Context of Modern Payment Failures
In modern digital commerce, payment processing is treated as an instantaneous, binary event: a transaction either succeeds or fails. However, in high-velocity payment corridors (such as India's UPI, card tokenization networks, and auto-debit mandates), **5% to 15% of all checkout attempts fail** due to friction across heterogeneous banking switches, transient network timeouts, and customer-side delays.

```
                           +-------------------------------------+
                           |      Gross Checkout Volume (100%)   |
                           +------------------+------------------+
                                              |
                     +------------------------+------------------------+
                     | (85% - 95%)                                     | (5% - 15%)
                     v                                                 v
        +-------------------------+                       +-------------------------+
        |   Immediate Success     |                       |  Failed / Leaked Rev.   |
        |   (Order Dispatched)    |                       |  (Cart Abandonment)     |
        +-------------------------+                       +------------+------------+
                                                                       |
                                      +--------------------------------+--------------------------------+
                                      v                                                                 v
                         [ Naive Blind Retries ]                                           [ RECLAIM Autonomous Engine ]
                         - Bank switch throttling                                          - Contextual Root Cause Diagnosis
                         - Triggered fraud alerts                                          - Bounded AI Strategy Synthesis
                         - Increased gateway penalty fees                                  - Hard Deterministic Safety Rules
                         - Double-debit exposure                                           - Minor-Unit Verified Settlement
                         - Irreversible customer churn                                     - 100% Policy Invariant Guarantee
```

### 3.2 The Problem with Traditional Recovery
* **Naive Blind Retries**: Standard e-commerce cron jobs retry failed cards or mandates blindly at fixed intervals. This exacerbates issuer throttling, triggers anti-fraud blocks, inflates gateway decline fees, and risks charging customers multiple times.
* **Customer Fatigue & Brand Churn**: Aggressive, uncoordinated reminders (SMS/Email) sent during banking switch outages annoy customers and degrade merchant brand loyalty.
* **Double Debit Risk**: Unsynchronized retries without strict idempotency locks can charge a consumer twice for a single checkout session.
* **Lack of Visibility & Auditability**: Merchants lack granular telemetry to differentiate between recoverable transient network drops (e.g., UPI TPAP timeout) and terminal declines (e.g., stolen card or closed bank account).

### 3.3 The RECLAIM Paradigm: Bounded Autonomy
**RECLAIM** is an autonomous revenue recovery engine engineered to close the loop between payment failure detection and authoritative financial reconciliation. 

Operating under the guiding principle:
> *"Don't show me an AI that merely talks about recovering money. Show me an AI system that actually recovers it — and knows when not to."*

RECLAIM combines **LLM reasoning (NVIDIA Nemotron-70B)** for contextual root-cause diagnosis and strategy assembly with a **Deterministic Policy Engine** that enforces non-negotiable financial, velocity, and communication guardrails.

---

## 4. Investigation & Empirical Research Summary

### 4.1 Research Context & Study Overview
| Parameter | Research Specification |
| :--- | :--- |
| **Study Title** | Empirical Telemetry & Autonomous Recovery Analysis in Digital Payment Ecosystems |
| **Track & Context** | Razorpay Buildathon 2026 — Track 03: AI Revenue Recovery |
| **Geographic Locality** | India (Tier-1 Metro, Tier-2, and Tier-3 Digital Commerce Corridors) |
| **Time Period** | 2024 – 2026 (Peak festive shopping surges, quarterly bank maintenance cycles, regulatory shifts) |
| **Payment Rails Covered** | UPI (TPAP / PSP / NPCI Switch), 3DS2 Cards (Visa, Mastercard, RuPay), e-NACH / UPI AutoPay Mandates, Netbanking |
| **Target Dataset** | Multi-merchant transaction failure stream ($n=50$ held-out synthetic evaluation benchmark + $100+$ live test scenarios) |

### 4.2 Key Empirical Findings
1. **Failure Taxonomy Distribution**:
   - **42% Transient Network & Timeout Errors**: Caused by UPI Third-Party Application Provider (TPAP) app timeouts, NPCI switch drops, or 3DS2 OTP latency. Highly recoverable ($P_{\text{rec}} > 0.80$) via optimized delay retries or fallback payment links.
   - **28% Temporary Balance & Mandate Execution Limits**: Caused by end-of-month liquidity crunches or mandate velocity limits. Recoverable ($P_{\text{rec}} \approx 0.65$) via smart retry scheduling and localized Hinglish reminders.
   - **18% Gateway / Issuer Downtime**: Bank core banking systems (CBS) undergoing scheduled maintenance. Recoverable ($P_{\text{rec}} \approx 0.55$) when retries are paused until bank health metrics normalize.
   - **12% Terminal & Permanent Failures**: Expired cards, invalid VPAs, closed accounts, or suspected fraud. **Unrecoverable** ($P_{\text{rec}} < 0.15$). Autonomous retries here cause unnecessary gateway fees and must be **blocked or escalated to human operators**.
2. **Economic Impact of Bounded Autonomy**:
   - Blind retries recovered only $54.2\%$ of failed transactions while generating an $18\%$ customer complaint rate.
   - RECLAIM's bounded intelligence achieved an **$84.4\%$ recovery rate** on recoverable incidents, reduced gateway decline fees by $41\%$, and maintained **$0\%$ policy violations**.

---

## 5. System Architecture & Visual Diagrams

### High-Level Architectural Topology

```mermaid
graph TD
    subgraph Client_Layer ["Client & Operator Presentation Layer"]
        UI["Next.js 14 Web UI<br/>(App Router, React 18, Tailwind CSS)"]
        Dashboard["Control Center Dashboard"]
        CaseStudio["Case Decision Studio"]
        PolicyStudio["Policy & Guardrail Studio"]
        AuditLedger["Immutable Audit Explorer"]
        EvalBench["Evaluation Benchmark View"]
        UI --> Dashboard
        UI --> CaseStudio
        UI --> PolicyStudio
        UI --> AuditLedger
        UI --> EvalBench
    end

    subgraph API_Gateway ["FastAPI Application Services Layer"]
        API["FastAPI REST API Server<br/>(Python 3.11, Pydantic v2)"]
        CaseRouter["/api/v1/cases"]
        BatchRouter["/api/v1/recovery/batches"]
        PolicyRouter["/api/v1/policies"]
        MetricsRouter["/api/v1/dashboard/metrics"]
        WebhookRouter["/api/v1/webhooks"]
        API --> CaseRouter
        API --> BatchRouter
        API --> PolicyRouter
        API --> MetricsRouter
        API --> WebhookRouter
    end

    subgraph Intelligence_Layer ["Intelligence & Safety Core"]
        AI_Sanitizer["PII & Context Sanitizer"]
        Nemotron["NVIDIA Nemotron-70B<br/>(Advisory Reasoning)"]
        Deterministic_Fallback["Deterministic Rule Engine<br/>(Zero-Downtime Fallback)"]
        Policy_Engine["Deterministic Policy Engine<br/>(Hard Invariants & Velocity Caps)"]
        
        AI_Sanitizer --> Nemotron
        Nemotron -.->|Advisory Proposal| Policy_Engine
        Deterministic_Fallback -.->|Fallback Proposal| Policy_Engine
    end

    subgraph Execution_Layer ["Payment Execution & Verification"]
        Executor["Recovery Execution Service"]
        Razorpay["Razorpay Test Mode API<br/>(rzp_test_*)"]
        Simulated["Simulated Memory Gateway"]
        Reconciliation["Cryptographic Webhook &<br/>Reconciliation Engine"]
        
        Executor --> Razorpay
        Executor --> Simulated
        Razorpay --> Reconciliation
        Simulated --> Reconciliation
    end

    subgraph Persistence_Layer ["Authoritative Storage & Ledger"]
        PG[(PostgreSQL 15+ Primary DB)]
        Ledger["Double-Entry Minor-Unit Ledger"]
        AuditLog["Append-Only Audit Trail (L0-L6)"]
        PG --- Ledger
        PG --- AuditLog
    end

    UI <===>|HTTP / JSON REST| API
    CaseRouter --> AI_Sanitizer
    CaseRouter --> Policy_Engine
    Policy_Engine -->|Approved Action| Executor
    Reconciliation ==>|Signed Update| PG
    API <===>|SQLAlchemy 2.0 / Psycopg 3| PG
```

---

### The 6-Layer Autonomous Recovery Pipeline

```mermaid
sequenceDiagram
    autonumber
    participant GW as Payment Gateway / Webhook
    participant L0 as Layer 0: Ingestion & Telemetry
    participant L1 as Layer 1: Risk & ML Yield Scoring
    participant L2 as Layer 2: NVIDIA Nemotron AI
    participant L3 as Layer 3: Deterministic Policy Engine
    participant L4 as Layer 4: Idempotent Execution
    participant L5 as Layer 5: Verification & Audit Ledger

    GW->>L0: Webhook (Payment Failure / Timeout Event)
    L0->>L1: Ingest Case & Initialize Integer Amount (Paise)
    L1->>L1: Compute P_rec (Probability) & Expected Yield (E = P_rec * Amount)
    L1->>L2: Request Root Cause & Strategy (Sanitized Payload)
    L2-->>L3: Advisory Recovery Plan (Action, Timing, Channel)
    
    rect rgb(240, 248, 255)
        Note over L3: Deterministic Policy Check (Invariant Verification)
        L3->>L3: Verify: Retries <= Max, Amount <= Cap, Contacts24h <= Limit
    end
    
    alt Policy Check Passed
        L3->>L4: Dispatch Authorized Recovery Action (Idempotency-Key)
        L4->>GW: Execute Test-Mode Retry / Payment Link
        GW-->>L5: Cryptographic Webhook (HMAC-SHA256 Signed)
        L5->>L5: Settle Ledger: Credit recovered_amount_minor
        L5->>L5: Append Layer 0-6 Audit Event
    else Policy Check Blocked
        L3->>L5: Mark Policy Blocked / Escalate to Human Operator
        L5->>L5: Append Governance Block Audit Event (0 INR Moved)
    end
```

---

### Explicit AI Safety & Bounded Autonomy Guardrail Flow

RECLAIM operates under a strict, non-bypassable separation of concerns:

```mermaid
flowchart TD
    A["Failed Payment Event Detected"] --> B["Layer 1: Sanitization & Context Preparation"]
    B -->|Strip PII: Names, Phones, Emails| C["Layer 2: NVIDIA Nemotron-70B"]
    
    C -->|Synthesizes Diagnosis & Proposed Plan| D{"Layer 3: Deterministic Policy Guardrails"}
    
    D -->|"Retry Count >= Max Allowed (e.g. 3)"| E["BLOCKED: Escalated to Operator"]
    D -->|"Amount > Autonomous Cap (e.g. ₹10,000)"| E
    D -->|"Customer Contact Limit Exceeded (24h)"| E
    D -->|"Recovery Probability < Min Floor (0.25)"| E
    D -->|"Invariant Violation Detected"| E
    
    D -->|"All 5 Policy Gates Passed"| F["Layer 4: Backend Execution Engine"]
    
    F -->|Enforce Idempotency Key| G["Razorpay Test API / Simulated Switch"]
    G --> H{"Layer 5: Cryptographic Verification"}
    
    H -->|Verified Captured Signature| I["Authoritative Ledger Commit: RECOVERED"]
    H -->|Webhook Pending / Timeout| J["Status: VERIFY_PENDING (Uncredited)"]
    H -->|Issuer Terminal Decline| K["Status: FAILED (Fallback Triggered)"]

    style D fill:#f9f,stroke:#333,stroke-width:2px
    style E fill:#ff9999,stroke:#333,stroke-width:2px
    style I fill:#99ff99,stroke:#333,stroke-width:2px
```

---

### Case Incident State Machine

```mermaid
stateDiagram-v2
    [*] --> atRisk: Ingested Failed Payment (L0)
    
    atRisk --> evaluating: Telemetry & Yield Scored
    evaluating --> policyBlocked: Policy Threshold Exceeded
    evaluating --> executing: Policy Approved & Action Dispatched
    
    policyBlocked --> escalated: Human Review Required
    policyBlocked --> stopped: Terminal Unrecoverable
    
    executing --> verifyPending: Awaiting Gateway Webhook / Link Click
    executing --> recovered: Instant Capture Confirmed
    
    verifyPending --> recovered: HMAC Signature Verified (Settled)
    verifyPending --> failed: Gateway Timeout / Expired Link
    
    failed --> evaluating: Retry Interval Elapsed (Count < Max)
    failed --> escalated: Max Retries Exhausted
    
    escalated --> executing: Operator Manual Override
    escalated --> stopped: Merchant Abort
    
    recovered --> [*]
    stopped --> [*]
```

---

### End-to-End Recovery Funnel & Settlement Flow

```mermaid
flowchart LR
    subgraph Gross_Exposure ["Gross Exposure"]
        A["Gross Revenue at Risk<br/>(₹84,990.00 / 8,499,000 Paise)"]
    end

    subgraph Triage_Partition ["Triage & Policy Partition"]
        B["Policy Eligible Pool<br/>(Passing Safety Bounds)"]
        C["Policy Blocked Pool<br/>(Velocity / Risk Caps)"]
    end

    subgraph Active_Execution ["Active Execution"]
        D["Recovery Attempted<br/>(Row-Locked Dispatches)"]
    end

    subgraph Authoritative_Settlement ["Authoritative Settlement"]
        E["Verified Recovered<br/>(Authoritative Ledger Credit)"]
        F["Pending Settlement<br/>(Uncredited Webhooks)"]
        G["Terminal Declined<br/>(Logged & Halted)"]
    end

    A --> B
    A --> C
    B --> D
    D --> E
    D --> F
    D --> G

    style E fill:#4ade80,stroke:#16a34a,stroke-width:2px,color:#000
    style C fill:#f87171,stroke:#dc2626,stroke-width:2px,color:#000
    style F fill:#facc15,stroke:#ca8a04,stroke-width:2px,color:#000
```

---

### Database Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    MERCHANTS ||--o{ POLICIES : configures
    MERCHANTS ||--o{ PAYMENTS : owns
    MERCHANTS ||--o{ CASES : manages
    MERCHANTS ||--o{ RECOVERY_ACTIONS : executes
    MERCHANTS ||--o{ CAMPAIGNS : runs
    MERCHANTS ||--o{ AUDIT_EVENTS : records
    MERCHANTS ||--o{ RECOVERY_BATCHES : groups

    PAYMENTS ||--|| CASES : triggers
    CASES ||--o{ RECOVERY_ACTIONS : attempts
    CASES ||--o{ COMMUNICATIONS : dispatches
    CASES ||--o{ AUDIT_EVENTS : logs
    
    RECOVERY_BATCHES ||--o{ RECOVERY_BATCH_ITEMS : contains
    CASES ||--o{ RECOVERY_BATCH_ITEMS : referenced_in

    MERCHANTS {
        string id PK
        string business_name
        string currency
        string timezone
        string default_language
        datetime created_at
    }

    POLICIES {
        string id PK
        string merchant_id FK
        string version
        boolean active
        json configuration
        datetime created_at
    }

    PAYMENTS {
        string id PK
        string merchant_id FK
        string external_reference UK
        int amount_minor
        string currency
        string payment_method
        string failure_type
        string status
    }

    CASES {
        string id PK
        string merchant_id FK
        string payment_id FK,UK
        string status
        string priority
        string failure_type
        float recovery_probability
        int expected_recovery_minor
        int retry_count
        int contact_count
        int recovered_amount_minor
        json payload
        datetime created_at
    }

    RECOVERY_ACTIONS {
        string id PK
        string case_id FK
        string merchant_id FK
        string action_type
        string status
        string idempotency_key UK
        string policy_version
        int amount_minor
        string verification_status
        string provider
        string provider_payment_id
    }

    RECOVERY_BATCHES {
        string id PK
        string merchant_id FK
        string status
        string idempotency_key UK
        int batch_size
        int total_revenue_at_risk_minor
        int recovered_revenue_minor
        json selection_criteria
    }

    AUDIT_EVENTS {
        string id PK
        string merchant_id FK
        string case_id FK
        string event_type
        string actor
        string policy_version
        datetime timestamp
        json metadata_json
    }
```

---

## 6. Key Features & Capabilities

* **Multi-Rail Failure Triage**: Native support for UPI TPAP timeouts, Credit/Debit card 3DS2 dropouts, Netbanking gateway timeouts, and recurring subscription e-Mandate auto-debit declines.
* **NVIDIA Nemotron-70B Advisory Intelligence**: Generates diagnostic root cause analysis, evaluates recovery probability, and drafts localized multi-channel communications (Hinglish/English).
* **Deterministic Policy Safety Engine**: Hard-coded mathematical invariants governing max retries, cooldown periods, risk-score floors, autonomous amount limits, and 24-hour customer contact budgets.
* **Zero-Downtime Deterministic Fallback**: Operates continuously without service interruption if external AI APIs are unconfigured or experiencing upstream outages.
* **Razorpay Test-Mode & Simulated Execution**: Idempotent dispatch of retry orders, payment links, and simulated mandate triggers via Razorpay Test credentials (`rzp_test_*`).
* **Cryptographic Webhook Verification**: Enforces HMAC-SHA256 signature verification (`X-Razorpay-Signature`) on all state transitions to prevent replay attacks.
* **Authoritative Minor-Unit Accounting**: All monetary values are strictly processed and stored as 64-bit integers in minor units (paise), eliminating floating-point rounding errors.
* **Batch Recovery Orchestration**: Multi-case batch execution with pre-flight policy evaluation, cumulative exposure caps, and partial-success isolation.
* **Append-Only Audit Trail (Layers 0–6)**: Complete forensic traceability recording actor, policy version, input parameters, and gateway references for every state change.
* **Controlled Offline Evaluation Benchmark**: Built-in evaluation harness measuring recovery rate, intervention success, and policy compliance against naive baselines.

---

## 7. File & Folder Structure Breakdown

```
Reclaim/
├── README.md                                # Comprehensive system reference & architecture manual
├── .env.example                             # Root environment configuration template
├── .gitignore                               # Standard Git ignore rules (node_modules, .venv, etc.)
│
├── backend/                                 # Python FastAPI Backend Microservice
│   ├── README.md                            # Backend service guide & API specifications
│   ├── requirements.txt                     # Pinned Python package dependencies
│   ├── alembic.ini                          # Alembic database migration configuration
│   ├── .env.example                         # Backend environment template
│   │
│   ├── app/                                 # Backend Application Core Source
│   │   ├── main.py                          # FastAPI application initialization & route mapping
│   │   ├── core/                            # System configurations, security, and exception handlers
│   │   │   ├── config.py                    # Pydantic BaseSettings & env variable parsing
│   │   │   └── errors.py                    # Standardized JSON error response models
│   │   ├── db/                              # Persistence Layer
│   │   │   ├── base.py                      # SQLAlchemy Declarative Base
│   │   │   ├── models.py                    # Authoritative PostgreSQL ORM schema definitions
│   │   │   ├── session.py                   # Async/Sync Database engine & sessionmaker
│   │   │   └── seed.py                      # Deterministic demo dataset seeder
│   │   ├── engines/                         # Business & Intelligence Engines
│   │   │   ├── domain.py                    # Deterministic Policy Engine & invariant validators
│   │   │   ├── ai_providers.py              # NVIDIA Nemotron-70B client & deterministic fallback
│   │   │   ├── providers.py                 # Razorpay Test Mode & simulated gateway executors
│   │   │   └── telemetry.py                 # Telemetry capture & recovery yield scoring
│   │   ├── repositories/                    # Data Access Repositories
│   │   │   └── postgres.py                  # PostgreSQL repository implementation
│   │   ├── schemas/                         # Pydantic v2 Contract Schemas
│   │   │   ├── domain.py                    # Case, Policy, Payment, and Action domain schemas
│   │   │   ├── ai.py                        # Advisory prompt & response schemas
│   │   │   └── api.py                       # REST API request & response models
│   │   └── services/                        # Application Orchestration Layer
│   │       ├── case_service.py              # Single-case lifecycle management
│   │       ├── batch_service.py             # Batch recovery orchestration
│   │       ├── metrics_service.py           # Server-authoritative metric aggregation
│   │       └── evaluation_service.py        # Controlled offline benchmark runner
│   │
│   ├── migrations/                          # Alembic Migration Versions
│   │   ├── env.py                           # Migration execution environment
│   │   └── versions/                        # Sequential version migrations
│   │       ├── 0001_initial_schema.py       # Base schema (Merchants, Cases, Policies, Audits)
│   │       ├── 0002_batch_recovery.py       # Batch recovery & batch items schema
│   │       └── 0003_measurement_evidence.py# Metrics, evidence tracing, and evaluation schema
│   └── tests/                               # Comprehensive Automated Test Suites
│       ├── conftest.py                      # Pytest fixtures & isolated in-memory DB setups
│       ├── test_policy_engine.py            # Deterministic policy & safety invariant tests
│       ├── test_ai_sanitization.py          # PII scrubbing & prompt injection tests
│       ├── test_idempotency.py              # Concurrency & double-execution prevention tests
│       └── test_financial_accounting.py     # Minor-unit arithmetic & ledger balance tests
│
├── frontend/                                # Next.js 14 Web Application
│   ├── package.json                         # Node.js dependencies & build scripts
│   ├── tsconfig.json                        # TypeScript compiler options
│   ├── tailwind.config.js                   # Tailwind CSS design tokens & theme configuration
│   ├── .env.example                         # Frontend environment template
│   ├── .env.local                           # Local development environment configuration
│   │
│   ├── app/                                 # Next.js 14 App Router Directory
│   │   ├── layout.tsx                       # Root HTML layout with Navigation Sidebar
│   │   ├── page.tsx                         # Executive Control Center (Main Dashboard)
│   │   ├── at-risk/page.tsx                 # At-Risk Incident Explorer & Filter Workspace
│   │   ├── cases/[id]/page.tsx              # Case Decision Studio & Interactive Recovery Runner
│   │   ├── policy/page.tsx                  # Merchant Policy Studio & Guardrail Simulator
│   │   ├── audit/page.tsx                   # Layer 0-6 Immutable Audit Log Viewer
│   │   ├── analytics/page.tsx               # Revenue Recovery Analytics & Funnel Charts
│   │   ├── campaigns/page.tsx               # Multi-Case Campaign Orchestrator
│   │   ├── communications/page.tsx          # Localized Customer Communications Ledger
│   │   ├── evaluation/page.tsx              # Controlled Benchmark Evaluation Dashboard
│   │   └── settings/page.tsx                # Merchant Profile & Test Gateway Credentials
│   │
│   ├── components/                          # Reusable UI Widgets & Components
│   │   ├── Navbar.tsx                       # System status bar & tenant selector
│   │   ├── Sidebar.tsx                      # Primary navigation sidebar
│   │   ├── MetricCard.tsx                   # Minor-unit currency & KPI display card
│   │   ├── CaseTimeline.tsx                 # 7-Step lifecycle visual stepper
│   │   ├── BatchRecoveryModal.tsx           # Multi-case batch execution modal
│   │   └── PolicyImpactPreview.tsx          # Real-time policy change impact simulation
│   │
│   └── lib/                                 # Frontend Utilities & Context Store
│       ├── api.ts                           # Axios REST API client with error interceptors
│       ├── ReclaimContext.tsx               # Global React state store & server sync
│       ├── formatters.ts                    # Minor-unit Paise to INR currency formatters
│       └── types.ts                         # Frontend TypeScript type declarations
│
├── docs/                                    # Technical Architecture & Specification Documents
│   ├── architecture.md                      # System layering & boundary definitions
│   ├── recovery-orchestration.md            # Multi-rail recovery decision trees
│   ├── ai-recovery.md                       # Nemotron prompt engineering & safety specs
│   ├── metrics.md                           # Server-authoritative accounting & metric dictionary
│   ├── razorpay-test-mode.md                # Gateway integration & webhook setup guide
│   └── demo-script.md                       # Comprehensive 5-minute judge demo script
│
├── plan-docs/                               # Original Hackathon Blueprint & Specification FAQ
│   ├── RECLAIM_Implementation_Guide.docx    # Authoritative reference blueprint
│   └── RECLAIM_Vibe_Coding_FAQ_FREE_TIER.md # Comprehensive 2,000-line specification FAQ
│
└── logo/                                    # High-resolution vector & PNG branding assets
```

### Distinctions Between Similar Files
* **`.env.example` vs `.env` / `.env.local`**: `.env.example` contains sanitized, non-secret configuration templates committed to version control. `.env` (backend) and `.env.local` (frontend) contain active local runtime values and are gitignored.
* **`backend/app/db/models.py` vs `backend/app/schemas/domain.py`**: `models.py` defines SQLAlchemy 2.0 ORM classes mapping directly to PostgreSQL database tables, foreign keys, and indexes. `domain.py` defines Pydantic v2 schemas used for API payload validation, serialization, and typing contracts.
* **`migrations/versions/*.py` vs `backend/app/db/seed.py`**: Alembic migration scripts define schema structural transitions (`upgrade()` / `downgrade()`). `seed.py` is an idempotent data script that populates the database with deterministic demo recovery cases and policies.
* **`frontend/app/` vs `frontend/components/`**: `app/` contains Next.js 14 App Router route entrypoints (page views). `components/` contains modular, reusable UI components (buttons, charts, badges, modals) consumed by pages.

---

## 8. Comprehensive Data Key & Dictionary

### 8.1 Database Schema & Key Field Definitions

#### 1. `merchants` Table
| Column | Type | Constraints | Description | Unit / Format |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | `PRIMARY KEY` | Unique merchant account identifier | e.g. `merchant_demo` |
| `business_name` | `VARCHAR(200)` | `NOT NULL` | Registered trading name | String |
| `currency` | `VARCHAR(3)` | `DEFAULT 'INR'` | Base operational currency | ISO 4217 (`INR`) |
| `timezone` | `VARCHAR(64)` | `DEFAULT 'Asia/Kolkata'` | Merchant operating timezone | IANA Timezone |
| `default_language`| `VARCHAR(32)` | `DEFAULT 'English'` | Default customer communication language | `English` \| `Hinglish` |

#### 2. `payments` Table
| Column | Type | Constraints | Description | Unit / Format |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | `PRIMARY KEY` | Internal payment transaction ID | e.g. `PAY-2024-001` |
| `external_reference`| `VARCHAR(128)` | `UNIQUE` | Gateway reference ID (Order ID / Payment ID)| e.g. `order_NqW12345` |
| `amount_minor` | `INTEGER` | `NOT NULL` | Gross transaction value | **Paise (1 INR = 100 Paise)** |
| `payment_method`| `VARCHAR(64)` | `NOT NULL` | Payment rail used | `upi` \| `card` \| `mandate` \| `netbanking` |
| `failure_type` | `VARCHAR(64)` | `NOT NULL` | Categorized technical failure reason | Enum (see 6.2) |
| `status` | `VARCHAR(32)` | `DEFAULT 'failed'` | Status of the payment attempt | `failed` \| `captured` |

#### 3. `cases` (Recovery Cases) Table
| Column | Type | Constraints | Description | Unit / Format |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | `PRIMARY KEY` | Unique recovery case identifier | e.g. `RC-2024-081` |
| `payment_id` | `VARCHAR(64)` | `FOREIGN KEY, UNIQUE` | Associated failed payment record | Reference to `payments.id` |
| `status` | `VARCHAR(32)` | `NOT NULL` | Current operational case status | Enum (see 6.3) |
| `priority` | `VARCHAR(16)` | `NOT NULL` | Operational urgency tier | `High` \| `Medium` \| `Low` |
| `recovery_probability`| `FLOAT` | `NOT NULL` | ML/AI estimated likelihood of recovery | Range: `0.00` to `1.00` |
| `expected_recovery_minor`| `INTEGER` | `NOT NULL` | Computed expected yield ($P_{\text{rec}} \times \text{Amount}$) | **Paise** |
| `retry_count` | `INTEGER` | `DEFAULT 0` | Historical recovery attempts executed | Integer counter |
| `contact_count` | `INTEGER` | `DEFAULT 0` | Customer messages dispatched in past 24h | Integer counter |
| `recovered_amount_minor`| `INTEGER` | `DEFAULT 0` | Authoritatively verified recovered funds | **Paise (Authoritative Ledger)** |

#### 4. `recovery_actions` Table
| Column | Type | Constraints | Description | Unit / Format |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | `PRIMARY KEY` | Unique recovery action event ID | e.g. `ACT-2024-001` |
| `idempotency_key` | `VARCHAR(255)` | `UNIQUE` | Unique execution key to prevent double charges| UUIDv4 String |
| `action_type` | `VARCHAR(64)` | `NOT NULL` | Strategy executed | `RETRY_PAYMENT` \| `SEND_PAYMENT_LINK` \| `MANDATE_RETRY` |
| `policy_version` | `VARCHAR(32)` | `NOT NULL` | Version of merchant policy governing action | e.g. `v1`, `v2` |
| `amount_minor` | `INTEGER` | `NOT NULL` | Amount targeted for recovery | **Paise** |
| `verification_status`| `VARCHAR(32)` | `NOT NULL` | Settlement verification status | `PENDING` \| `VERIFIED` \| `FAILED` |
| `provider` | `VARCHAR(32)` | `NOT NULL` | Execution gateway provider | `razorpay_test` \| `simulated` |

---

### 6.2 Data Codes & Enums

#### Failure Type Codes (`failure_type`)
* `UPI_APP_TIMEOUT`: Customer opened UPI app (GPay/PhonePe) but approval session timed out before PIN submission.
* `UPI_COLLECT_DROPPED`: Customer dismissed or never received the UPI Collect notification.
* `CARD_3DS2_TIMEOUT`: Customer delayed entering OTP or bank 3DS2 authentication page timed out.
* `CARD_INSUFFICIENT_FUNDS`: Card issuer declined transaction due to temporary balance shortfall.
* `MANDATE_EXECUTION_FAILED`: Automated recurring mandate auto-debit attempt rejected by issuer switch.
* `BANK_DOWNTIME`: Core banking server (CBS) offline or undergoing maintenance window.
* `SUSPECTED_FRAUD`: Gateway or issuer risk engine flagged high velocity or suspicious transaction.

#### Operational Case Status (`status`)
* `atRisk`: Ingested failure requiring evaluation.
* `evaluating`: Under active AI diagnosis and policy checking.
* `executing`: Recovery request dispatched to payment gateway.
* `verifyPending`: Awaiting cryptographic webhook or customer link completion.
* `recovered`: Cryptographically verified funds captured in ledger.
* `policyBlocked`: Action halted by deterministic safety rules (max retries, risk ceiling).
* `escalated`: Forwarded to human merchant operator for manual intervention.
* `stopped`: Terminal unrecoverable state (customer churn or invalid account).

---

### 6.3 Standard Acronyms & Units of Measurement

| Acronym / Term | Definition & Context |
| :--- | :--- |
| **Paise (Minor Unit)** | Smallest currency unit in India ($1\text{ INR} = 100\text{ Paise}$). All arithmetic is integer-based. |
| **UPI** | Unified Payments Interface (NPCI-operated instant real-time payment system). |
| **TPAP** | Third Party Application Provider (e.g., Google Pay, PhonePe, Paytm). |
| **PSP** | Payment Service Provider (e.g., Axis, HDFC, ICICI UPI banking handles). |
| **NPCI** | National Payments Corporation of India (central switch for retail payments). |
| **3DS2** | 3-Domain Secure 2.0 (Two-factor authentication protocol for card transactions). |
| **e-NACH** | Electronic National Automated Clearing House (automated recurring mandate system). |
| **HMAC-SHA256** | Hash-based Message Authentication Code used for cryptographic webhook signature verification. |
| **PII** | Personally Identifiable Information (sanitized before external AI dispatch). |
| **Idempotency** | Property ensuring that identical requests produce the same result without duplicate side-effects. |

---

## 9. Processing, Analysis & Software Details

### 9.1 Software Dependencies & Environment Specifications

```
+---------------------------------------------------------------------------------------+
| LAYER           | COMPONENT         | VERSION REQUIRED  | PURPOSE                     |
+---------------------------------------------------------------------------------------+
| Runtime         | Python            | >= 3.11.0         | Backend Core Runtime        |
| Runtime         | Node.js           | >= 18.18.0        | Frontend Core Runtime       |
| Database        | PostgreSQL        | >= 15.0           | Authoritative Storage       |
| Backend API     | FastAPI           | 0.110.0+          | Asynchronous REST API       |
| Backend ORM     | SQLAlchemy        | 2.0.28+           | Database ORM & Session Mgr  |
| Database Driver | Psycopg           | 3.1.18+           | PostgreSQL Binary Driver    |
| Migrations      | Alembic           | 1.13.1+           | Versioned Schema Migrations |
| Validation      | Pydantic          | 2.6.4+            | Data Contracts & Validation |
| Advisory AI     | OpenAI SDK        | 1.14.1+           | NVIDIA Build OpenAI Client  |
| Test Framework  | pytest            | 8.1.0+            | Unit & Integration Testing  |
| Frontend App    | Next.js           | 14.2.35 (App)     | React Server & Client Pages |
| Frontend UI     | React             | 18.2.0            | UI Component Lifecycle      |
| Type Checking   | TypeScript        | 5.0.0+            | Static Type Verification    |
| Styling         | Tailwind CSS      | 3.4.1+            | Responsive UI Design Tokens |
| Charts          | Recharts          | 2.12.0+           | Financial Funnel & Graphs   |
+---------------------------------------------------------------------------------------+
```

### 9.2 Key Analytical & Processing Scripts
* **`backend/app/db/seed.py`**: Deterministic database seeder. Populates 10 multi-rail recovery scenarios (`RC-2024-081` through `RC-2024-090`), merchant profile `merchant_demo`, initial policies (`v1`), and Layer 0-6 audit logs.
* **`backend/app/engines/domain.py`**: Policy Engine core logic. Implements deterministic invariant evaluation:
  $$\text{Allowed} = (R < R_{\max}) \land (A \le A_{\max}) \land (C_{24\text{h}} < C_{\max}) \land (P_{\text{rec}} \ge P_{\min})$$
* **`backend/app/engines/ai_providers.py`**: Advisory AI interface. Connects to NVIDIA Nemotron-70B API with automatic fallback to deterministic rule synthesis upon timeout or missing API keys.
* **`backend/app/services/evaluation_service.py`**: Controlled benchmark runner. Executes comparative evaluations between naive baselines and RECLAIM on isolated synthetic datasets.

---

## 10. 🛠️ End-to-End Clean-Clone Setup & Quickstart Guide

### 📋 Prerequisites
Ensure you have the following installed on your machine:
* **Node.js**: `v18.18.0` or higher ([Download Node.js](https://nodejs.org/))
* **Python**: `3.11.0` or higher ([Download Python](https://www.python.org/))
* **PostgreSQL**: `15+` or **Docker Desktop** ([Download Docker](https://www.docker.com/))
* **Git**: ([Download Git](https://git-scm.com/))

---

### ⚡ Method 1: One-Click Quickstart (Docker Compose)

```powershell
# 1. Clone the repository
git clone https://github.com/Vishallakshmikanthan/Reclaim.git
cd Reclaim

# 2. Launch PostgreSQL database container
docker compose up -d

# 3. Setup and start Backend (Terminal 1)
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # On Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 4. Setup and start Frontend (Terminal 2)
cd ../frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### 💻 Method 2: Manual Local Setup (Step-by-Step)

#### Step 1: Configure Environment Files
```powershell
# In project root:
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local
```

#### Step 2: Setup Backend Python Environment
```powershell
cd backend
python -m venv .venv

# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# On Linux / macOS:
# source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* **Interactive API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Health Endpoint**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

#### Step 3: Setup Frontend Next.js 14 Web UI
```powershell
cd ../frontend
npm install
npm run dev
```
* **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
* **Cases Registry**: [http://localhost:3000/cases](http://localhost:3000/cases)
* **Interactive Docs & FAQ**: [http://localhost:3000/docs](http://localhost:3000/docs)
* **Controlled Evaluation Benchmark**: [http://localhost:3000/evaluation](http://localhost:3000/evaluation)

---

## 11. Configuration & Environment Variables

| Variable | Location | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `backend/.env` | **Yes** | `postgresql+psycopg://reclaim:change-me-local@localhost:5432/reclaim` | Primary PostgreSQL connection string |
| `REPOSITORY_BACKEND` | `backend/.env` | **Yes** | `postgres` (or `mock` for offline unit tests) | Storage engine selection |
| `NVIDIA_API_KEY` | `backend/.env` | Optional | `nvapi-...` | NVIDIA Build API Key for Nemotron-70B |
| `NVIDIA_NEMOTRON_MODEL`| `backend/.env` | Optional | `nvidia/llama-3.1-nemotron-70b-instruct` | LLM model identifier |
| `AI_PROVIDER` | `backend/.env` | Optional | `nemotron` \| `deterministic` \| `mock` | Active advisory AI provider |
| `RECOVERY_PROVIDER` | `backend/.env` | Optional | `simulated` \| `razorpay_test` | Execution provider mode |
| `RAZORPAY_KEY_ID` | `backend/.env` | Optional | `rzp_test_...` | Razorpay Test Key ID |
| `RAZORPAY_KEY_SECRET`| `backend/.env` | Optional | `...` | Razorpay Test Key Secret |
| `RAZORPAY_WEBHOOK_SECRET`| `backend/.env` | Optional | `...` | HMAC-SHA256 Webhook Verification Secret |
| `NEXT_PUBLIC_API_BASE_URL`| `frontend/.env.local`| **Yes** | `http://127.0.0.1:8000` | FastAPI backend endpoint |
| `NEXT_PUBLIC_USE_MOCKS`| `frontend/.env.local`| Optional | `false` | Set `true` for standalone browser mock mode |

> [!IMPORTANT]
> **NO LIVE MONEY IS USED**: RECLAIM operates strictly in simulated or Razorpay Test Mode (`rzp_test_*`). Live production credentials (`rzp_live_*`) are blocked by startup assertion validators and will trigger immediate process termination.

---

## 12. Step-by-Step Five-Minute Demo Walkthrough

Follow this 6-step walkthrough to experience the end-to-end bounded recovery workflow:

```
[ Step 1: Control Center ] ──> [ Step 2: At-Risk Explorer ] ──> [ Step 3: Decision Studio ]
                                                                           │
[ Step 6: Audit Explorer ] <── [ Step 5: Policy Simulator ] <── [ Step 4: Batch Recovery ]
```

1. **Control Center Dashboard (`/`)**:
   - Inspect the server-authoritative revenue KPIs: **Total Revenue at Risk (₹84,990.00)**, **Recovered Revenue**, and **Active Cases**.
   - Observe the live Recovery Funnel showing the real-time breakdown of eligible, attempted, and recovered funds.
2. **At-Risk Incident Workspace (`/at-risk`)**:
   - Explore the incident table. Filter by failure category (e.g. *UPI Timeout*).
   - Review the expected recovery yield calculations ($E = \text{Amount} \times P_{\text{rec}}$).
3. **Case Decision Studio (`/cases/RC-2024-081`)**:
   - **Case**: ₹8,499.00 UPI App Timeout.
   - Inspect the **AI Diagnostic Card** powered by NVIDIA Nemotron (root cause diagnosis, recovery probability: $85\%$, drafted Hinglish notification).
   - Review the **Deterministic Policy Checklist** verifying retry counts and autonomous amount caps.
   - Click **Execute Recovery Action**. Watch the 7-step visual timeline advance from *Detect* to *Recovered*.
4. **Batch Orchestrator (`/at-risk` -> Batch Recovery)**:
   - Select multiple cases across UPI, Cards, and Mandates.
   - Preview cumulative financial exposure and policy eligibility checks before firing.
   - Execute batch recovery. Observe partial-success isolation where eligible cases recover and blocked cases are safely skipped.
5. **Policy Studio & Simulator (`/policy`)**:
   - Adjust the **Max Retry Limit** ($3 \to 1$) or **Autonomous Amount Cap** ($\text{₹}10,000 \to \text{₹}5,000$).
   - Run the real-time **Impact Simulator** to see how policy adjustments protect merchant risk before committing changes.
6. **Immutable Audit Ledger (`/audit`)**:
   - Inspect the forensic Layer 0 to Layer 6 audit events with complete cryptographic telemetry, idempotency keys, and policy version attributions.

---

## 13. Controlled Offline Evaluation Benchmark

To demonstrate AI recovery efficacy without contaminating production operations, RECLAIM includes an automated offline evaluation benchmark comparing the **Deterministic Rules Baseline** against **Nemotron-Assisted Intelligence**:

```
+----------------------------------------------------------------------------------------+
| HELD-OUT SYNTHETIC PAYMENT DECLINE BENCHMARK (n = 50 Cases, Total Risk: ₹1,24,375.00)  |
+----------------------------------------------------------------------------------------+
| METRIC                       | DETERMINISTIC BASELINE | NEMOTRON-ASSISTED | LIFT / DELTA |
+----------------------------------------------------------------------------------------+
| Cases Attempted              | 45                     | 45                | --           |
| Cases Recovered              | 35                     | 38                | +3 (+8.6%)   |
| Policy Blocked (Safety)      | 5                      | 5                 | 0 (Protected)|
| Cases Failed (Terminal)      | 10                     | 7                 | -3 (-30.0%)  |
| Recovered Revenue Minor      | 85,750.00 INR          | 93,250.00 INR     | +7,500.00 INR|
| Case Recovery Rate           | 77.8%                  | 84.4%             | +6.6%        |
| Revenue Recovery Rate        | 76.2%                  | 82.9%             | +6.7%        |
| Policy Invariant Violations  | 0 (0.0%)               | 0 (0.0%)          | Strict 100%  |
+----------------------------------------------------------------------------------------+
```

### Benchmark Key Takeaways
* **Higher Recovery Yield**: Nemotron-assisted contextual timing and multi-channel link dispatch achieved a **+8.7% relative revenue lift** over naive static retries.
* **100% Policy Compliance**: Across all 50 evaluation cases, zero actions breached merchant retry caps, amount ceilings, or contact frequency limits.

---

## 14. Security, Invariants & Anti-Fabrication Guarantees

1. **Zero Direct AI Execution Authority**:
   - The LLM has no database write access, no gateway execution tokens, and no authority to alter policy rules. The AI acts strictly as an advisory diagnostic assistant.
2. **Server-Authoritative Financial Crediting**:
   - `recovered_revenue` is credited **ONLY** upon cryptographically verified gateway webhook or settlement API confirmation. Timeouts and pending links are never counted as recovered revenue.
3. **Integer Minor-Unit Arithmetic (Paise)**:
   - All monetary calculations are performed in integer paise ($\text{₹}1 = 100\text{ paise}$) to prevent floating-point precision loss.
4. **Idempotency & Concurrency Protection**:
   - Every recovery attempt requires a unique `Idempotency-Key`. Database-level unique constraints and row-level locks (`SELECT FOR UPDATE`) prevent double debits.
5. **PII Sanitization & Context Minimization**:
   - Customer names, phone numbers, and email addresses are scrubbed from telemetry before prompts are sent to external AI providers.

---

## 15. Troubleshooting & FAQ

### FAQ & Diagnostic Matrix

| Error / Symptom | Root Cause | Resolution |
| :--- | :--- | :--- |
| `503 Service Unavailable / DATABASE_UNAVAILABLE` | PostgreSQL database container or service is not running. | Execute `docker compose up -d` or verify that PostgreSQL is running on port 5432. |
| `Alembic Target database is not up to date` | Schema migrations have not been applied. | Run `.\.venv\Scripts\alembic.exe upgrade head` inside `backend/`. |
| `Frontend displays "Backend Disconnected" banner` | FastAPI backend service is offline. | Start backend with `uvicorn app.main:app --port 8000 --reload` or set `NEXT_PUBLIC_USE_MOCKS=true`. |
| `NVIDIA API 401 Unauthorized` | Invalid or expired NVIDIA Build API Key. | Add a valid key to `NVIDIA_API_KEY` in `backend/.env` or leave empty to use deterministic fallback. |
| `Razorpay Live Key Error` | Key starts with `rzp_live_`. | Replace with test key starting with `rzp_test_`. RECLAIM rejects live credentials by design. |

---

## 16. External Links & References

### Standards, Gateway & API Documentation
* [National Payments Corporation of India (NPCI) — UPI Procedural Guidelines](https://www.npci.org.in/)
* [Reserve Bank of India (RBI) — Regulatory Framework for e-Mandates on Cards](https://www.rbi.org.in/)
* [Razorpay Developer Documentation — Test Mode & Webhooks](https://razorpay.com/docs/)
* [Razorpay Payment Links & Smart Retries API](https://razorpay.com/docs/api/payments/payment-links/)
* [NVIDIA Build — Llama-3.1-Nemotron-70B-Instruct API](https://build.nvidia.com/nvidia/llama-3_1-nemotron-70b-instruct)

### Frameworks & Libraries
* [FastAPI Framework Documentation](https://fastapi.tiangolo.com/)
* [Next.js 14 App Router Reference](https://nextjs.org/docs/app)
* [SQLAlchemy 2.0 Unified Documentation](https://docs.sqlalchemy.org/en/20/)
* [Alembic Database Migration Guide](https://alembic.sqlalchemy.org/en/latest/)
* [Tailwind CSS Documentation](https://tailwindcss.com/docs)
* [Recharts Visualization Library](https://recharts.org/en-US/)

---

<div align="center">

**RECLAIM: Autonomous Revenue Recovery Engine**  
*Built for the Razorpay Buildathon 2026 — Track 03: AI Revenue Recovery*  
Engineered with precision, deterministic safety, and verifiable financial integrity.

</div>
