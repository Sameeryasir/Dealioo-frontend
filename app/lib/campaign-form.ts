export function parseOfferPrice(raw: string): number {
  const n = Number.parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) {
    throw new Error("Enter a valid price.");
  }
  return n;
}

export function isValidOfferName(raw: string): boolean {
  const trimmed = raw.trim();
  return trimmed.length >= 2 && trimmed.length <= 120;
}

/** Campaign create flow: price must be a non-negative number with up to 2 decimals. */
export function isValidOfferPrice(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return false;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) && n >= 0 && n <= 999999.99;
}

export function offerNameValidationMessage(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "Enter an offer name.";
  if (trimmed.length < 2) return "Offer name must be at least 2 characters.";
  if (trimmed.length > 120) return "Offer name must be 120 characters or less.";
  return null;
}

export function offerPriceValidationMessage(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "Enter a price.";
  if (!isValidOfferPrice(trimmed)) {
    return "Enter a valid price (e.g. 19.99). Use numbers only, up to 2 decimals.";
  }
  return null;
}
