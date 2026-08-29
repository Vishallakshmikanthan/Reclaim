import { EvaluationCase, EvaluationGroundTruth } from "./types";
import { FailureType, PaymentMethod } from "../types";

/**
 * Held-Out Evaluation Dataset (N = 150 Cases)
 * Deterministic benchmark batch representing realistic merchant failure patterns across Indian payment rails.
 * Completely separate and immutable from live dashboard and interactive demo state.
 */

// Deterministic Pseudo-Random Generator with fixed seed for guaranteed reproducibility
class SeededRNG {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  choice<T>(arr: T[]): T {
    return arr[this.range(0, arr.length - 1)];
  }
}

function generateDeterministicEvaluationDataset(): EvaluationCase[] {
  const rng = new SeededRNG(428192); // Fixed deterministic seed

  const CUSTOMER_NAMES = [
    "Rahul Sharma", "Priya Nair", "Aditya Verma", "Sneha Patel", "Ananya Roy", 
    "Vikram Malhotra", "Kavita Rao", "Deepak Gupta", "Rohan Mehta", "Pooja Desai",
    "Siddharth Joshi", "Meera Iyer", "Karan Singhal", "Neha Kapoor", "Arjun Nambiar",
    "Sanya Chawla", "Tarun Saxena", "Divya Menon", "Aakash Jain", "Bhavna Kulkarni",
    "Gaurav Hegde", "Ishita Bose", "Manish Pandey", "Nidhi Trivedi", "Rajesh Pillai"
  ];

  const FAILURE_CONFIGS: {
    type: FailureType;
    method: PaymentMethod;
    weight: number;
    baseProb: number;
    gatewaySucceedRate: number;
    linkSucceedRate: number;
    fraudRate: number;
  }[] = [
    { type: "UPI Timeout", method: "UPI", weight: 36, baseProb: 0.82, gatewaySucceedRate: 0.76, linkSucceedRate: 0.65, fraudRate: 0.02 },
    { type: "Card Decline", method: "Credit Card", weight: 26, baseProb: 0.54, gatewaySucceedRate: 0.12, linkSucceedRate: 0.58, fraudRate: 0.06 },
    { type: "Insufficient Funds", method: "Debit Card", weight: 22, baseProb: 0.46, gatewaySucceedRate: 0.08, linkSucceedRate: 0.50, fraudRate: 0.03 },
    { type: "Bank Downtime", method: "Netbanking", weight: 18, baseProb: 0.64, gatewaySucceedRate: 0.68, linkSucceedRate: 0.45, fraudRate: 0.01 },
    { type: "Subscription Failure", method: "Subscription Mandate", weight: 18, baseProb: 0.71, gatewaySucceedRate: 0.72, linkSucceedRate: 0.42, fraudRate: 0.02 },
    { type: "Checkout Abandonment", method: "UPI", weight: 12, baseProb: 0.32, gatewaySucceedRate: 0.00, linkSucceedRate: 0.38, fraudRate: 0.04 },
    { type: "Overdue Invoice", method: "Netbanking", weight: 10, baseProb: 0.56, gatewaySucceedRate: 0.00, linkSucceedRate: 0.60, fraudRate: 0.02 },
    { type: "Fraud Signal", method: "Credit Card", weight: 8, baseProb: 0.04, gatewaySucceedRate: 0.00, linkSucceedRate: 0.00, fraudRate: 0.95 },
  ];

  const AMOUNT_TIERS = [
    { min: 49900, max: 99900, weight: 35 },     // ₹499 - ₹999
    { min: 149900, max: 499900, weight: 45 },   // ₹1,499 - ₹4,999
    { min: 500000, max: 1499900, weight: 40 },  // ₹5,000 - ₹14,999
    { min: 1500000, max: 4999900, weight: 20 }, // ₹15,000 - ₹49,999
    { min: 5000000, max: 25000000, weight: 10 } // ₹50,000 - ₹2,50,000
  ];

  const dataset: EvaluationCase[] = [];
  let caseIndex = 1;

  for (const cfg of FAILURE_CONFIGS) {
    for (let i = 0; i < cfg.weight; i++) {
      const caseId = `EVAL-2026-${String(caseIndex).padStart(3, "0")}`;
      const customerName = CUSTOMER_NAMES[(caseIndex - 1) % CUSTOMER_NAMES.length];
      const customerId = `cust_eval_${String(caseIndex).padStart(3, "0")}`;
      const paymentId = `pay_eval_${String(100000 + caseIndex)}`;
      const orderId = `order_eval_${String(900000 + caseIndex)}`;

      // Select amount tier
      const tierRoll = rng.range(1, 150);
      let cumulative = 0;
      let selectedTier = AMOUNT_TIERS[0];
      for (const tier of AMOUNT_TIERS) {
        cumulative += tier.weight;
        if (tierRoll <= cumulative) {
          selectedTier = tier;
          break;
        }
      }

      // Generate realistic Indian rupee amount ending in common price points (e.g. 499, 999, 000)
      const rawPaise = rng.range(selectedTier.min, selectedTier.max);
      const roundedRupees = Math.round(rawPaise / 10000) * 100;
      const amount = Math.max(selectedTier.min, roundedRupees * 100);

      // Customer signals
      const isFraud = rng.next() < cfg.fraudRate;
      const customerRiskScore = isFraud ? Number((rng.next() * 0.25 + 0.75).toFixed(2)) : Number((rng.next() * 0.35 + 0.05).toFixed(2));
      const previousAttempts = rng.range(0, 3);
      const contactCount24h = rng.range(0, 2);
      const historicalRecoveryRate = isFraud ? rng.range(5, 20) : rng.range(55, 95);
      
      const ageMinutes = rng.range(2, 240);
      const paymentAge = ageMinutes < 60 ? `${ageMinutes}m ago` : `${Math.floor(ageMinutes / 60)}h ago`;

      // Ground truth simulation
      const gatewayWillSucceed = !isFraud && rng.next() < cfg.gatewaySucceedRate && previousAttempts < 3;
      const linkWillSucceed = !isFraud && rng.next() < cfg.linkSucceedRate;
      const isRecoverable = !isFraud && (gatewayWillSucceed || linkWillSucceed);
      const settlementTime = gatewayWillSucceed ? rng.range(15, 60) : linkWillSucceed ? rng.range(300, 1800) : 0;

      const groundTruth: EvaluationGroundTruth = {
        recoverable: isRecoverable,
        actualMaxRecoverableAmount: isRecoverable ? amount : 0,
        idealChannel: gatewayWillSucceed ? "gateway_retry" : linkWillSucceed ? "whatsapp_link" : "human_escalation",
        failureRootCause: cfg.type === "UPI Timeout" ? "NPCI VPA Session Drop" :
                          cfg.type === "Card Decline" ? "Issuer Authentication Challenge" :
                          cfg.type === "Insufficient Funds" ? "Low Balance in Primary Account" :
                          cfg.type === "Bank Downtime" ? "Core Banking CBS Outage" :
                          cfg.type === "Subscription Failure" ? "E-Mandate Recurring Processing Window" :
                          cfg.type === "Checkout Abandonment" ? "Customer Drop-off at 3DS Step" :
                          cfg.type === "Overdue Invoice" ? "B2B Invoice Payment Delay" :
                          "Stolen Instrument / High-Risk Proxy Radar",
        isFraudOrDispute: isFraud,
        customerWillPayOnLink: linkWillSucceed,
        gatewayRetryWillSucceed: gatewayWillSucceed,
        actualSettlementTimeSeconds: settlementTime,
      };

      dataset.push({
        id: caseId,
        paymentId,
        orderId,
        customerId,
        customerName,
        amount,
        paymentMethod: cfg.method,
        failureType: cfg.type,
        failureReason: groundTruth.failureRootCause,
        paymentAge,
        previousAttempts,
        contactCount24h,
        customerRiskScore,
        historicalRecoveryRate,
        groundTruth,
      });

      caseIndex++;
    }
  }

  return dataset;
}

// Singleton held-out evaluation dataset (N = 150)
export const EVALUATION_DATASET: EvaluationCase[] = generateDeterministicEvaluationDataset();

/**
 * Rigorous Data Quality & Integrity Validation
 * Ensures 0 duplicates, non-zero amounts, valid ground truth, and valid types.
 */
export function validateEvaluationDataset(data: EvaluationCase[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const idSet = new Set<string>();

  if (!data || data.length === 0) {
    errors.push("Evaluation dataset is empty.");
    return { valid: false, errors };
  }

  data.forEach((item, idx) => {
    if (!item.id) errors.push(`Row ${idx}: Missing case ID`);
    if (idSet.has(item.id)) errors.push(`Duplicate case ID detected: ${item.id}`);
    idSet.add(item.id);

    if (typeof item.amount !== "number" || item.amount <= 0 || !Number.isInteger(item.amount)) {
      errors.push(`Case ${item.id}: Invalid amount ${item.amount}. Must be a positive integer in paise.`);
    }

    if (!item.failureType) errors.push(`Case ${item.id}: Missing failureType`);
    if (!item.paymentMethod) errors.push(`Case ${item.id}: Missing paymentMethod`);
    if (!item.groundTruth) {
      errors.push(`Case ${item.id}: Missing groundTruth object`);
    } else {
      if (typeof item.groundTruth.recoverable !== "boolean") {
        errors.push(`Case ${item.id}: groundTruth.recoverable must be boolean`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
