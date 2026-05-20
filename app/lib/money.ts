export function formatCents(
  amount: number,
  currency: string,
  locale = "en-US",
): string {
  const code = currency?.trim() || "USD";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
    }).format(amount / 100);
  } catch {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  }
}
