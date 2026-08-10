export function formatMetaSpend(
  spend: string | null | undefined,
  currency: string | null | undefined,
): string {
  if (spend == null || spend.trim() === "") return "N/A";
  const n = Number.parseFloat(spend);
  if (!Number.isFinite(n)) return spend;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: (currency?.trim() || "EUR").toUpperCase(),
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency ?? ""}`.trim();
  }
}

/** Meta campaign daily_budget is in the currency minor unit (e.g. cents). */
export function formatMetaDailyBudget(
  dailyBudget: string | null | undefined,
  currency: string | null | undefined,
): string {
  if (dailyBudget == null || dailyBudget.trim() === "") return "N/A";
  const n = Number.parseInt(dailyBudget, 10);
  if (!Number.isFinite(n)) return dailyBudget;
  try {
    const amount = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: (currency?.trim() || "EUR").toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n / 100);
    return `${amount} daily`;
  } catch {
    return `${(n / 100).toFixed(2)} daily`;
  }
}

export function formatMetaCount(value: string | null | undefined): string {
  if (value == null || value.trim() === "") return "N/A";
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat().format(n);
}

/** Meta CTR is a percentage string, e.g. "1.234567". */
export function formatMetaPercent(value: string | null | undefined): string {
  if (value == null || value.trim() === "") return "N/A";
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return value;
  return `${n.toFixed(2)}%`;
}

/** Meta CPC / CPM money amounts as major currency units. */
export function formatMetaRateMoney(
  value: string | null | undefined,
  currency: string | null | undefined,
): string {
  return formatMetaSpend(value, currency);
}

export function formatMetaFrequency(value: string | null | undefined): string {
  if (value == null || value.trim() === "") return "N/A";
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return value;
  return n.toFixed(2);
}

const PRIMARY_ACTION_PRIORITY = [
  "purchase",
  "omni_purchase",
  "lead",
  "complete_registration",
  "submit_application",
  "contact",
  "schedule",
  "start_trial",
  "subscribe",
  "add_to_cart",
  "initiate_checkout",
  "link_click",
] as const;

export function pickPrimaryMetaAction(
  actions:
    | Array<{ actionType: string; value: string }>
    | null
    | undefined,
): { actionType: string; value: string } | null {
  if (!actions?.length) return null;
  for (const preferred of PRIMARY_ACTION_PRIORITY) {
    const match = actions.find(
      (row) => row.actionType.trim().toLowerCase() === preferred,
    );
    if (match) return match;
  }
  return actions[0] ?? null;
}

export function formatMetaActionType(
  actionType: string | null | undefined,
): string {
  if (!actionType?.trim()) return "Result";
  return actionType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function findMetaCostForAction(
  costPerActionType:
    | Array<{ actionType: string; value: string }>
    | null
    | undefined,
  actionType: string | null | undefined,
): string | null {
  if (!costPerActionType?.length || !actionType?.trim()) return null;
  const wanted = actionType.trim().toLowerCase();
  return (
    costPerActionType.find(
      (row) => row.actionType.trim().toLowerCase() === wanted,
    )?.value ?? null
  );
}

export function formatMetaDeliveryStatus(
  effectiveStatus: string | null | undefined,
): string {
  if (!effectiveStatus?.trim()) return "N/A";
  return effectiveStatus
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
