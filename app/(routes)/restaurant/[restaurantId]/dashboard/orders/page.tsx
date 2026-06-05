"use client";

import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { RestaurantOrdersPanel } from "@/app/components/restaurant/RestaurantOrdersPanel";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function RestaurantOrdersPage() {
  const params = useParams();
  const restaurantId = useMemo(
    () => parseRoutePositiveInt(params.restaurantId),
    [params.restaurantId],
  );

  if (restaurantId == null) {
    return <InvalidRouteMessage />;
  }

  return <RestaurantOrdersPanel restaurantId={restaurantId} />;
}
