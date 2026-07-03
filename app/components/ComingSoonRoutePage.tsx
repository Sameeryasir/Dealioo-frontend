"use client";

import { ComingSoonPanel } from "@/app/components/ComingSoonPanel";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export function ComingSoonRoutePage({
  title,
  description,
  backHref,
  backLabel,
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const params = useParams();
  const restaurantId = useMemo(
    () => parseRoutePositiveInt(params.restaurantId),
    [params.restaurantId],
  );

  const hasRestaurantParam = params?.restaurantId != null;
  if (hasRestaurantParam && restaurantId == null) {
    return <InvalidRouteMessage />;
  }

  const resolvedBackHref =
    backHref ??
    (restaurantId != null
      ? `/restaurant/${restaurantId}/dashboard`
      : "/dashboard");

  return (
    <ComingSoonPanel
      title={title}
      description={description}
      backHref={resolvedBackHref}
      backLabel={backLabel ?? "Back to dashboard"}
    />
  );
}
