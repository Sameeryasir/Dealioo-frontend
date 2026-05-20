"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { AutomationListPage } from "@/app/components/automation/AutomationListPage";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";

export default function RestaurantAutomationsPage() {
  const params = useParams();
  const restaurantId = useMemo(
    () => parseRoutePositiveInt(params.restaurantId),
    [params.restaurantId],
  );

  if (restaurantId == null) {
    return <InvalidRouteMessage />;
  }

  return <AutomationListPage />;
}
