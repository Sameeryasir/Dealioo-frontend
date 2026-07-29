"use client";

import { CampaignGoogleAdsPanel } from "@/app/components/campaign/CampaignGoogleAdsPanel";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function BusinessGoogleAdsPage() {
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  if (businessId == null) {
    return <InvalidRouteMessage />;
  }

  return (
    <section className="rd-premium rd-premium--fill" aria-label="Google Ads">
      <div className="rd-premium-page campaign-immersive-page">
        <article className="campaign-immersive-shell rd-premium-panel">
          <div className="campaign-immersive-tab-panel min-h-0 flex-1 overflow-y-auto">
            <CampaignGoogleAdsPanel embedded businessId={businessId} />
          </div>
        </article>
      </div>
    </section>
  );
}
