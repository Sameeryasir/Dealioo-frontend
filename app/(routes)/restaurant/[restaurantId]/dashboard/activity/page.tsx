"use client";

import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { RestaurantActivityPanel } from "@/app/components/restaurant/RestaurantActivityPanel";
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

  return <RestaurantActivityPanel restaurantId={restaurantId} />;
}
