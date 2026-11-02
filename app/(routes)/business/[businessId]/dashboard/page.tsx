"use client";

import { BusinessActivityOverviewPanel } from "@/app/components/business/BusinessActivityOverviewPanel";
import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import { isAdminOrSuperAdminUser } from "@/app/lib/is-admin-or-super-admin-user";
import { isScannerUser } from "@/app/lib/is-scanner-user";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BusinessDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const businessIdParam = params?.businessId;
  const businessId =
    typeof businessIdParam === "string" && /^\d+$/.test(businessIdParam)
      ? Number(businessIdParam)
      : null;
  const [canViewPerformance, setCanViewPerformance] = useState(false);

  useEffect(() => {
    if (!isScannerUser()) return;
    if (businessId == null) return;
    router.replace(`/business/${businessId}/dashboard/scanning`);
  }, [businessId, router]);

  useEffect(() => {
    setCanViewPerformance(isAdminOrSuperAdminUser());
  }, []);

  const { data: restaurant } = useBusinessByIdQuery(businessId);

  if (isScannerUser()) return null;

  return (
    <section className="rd-premium w-full" aria-label="Business dashboard">
      <div className="flex w-full flex-col gap-4 sm:gap-[1.1rem]">
        <section aria-label="Restaurant activity overview">
          <BusinessActivityOverviewPanel
            businessId={businessId}
            businessName={restaurant?.name}
            showTopCampaigns={canViewPerformance}
          />
        </section>
      </div>
    </section>
  );
}
