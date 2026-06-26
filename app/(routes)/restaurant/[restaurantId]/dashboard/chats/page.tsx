"use client";

import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { RestaurantChatsPanel } from "@/app/components/restaurant/RestaurantChatsPanel";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function RestaurantChatsPage() {
  const params = useParams();
  const restaurantId = useMemo(
    () => parseRoutePositiveInt(params.restaurantId),
    [params.restaurantId],
  );

  if (restaurantId == null) {
    return <InvalidRouteMessage />;
  }

  return <RestaurantChatsPanel restaurantId={restaurantId} />;
}
