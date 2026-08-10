"use client";

import { CampaignAdsPanel } from "@/app/components/campaign/CampaignAdsPanel";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function BusinessMetaAdsPage() {
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  if (businessId == null) {
    return <InvalidRouteMessage />;
  }

  return (
    <section className="meta-ads-page rd-premium" aria-label="Meta Ads">
      <CampaignAdsPanel businessId={businessId} />
    </section>
  );
}
