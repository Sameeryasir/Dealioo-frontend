"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { AutomationBuilderPage } from "@/app/components/automation/AutomationBuilderPage";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { resolveAutomationNumericId } from "@/app/lib/resolve-automation-id";

export default function BusinessAutomationBuilderRoute() {
  const params = useParams();
  const searchParams = useSearchParams();
  const funnelId = useMemo(
    () => parseRoutePositiveInt(searchParams.get("funnelId")),
    [searchParams],
  );
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );
  const automationId =
    typeof params.automationId === "string" ? params.automationId : "";

  if (businessId == null || !automationId) {
    return <InvalidRouteMessage />;
  }

  const automationNumericId = resolveAutomationNumericId(automationId);

  return (
    <AutomationBuilderPage
      businessId={businessId}
      automationId={automationId}
      automationNumericId={automationNumericId}
      funnelId={funnelId}
    />
  );
}
