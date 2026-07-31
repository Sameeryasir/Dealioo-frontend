"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  type CampaignPricing,
  campaignPricingTotal,
  parseCampaignPrice,
} from "@/app/lib/campaign-price";
import {
  getFunnelCampaignPrice,
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

  const pricing = useMemo((): CampaignPricing => {
    if (override) return override;

    if (fromUrl != null) {
      return { subtotal: fromUrl, fees: 0 };
    }

    return {
      subtotal: getFunnelCampaignPrice(),
      fees: 0,
    };
  }, [override, fromUrl]);

  useEffect(() => {
    if (override) return;

    const persist = fromUrl ?? getFunnelCampaignPrice();
    if (persist != null) {
      setFunnelCampaignPrice(persist);
    }
  }, [override, fromUrl]);

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
