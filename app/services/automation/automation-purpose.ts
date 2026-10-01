import type { AutomationPurpose } from "@/app/services/automation/types";

export type TriggerPurposeMeta = {
  purpose: AutomationPurpose;
  label: string;
  description: string;
};

const TRIGGER_PURPOSE_BY_UI: Record<string, TriggerPurposeMeta> = {
  "Cron Job": {
    purpose: "funnel_signup_payment_reminder",
    label: "Scheduled (Cron)",
    description:
      "Runs on your schedule so unpaid or eligible guests can be reached again.",
  },
  Payment: {
    purpose: "funnel_payment",
    label: "Prepaid / paid guests",
    description: "Runs after a guest completes payment on this funnel.",
  },
  Signup: {
    purpose: "funnel_signup",
    label: "Signup welcome",
    description: "Runs when someone new signs up on this campaign.",
  },
  "Abandoned Checkout": {
    purpose: "funnel_abandoned_checkout_reminder",
    label: "Abandoned checkout",
    description:
      "Recover guests who started checkout but have not paid yet.",
  },
  "First Purchase": {
    purpose: "funnel_payment",
    label: "First purchase",
    description: "Runs only on a guest’s first paid purchase.",
  },
  "Funnel Complete": {
    purpose: "funnel_signup",
    label: "Funnel completed",
    description: "Runs when a guest finishes the funnel path.",
  },
  "Win-back": {
    purpose: "funnel_signup",
    label: "Win-back",
    description:
      "Re-engages guests who have not visited for your chosen number of days.",
  },
  "No Visit": {
    purpose: "funnel_signup",
    label: "Win-back",
    description:
      "Re-engages guests who have not visited for your chosen number of days.",
  },
};

const TRIGGER_PURPOSE_BY_API: Record<string, TriggerPurposeMeta> = {
  cron: TRIGGER_PURPOSE_BY_UI["Cron Job"]!,
  payment: TRIGGER_PURPOSE_BY_UI.Payment!,
  signup: TRIGGER_PURPOSE_BY_UI.Signup!,
  abandoned_checkout: TRIGGER_PURPOSE_BY_UI["Abandoned Checkout"]!,
  first_purchase: TRIGGER_PURPOSE_BY_UI["First Purchase"]!,
  funnel_completed: TRIGGER_PURPOSE_BY_UI["Funnel Complete"]!,
  funnel_complete: TRIGGER_PURPOSE_BY_UI["Funnel Complete"]!,
  no_visit: TRIGGER_PURPOSE_BY_UI["Win-back"]!,
};

const PURPOSE_FALLBACK_LABEL: Record<string, string> = {
  funnel_signup_payment_reminder: "Payment reminder (unpaid signups)",
  funnel_signup: "Signup welcome",
  funnel_payment: "Prepaid / paid guests",
  funnel_abandoned_checkout_reminder: "Abandoned checkout",
  manual: "Manual",
};

const TRIGGER_PURPOSE_BY_KIND: Record<string, TriggerPurposeMeta> = {
  cron_trigger: TRIGGER_PURPOSE_BY_UI["Cron Job"]!,
  payment_trigger: TRIGGER_PURPOSE_BY_UI.Payment!,
  signup_trigger: TRIGGER_PURPOSE_BY_UI.Signup!,
  abandoned_checkout_trigger: TRIGGER_PURPOSE_BY_UI["Abandoned Checkout"]!,
  first_purchase_trigger: TRIGGER_PURPOSE_BY_UI["First Purchase"]!,
  funnel_complete: TRIGGER_PURPOSE_BY_UI["Funnel Complete"]!,
  win_back_trigger: TRIGGER_PURPOSE_BY_UI["Win-back"]!,
};

export function resolvePurposeMetaForTrigger(
  trigger: string | null | undefined,
): TriggerPurposeMeta {
  const raw = String(trigger ?? "").trim();
  if (!raw) {
    return TRIGGER_PURPOSE_BY_UI.Signup!;
  }
  return (
    TRIGGER_PURPOSE_BY_UI[raw] ??
    TRIGGER_PURPOSE_BY_API[raw.toLowerCase()] ??
    TRIGGER_PURPOSE_BY_KIND[raw] ??
    TRIGGER_PURPOSE_BY_UI.Signup!
  );
}

export function resolvePurposeForTrigger(
  trigger: string | null | undefined,
): AutomationPurpose {
  return resolvePurposeMetaForTrigger(trigger).purpose;
}

export function purposeLabelForTrigger(
  trigger: string | null | undefined,
): string {
  return resolvePurposeMetaForTrigger(trigger).label;
}

export function purposeToDisplayLabel(
  purpose: AutomationPurpose | string | null | undefined,
  trigger?: string | null,
): string {
  const rawTrigger = String(trigger ?? "").trim().toLowerCase();
  const isCron =
    rawTrigger === "cron" ||
    rawTrigger === "cron job" ||
    rawTrigger === "cron_trigger";

  if (isCron || !trigger) {
    if (!purpose) return isCron ? "Scheduled (Cron)" : "N/A";
    return PURPOSE_FALLBACK_LABEL[purpose] ?? String(purpose);
  }

  return purposeLabelForTrigger(trigger);
}

export function isCronTrigger(trigger: string | null | undefined): boolean {
  const raw = String(trigger ?? "").trim().toLowerCase();
  return (
    raw === "cron" ||
    raw === "cron job" ||
    raw === "cron_trigger"
  );
}
