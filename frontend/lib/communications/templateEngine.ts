import { Case, FailureType } from "../types";
import { CommunicationChannel, CommunicationMessage } from "./types";
import { formatCurrency } from "../utils";

/**
 * Deterministic Template Engine for Autonomous Recovery Communications
 * Supports English & Hinglish copy across WhatsApp, SMS, Email, and In-App channels.
 */

export interface MessageTemplateInput {
  customerName: string;
  amountRupees: string;
  paymentLink: string;
  brandName?: string;
  failureType: FailureType;
  invoiceNumber?: string;
}

export function generateRecoveryMessage(
  caseItem: Case,
  channel: CommunicationChannel,
  language: "English" | "Hinglish",
  campaignName?: string
): string {
  const customerName = caseItem.customer || "Customer";
  const amountStr = formatCurrency(caseItem.amount);
  const paymentLink = `rzp.io/l/rec_${caseItem.id.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const fType = caseItem.failureType || caseItem.failure;

  if (language === "Hinglish") {
    switch (fType) {
      case "UPI Timeout":
        return `Namaste ${customerName}, aapki ${amountStr} ki UPI payment network issue ki wajah se complete nahi ho paayi. Aap iss secure Razorpay link se 1-click mein complete kar sakte hain: ${paymentLink}. Link 24 ghante valid hai.`;
      
      case "Card Decline":
        return `Hi ${customerName}, aapki ${amountStr} ki card payment bank ne decline kardi. Aap alternate card ya UPI ke through payment complete kar sakte hain: ${paymentLink}`;
      
      case "Insufficient Funds":
        return `Namaste ${customerName} ji, aapka ${amountStr} ka order pending hai. Aap alternate UPI app ya netbanking se payment complete karein: ${paymentLink}`;
      
      case "Checkout Abandonment":
        return `Hi ${customerName}, aapka ${amountStr} ka cart order reserve kar diya gaya hai! 1-click Razorpay link se checkout complete karein: ${paymentLink}`;
      
      case "Subscription Failure":
        return `Namaste ${customerName}, aapki ${amountStr} ki subscription auto-pay process nahi ho paayi. Mandate details update karne ke liye yahan tap karein: ${paymentLink}`;
      
      case "Overdue Invoice":
        return `Namaste ${customerName}, aapka invoice amount ${amountStr} due hai. Direct GST-compliant Razorpay link se pay karein: ${paymentLink}`;
      
      default:
        return `Hi ${customerName}, aapki ${amountStr} ki pending payment complete karne ke liye yahan tap karein: ${paymentLink}`;
    }
  } else {
    // Standard English
    switch (fType) {
      case "UPI Timeout":
        return `Hello ${customerName}, your UPI payment of ${amountStr} could not be confirmed due to a temporary bank timeout. You can complete your transaction securely here: ${paymentLink}`;
      
      case "Card Decline":
        return `Hello ${customerName}, your card issuer was unable to process your payment of ${amountStr}. Please use an alternate card or UPI to retry: ${paymentLink}`;
      
      case "Insufficient Funds":
        return `Hi ${customerName}, your order of ${amountStr} is pending. Please complete your payment using an alternate payment method here: ${paymentLink}`;
      
      case "Checkout Abandonment":
        return `Hi ${customerName}, looks like you left something behind! Complete your order of ${amountStr} with our instant 1-click link: ${paymentLink}`;
      
      case "Subscription Failure":
        return `Hello ${customerName}, your recurring subscription payment of ${amountStr} was unsuccessful. Please update your mandate details: ${paymentLink}`;
      
      case "Overdue Invoice":
        return `Hello ${customerName}, invoice payment of ${amountStr} is awaiting settlement. You can settle it directly via Razorpay: ${paymentLink}`;
      
      default:
        return `Hello ${customerName}, please complete your pending transaction of ${amountStr} using this secure link: ${paymentLink}`;
    }
  }
}

/**
 * Deterministic Channel Selector
 */
export function selectOptimalChannel(caseItem: Case): CommunicationChannel {
  const fType = caseItem.failureType || caseItem.failure;
  const amountRupees = caseItem.amount / 100;

  if (amountRupees >= 10000 || fType === "Card Decline" || fType === "Checkout Abandonment") {
    return "whatsapp";
  } else if (fType === "Overdue Invoice") {
    return "email";
  } else {
    return "sms";
  }
}
