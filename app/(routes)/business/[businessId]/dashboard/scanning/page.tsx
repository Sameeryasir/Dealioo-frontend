"use client";

import { BusinessQrScannerPanel } from "@/app/components/business/BusinessQrScannerPanel";

import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function BusinessScanningPage() {
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  if (businessId == null) {
    return <InvalidRouteMessage />;
  }

  return <BusinessQrScannerPanel businessId={businessId} />;
}
