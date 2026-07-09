"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { AutomationListPage } from "@/app/components/automation/AutomationListPage";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";

export default function BusinessAutomationsPage() {
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  if (businessId == null) {
    return <InvalidRouteMessage />;
  }

  return <AutomationListPage />;
}
