"use client";

import { isScannerUser } from "@/app/lib/is-scanner-user";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BusinessDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params?.restaurantId;

  useEffect(() => {
    if (!isScannerUser()) return;
    if (typeof restaurantId !== "string" || !/^\d+$/.test(restaurantId)) return;
    router.replace(`/restaurant/${restaurantId}/dashboard/scanning`);
  }, [restaurantId, router]);

  if (isScannerUser()) {
    return null;
  }

  return (
    <div className="p-8 md:p-10">
      <h1 className="text-2xl font-semibold tracking-tight text-black md:text-3xl">
        Welcome to your business dashboard
      </h1>
    </div>
  );
}
