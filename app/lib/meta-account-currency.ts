export const DEFAULT_META_ACCOUNT_CURRENCY = "USD";

export function normalizeMetaCurrencyCode(
  currency: string | null | undefined,
): string {
  const code = currency?.trim().toUpperCase();
  return code && /^[A-Z]{3}$/.test(code) ? code : DEFAULT_META_ACCOUNT_CURRENCY;
}

export function metaCurrencySymbol(currencyCode: string): string {
  const code = normalizeMetaCurrencyCode(currencyCode);
  try {
    const parts = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    return parts.find((part) => part.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

export function formatMetaAccountMoney(
  amount: number | null | undefined,
  currencyCode: string,
): string {
  if (amount == null || !Number.isFinite(amount)) {
    return "N/A";
  }
  const code = normalizeMetaCurrencyCode(currencyCode);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
}
