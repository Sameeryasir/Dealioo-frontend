export function parseCampaignPrice(
  raw: number | string | null | undefined,
): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) return raw;
  const n = Number.parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function formatCampaignPrice(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "N/A";
  if (Number.isInteger(amount)) return `$${amount}`;
  return `$${amount.toFixed(2)}`;
}

export type CampaignPricing = {
  subtotal: number | null;
  originalPrice?: number | null;
  fees: number;
  offer?: string | null;
};

export const EMPTY_CAMPAIGN_PRICING: CampaignPricing = {
  subtotal: null,
  originalPrice: null,
  fees: 0,
};

export function campaignPricingTotal(p: CampaignPricing): number | null {
  if (p.subtotal == null) return null;
  return p.subtotal + (p.fees ?? 0);
}

export function resolveDealDiscount(input: {
  price: number | string | null | undefined;
  originalPrice?: number | string | null | undefined;
}): {
  price: number | null;
  originalPrice: number | null;
  hasDiscount: boolean;
  percentOff: number | null;
} {
  const price = parseCampaignPrice(input.price);
  const originalPrice = parseCampaignPrice(input.originalPrice);
  const hasDiscount =
    price != null && originalPrice != null && originalPrice > price;
  const percentOff = hasDiscount
    ? Math.round(((originalPrice! - price!) / originalPrice!) * 100)
    : null;
  return {
    price,
    originalPrice: hasDiscount ? originalPrice : null,
    hasDiscount,
    percentOff,
  };
}
