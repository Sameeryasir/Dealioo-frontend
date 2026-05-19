"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { AutomationBuilderPage } from "@/app/components/automation/AutomationBuilderPage";

function parseRestaurantId(raw: unknown): number | undefined {
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return undefined;
  const n = Number.parseInt(raw, 10);
  return n >= 1 ? n : undefined;
}

export default function RestaurantAutomationBuilderRoute() {
  const params = useParams();
  const restaurantId = useMemo(
    () => parseRestaurantId(params.restaurantId),
    [params.restaurantId],
  );
  const automationId =
    typeof params.automationId === "string" ? params.automationId : "";

  if (restaurantId == null || !automationId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-sm text-zinc-700">
        <p>Invalid link.</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block font-medium text-zinc-900 underline underline-offset-2"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <AutomationBuilderPage
      restaurantId={restaurantId}
      automationId={automationId}
    />
  );
}
