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

export function formatMetaDeliveryStatus(
  effectiveStatus: string | null | undefined,
): string {
  if (!effectiveStatus?.trim()) return "N/A";
  return effectiveStatus
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
