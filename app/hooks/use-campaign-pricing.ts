"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  type CampaignPricing,
  campaignPricingTotal,
  parseCampaignPrice,
  resolveDealDiscount,
} from "@/app/lib/campaign-price";
import {
  getFunnelCampaignOriginalPrice,
  getFunnelCampaignPrice,
  setFunnelCampaignOriginalPrice,
  setFunnelCampaignPrice,
} from "@/app/lib/funnel-campaign-price-storage";

export function useCampaignPricing(
  _campaignId?: number | null,
  _businessId?: number | null,
  override?: CampaignPricing | null,
): CampaignPricing {
  const searchParams = useSearchParams();

  const fromUrl = useMemo(
    () => parseCampaignPrice(searchParams.get("price")),
    [searchParams],
  );
  const originalFromUrl = useMemo(
    () => parseCampaignPrice(searchParams.get("originalPrice")),
    [searchParams],
  );

  const pricing = useMemo((): CampaignPricing => {
    if (override) return override;

    const subtotal = fromUrl ?? getFunnelCampaignPrice();
    const originalCandidate =
      originalFromUrl ?? getFunnelCampaignOriginalPrice();
    const deal = resolveDealDiscount({
      price: subtotal,
      originalPrice: originalCandidate,
    });

    return {
      subtotal: deal.price,
      originalPrice: deal.originalPrice,
      fees: 0,
    };
  }, [override, fromUrl, originalFromUrl]);

  useEffect(() => {
    if (override) return;

    const persist = fromUrl ?? getFunnelCampaignPrice();
    if (persist != null) {
      setFunnelCampaignPrice(persist);
    }

    const originalPersist =
      originalFromUrl ?? getFunnelCampaignOriginalPrice();
    const deal = resolveDealDiscount({
      price: persist,
      originalPrice: originalPersist,
    });
    setFunnelCampaignOriginalPrice(deal.originalPrice);
  }, [override, fromUrl, originalFromUrl]);

  return pricing;
}

export function useCampaignPricingWithTotal(
  campaignId: number | null | undefined,
  businessId: number | null | undefined,
  override?: CampaignPricing | null,
) {
  const pricing = useCampaignPricing(campaignId, businessId, override);
  return {
    pricing,
    total: campaignPricingTotal(pricing),
  };
}
