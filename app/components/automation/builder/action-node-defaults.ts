import type { WorkflowNode } from "@/app/components/automation/types";
import {
  isPrepaidFirstEmailNode,
  PAYMENT_REMINDER_EMAIL_KIND,
  PAYMENT_REMINDER_EXPIRY_EMAIL_KIND,
  PAYMENT_REMINDER_WALLET_EMAIL_KIND,
  PREPAID_FIRST_EMAIL_DEFAULTS,
} from "@/app/components/automation/builder/bundled-actions";
import { isReturnOfferEmailNode } from "@/app/components/automation/builder/workflow-node-display";

export type EmailContentDefaults = {
  template: string;
  subject: string;
  message: string;
  ctaLabel: string;
};

const PAYMENT_REMINDER_EMAIL_DEFAULTS: EmailContentDefaults = {
  template: "Payment reminder",
  subject: "Complete your payment — your offer is waiting",
  message:
    "Hi — thank you for signing up! Your offer is almost ready. Please complete your payment to unlock it. If you already paid, you can ignore this email.",
  ctaLabel: "Complete payment",
};

const EMPTY_EMAIL_DEFAULTS: EmailContentDefaults = {
  template: "",
  subject: "",
  message: "",
  ctaLabel: "",
};

const PAYMENT_REMINDER_WORKFLOW_KINDS = new Set([
  PAYMENT_REMINDER_EMAIL_KIND,
  PAYMENT_REMINDER_WALLET_EMAIL_KIND,
  PAYMENT_REMINDER_EXPIRY_EMAIL_KIND,
  "payment_reminder_wait",
  "payment_reminder_wallet_wait",
  "payment_reminder_expiry_wait",
]);

export function isUserCreatedActionNode(node: WorkflowNode): boolean {
  if (
    node.kind !== "send_email" &&
    node.kind !== "send_sms" &&
    node.kind !== "send_whatsapp"
  ) {
    return false;
  }

  const workflowKind = String(node.config.workflowKind ?? "").trim();
  return workflowKind.length === 0;
}

export function resolveEmailContentDefaults(node: WorkflowNode): EmailContentDefaults {
  if (isPrepaidFirstEmailNode(node)) {
    return {
      template: PREPAID_FIRST_EMAIL_DEFAULTS.template,
      subject: PREPAID_FIRST_EMAIL_DEFAULTS.subject,
      message: PREPAID_FIRST_EMAIL_DEFAULTS.message,
      ctaLabel: PREPAID_FIRST_EMAIL_DEFAULTS.ctaLabel,
    };
  }

  if (isReturnOfferEmailNode(node)) {
    return {
      template: "",
      subject: "Your return visit offer is ready",
      message:
        "Hi [First Name] — we'd love to see you again! Your return visit offer is ready.\n\nValid for 30 days after send.",
      ctaLabel: "Complete payment",
    };
  }

  const workflowKind = String(node.config.workflowKind ?? "").trim();
  if (
    workflowKind.length > 0 &&
    (PAYMENT_REMINDER_WORKFLOW_KINDS.has(workflowKind) ||
      workflowKind.startsWith("payment_reminder"))
  ) {
    return PAYMENT_REMINDER_EMAIL_DEFAULTS;
  }

  if (node.kind === "send_email" && isUserCreatedActionNode(node)) {
    return EMPTY_EMAIL_DEFAULTS;
  }

  if (node.kind === "send_email") {
    return PAYMENT_REMINDER_EMAIL_DEFAULTS;
  }

  return EMPTY_EMAIL_DEFAULTS;
}

export function readEmailField(
  config: Record<string, unknown>,
  key: keyof EmailContentDefaults,
  defaults: EmailContentDefaults,
): string {
  const value = config[key];
  if (typeof value === "string") {
    return value;
  }
  return defaults[key];
}

export function getEmailPreviewText(config: Record<string, unknown>): string {
  const read = (key: string) => {
    const value = config[key];
    return typeof value === "string" ? value.trim() : "";
  };

  return read("message") || read("headline") || read("subject");
}
