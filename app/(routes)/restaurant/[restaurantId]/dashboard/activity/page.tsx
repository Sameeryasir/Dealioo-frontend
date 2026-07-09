"use client";

import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { BusinessActivityPanel } from "@/app/components/business/BusinessActivityPanel";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function RestaurantActivityPage() {
  const params = useParams();
  const restaurantId = useMemo(
    () => parseRoutePositiveInt(params.restaurantId),
    [params.restaurantId],
  );

  if (restaurantId == null) {
    return <InvalidRouteMessage />;
  }

  return <BusinessActivityPanel restaurantId={restaurantId} />;
}
