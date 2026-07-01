/**
 * Change summary:
 * - Abandoned Cart, Payment Reminder, and Prepaid Offer import templates.
 */

import type { WorkflowNodeKind } from "@/app/components/automation/types";
import type { AutomationPurpose } from "@/app/services/automation/types";
import {
  FLOW_BRANCH_PASS,
  FLOW_BRANCH_PAYMENT,
  FLOW_BRANCH_VISITED_YES,
} from "@/app/components/automation/builder/flow-layout";
import { PREPAID_FIRST_EMAIL_DEFAULTS } from "@/app/components/automation/builder/bundled-actions";

export type AutomationTemplateNodeDef = {
  key: string;
  kind: WorkflowNodeKind;
  label: string;
  summary: string;
  config: Record<string, unknown>;
};

export type AutomationTemplateConnectionDef = {
  sourceKey: string;
  targetKey: string;
};

export type AutomationTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  trigger: string;
  purpose: AutomationPurpose;
  nodes: AutomationTemplateNodeDef[];
  connections: AutomationTemplateConnectionDef[];
};

/** Shared payment-reminder email copy (Payment Reminder template). */
const PAYMENT_REMINDER_EMAIL_CONFIG = {
  subject: "Complete your payment — your offer is waiting",
  template: "Payment reminder",
  message:
    "Hi — thank you for signing up! Your offer is almost ready. Please complete your payment to unlock it. If you already paid, you can ignore this email.",
  headline: "Complete your payment",
  ctaLabel: "Complete payment",
} as const;

/** Shared payment-reminder SMS copy (Abandoned Cart payment branch). */
const PAYMENT_REMINDER_SMS_CONFIG = {
  message:
    "Hi [First Name] — thank you for signing up!\n\nYour offer is almost ready. Complete your payment here: [Payment Link]\n\nPrefer to pay when you visit?\n• Save your pass to Google Wallet: [Pass Link]\n• Come by the restaurant — we'll scan your pass at checkout.\n\nWe look forward to seeing you!",
  linkLabel: "View Your Pass",
} as const;

/** Abandoned Cart — wait/filter/actions, then split pass + payment reminders. */
export const ABANDONED_CART_TEMPLATE: AutomationTemplate = {
  id: "abandoned_cart",
  name: "Abandoned Cart",
  category: "Revenue Recovery",
  description:
    "Recover guests who signed up but did not finish. Sends initial SMS and rewards, then splits into pass and payment reminder paths.",
  trigger: "Abandoned Checkout",
  purpose: "funnel_abandoned_checkout_reminder",
  nodes: [
    {
      key: "trigger",
      kind: "signup_trigger",
      label: "Signed up for campaign",
      summary:
        "Guests enter this flow when they provide their information in a campaign funnel.",
      config: {
        trigger: "abandoned_checkout",
        title: "Signed up for campaign",
        description:
          "Guests enter this flow when they provide their information in a campaign funnel.",
      },
    },
    {
      key: "wait",
      kind: "wait",
      label: "Wait until",
      summary: "15 minutes elapsed",
      config: { delay: 15, unit: "minutes" },
    },
    {
      key: "filter",
      kind: "condition",
      label: "Filters",
      summary: "NOT Prepaid for campaign offer",
      config: {
        conditionType: "Has not completed payment",
        value: "NOT Prepaid",
      },
    },
    {
      key: "sms_pass_link",
      kind: "send_sms",
      label: "Send Text",
      summary:
        "Pass link — complete signup by adding your pass to your wallet.",
      config: {
        message:
          "In order to complete your signup, you will need to click this link to add your pass to your wallet:",
        linkLabel: "Pass Link",
      },
    },
    {
      key: "sms_confirm",
      kind: "send_sms",
      label: "Send Text",
      summary:
        "Personal follow-up confirming the offer and opt-out instructions.",
      config: {
        message:
          "Hi [First Name]! This is your team confirming your offer. We noticed you didn't complete your purchase so we've texted you the offer in case you're still planning on coming by. Text STOP at anytime to opt out and delete your offer.",
      },
    },
    {
      key: "give_reward",
      kind: "create_coupon",
      label: "Give Rewards",
      summary: "Grant the campaign reward — expires in 2 weeks (Sunday 11:59 PM).",
      config: {
        rewardName: "Campaign offer",
        expiration: "2 weeks",
        expirationNote:
          "Expires in 2 weeks (rounded up to Sunday at 11:59 PM)",
      },
    },
    {
      key: "set_expiry",
      kind: "tag_customer",
      label: "Set Reward Expiration",
      summary:
        "Set reward expiration to 2 weeks (rounded up to Sunday at 11:59 PM).",
      config: {
        tag: "reward_expiration",
        rewardName: "Campaign offer",
        expiration: "2 weeks",
        expirationNote:
          "Set expiration to in 2 weeks (rounded up to Sunday at 11:59 PM)",
      },
    },
    {
      key: "wait_pass",
      kind: "wait",
      label: "Wait until",
      summary: "15 minutes elapsed",
      config: { delay: 15, unit: "minutes", flowBranch: FLOW_BRANCH_PASS },
    },
    {
      key: "filter_pass",
      kind: "condition",
      label: "Filters",
      summary: "NOT Pass was added",
      config: {
        flowBranch: FLOW_BRANCH_PASS,
        conditionType: "Pass not added",
        value: "NOT Pass was added",
      },
    },
    {
      key: "action_pass",
      kind: "send_sms",
      label: "Send Text",
      summary: "Pass reminder with wallet link.",
      config: {
        flowBranch: FLOW_BRANCH_PASS,
        message:
          "Hi [First Name], we noticed that you haven't added your offer to your wallet yet. Get your pass: [Pass Link]",
        linkLabel: "Pass Link",
      },
    },
    {
      key: "wait_payment",
      kind: "wait",
      label: "Wait until",
      summary: "11:08 am",
      config: {
        flowBranch: FLOW_BRANCH_PAYMENT,
        waitMode: "until_time",
        untilTime: "11:08 am",
        time: "11:08",
      },
    },
    {
      key: "filter_payment",
      kind: "condition",
      label: "Filters",
      summary: "Over 7 hours + NOT paid + NOT Arancini redeemed",
      config: {
        flowBranch: FLOW_BRANCH_PAYMENT,
        conditions: [
          { value: "Over 7 hours since signed up for the first time" },
          { negated: true, value: "Status not paid" },
          { negated: true, value: "Arancini was redeemed" },
        ],
      },
    },
    {
      key: "action_payment",
      kind: "send_sms",
      label: "Send Text",
      summary: "Register thanks, pay online, or add pass to Wallet then visit restaurant.",
      config: {
        flowBranch: FLOW_BRANCH_PAYMENT,
        ...PAYMENT_REMINDER_SMS_CONFIG,
      },
    },
  ],
  connections: [
    { sourceKey: "trigger", targetKey: "wait" },
    { sourceKey: "wait", targetKey: "filter" },
    { sourceKey: "filter", targetKey: "sms_pass_link" },
    { sourceKey: "sms_pass_link", targetKey: "sms_confirm" },
    { sourceKey: "sms_confirm", targetKey: "give_reward" },
    { sourceKey: "give_reward", targetKey: "set_expiry" },
    { sourceKey: "set_expiry", targetKey: "wait_pass" },
    { sourceKey: "wait_pass", targetKey: "filter_pass" },
    { sourceKey: "filter_pass", targetKey: "action_pass" },
    { sourceKey: "action_pass", targetKey: "wait_payment" },
    { sourceKey: "wait_payment", targetKey: "filter_payment" },
    { sourceKey: "filter_payment", targetKey: "action_payment" },
  ],
};

/** QR pass guide email (after payment reminder). */
const QR_PASS_EMAIL_CONFIG = {
  subject: "Your QR pass is ready — add to Wallet",
  template: "QR pass guide",
  message:
    "Your offer pass is ready! Tap the button below to view your QR code.\n\nHow to use your pass:\n1. Open your pass and tap Add to Apple Wallet or Google Wallet\n2. Visit the restaurant and show your pass at the scanner when you pay\n\nPrefer to pay online? You can still complete checkout anytime.",
  headline: "Your QR pass is ready",
  ctaLabel: "View my pass",
} as const;

export const PAYMENT_REMINDER_TEMPLATE: AutomationTemplate = {
  id: "payment_reminder",
  name: "Payment Reminder",
  category: "Revenue Recovery",
  description:
    "Follow up with guests who signed up but have not paid. Sends a payment reminder, waits, then sends QR pass instructions for Wallet and in-store scanner.",
  trigger: "Cron Job",
  purpose: "funnel_signup_payment_reminder",
  nodes: [
    {
      key: "trigger",
      kind: "cron_trigger",
      label: "Cron Job",
      summary: "Every 15 minutes",
      config: {
        trigger: "cron",
        frequency: "interval",
        interval: 15,
        unit: "minutes",
      },
    },
    {
      key: "filter",
      kind: "condition",
      label: "Filters",
      summary: "Status not paid",
      config: {
        conditionType: "Has not completed payment",
        conditions: [{ negated: true, value: "Status not paid" }],
      },
    },
    {
      key: "email_payment",
      kind: "send_email",
      label: "Send Email",
      summary: "Payment reminder with link to complete checkout.",
      config: {
        ...PAYMENT_REMINDER_EMAIL_CONFIG,
        workflowKind: "payment_reminder_email",
      },
    },
    {
      key: "wait_pass",
      kind: "wait",
      label: "Wait until",
      summary: "2 minutes elapsed",
      config: {
        delay: 2,
        unit: "minutes",
        workflowKind: "payment_reminder_wait",
      },
    },
    {
      key: "email_pass",
      kind: "send_email",
      label: "Send Email",
      summary: "QR pass — add to Wallet and use at scanner.",
      config: QR_PASS_EMAIL_CONFIG,
    },
    {
      key: "filter_loop",
      kind: "condition",
      label: "Filters",
      summary: "Still unpaid — loop reminders until paid",
      config: {
        conditionType: "Has not completed payment",
        onFalseLoopWorkflowKind: "payment_reminder_email",
        branchLabelTrue: "Guest paid — stop",
        branchLabelFalse: "Still unpaid — send reminders again",
      },
    },
  ],
  connections: [
    { sourceKey: "trigger", targetKey: "filter" },
    { sourceKey: "filter", targetKey: "email_payment" },
    { sourceKey: "email_payment", targetKey: "wait_pass" },
    { sourceKey: "wait_pass", targetKey: "email_pass" },
    { sourceKey: "email_pass", targetKey: "filter_loop" },
  ],
};

export const POST_PAYMENT_JOURNEY_TEMPLATE: AutomationTemplate = {
  id: "post_payment_journey",
  name: "Prepaid Offer",
  category: "Guest Journey",
  description:
    "Runs after a guest pays. Sends thank-you and confirmation emails, a pass reminder, then follow-ups after they visit the restaurant (when their pass is scanned).",
  trigger: "Payment",
  purpose: "funnel_payment",
  nodes: [
    {
      key: "trigger",
      kind: "payment_trigger",
      label: "Payment Completed",
      summary: "Starts when a guest completes payment.",
      config: {
        trigger: "payment",
        title: "Payment Completed",
        description:
          "Guests enter this flow when they finish paying for the campaign offer.",
      },
    },
    {
      key: "payment_confirmation_email",
      kind: "send_email",
      label: "Send Email",
      summary: "First prepaid offer email with pass link — sent once after payment.",
      config: {
        workflowKind: "prepaid_payment_actions",
        subject: PREPAID_FIRST_EMAIL_DEFAULTS.subject,
        template: PREPAID_FIRST_EMAIL_DEFAULTS.template,
        message: PREPAID_FIRST_EMAIL_DEFAULTS.message,
        headline: PREPAID_FIRST_EMAIL_DEFAULTS.headline,
        ctaLabel: PREPAID_FIRST_EMAIL_DEFAULTS.ctaLabel,
      },
    },
    {
      key: "wait_before_reminder",
      kind: "wait",
      label: "Wait until",
      summary: "1 day elapsed",
      config: { delay: 1, unit: "days", workflowKind: "prepaid_visit_reminder_wait" },
    },
    {
      key: "email_visit_reminder",
      kind: "send_email",
      label: "Send Email",
      summary: "Pass reminder — visit anytime and show your pass.",
      config: {
        workflowKind: "prepaid_visit_reminder",
        subject: "Your offer is ready — visit us anytime",
        template: "Payment confirmation",
        message:
          "Hi [First Name] — your offer is ready whenever you visit! Show your pass at the restaurant when you arrive.",
        headline: "Your offer is ready",
        ctaLabel: "View Your Pass",
      },
    },
    {
      key: "filter_visited",
      kind: "condition",
      label: "Filters",
      summary: "Customer visited (pass scanned at restaurant)",
      config: {
        conditionType: "Customer visited",
        value: "Customer visited",
        onFalseLoopWorkflowKind: "prepaid_visit_reminder_wait",
        branchLabelTrue: "Customer visited",
        branchLabelFalse: "Not visited — wait then send reminder again",
      },
    },
    {
      key: "email_post_visit_thanks",
      kind: "send_email",
      label: "Send Email",
      summary: "Thank you message after the visit.",
      config: {
        flowBranch: FLOW_BRANCH_VISITED_YES,
        subject: "Thanks for visiting us!",
        template: "Payment confirmation",
        message:
          "Thanks for visiting us today, [First Name]! We hope you enjoyed your experience.",
        headline: "Thank you for visiting",
      },
    },
    {
      key: "wait_2_days",
      kind: "wait",
      label: "Wait until",
      summary: "2 days elapsed",
      config: { flowBranch: FLOW_BRANCH_VISITED_YES, delay: 2, unit: "days" },
    },
    {
      key: "email_review",
      kind: "send_email",
      label: "Send Email",
      summary: "Review request with link.",
      config: {
        flowBranch: FLOW_BRANCH_VISITED_YES,
        subject: "We'd love your feedback",
        template: "Payment confirmation",
        message:
          "Hi [First Name] — we'd love your feedback! Leave us a quick review.",
        headline: "Share your experience",
        ctaLabel: "Leave a Review",
      },
    },
    {
      key: "wait_7_days",
      kind: "wait",
      label: "Wait until",
      summary: "7 days elapsed",
      config: { flowBranch: FLOW_BRANCH_VISITED_YES, delay: 7, unit: "days" },
    },
    {
      key: "return_offer",
      kind: "send_email",
      label: "Send Email",
      summary: "Return visit offer email.",
      config: {
        flowBranch: FLOW_BRANCH_VISITED_YES,
        subject: "Your return visit offer is ready",
        message:
          "Hi [First Name] — we'd love to see you again! Your return visit offer is ready.\n\nValid for 30 days after send.",
        headline: "Return visit offer",
      },
    },
  ],
  connections: [
    { sourceKey: "trigger", targetKey: "payment_confirmation_email" },
    { sourceKey: "payment_confirmation_email", targetKey: "wait_before_reminder" },
    { sourceKey: "wait_before_reminder", targetKey: "email_visit_reminder" },
    { sourceKey: "email_visit_reminder", targetKey: "filter_visited" },
    { sourceKey: "filter_visited", targetKey: "email_post_visit_thanks" },
    { sourceKey: "email_post_visit_thanks", targetKey: "wait_2_days" },
    { sourceKey: "wait_2_days", targetKey: "email_review" },
    { sourceKey: "email_review", targetKey: "wait_7_days" },
    { sourceKey: "wait_7_days", targetKey: "return_offer" },
  ],
};

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  ABANDONED_CART_TEMPLATE,
  PAYMENT_REMINDER_TEMPLATE,
  POST_PAYMENT_JOURNEY_TEMPLATE,
];

export function getAutomationTemplateById(
  templateId: string,
): AutomationTemplate | undefined {
  return AUTOMATION_TEMPLATES.find((template) => template.id === templateId);
}
