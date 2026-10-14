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
  "Ask Review": {
    purpose: "funnel_payment",
    label: "Ask for review (paid, no review yet)",
    description:
      "When activated, finds paid guests who have not submitted a review yet and starts the flow for them.",
  },
};

const TRIGGER_PURPOSE_BY_API: Record<string, TriggerPurposeMeta> = {
  cron: TRIGGER_PURPOSE_BY_UI["Cron Job"]!,
  payment: TRIGGER_PURPOSE_BY_UI.Payment!,
  signup: TRIGGER_PURPOSE_BY_UI.Signup!,
  abandoned_checkout: TRIGGER_PURPOSE_BY_UI["Abandoned Checkout"]!,
  ask_review: TRIGGER_PURPOSE_BY_UI["Ask Review"]!,
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
  ask_review_trigger: TRIGGER_PURPOSE_BY_UI["Ask Review"]!,
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
