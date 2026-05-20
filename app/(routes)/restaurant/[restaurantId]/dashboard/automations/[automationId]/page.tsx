"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { AutomationBuilderPage } from "@/app/components/automation/AutomationBuilderPage";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { resolveAutomationNumericId } from "@/app/lib/resolve-automation-id";

export default function RestaurantAutomationBuilderRoute() {
  const params = useParams();
  const searchParams = useSearchParams();
  const funnelId = useMemo(
    () => parseRoutePositiveInt(searchParams.get("funnelId")),
    [searchParams],
  );
  const restaurantId = useMemo(
    () => parseRoutePositiveInt(params.restaurantId),
    [params.restaurantId],
  );
  const automationId =
    typeof params.automationId === "string" ? params.automationId : "";

  if (restaurantId == null || !automationId) {
    return <InvalidRouteMessage />;
  }

  const automationNumericId = resolveAutomationNumericId(automationId);

  return (
    <AutomationBuilderPage
      restaurantId={restaurantId}
      automationId={automationId}
      automationNumericId={automationNumericId}
      funnelId={funnelId}
    />
  );
}
