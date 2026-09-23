export function parseOfferPrice(raw: string): number {
  const n = Number.parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) {
    throw new Error("Enter a valid price.");
  }
  return n;
}

export const CAMPAIGN_OFFER_MAX_LENGTH = 100;

export function isValidOfferName(raw: string): boolean {
  const trimmed = raw.trim();
  return (
    trimmed.length >= 2 && trimmed.length <= CAMPAIGN_OFFER_MAX_LENGTH
  );
}

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
  if (trimmed.length > CAMPAIGN_OFFER_MAX_LENGTH) {
    return `Offer name must be ${CAMPAIGN_OFFER_MAX_LENGTH} characters or less.`;
  }
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

export const CAMPAIGN_DESCRIPTION_MAX_LENGTH = 80;

export function campaignDescriptionValidationMessage(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "Enter a campaign description.";
  if (trimmed.length < 10) {
    return "Description must be at least 10 characters.";
  }
  if (trimmed.length > CAMPAIGN_DESCRIPTION_MAX_LENGTH) {
    return `Description must be ${CAMPAIGN_DESCRIPTION_MAX_LENGTH} characters or less.`;
  }
  return null;
}
