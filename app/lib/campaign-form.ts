import { meaningfulTextValidationMessage } from "@/app/lib/form-validation";

export {
  hasMeaningfulText,
  meaningfulTextValidationMessage,
} from "@/app/lib/form-validation";

export const CAMPAIGN_PRICE_MAX = 999_999.99;
export const CAMPAIGN_OFFER_MAX_LENGTH = 100;

export function parseOfferPrice(raw: string): number {
  const n = Number.parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) {
    throw new Error("Enter a valid price.");
  }
  return roundMoney(n);
}

export function isValidOfferName(raw: string): boolean {
  return offerNameValidationMessage(raw) == null;
}

export function isValidOfferPrice(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return false;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) && n >= 0 && n <= CAMPAIGN_PRICE_MAX;
}

export function assertDealPricingPair(
  price: number | null,
  originalPrice: number | null,
): string | null {
  if (originalPrice == null) return null;
  if (price == null) {
    return "Set a deal price before adding a discount.";
  }
  if (!Number.isFinite(price) || price < 0 || price > CAMPAIGN_PRICE_MAX) {
    return "Enter a valid deal price.";
  }
  if (
    !Number.isFinite(originalPrice) ||
    originalPrice < 0 ||
    originalPrice > CAMPAIGN_PRICE_MAX
  ) {
    return "Enter a valid original price.";
  }
  if (!(originalPrice > price)) {
    return "Original price must be higher than the deal price.";
  }
  return null;
}

export function offerNameValidationMessage(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "Enter an offer name.";
  if (trimmed.length < 2) return "Offer name must be at least 2 characters.";
  if (trimmed.length > CAMPAIGN_OFFER_MAX_LENGTH) {
    return `Offer name must be ${CAMPAIGN_OFFER_MAX_LENGTH} characters or less.`;
  }
  const textError = meaningfulTextValidationMessage(trimmed, "Offer name");
  if (textError) return textError;
  return null;
}

export function campaignNameValidationMessage(
  raw: string,
  maxLength = 30,
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "Enter a campaign name.";
  if (trimmed.length < 2) {
    return "Campaign name must be at least 2 characters.";
  }
  if (trimmed.length > maxLength) {
    return `Campaign name must be ${maxLength} characters or less.`;
  }
  const textError = meaningfulTextValidationMessage(trimmed, "Campaign name");
  if (textError) return textError;
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

export type CampaignDiscountType = "fixed" | "percent";

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function computeOriginalPriceFromDiscount(input: {
  dealPrice: number;
  discountType: CampaignDiscountType;
  discountValue: number;
}): number | null {
  const dealPrice = roundMoney(input.dealPrice);
  const discountValue = Number(input.discountValue);
  if (!Number.isFinite(dealPrice) || dealPrice < 0 || dealPrice > CAMPAIGN_PRICE_MAX) {
    return null;
  }
  if (!Number.isFinite(discountValue) || discountValue <= 0) return null;

  let original: number;
  if (input.discountType === "fixed") {
    if (discountValue > CAMPAIGN_PRICE_MAX) return null;
    original = roundMoney(dealPrice + discountValue);
  } else {
    if (discountValue < 1 || discountValue >= 100) return null;
    original = roundMoney(dealPrice / (1 - discountValue / 100));
  }

  if (!Number.isFinite(original) || original > CAMPAIGN_PRICE_MAX) return null;
  if (!(original > dealPrice)) return null;
  return original;
}

export function discountValidationMessage(input: {
  enabled: boolean;
  dealPriceRaw: string;
  discountType: CampaignDiscountType;
  discountValueRaw: string;
}): string | null {
  if (!input.enabled) return null;

  const dealError = offerPriceValidationMessage(input.dealPriceRaw);
  if (dealError) return dealError;

  const raw = input.discountValueRaw.trim();
  if (!raw) {
    return input.discountType === "percent"
      ? "Enter a discount percent."
      : "Enter a fixed discount amount.";
  }
  if (!isValidOfferPrice(raw)) {
    return input.discountType === "percent"
      ? "Enter a valid percent (e.g. 20)."
      : "Enter a valid discount amount (e.g. 5.00).";
  }

  const dealPrice = Number.parseFloat(input.dealPriceRaw.trim());
  const discountValue = Number.parseFloat(raw);

  if (input.discountType === "percent") {
    if (discountValue < 1 || discountValue >= 100) {
      return "Percent discount must be between 1 and 99.";
    }
  } else if (discountValue <= 0) {
    return "Fixed discount must be greater than 0.";
  }

  const original = computeOriginalPriceFromDiscount({
    dealPrice,
    discountType: input.discountType,
    discountValue,
  });
  if (original == null) {
    return "That discount would exceed the maximum price or is invalid.";
  }
  return assertDealPricingPair(dealPrice, original);
}

export function buildCampaignOriginalPrice(input: {
  discountEnabled: boolean;
  dealPriceRaw: string;
  discountType: CampaignDiscountType;
  discountValueRaw: string;
}): { originalPrice: number | null; error: string | null } {
  if (!input.discountEnabled) {
    return { originalPrice: null, error: null };
  }
  const error = discountValidationMessage({
    enabled: true,
    dealPriceRaw: input.dealPriceRaw,
    discountType: input.discountType,
    discountValueRaw: input.discountValueRaw,
  });
  if (error) return { originalPrice: null, error };

  const originalPrice = computeOriginalPriceFromDiscount({
    dealPrice: Number.parseFloat(input.dealPriceRaw.trim()),
    discountType: input.discountType,
    discountValue: Number.parseFloat(input.discountValueRaw.trim()),
  });
  if (originalPrice == null) {
    return {
      originalPrice: null,
      error: "That discount does not create a valid original price.",
    };
  }
  return { originalPrice, error: null };
}

export function inferDiscountFromPrices(
  dealRaw: number | string | null | undefined,
  originalRaw: number | string | null | undefined,
): {
  enabled: boolean;
  discountType: CampaignDiscountType;
  discountValue: string;
} {
  const deal =
    typeof dealRaw === "number"
      ? dealRaw
      : typeof dealRaw === "string" && dealRaw.trim()
        ? Number.parseFloat(dealRaw)
        : NaN;
  const original =
    typeof originalRaw === "number"
      ? originalRaw
      : typeof originalRaw === "string" && originalRaw.trim()
        ? Number.parseFloat(originalRaw)
        : NaN;

  if (
    !Number.isFinite(deal) ||
    !Number.isFinite(original) ||
    !(original > deal)
  ) {
    return { enabled: false, discountType: "percent", discountValue: "" };
  }

  const percent = ((original - deal) / original) * 100;
  const percentRounded = Math.round(percent);
  const reconstructed = computeOriginalPriceFromDiscount({
    dealPrice: deal,
    discountType: "percent",
    discountValue: percentRounded,
  });

  if (
    reconstructed != null &&
    Math.abs(reconstructed - original) < 0.02 &&
    percentRounded >= 1 &&
    percentRounded <= 99
  ) {
    return {
      enabled: true,
      discountType: "percent",
      discountValue: String(percentRounded),
    };
  }

  return {
    enabled: true,
    discountType: "fixed",
    discountValue: String(roundMoney(original - deal)),
  };
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
  const textError = meaningfulTextValidationMessage(trimmed, "Description");
  if (textError) return textError;
  return null;
}
