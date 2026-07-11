"use client";

import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { BusinessMembersPanel } from "@/app/components/business/BusinessMembersPanel";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function BusinessMembersPage() {
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  if (businessId == null) {
    return <InvalidRouteMessage />;
  }

  return <BusinessMembersPanel businessId={businessId} />;
}
