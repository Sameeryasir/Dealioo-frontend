"use client";

import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { BusinessQrScannerPanel } from "@/app/components/business/BusinessQrScannerPanel";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function RestaurantScanningPage() {
  const params = useParams();
  const restaurantId = useMemo(
    () => parseRoutePositiveInt(params.restaurantId),
    [params.restaurantId],
  );

  if (restaurantId == null) {
    return <InvalidRouteMessage />;
  }

  return <BusinessQrScannerPanel restaurantId={restaurantId} />;
}
