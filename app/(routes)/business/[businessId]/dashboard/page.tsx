"use client";

/**
 * Change: Info banner above Business Performance when Stripe/Meta not connected.
 * Why: Guide owners to finish Integrations so payments and ads data can work.
 * Related: BusinessSettingsPanel integrations, businessSettingsHref
 */

import { BusinessActivityOverviewPanel } from "@/app/components/business/BusinessActivityOverviewPanel";
import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import { hasAuthSession, getSetupAccessToken } from "@/app/lib/auth-session";
import { businessSettingsHref } from "@/app/lib/business-settings-routes";
import { isScannerUser } from "@/app/lib/is-scanner-user";
import { getRestaurantActivityMonthly } from "@/app/services/activity/get-business-activity";
import { getFacebookConnectionStatus } from "@/app/services/facebook/get-facebook-connection-status";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Info, Link2, Megaphone } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

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

  const metaStatusQuery = useQuery({
    queryKey: ["rd-home-facebook-status", businessId],
    enabled: activityEnabled,
    staleTime: 60_000,
    queryFn: () =>
      getFacebookConnectionStatus(getSetupAccessToken(), businessId!),
  });

  const stripeConnected = Boolean(restaurant?.stripeAccountId?.trim());
  const metaConnected = Boolean(metaStatusQuery.data?.connected);
  const integrationsLoading =
    !restaurant || metaStatusQuery.isPending;

  const missingIntegrations = useMemo(() => {
    const missing: Array<"stripe" | "facebook"> = [];
    if (!stripeConnected) missing.push("stripe");
    if (!metaConnected) missing.push("facebook");
    return missing;
  }, [stripeConnected, metaConnected]);

  const showIntegrationsInfo =
    businessId != null && !integrationsLoading && missingIntegrations.length > 0;

  if (isScannerUser()) return null;

  const activityData = activityChartQuery.data;
  const integrationsHref =
    businessId != null
      ? businessSettingsHref(businessId, "integrations")
      : "/dashboard/settings/integrations";

  const infoMessage =
    missingIntegrations.length === 2
      ? "Connect Stripe and your Meta (Facebook) Ads account to accept payments and see ad performance for this business."
      : missingIntegrations[0] === "stripe"
        ? "Connect Stripe to accept funnel and campaign payments for this business."
        : "Connect Meta (Facebook) Ads to pull ad performance into Dealioo for this business.";

  return (
    <section className="rd-premium w-full" aria-label="Business dashboard">
      <div className="flex w-full flex-col gap-4 sm:gap-[1.1rem]">
        {showIntegrationsInfo ? (
          <aside
            className="flex flex-col gap-3 rounded-[1.25rem] border border-[#bfdbfe] bg-gradient-to-r from-[#eff6ff] via-[#f8faff] to-[#fdf2f8] px-4 py-3.5 shadow-[0_10px_28px_rgba(24,119,242,0.08)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
            role="status"
            aria-label="Integrations needed"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#1877f2]/12 text-[#1877f2] ring-1 ring-[#1877f2]/20">
                <Info className="size-4" strokeWidth={2.25} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#1877f2]">
                  Continue setup
                </p>
                <p className="m-0 mt-1 text-sm font-medium leading-relaxed text-slate-700">
                  {infoMessage}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {!stripeConnected ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-slate-600 ring-1 ring-[#e8edf5]">
                      <CreditCard className="size-3.5 text-[#635BFF]" aria-hidden />
                      Stripe not connected
                    </span>
                  ) : null}
                  {!metaConnected ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-slate-600 ring-1 ring-[#e8edf5]">
                      <Megaphone className="size-3.5 text-[#1877f2]" aria-hidden />
                      Meta Ads not connected
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <Link
              href={integrationsHref}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(24,119,242,0.25)] transition hover:bg-[#166fe0]"
            >
              <Link2 className="size-4" strokeWidth={2.25} aria-hidden />
              Open Integrations
            </Link>
          </aside>
        ) : null}

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
