"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { AutomationListPage } from "@/app/components/automation/AutomationListPage";

function parseId(raw: unknown): number | undefined {
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return undefined;
  const n = Number.parseInt(raw, 10);
  return n >= 1 ? n : undefined;
}

export default function RestaurantAutomationsPage() {
  const params = useParams();
  const restaurantId = useMemo(
    () => parseId(params.restaurantId),
    [params.restaurantId],
  );

  if (restaurantId == null) {
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

  return <AutomationListPage />;
}
