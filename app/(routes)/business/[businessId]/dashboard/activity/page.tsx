"use client";

import { BusinessActivityPanel } from "@/app/components/business/BusinessActivityPanel";

import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function BusinessActivityPage() {
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  if (businessId == null) {
    return <InvalidRouteMessage />;
  }

  return <BusinessActivityPanel businessId={businessId} />;
}
