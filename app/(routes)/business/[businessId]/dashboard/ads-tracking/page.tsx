"use client";

import { AdsTrackingPanel } from "@/app/components/business/AdsTrackingPanel";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function BusinessAdsTrackingPage() {
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  if (businessId == null) {
    return <InvalidRouteMessage />;
  }

  return (
    <section className="rd-premium rd-premium--fill" aria-label="Ads Tracking">
      <div className="rd-premium-page campaign-immersive-page">
        <article className="campaign-immersive-shell rd-premium-panel min-h-0">
          <div className="campaign-immersive-tab-panel min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            <AdsTrackingPanel businessId={businessId} />
          </div>
        </article>
      </div>
    </section>
  );
}
