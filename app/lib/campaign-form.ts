export function parseOfferPrice(raw: string): number {
  const n = Number.parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) {
    throw new Error("Enter a valid price.");
  }
  return n;
}

/** Campaign create flow: price must be present and a non-negative number. */
export function isValidOfferPrice(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  const n = Number.parseFloat(trimmed.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) && n >= 0;
}
