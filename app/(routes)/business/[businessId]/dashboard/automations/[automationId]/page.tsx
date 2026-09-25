"use client";

import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { Skeleton } from "@/app/components/skeleton";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { resolveAutomationNumericId } from "@/app/lib/resolve-automation-id";

const AutomationBuilderPage = dynamic(
  () =>
    import("@/app/components/automation/AutomationBuilderPage").then(
      (mod) => mod.AutomationBuilderPage,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-6" aria-busy="true" aria-label="Loading automation builder">
        <Skeleton className="mb-4 h-10 w-64 rounded-xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    ),
  },
);

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
