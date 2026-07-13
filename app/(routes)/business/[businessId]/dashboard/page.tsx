"use client";

import { BusinessActivityOverviewPanel } from "@/app/components/business/BusinessActivityOverviewPanel";
import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import { hasAuthSession } from "@/app/lib/auth-session";
import { isScannerUser } from "@/app/lib/is-scanner-user";
import { getRestaurantActivityMonthly } from "@/app/services/activity/get-business-activity";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BusinessDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const businessIdParam = params?.businessId;
  const businessId =
    typeof businessIdParam === "string" && /^\d+$/.test(businessIdParam)
      ? Number(businessIdParam)
      : null;

  useEffect(() => {
    if (!isScannerUser()) return;
    if (businessId == null) return;
    router.replace(`/business/${businessId}/dashboard/scanning`);
  }, [businessId, router]);

  const { data: restaurant } = useBusinessByIdQuery(businessId);

  const activityEnabled = businessId != null && hasAuthSession();
  const activityMonths = 6;

  const activityChartQuery = useQuery({
    queryKey: ["rd-home-activity-monthly", businessId, activityMonths],
    enabled: activityEnabled,
    staleTime: 60_000,
    queryFn: () =>
      getRestaurantActivityMonthly(businessId!, { months: activityMonths }),
  });

  if (isScannerUser()) return null;

  const activityData = activityChartQuery.data;

  return (
    <section className="rd-premium w-full" aria-label="Business dashboard">
      <div className="flex w-full flex-col gap-4 sm:gap-[1.1rem]">
        <section aria-label="Restaurant activity overview">
          <BusinessActivityOverviewPanel
            businessName={restaurant?.name}
            data={activityData?.data ?? []}
            months={activityData?.months ?? activityMonths}
            activeCampaigns={activityData?.activeCampaigns ?? 0}
            totalOrders={activityData?.totalOrders ?? 0}
            totalMembers={activityData?.totalMembers ?? 0}
            todayRevenueCents={activityData?.todayRevenueCents ?? 0}
            isLoading={activityChartQuery.isPending}
          />
        </section>
      </div>
    </section>
  );
}
