"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useCampaignsByRestaurantQuery } from "@/app/hooks/use-campaigns-by-restaurant-query";

export function useCampaignPricing(
  campaignId: number | null | undefined,
  restaurantId: number | null | undefined,
  override?: CampaignPricing | null,
): CampaignPricing {
  const searchParams = useSearchParams();
  const [loaded, setLoaded] = useState<CampaignPricing | null>(null);

  const { data: campaigns } = useCampaignsByRestaurantQuery(
    override ? null : restaurantId,
  );

  const fromUrl = useMemo(
    () => parseCampaignPrice(searchParams.get("price")),
    [searchParams],
  );

  useEffect(() => {
    if (override) return;

    const urlPrice = fromUrl;
    if (urlPrice != null) {
      setFunnelCampaignPrice(urlPrice);
      setLoaded({ subtotal: urlPrice, fees: 0 });
      return;
    }

    const stored = getFunnelCampaignPrice();
    if (stored != null) {
      setLoaded({ subtotal: stored, fees: 0 });
    }

    if (campaignId == null || restaurantId == null) return;

    const campaign = campaigns.find((c) => c.id === campaignId);
    const subtotal = parseCampaignPrice(campaign?.price);
    if (subtotal == null) return;

    setFunnelCampaignPrice(subtotal);
    setLoaded({
      subtotal,
      fees: 0,
      offer: campaign?.offer?.trim() || null,
    });
  }, [campaignId, restaurantId, fromUrl, override, campaigns]);

  if (override) return override;

  return (
    loaded ?? {
      subtotal: fromUrl ?? getFunnelCampaignPrice(),
      fees: 0,
    }
  );
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
