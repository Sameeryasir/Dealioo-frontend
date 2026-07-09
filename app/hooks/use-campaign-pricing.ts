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
import { useCampaignsByBusinessQuery } from "@/app/hooks/use-campaigns-by-business-query";

export function useCampaignPricing(
  campaignId: number | null | undefined,
  restaurantId: number | null | undefined,
  override?: CampaignPricing | null,
): CampaignPricing {
  const searchParams = useSearchParams();

  const { data: campaigns } = useCampaignsByBusinessQuery(
    override ? null : restaurantId,
  );

  const fromUrl = useMemo(
    () => parseCampaignPrice(searchParams.get("price")),
    [searchParams],
  );

  const campaignSubtotal = useMemo(() => {
    if (campaignId == null) return null;
    const campaign = campaigns.find((c) => c.id === campaignId);
    return parseCampaignPrice(campaign?.price);
  }, [campaignId, campaigns]);

  const campaignOffer = useMemo(() => {
    if (campaignId == null) return null;
    const campaign = campaigns.find((c) => c.id === campaignId);
    return campaign?.offer?.trim() || null;
  }, [campaignId, campaigns]);

  const pricing = useMemo((): CampaignPricing => {
    if (override) return override;

    if (fromUrl != null) {
      return { subtotal: fromUrl, fees: 0 };
    }

    if (campaignSubtotal != null) {
      return {
        subtotal: campaignSubtotal,
        fees: 0,
        offer: campaignOffer,
      };
    }

    return {
      subtotal: getFunnelCampaignPrice(),
      fees: 0,
    };
  }, [override, fromUrl, campaignSubtotal, campaignOffer]);

  useEffect(() => {
    if (override) return;

    const persist = fromUrl ?? campaignSubtotal ?? getFunnelCampaignPrice();
    if (persist != null) {
      setFunnelCampaignPrice(persist);
    }
  }, [override, fromUrl, campaignSubtotal]);

  return pricing;
}

export function useCampaignPricingWithTotal(
  campaignId: number | null | undefined,
  restaurantId: number | null | undefined,
  override?: CampaignPricing | null,
) {
  const pricing = useCampaignPricing(campaignId, restaurantId, override);
  return {
    pricing,
    total: campaignPricingTotal(pricing),
  };
}
