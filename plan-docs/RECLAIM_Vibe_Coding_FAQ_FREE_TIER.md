# RECLAIM --- Vibe Coding FAQ & Clarification Bible

**Project:** RECLAIM --- Autonomous Revenue Recovery Engine\
**Track:** Razorpay Buildathon 2026 --- Track 03: AI Revenue Recovery\
**Purpose:** This file is a clarification/reference layer for a
vibe-coding AI.\
**Source of truth:** The original `RECLAIM_Implementation_Guide.docx`
supplied by Vishal.

------------------------------------------------------------------------

## How the vibe-coding AI must use this file

1.  Treat the original RECLAIM implementation guide and this FAQ as the
    project specification.
2.  Preserve the original architecture, terminology, workflow, database
    design, stack, evaluation plan, dashboard plan, Hinglish layer,
    failure scenarios, and 21-day plan.
3.  Do **not** replace the architecture with a different architecture
    unless Vishal explicitly asks for a change.
4.  Do not add technologies merely because they are fashionable.
5.  Do not turn RECLAIM into a generic chatbot or a dashboard with an
    LLM attached.
6.  Keep deterministic responsibilities deterministic.
7.  Keep AI responsibilities inside the places defined by the guide.
8.  Never fabricate evaluation results. Final metrics must come from
    actual evaluation runs.
9.  Never expose real secrets in code, screenshots, README files, or
    generated output.
10. When a requirement is genuinely ambiguous, ask Vishal rather than
    silently changing the design.
11. Prefer small, testable, production-minded changes.
12. Preserve existing working functionality when adding a new feature.
13. Before modifying a critical path, inspect the existing
    implementation and understand its interfaces.
14. Every implementation should be explainable in terms of the Razorpay
    judging criteria: problem taste, build quality, AI judgment, and
    failure recovery.
15. The goal is a working, demonstrable system, not maximum technical
    complexity.

------------------------------------------------------------------------

# A. Project Identity & Core Concept

### FAQ 1 --- What is RECLAIM?

RECLAIM is a bounded, autonomous AI revenue recovery engine built on
Razorpay test-mode payment APIs. It watches payment events, identifies
revenue at risk, determines why the revenue is at risk, decides whether
recovery is worth attempting, executes a bounded recovery action,
verifies the outcome, and records the full audit trail.

### FAQ 2 --- Is RECLAIM a chatbot?

No. The project specification explicitly says RECLAIM is not a chatbot.

### FAQ 3 --- Is RECLAIM just an LLM dashboard?

No. It is a complete decision-making system with deterministic risk
analysis, AI reasoning, deterministic policy enforcement, action
execution, verification, audit logging, and evaluation.

### FAQ 4 --- What is the core problem?

The problem is the gap between payment failure/revenue leakage and
actual recovery action. Detecting a failed payment is not enough; the
system must close the loop.

### FAQ 5 --- What does "revenue recovery" mean in this project?

It means recovering money associated with failed payments, abandoned
checkout sessions, failed subscriptions, overdue invoices, or preventing
further loss when payment degradation is detected.

### FAQ 6 --- What is the central intellectual idea?

Not all payment failures are equal. A recovery system should understand
the failure context and choose an appropriate intervention rather than
blindly retrying everything.

### FAQ 7 --- What is the project slogan?

"Don't show me an AI that talks about recovering money. Show me an AI
system that actually recovers it --- and knows when not to."

### FAQ 8 --- What does "bounded autonomy" mean here?

The AI can reason and propose a recovery plan, but deterministic policy
rules decide whether the proposed action is allowed.

### FAQ 9 --- What does "knows when not to" mean?

RECLAIM must sometimes choose escalation or no action instead of
attempting recovery, especially for very low recovery probability or
serious/fraud-related failures.

### FAQ 10 --- What makes RECLAIM different from naive retry?

RECLAIM classifies failures, estimates recovery probability, estimates
expected recovery value, reasons about context, applies policy limits,
executes bounded actions, verifies outcomes, and records evidence.

### FAQ 11 --- What is the primary unit of work?

A recovery case in the `recovery_cases` table.

### FAQ 12 --- What is a payment case?

A payment or revenue-loss event that the system evaluates for possible
recovery.

### FAQ 13 --- What does "merchant" mean?

The synthetic merchant whose payment stream RECLAIM manages in the
hackathon environment.

### FAQ 14 --- How many synthetic merchants are required?

The database specification allows one or two synthetic merchants.

### FAQ 15 --- Does RECLAIM move real money?

No. The guide specifies Razorpay test mode for the hackathon.

------------------------------------------------------------------------

# B. Razorpay Buildathon Alignment

### FAQ 16 --- Which track is RECLAIM targeting?

Track 03 --- AI Revenue Recovery.

### FAQ 17 --- What is the Track 03 bar?

The system must detect revenue at risk, determine an appropriate
intervention, execute a bounded recovery workflow, show measured money
recovered across a batch, use compliant escalation and stopping rules,
and maintain an audit trail.

### FAQ 18 --- What four judging criteria matter?

Problem taste, build quality, AI judgment, and failure recovery.

### FAQ 19 --- What does problem taste mean for RECLAIM?

The project must address a meaningful merchant problem rather than
demonstrate AI for its own sake.

### FAQ 20 --- What does build quality mean?

The system should run reliably, have clear structure and interfaces, and
be trustworthy enough to explain as a serious engineering product.

### FAQ 21 --- What does AI judgment mean?

Use AI where reasoning adds value and deliberately avoid AI where
deterministic logic is safer or more appropriate.

### FAQ 22 --- What does failure recovery mean?

Show what happens when a critical dependency or decision path fails, and
demonstrate that the system handles the failure safely.

### FAQ 23 --- Why should the project not become a generic "AI payment assistant"?

Because the Track 03 value proposition is revenue recovery, not
conversational ability.

### FAQ 24 --- What is the strongest evidence of value?

Actual evaluation numbers showing recovered cases and recovered rupees,
compared with the naive retry baseline.

### FAQ 25 --- What is the strongest trust signal?

A complete audit trail plus visible policy enforcement and deliberate
failure handling.

------------------------------------------------------------------------

# C. Revenue Loss Categories

### FAQ 26 --- How many revenue-loss categories does the guide define?

Five high-level categories: payment failure, checkout abandonment,
subscription failure, overdue receivables, and payment degradation.

### FAQ 27 --- What payment failures are listed?

UPI timeout, card decline, insufficient funds, authentication failure,
bank gateway downtime, and network drop.

### FAQ 28 --- What is a UPI timeout?

The customer initiated UPI payment but the bank did not respond within
the expected time.

### FAQ 29 --- What is a card decline?

The card issuer declined the transaction.

### FAQ 30 --- What is insufficient funds?

The customer did not have enough balance for the transaction.

### FAQ 31 --- What is authentication failure?

A payment failed during an authentication step such as 3D Secure or OTP.

### FAQ 32 --- What is bank gateway downtime?

The acquiring or issuing bank/payment gateway was temporarily
unavailable.

### FAQ 33 --- What is a network drop?

The connection was lost during payment processing.

### FAQ 34 --- What is checkout abandonment?

The customer reached the payment page and entered information but never
completed the payment.

### FAQ 35 --- How is checkout abandonment different from payment failure?

In checkout abandonment, the payment transaction was never
completed/initiated in the same way as a failed payment attempt.
Recovery focuses on bringing the customer back to checkout.

### FAQ 36 --- What is the recovery window for checkout abandonment in the guide?

Typically 24--48 hours before customer intent cools.

### FAQ 37 --- What is subscription failure?

A recurring payment mandate was set up but an automatic debit failed.

### FAQ 38 --- Why is subscription failure important?

It can damage an ongoing revenue relationship rather than only losing
one payment.

### FAQ 39 --- What is an overdue receivable?

A B2B invoice has been sent and acknowledged but payment has not
arrived.

### FAQ 40 --- How are overdue receivables recovered?

Through automated reminders, alternative payment-method suggestions, and
human escalation when reminders fail.

### FAQ 41 --- What is payment degradation?

A warning signal where payment success rates for a merchant or payment
method have dropped below normal levels.

### FAQ 42 --- Is payment degradation itself a payment failure?

No. It is a predictive warning signal.

### FAQ 43 --- What should payment degradation trigger?

The system should flag the issue, identify the likely cause, and
recommend preventive action.

### FAQ 44 --- Why is blind retry insufficient?

Some failures are recoverable after a delay, while others may be
permanent or risky to retry.

### FAQ 45 --- What is an example of a failure that should not be blindly retried?

A payment failure associated with fraud suspicion or a stolen card.

------------------------------------------------------------------------

# D. Seven-Layer Architecture

### FAQ 46 --- How many layers does RECLAIM have?

Seven layers, numbered Layer 0 through Layer 6.

### FAQ 47 --- What is Layer 0?

Data Ingestion.

### FAQ 48 --- What does Layer 0 do?

It receives payment events, validates them, and stores raw payment
events before processing.

### FAQ 49 --- How are events represented in the hackathon context?

The synthetic data generator populates the database with realistic
payment events that simulate what a real merchant would see.

### FAQ 50 --- What is Layer 1?

The Revenue Risk Engine.

### FAQ 51 --- What is Layer 2?

The LangGraph Recovery Agent.

### FAQ 52 --- What is Layer 3?

The Policy & Guardrails Engine.

### FAQ 53 --- What is Layer 4?

The Action Executor.

### FAQ 54 --- What is Layer 5?

The Audit Trail.

### FAQ 55 --- What is Layer 6?

The Evaluation Harness.

### FAQ 56 --- Why are the layers separated?

Each layer has one clear responsibility and communicates through
well-defined interfaces.

### FAQ 57 --- Which layer is allowed to call Razorpay APIs?

Only Layer 4, the Action Executor.

### FAQ 58 --- Which layer is purely deterministic?

The Revenue Risk Engine is deterministic. The Policy Engine is also
deterministic.

### FAQ 59 --- Which layer contains AI reasoning?

The LangGraph Recovery Agent.

### FAQ 60 --- Why should the Risk Engine not use an LLM?

The guide explicitly defines it as deterministic so that initial
classification and recovery scoring are consistent and reproducible.

### FAQ 61 --- Why should the Policy Engine not use an LLM?

Policies are hard boundaries. The AI should not be able to reinterpret
or override them.

### FAQ 62 --- Why is the Action Executor separate?

It creates a single controlled boundary between RECLAIM's
decision-making logic and Razorpay API calls.

### FAQ 63 --- Why is the Audit Trail a separate layer?

It is the evidence layer proving what happened, what was authorized, and
how failures were handled.

### FAQ 64 --- Why is evaluation a separate layer?

It objectively measures whether RECLAIM performs better than the
baseline.

------------------------------------------------------------------------

# E. End-to-End Data Flow

### FAQ 65 --- What happens when a payment event enters RECLAIM?

It is stored in `payment_events` with status `PENDING_ANALYSIS`.

### FAQ 66 --- What happens next?

The Risk Engine processes the event.

### FAQ 67 --- What does the Risk Engine produce?

Failure classification, recovery probability, expected recovery value,
and triage recommendation.

### FAQ 68 --- What happens when recovery probability is below 0.1?

The guide says the case is immediately escalated to human review.

### FAQ 69 --- What happens when recovery probability is above 0.1?

The case enters the recovery queue, subject to the rest of the system's
logic.

### FAQ 70 --- What does the LangGraph agent read?

Failure classification, recovery probability, merchant history, customer
interaction history, and other relevant context.

### FAQ 71 --- What does the agent generate?

A recovery plan containing a primary action and up to two fallback
actions, plus reasoning.

### FAQ 72 --- What happens after the agent generates a plan?

The Policy Engine checks every element of the plan.

### FAQ 73 --- What happens if policy approves the plan?

The approved action proceeds to the Action Executor.

### FAQ 74 --- What happens if policy blocks an action?

The blocked action is replaced with escalation or otherwise modified
according to the defined policy output, and the result is logged.

### FAQ 75 --- What happens after execution?

The outcome is verified.

### FAQ 76 --- What happens after successful recovery?

The case is closed, the recovered amount is recorded, and the final
audit event is written.

### FAQ 77 --- What happens after a failed action?

The system checks whether a fallback action is available. If so, it can
return through policy checking before attempting the fallback.

### FAQ 78 --- What happens if there are no usable fallbacks?

The case can be marked failed or escalated according to the recovery
flow.

### FAQ 79 --- What is the final case state?

Recovered, failed, or escalated, with stopped also defined as a
recovery-case status.

------------------------------------------------------------------------

# F. Technology Stack

### FAQ 80 --- What frontend should be used?

Next.js 14 with TypeScript.

### FAQ 81 --- What database should be used?

PostgreSQL.

### FAQ 82 --- What ORM should be used?

Prisma.

### FAQ 83 --- What agent framework should be used?

LangGraph in Python.

### FAQ 84 --- What API framework should expose the Python agent?

FastAPI.

### FAQ 85 --- What LLM is specified?

Google Gemini 2.5 Flash via Gemini Developer API Free Tier.

### FAQ 86 --- What payment SDK is specified?

Razorpay Python SDK.

### FAQ 87 --- What tools are specified for evaluation?

Python, Pandas, and Scikit-learn.

### FAQ 88 --- What deployment targets are specified?

Vercel Hobby Free plan for the frontend and Railway Free plan for the Python service.

### FAQ 89 --- What chart library is specified?

Recharts.

### FAQ 90 --- Should the AI introduce Kubernetes?

No.

### FAQ 91 --- Should the AI introduce Kafka?

No.

### FAQ 92 --- Should the AI introduce Redis?

Not unless there is an actual demonstrated need. The guide explicitly
says not to learn/use it unless needed.

### FAQ 93 --- Should the AI introduce LangChain?

No. LangGraph is the specified choice.

### FAQ 94 --- Should the AI introduce a vector database?

No.

### FAQ 95 --- Should the AI introduce microservices?

No.

### FAQ 96 --- Should the AI introduce multiple LLM providers?

No.

### FAQ 97 --- Should the AI introduce MLOps platforms?

No.

### FAQ 98 --- Should the AI introduce GraphQL?

No.

### FAQ 99 --- Should the AI introduce React Native?

No.

### FAQ 100 --- Should the AI introduce blockchain?

No.

------------------------------------------------------------------------

# G. Database Schema

### FAQ 101 --- What tables are required?

`merchants`, `customers`, `payments`, `recovery_cases`,
`recovery_actions`, `audit_events`, and `evaluation_runs`.

### FAQ 102 --- What does `merchants` store?

The merchant being managed by RECLAIM.

### FAQ 103 --- How many synthetic merchants should the initial implementation support?

One or two.

### FAQ 104 --- What does `customers` store?

Synthetic customer information and contact history.

### FAQ 105 --- Why does customer contact history matter?

It drives the customer-contact stopping rule.

### FAQ 106 --- What does `payments` represent?

One row per payment attempt.

### FAQ 107 --- What unit should payment amounts use?

Paise.

### FAQ 108 --- What currency should be used?

INR.

### FAQ 109 --- What payment methods are listed?

UPI, card, netbanking, wallet, and EMI.

### FAQ 110 --- What payment statuses are listed?

Created, authorized, captured, failed, and refunded.

### FAQ 111 --- What does `recovery_cases` represent?

One row per payment that the system decides to attempt recovery on.

### FAQ 112 --- What statuses does `recovery_cases` contain?

`pending_analysis`, `in_recovery`, `recovered`, `failed`, `escalated`,
and `stopped`.

### FAQ 113 --- What does `recovery_probability` store?

A decimal between 0 and 1 calculated by the Risk Engine.

### FAQ 114 --- What does `expected_recovery_value` store?

Recovery probability multiplied by payment amount, stored in paise.

### FAQ 115 --- What does `ai_reasoning` store?

The LangGraph agent's natural-language explanation of its decision.

### FAQ 116 --- What does `recovery_plan` store?

The full recovery plan generated by the agent as JSONB.

### FAQ 117 --- What does `amount_recovered` store?

The actual amount recovered, in paise.

### FAQ 118 --- What does `attempts_count` store?

How many recovery actions have been tried.

### FAQ 119 --- What does `recovery_actions` represent?

One row per individual recovery action attempted.

### FAQ 120 --- Can one recovery case have multiple actions?

Yes. For example, an initial action followed by a customer notification
or fallback.

### FAQ 121 --- What action types are defined?

`retry_payment`, `send_payment_link`, `send_sms_nudge`,
`send_email_nudge`, `escalate_human`, and `mark_stopped`.

### FAQ 122 --- What action statuses are defined?

`pending`, `executing`, `succeeded`, `failed`, and `skipped_by_policy`.

### FAQ 123 --- What does `policy_check_result` store?

What the Policy Engine checked and whether the action was approved or
blocked.

### FAQ 124 --- What is `audit_events`?

The immutable, append-only audit trail.

### FAQ 125 --- Can audit events be updated?

No. The guide specifies append-only behavior with no updates and no
deletes.

### FAQ 126 --- What does `evaluation_runs` store?

Results from each evaluation run.

------------------------------------------------------------------------

# H. Synthetic Dataset

### FAQ 127 --- How many synthetic payment events are required?

1,000.

### FAQ 128 --- Why use synthetic data?

Real payment data is private and unsuitable for a public hackathon demo.
Synthetic data allows realistic testing without exposing private data.

### FAQ 129 --- What is the required failure distribution?

UPI timeout: 250; card decline: 200; insufficient funds: 150; bank
downtime: 120; checkout abandonment: 150; subscription failure: 80;
overdue invoice: 50.

### FAQ 130 --- What are the expected recovery rates in the guide?

UPI timeout 70%; card decline 35%; insufficient funds 45%; bank downtime
80%; checkout abandonment 30%; subscription failure 55%; overdue invoice
60%.

### FAQ 131 --- What is the required data split?

700 development, 150 validation, and 150 held-out test.

### FAQ 132 --- Can the held-out test set be used to tune the model?

No.

### FAQ 133 --- When should the held-out set be used?

At the end for final evaluation.

### FAQ 134 --- Why is the held-out set important?

It provides evidence that the reported performance is not simply the
result of tuning against the final test cases.

### FAQ 135 --- What should the demo say about the held-out set?

"These metrics are from the held-out test set. The system has never seen
these 150 cases before."

### FAQ 136 --- What fields should each synthetic record contain?

A payment ID, amount, payment method, failure reason, failure code,
timestamp, customer details, bank/payment provider, and a ground-truth
recovery field.

### FAQ 137 --- What format should payment IDs use?

`pay_` followed by 14 alphanumeric characters.

### FAQ 138 --- What is the realistic payment amount range mentioned?

Most small merchant payments are between ₹500 and ₹50,000.

### FAQ 139 --- Which banks/providers should appear?

HDFC, SBI, ICICI, Axis, Kotak, Paytm UPI, GPay UPI, and PhonePe UPI.

### FAQ 140 --- Can the agent see the ground-truth recovery field?

No.

### FAQ 141 --- Who can use the ground-truth field?

The evaluation harness only.

------------------------------------------------------------------------

# I. Revenue Risk Engine

### FAQ 142 --- What is the Risk Engine?

A deterministic Python component that converts raw payment information
into a structured risk assessment.

### FAQ 143 --- Does the Risk Engine call an LLM?

No.

### FAQ 144 --- What are its four outputs?

Failure classification, recovery probability, expected recovery value,
and triage recommendation.

### FAQ 145 --- How is failure classification determined?

Using failure code, failure reason, contextual signals such as time and
payment method, and historical failure patterns.

### FAQ 146 --- What is recovery probability?

A score from 0 to 1 representing the likelihood that a specific failure
can be recovered.

### FAQ 147 --- How is the base recovery probability derived?

From historical recovery rates in the synthetic dataset.

### FAQ 148 --- Can case-specific context adjust recovery probability?

Yes. The guide gives customer history as an example of contextual
adjustment.

### FAQ 149 --- What is expected recovery value?

Recovery probability multiplied by payment amount.

### FAQ 150 --- Why is expected recovery value useful?

It helps determine whether attempting recovery is worthwhile.

### FAQ 151 --- What are the three triage outcomes?

`ATTEMPT_RECOVERY`, `ESCALATE_IMMEDIATELY`, and `NO_ACTION`.

### FAQ 152 --- What is the default minimum recovery probability?

0.15.

### FAQ 153 --- What is the default minimum expected recovery value?

₹200.

### FAQ 154 --- What triggers immediate fraud escalation?

Any failure code containing `FRAUD` or `RISK`.

### FAQ 155 --- What is the maximum age for attempting recovery?

72 hours since failure.

### FAQ 156 --- Should thresholds be hardcoded?

No. The guide says thresholds should be configurable and stored in a
configuration object.

------------------------------------------------------------------------

# J. LangGraph Agent

### FAQ 157 --- Why use LangGraph?

The recovery workflow is multi-step and can branch based on failure type
and action outcome.

### FAQ 158 --- What is shared across LangGraph nodes?

A shared agent state object.

### FAQ 159 --- What fields belong in the agent state?

`payment_data`, `risk_assessment`, `failure_type`, `merchant_context`,
`customer_context`, `recovery_plan`, `reasoning`, `policy_check_result`,
`action_result`, and `final_status`.

### FAQ 160 --- How many nodes does the agent have?

Six.

### FAQ 161 --- What is Node 1?

Context Loader.

### FAQ 162 --- What does Context Loader do?

It loads merchant policy configuration, customer contact history,
previous recovery attempts, and historical recovery rates.

### FAQ 163 --- Does Context Loader use AI?

No. It performs database reads.

### FAQ 164 --- What is Node 2?

Failure Analyzer.

### FAQ 165 --- Does Failure Analyzer use an LLM?

Yes.

### FAQ 166 --- What does Failure Analyzer do?

It analyzes payment data, risk assessment, and context to identify
likely root cause, complicating factors, and confidence.

### FAQ 167 --- What format should Failure Analyzer output use?

Structured JSON with fields required by the next node.

### FAQ 168 --- What is Node 3?

Recovery Planner.

### FAQ 169 --- Does Recovery Planner use an LLM?

Yes.

### FAQ 170 --- What does Recovery Planner produce?

A primary action, up to two fallback actions, reasoning, a Hinglish
message when communication is required, and the expected outcome.

### FAQ 171 --- What is Node 4?

Policy Check.

### FAQ 172 --- Does Policy Check use an LLM?

No. It calls the deterministic Policy Engine.

### FAQ 173 --- What happens when policy blocks an action?

The blocked action is replaced with escalation or a modified acceptable
action, then the graph continues to execution as specified.

### FAQ 174 --- What is Node 5?

Action Executor.

### FAQ 175 --- What is Node 6?

Outcome Recorder.

### FAQ 176 --- What does Outcome Recorder do?

It writes the final outcome, updates the recovery case, and writes the
final audit event.

### FAQ 177 --- Where does conditional routing occur?

After Policy Check and after Action Executor.

### FAQ 178 --- Why is conditional routing important?

Different failure types and action outcomes need different paths.

------------------------------------------------------------------------

# K. Policy & Guardrails

### FAQ 179 --- Why is the Policy Engine important?

It ensures the AI acts within explicit, configurable boundaries and
demonstrates bounded autonomy.

### FAQ 180 --- How many policy rules are defined?

Six.

### FAQ 181 --- What is Rule 1?

Maximum retry count.

### FAQ 182 --- What is the default maximum retry count?

3.  

### FAQ 183 --- What is Rule 2?

Minimum retry interval.

### FAQ 184 --- What are the default retry intervals?

30 minutes for UPI, 2 hours for card payments, and 24 hours for
subscription failures.

### FAQ 185 --- What is Rule 3?

Customer contact frequency limit.

### FAQ 186 --- What is the default contact limit?

No more than 2 recovery communications within 24 hours.

### FAQ 187 --- What is Rule 4?

Auto-action amount threshold.

### FAQ 188 --- What is the default amount threshold?

₹10,000.

### FAQ 189 --- What happens above the auto-action threshold?

Human approval is required before execution.

### FAQ 190 --- What is Rule 5?

Escalation triggers for serious conditions such as fraud, card theft,
account suspension, or regulatory holds.

### FAQ 191 --- What is Rule 6?

Cooling period after escalation.

### FAQ 192 --- What is the default cooling period?

48 hours.

### FAQ 193 --- Can the AI override a policy rule?

No.

### FAQ 194 --- What does the Policy Engine return?

`approved`, `blocked_rules`, `modified_action`, and `audit_record`.

### FAQ 195 --- Is a blocked policy check audited?

Yes. The check is always written to the audit trail.

------------------------------------------------------------------------

# L. Razorpay Action Executor

### FAQ 196 --- What is the Action Executor?

The only layer allowed to make Razorpay test-mode API calls.

### FAQ 197 --- What API capabilities are listed?

Payment capture, payment refund, payment link creation, payment detail
retrieval, subscription actions, and order creation.

### FAQ 198 --- What is payment capture?

Capturing an authorized payment that has not yet been captured.

### FAQ 199 --- What is payment refund?

Issuing a refund for a captured payment.

### FAQ 200 --- What is payment link creation?

Creating a payment link that can be sent to a customer for recovery.

### FAQ 201 --- What is fetching payment details used for?

Checking the current payment status, particularly during verification
and uncertain outcomes.

### FAQ 202 --- What subscription actions are listed?

Pause, resume, or cancel.

### FAQ 203 --- Why is idempotency important?

Payment actions must not accidentally produce duplicate effects when a
request is repeated.

### FAQ 204 --- What should the Action Executor record?

Endpoint, request body, response code, response body, timestamp, and
latency.

### FAQ 205 --- What should happen on HTTP 400?

Log the error, do not retry, and escalate.

### FAQ 206 --- What should happen on HTTP 401?

Treat it as a configuration error, log it as critical, stop processing,
and alert.

### FAQ 207 --- What should happen on HTTP 429?

Wait according to the defined retry strategy and use exponential
backoff.

### FAQ 208 --- What should happen on HTTP 500?

Retry with exponential backoff up to the defined limit, then mark failed
and use a fallback if available.

### FAQ 209 --- What should happen on a network timeout?

Do not assume the payment action succeeded or failed. Verify payment
status before deciding.

### FAQ 210 --- Why is verification after timeout important?

Because the request may have reached the payment system even though the
client did not receive the response.

------------------------------------------------------------------------

# M. Audit Trail

### FAQ 211 --- What is the audit trail?

An immutable evidence layer that records system decisions, actions,
outcomes, and failures.

### FAQ 212 --- What does the audit trail prove?

That actions were authorized and documented, that system behavior is
traceable, and that failures can be reconstructed.

### FAQ 213 --- What are example audit events?

`CASE_CREATED`, `RISK_SCORED`, `AGENT_DECISION`, `POLICY_APPROVED`,
`POLICY_BLOCKED`, `ACTION_EXECUTED`, `ACTION_SUCCEEDED`,
`ACTION_FAILED`, `CASE_RESOLVED`, and `CASE_ESCALATED`.

### FAQ 214 --- What should audit records contain?

Relevant context in JSONB plus timestamp and originating layer.

### FAQ 215 --- Can audit records be deleted?

No.

### FAQ 216 --- Can audit records be modified?

No.

### FAQ 217 --- What is a Recovery Decision Card?

A human-readable summary of the complete decision and action history for
a recovery case.

### FAQ 218 --- What must the Recovery Decision Card show?

Payment ID and amount, failure type and confidence, recovery
probability, AI reasoning, recovery plan, policy result, API action,
outcome, actual amount recovered, and chronological timeline.

### FAQ 219 --- Why is the Recovery Decision Card important?

It gives judges a compact view of the complete decision trail.

### FAQ 220 --- What should the audit table show?

Timestamp, event type, layer, case ID, and a brief description, with
expandable full event data.

------------------------------------------------------------------------

# N. Evaluation & Metrics

### FAQ 221 --- What is the baseline?

Naive retry: retry every failed payment once after 30 minutes.

### FAQ 222 --- Where should the baseline be evaluated?

Against the 150-case held-out test set.

### FAQ 223 --- What metrics are defined?

Recovery Rate, Recovery Value Rate, Intervention Success Rate, False
Intervention Rate, Policy Compliance Rate, and Audit Coverage.

### FAQ 224 --- What is Recovery Rate?

Successfully recovered cases divided by total cases attempted.

### FAQ 225 --- What target is given for Recovery Rate?

Above 0.60 on the held-out test set.

### FAQ 226 --- What is Recovery Value Rate?

Rupees recovered divided by rupees at risk.

### FAQ 227 --- What target is given for Recovery Value Rate?

Above 0.55.

### FAQ 228 --- What is Intervention Success Rate?

Actions that led to recovery divided by total actions executed.

### FAQ 229 --- What target is given for Intervention Success Rate?

Above 0.65.

### FAQ 230 --- What is False Intervention Rate?

Actions taken on unrecoverable cases divided by total actions.

### FAQ 231 --- What target is given for False Intervention Rate?

Below 0.20.

### FAQ 232 --- What should Policy Compliance Rate be?

1.0.

### FAQ 233 --- What should Audit Coverage be?

1.0.

### FAQ 234 --- Can the AI invent final metrics?

No.

### FAQ 235 --- Can the developer manually choose favorable test cases?

No. The held-out test set must be used as defined.

### FAQ 236 --- Can final metrics be placeholders?

No. Submission materials must use actual numbers.

### FAQ 237 --- What comparison should the final dashboard show?

Naive Retry Baseline versus RECLAIM.

### FAQ 238 --- What financial number matters most?

Amount recovered and Recovery Value Rate.

### FAQ 239 --- Why show unnecessary interventions?

It demonstrates that RECLAIM discriminates between recoverable and
unrecoverable situations instead of retrying everything.

------------------------------------------------------------------------

# O. Frontend Dashboard

### FAQ 240 --- What is the dashboard's single job?

Make a judge understand in about 30 seconds that RECLAIM is a real
working system that recovers money.

### FAQ 241 --- How many dashboard screens are specified?

Four.

### FAQ 242 --- What is Screen 1?

Command Center.

### FAQ 243 --- What metrics should the Command Center show?

Total Revenue at Risk, Revenue Recovered Today, Recovery Rate, and Cases
Resolved.

### FAQ 244 --- What charts should it show?

Recovery over time and cases by failure type.

### FAQ 245 --- What table should appear on the Command Center?

Recent recovery activity, with the latest cases and status badges.

### FAQ 246 --- What is Screen 2?

Case Explorer.

### FAQ 247 --- What should Case Explorer contain?

All recovery cases with filtering and sorting.

### FAQ 248 --- What columns should Case Explorer show?

Case ID, payment amount, failure type, recovery probability, status,
amount recovered, and time to resolve.

### FAQ 249 --- What happens when a case is clicked?

The Recovery Decision Card opens.

### FAQ 250 --- What is Screen 3?

Recovery Decision Card.

### FAQ 251 --- What is Screen 4?

Evaluation Report.

### FAQ 252 --- What should the Evaluation Report show?

Baseline versus RECLAIM metrics.

### FAQ 253 --- What visual style is specified?

A professional fintech aesthetic with dark background, strong contrast,
clear status colors, and Indian rupee formatting.

### FAQ 254 --- What screen resolution should be targeted for the demo?

1920×1080.

### FAQ 255 --- How should money be formatted?

Indian number formatting such as `₹X,XX,XXX`.

### FAQ 256 --- Should dashboard features be added just because they look impressive?

No. Every feature should serve the goal of communicating a real, working
revenue-recovery system.

------------------------------------------------------------------------

# P. Hinglish Communication Layer

### FAQ 257 --- Why is Hinglish included?

The guide explicitly identifies Hinglish communication/voice recovery as
a relevant Track 03 direction and positions it as a product
differentiator for Indian customers.

### FAQ 258 --- How many communication types are required?

Three.

### FAQ 259 --- What is Communication Type 1?

Payment Retry Notification.

### FAQ 260 --- What is Communication Type 2?

Recovery Link Message.

### FAQ 261 --- What is Communication Type 3?

Escalation Acknowledgment.

### FAQ 262 --- Should the messages be hardcoded?

No. The guide says to generate them dynamically using the LLM.

### FAQ 263 --- What context should the LLM receive?

Failure type, amount, merchant name, and customer name, along with the
relevant payment context.

### FAQ 264 --- What style should the Hinglish use?

Natural Hinglish in Roman script, mixing Hindi and English naturally.

### FAQ 265 --- What length constraint is specified?

Under 160 characters for SMS compatibility.

### FAQ 266 --- Should every case receive a message?

Only when communication is part of the recovery plan.

------------------------------------------------------------------------

# Q. Failure Injection

### FAQ 267 --- Why deliberately break RECLAIM?

Because failure recovery is a judging criterion and deliberate fault
injection provides a controlled way to demonstrate it.

### FAQ 268 --- How many failure scenarios are required?

Three.

### FAQ 269 --- What is Failure Scenario 1?

API timeout during recovery.

### FAQ 270 --- What should happen after a timeout?

Detect the timeout, avoid assuming success/failure, verify payment
status, and either confirm success or schedule a retry.

### FAQ 271 --- What is the key outcome of the timeout scenario?

No duplicate action and a consistent case state.

### FAQ 272 --- What is Failure Scenario 2?

Policy violation attempt.

### FAQ 273 --- What example policy violation should be demonstrated?

The AI attempts a fourth retry when the maximum is three.

### FAQ 274 --- What should happen?

The Policy Engine blocks it, logs the blocked attempt, and escalates.

### FAQ 275 --- What is the key outcome of the policy violation demo?

The AI cannot override policy.

### FAQ 276 --- What is Failure Scenario 3?

Unrecoverable payment detection.

### FAQ 277 --- What example should be shown?

A payment blocked by the bank because of fraud suspicion.

### FAQ 278 --- What recovery probability example is specified?

0.02.

### FAQ 279 --- What should RECLAIM do with such a case?

Do not attempt recovery; escalate with a clear explanation.

### FAQ 280 --- Why is Scenario 3 powerful?

It demonstrates that RECLAIM knows when not to act, directly addressing
AI judgment.

------------------------------------------------------------------------

# R. 21-Day Implementation Plan

### FAQ 281 --- What is the overall schedule?

Three weeks / 21 days.

### FAQ 282 --- What is Week 1?

Foundation and Core Engine.

### FAQ 283 --- What happens on Day 1?

Environment setup: Next.js, PostgreSQL, Prisma, Python virtual
environment, and Razorpay test account.

### FAQ 284 --- What is the Day 1 completion condition?

Database works locally, tables are created, and Razorpay test keys work.

### FAQ 285 --- What happens on Day 2?

Generate 1,000 synthetic payment records.

### FAQ 286 --- What happens on Day 3?

Learn LangGraph basics: nodes, state, edges, and conditional routing.

### FAQ 287 --- What happens on Day 4?

Build the Revenue Risk Engine.

### FAQ 288 --- What happens on Day 5?

Wrap the Risk Engine in FastAPI.

### FAQ 289 --- What happens on Day 6?

Build LangGraph Nodes 1 and 2: Context Loader and Failure Analyzer.

### FAQ 290 --- What happens on Day 7?

Build Nodes 3 and 4: Recovery Planner and Policy Check.

### FAQ 291 --- What is Week 2?

Integration and Action Layer.

### FAQ 292 --- What happens on Day 8?

Study the Razorpay Python SDK and implement the Action Executor with the
specified API types.

### FAQ 293 --- What happens on Day 9?

Build LangGraph Nodes 5 and 6 and wire the full pipeline.

### FAQ 294 --- What happens on Day 10?

Implement the audit trail across every layer.

### FAQ 295 --- What happens on Day 11?

Implement all six Policy Engine rules.

### FAQ 296 --- What happens on Day 12?

Run the full pipeline over the 700-case development set.

### FAQ 297 --- What happens on Day 13?

Implement the three Hinglish communication types.

### FAQ 298 --- What happens on Day 14?

Build and test all three failure-injection scenarios.

### FAQ 299 --- What is Week 3?

Frontend, evaluation, and polish.

### FAQ 300 --- What happens on Day 15?

Build Command Center.

### FAQ 301 --- What happens on Day 16?

Build Case Explorer and Recovery Decision Card.

### FAQ 302 --- What happens on Day 17?

Build evaluation harness and run baseline plus RECLAIM on held-out test
set.

### FAQ 303 --- What happens on Day 18?

Build Evaluation Report and polish the dashboard.

### FAQ 304 --- What happens on Day 19?

Full end-to-end run and debugging.

### FAQ 305 --- What happens on Day 20?

Record the 5-minute demo.

### FAQ 306 --- What happens on Day 21?

Write application, deploy to Vercel, and submit.

------------------------------------------------------------------------

# S. Five-Minute Demo

### FAQ 307 --- What is the demo philosophy?

Tell a story, not a feature walkthrough.

### FAQ 308 --- What is the first 30-second segment?

The problem hook.

### FAQ 309 --- What should the first screen show?

A large revenue-at-risk figure, such as the guide's ₹25,00,000 example.

### FAQ 310 --- What is the second segment?

System detection and batch processing.

### FAQ 311 --- What should be shown during detection?

Cases appearing with risk scores and failure types while dashboard
numbers update.

### FAQ 312 --- What is the third segment?

AI reasoning on one moderately complex recovery case.

### FAQ 313 --- What case should be chosen?

The guide suggests a UPI timeout with a moderately complex story.

### FAQ 314 --- What should be shown in the reasoning segment?

Failure analysis, recovery plan, policy checks, and why the action was
allowed.

### FAQ 315 --- What is the fourth segment?

The recovery / money moment.

### FAQ 316 --- What should happen during the money moment?

Show the Razorpay test-mode action, status transition, recovered amount,
and audit trail.

### FAQ 317 --- What is the fifth segment?

Failure demonstration.

### FAQ 318 --- What failures should be demonstrated?

API timeout and policy violation, with the unrecoverable-payment
decision also demonstrated as specified.

### FAQ 319 --- What is the final segment?

Evaluation evidence.

### FAQ 320 --- What should be shown at the end?

Held-out test-set results, baseline comparison, recovery improvement,
zero policy violations, and audit coverage.

### FAQ 321 --- What is the final line?

"The point isn't that an LLM can recommend a retry. The point is that
the system decides when recovery is justified, executes only within its
authority, verifies the result, and knows when to stop."

------------------------------------------------------------------------

# T. Application

### FAQ 322 --- Should the application be a generic cover letter?

No. The guide says to write a technical brief.

### FAQ 323 --- What four areas should the application address?

Problem taste, build quality, AI judgment, and failure recovery.

### FAQ 324 --- What should the opening paragraph explain?

What RECLAIM is, what problem it solves, how AI is used, and evidence
from the held-out evaluation.

### FAQ 325 --- Where is AI explicitly used?

Failure root-cause analysis, recovery intervention selection, and
Hinglish message generation.

### FAQ 326 --- Where is AI explicitly NOT used?

Financial calculations, retry counting, policy enforcement, idempotency
logic, and escalation triggers.

### FAQ 327 --- What technical components should be named?

LangGraph agent pipeline, PostgreSQL with Prisma, Razorpay test-mode
integration, Python evaluation harness, and Next.js dashboard.

### FAQ 328 --- What repository qualities matter?

Public GitHub repository, clear README, documented environment
variables, meaningful commit history, clean code, and pinned
dependencies.

### FAQ 329 --- Should the README contain real API keys?

No. Only fake/example values.

### FAQ 330 --- What should the README explain?

How to run the project locally in under 10 minutes.

------------------------------------------------------------------------

# U. Vibe-Coding Rules

### FAQ 331 --- Should the vibe-coding AI write the entire project in one giant generation?

No. Build incrementally and verify each layer.

### FAQ 332 --- What should happen before changing code?

Inspect the current project structure and understand existing
interfaces.

### FAQ 333 --- Should a new feature break existing functionality?

No.

### FAQ 334 --- Should the AI refactor unrelated files while implementing a feature?

No, unless the refactor is necessary and explicitly explained.

### FAQ 335 --- Should the AI add dependencies automatically?

Only when the dependency is required by the specification or a concrete
implementation need.

### FAQ 336 --- Should the AI create mock functionality when a real component is required?

Not as a substitute for the required functionality. Mocks may be used
deliberately for isolated testing or failure injection.

### FAQ 337 --- Should synthetic data be hardcoded directly into the UI?

No. The guide calls for a Python synthetic data generator and
database-backed system.

### FAQ 338 --- Should evaluation results be hardcoded?

No.

### FAQ 339 --- Should dashboard numbers be manually typed?

No. They should come from the database/evaluation results.

### FAQ 340 --- Should AI reasoning be generated once and permanently hardcoded?

No. The LangGraph flow should generate it for the relevant case.

### FAQ 341 --- Should policy checks be generated by the LLM?

No. They are deterministic.

### FAQ 342 --- Should financial calculations be generated by the LLM?

No.

### FAQ 343 --- Should retry counts be decided by the LLM?

No.

### FAQ 344 --- Should escalation triggers be decided by the LLM?

No.

### FAQ 345 --- Should the LLM be allowed to execute arbitrary API calls?

No. It should produce a structured recovery plan that is checked by the
Policy Engine and executed by the Action Executor.

### FAQ 346 --- What should happen if an LLM response is malformed?

The system should fail safely, record the error, and avoid executing an
unsafe or invalid action.

### FAQ 347 --- What should happen if an API call fails?

Use the defined error-handling path, record the failure, verify
uncertain outcomes, and use fallbacks where appropriate.

### FAQ 348 --- What should happen if policy rejects an AI recommendation?

The AI recommendation must not be executed. The system follows the
policy-defined escalation/modified-action path.

### FAQ 349 --- Should the AI optimize for code volume?

No. Optimize for correctness, testability, reliability, and demo value.

### FAQ 350 --- Should the AI optimize for visual complexity?

No. The dashboard should communicate the system clearly.

------------------------------------------------------------------------

# V. Common Architecture Clarifications

### FAQ 351 --- Can Next.js directly call Razorpay?

The specified architecture says the Action Executor is the layer that
touches Razorpay APIs. Preserve that boundary.

### FAQ 352 --- Can the Risk Engine directly execute recovery actions?

No.

### FAQ 353 --- Can the LangGraph agent directly bypass the Policy Engine?

No.

### FAQ 354 --- Can the frontend directly change a recovery case to recovered?

No. State transitions should come from backend/system logic.

### FAQ 355 --- Can the frontend calculate final evaluation metrics?

It may display metrics, but the evaluation harness should be responsible
for producing the actual evaluation results.

### FAQ 356 --- Should the database be treated as the system of record?

Yes. The schema is the skeleton of the system.

### FAQ 357 --- Should every recovery action create a `recovery_actions` record?

Yes, according to the schema design.

### FAQ 358 --- Should every important event be written to `audit_events`?

Yes.

### FAQ 359 --- Should blocked actions be audited?

Yes.

### FAQ 360 --- Should failed actions be audited?

Yes.

### FAQ 361 --- Should successful actions be audited?

Yes.

### FAQ 362 --- Should escalations be audited?

Yes.

### FAQ 363 --- Should the final case state be recorded?

Yes.

### FAQ 364 --- Should the agent state contain both risk assessment and raw payment data?

Yes.

### FAQ 365 --- Should customer interaction history be part of agent context?

Yes.

### FAQ 366 --- Should merchant history be part of agent context?

Yes.

------------------------------------------------------------------------

# W. Testing & Quality

### FAQ 367 --- What is the minimum unit of testing?

Each layer should be testable independently where practical.

### FAQ 368 --- What should be tested in the Risk Engine?

Failure classification, probability scoring, expected recovery value,
and triage outcomes.

### FAQ 369 --- What should be tested in the Policy Engine?

Every one of the six policy rules and combinations that matter.

### FAQ 370 --- What should be tested in the Action Executor?

Success, 400, 401, 429, 500, timeout, verification, and fallback
behavior as specified.

### FAQ 371 --- What should be tested in the audit system?

That actions, decisions, policy checks, and outcomes generate complete
audit records.

### FAQ 372 --- What should be tested in LangGraph?

Correct state propagation and conditional routing.

### FAQ 373 --- What should be tested in the dashboard?

Loading, case navigation, decision-card rendering, and evaluation
display.

### FAQ 374 --- What should be tested before the final demo?

The complete end-to-end flow.

### FAQ 375 --- What is the final system quality target?

A clean full run without errors on the required datasets and demo
scenarios.

------------------------------------------------------------------------

# X. Security & Secrets

### FAQ 376 --- Where should Razorpay keys live?

Environment variables, not source code.

### FAQ 377 --- Should API keys appear in screenshots?

No.

### FAQ 378 --- Should API keys be committed to Git?

No.

### FAQ 379 --- Should synthetic customer information be real?

No. Use synthetic names, emails, and phone numbers.

### FAQ 380 --- Should real customer data ever be added just to make the demo look realistic?

No.

### FAQ 381 --- What should happen if a secret is accidentally exposed?

Stop, rotate/revoke the affected credential, remove it from the
repository history where appropriate, and replace it with a secure
environment variable.

------------------------------------------------------------------------

# Y. What the Vibe-Coding AI Must Never Do

### FAQ 382 --- Can it change Track 03 to another track?

No, unless Vishal explicitly requests it.

### FAQ 383 --- Can it replace RECLAIM with a different product?

No.

### FAQ 384 --- Can it replace LangGraph with another agent framework?

No, unless explicitly requested.

### FAQ 385 --- Can it remove the deterministic Risk Engine?

No.

### FAQ 386 --- Can it remove the deterministic Policy Engine?

No.

### FAQ 387 --- Can it remove the audit trail?

No.

### FAQ 388 --- Can it remove held-out evaluation?

No.

### FAQ 389 --- Can it remove failure injection?

No.

### FAQ 390 --- Can it remove the Recovery Decision Card?

No.

### FAQ 391 --- Can it remove the baseline comparison?

No.

### FAQ 392 --- Can it fabricate metrics to make the project look better?

Absolutely not.

### FAQ 393 --- Can it invent unsupported Razorpay APIs?

No. If an API capability is uncertain, flag the uncertainty rather than
inventing an endpoint.

### FAQ 394 --- Can it silently alter a database schema?

No. Explain the reason and preserve compatibility.

### FAQ 395 --- Can it add random AI features?

No. New functionality must serve the defined RECLAIM objective and
should be discussed before changing the locked plan.

------------------------------------------------------------------------

# Z. Final Judge-Oriented Clarifications

### FAQ 396 --- What should a judge understand within 30 seconds?

RECLAIM identifies revenue at risk, determines which cases are worth
recovering, and manages recovery actions safely.

### FAQ 397 --- What should a judge understand within 2 minutes?

The Risk Engine, AI agent, policy gate, and action execution work as a
connected system.

### FAQ 398 --- What should a judge understand within 4 minutes?

RECLAIM can recover money, maintain an audit trail, and handle failures
safely.

### FAQ 399 --- What should a judge believe by the end?

That the system is more than an LLM wrapper and that the builder
understands fintech reliability and bounded AI autonomy.

### FAQ 400 --- What is the single most important engineering principle?

AI should reason within explicit boundaries, while deterministic systems
control financial calculations, policies, limits, and execution.

### FAQ 401 --- What is the single most important product principle?

Close the gap between revenue loss detection and actual recovery.

### FAQ 402 --- What is the single most important evaluation principle?

Use actual held-out results and compare them honestly with the baseline.

### FAQ 403 --- What is the single most important failure principle?

Never assume an uncertain payment action failed; verify its state before
deciding what to do next.

### FAQ 404 --- What is the single most important audit principle?

Every important decision and action must be traceable.

### FAQ 405 --- What is the single most important demo principle?

Show the system working, show it recovering money, and show it
refusing/handling actions when it should not proceed.

------------------------------------------------------------------------

# AA. Quick Reference --- Non-Negotiable Numbers

  Item                                    Specification
  ---------------------------------- ------------------
  Synthetic events                                1,000
  Development set                                   700
  Validation set                                    150
  Held-out test set                                 150
  Minimum recovery probability                     0.15
  Minimum expected recovery value                  ₹200
  Maximum recovery age                         72 hours
  Maximum retries                                     3
  UPI retry interval                         30 minutes
  Card retry interval                           2 hours
  Subscription retry interval                  24 hours
  Customer communications                  2 / 24 hours
  Auto-action threshold                         ₹10,000
  Escalation cooling period                    48 hours
  Recovery Rate target                          \> 0.60
  Recovery Value Rate target                    \> 0.55
  Intervention Success Rate target              \> 0.65
  False Intervention Rate target                \< 0.20
  Policy Compliance target                          1.0
  Audit Coverage target                             1.0
  Hinglish message limit               \<160 characters
  Demo duration                              ≤5 minutes
  Dashboard target resolution                 1920×1080

------------------------------------------------------------------------

# AB. Quick Reference --- AI vs Deterministic Logic

## AI / LLM

-   Failure root-cause analysis
-   Recovery intervention selection
-   Natural-language decision explanation
-   Hinglish customer message generation

## Deterministic

-   Financial calculations
-   Recovery probability calculation framework
-   Expected recovery value calculation
-   Retry counting
-   Policy enforcement
-   Escalation triggers
-   Threshold checks
-   Idempotency logic
-   Audit recording
-   Evaluation metrics
-   Final recovered amount
-   Case state transitions

------------------------------------------------------------------------

# AC. Quick Reference --- Six LangGraph Nodes

1.  **Context Loader** --- database reads
2.  **Failure Analyzer** --- LLM reasoning
3.  **Recovery Planner** --- LLM recovery plan
4.  **Policy Check** --- deterministic policy validation
5.  **Action Executor** --- Razorpay test-mode action
6.  **Outcome Recorder** --- persist outcome + final audit event

------------------------------------------------------------------------

# AD. Quick Reference --- Six Policy Rules

1.  Maximum Retry Count
2.  Minimum Retry Interval
3.  Customer Contact Frequency Limit
4.  Auto-Action Amount Threshold
5.  Escalation Triggers
6.  Cooling Period After Escalation

------------------------------------------------------------------------

# AE. Quick Reference --- Three Failure Demos

1.  **API Timeout**
    -   Detect timeout
    -   Verify payment state
    -   Avoid duplicate action
    -   Retry/fallback safely
2.  **Policy Violation**
    -   AI proposes forbidden fourth retry
    -   Policy blocks
    -   Audit records block
    -   Case escalates
3.  **Unrecoverable Payment**
    -   Fraud-related failure
    -   Very low recovery probability
    -   No recovery attempt
    -   Immediate escalation
    -   Explain why

------------------------------------------------------------------------

# AF. Final Instruction to the Vibe-Coding AI

When implementing RECLAIM:

> Build the system described here and in the original RECLAIM
> implementation guide. Do not redesign it unless Vishal explicitly asks
> you to redesign it. Preserve the seven-layer architecture, database
> schema, LangGraph node structure, six policy rules, Razorpay action
> layer, immutable audit trail, held-out evaluation methodology, four
> dashboard screens, three Hinglish communication types, three
> failure-injection scenarios, and 21-day implementation sequence.

> When generating code, make it runnable rather than merely
> illustrative. Use real interfaces between components. Keep secrets in
> environment variables. Validate inputs. Handle errors explicitly. Keep
> deterministic financial and policy logic outside the LLM. Make LLM
> outputs structured and validated before they enter downstream logic.

> Never fabricate successful API calls, recovered amounts, evaluation
> metrics, or test results. If something cannot yet be implemented,
> clearly mark the boundary and build the safest working version
> permitted by the specification.

> Before changing an existing implementation, inspect it. Do not
> overwrite working functionality unnecessarily. Keep the repository
> clean and understandable.

> If you encounter an ambiguity that cannot be resolved from this FAQ or
> the original guide, stop and ask Vishal for clarification rather than
> inventing a new product decision.

**RECLAIM is the project. Track 03 is locked. The original
implementation guide is the source of truth.**


---

# FREE-TIER FINAL CHECKLIST

Before considering RECLAIM complete:

- [ ] Gemini API key is configured without enabling paid billing.
- [ ] Model is `gemini-2.5-flash` or another explicitly approved free-tier model.
- [ ] No Claude/Anthropic API calls remain.
- [ ] No OpenAI API calls remain.
- [ ] Vercel deployment is on Hobby/free.
- [ ] Railway deployment is on the $0 Free plan.
- [ ] Razorpay uses `rzp_test_...` credentials only.
- [ ] No real payment is processed.
- [ ] No paid SMS provider is configured.
- [ ] No paid WhatsApp provider is configured.
- [ ] No paid email provider is configured.
- [ ] Hinglish delivery is simulated inside the application.
- [ ] No paid database/hosting/observability service has been added.
- [ ] No code path can automatically upgrade a service or incur a paid charge.
- [ ] If a free-tier limit is reached, the system fails safely instead of billing the user.

**Free-tier principle:** ₹0 spent on APIs, AI, hosting, messaging, database, or developer tooling for the hackathon demo.
