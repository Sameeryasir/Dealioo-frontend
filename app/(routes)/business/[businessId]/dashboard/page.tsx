"use client";

import dynamic from "next/dynamic";
import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import { hasAuthSession, getSetupAccessToken } from "@/app/lib/auth-session";
import { businessSettingsHref } from "@/app/lib/business-settings-routes";
import { isAdminOrSuperAdminUser } from "@/app/lib/is-admin-or-super-admin-user";
import { isScannerUser } from "@/app/lib/is-scanner-user";
import { getFacebookConnectionStatus } from "@/app/services/facebook/get-facebook-connection-status";
import { Skeleton } from "@/app/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ChartColumn,
  CreditCard,
  Info,
  Link2,
  Megaphone,
  MessageSquare,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const BusinessActivityOverviewPanel = dynamic(
  () =>
    import("@/app/components/business/BusinessActivityOverviewPanel").then(
      (mod) => mod.BusinessActivityOverviewPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-2" aria-busy="true" aria-label="Loading overview">
        <Skeleton className="mb-3 h-8 w-48 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    ),
  },
);

type MissingIntegration = "stripe" | "twilio" | "facebook" | "google";

const INTEGRATION_FOCUS: Record<
  MissingIntegration,
  "stripe" | "twilio" | "meta" | "google"
> = {
  stripe: "stripe",
  twilio: "twilio",
  facebook: "meta",
  google: "google",
};

const INTEGRATION_LABEL: Record<MissingIntegration, string> = {
  stripe: "Stripe",
  twilio: "Twilio",
  facebook: "Meta (Facebook) Ads",
  google: "Google Ads",
};

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

  const activityEnabled = businessId != null && hasAuthSession();
  const metaStatusQuery = useQuery({
    queryKey: ["rd-home-facebook-status", businessId],
    enabled: activityEnabled,
    staleTime: 60_000,
    queryFn: () =>
      getFacebookConnectionStatus(getSetupAccessToken(), businessId!),
  });

  const stripeConnected = restaurant?.stripeConnected === true;
  const twilioConnected = restaurant?.twilioConnected === true;
  const metaConnected =
    restaurant?.metaConnected === true ||
    Boolean(metaStatusQuery.data?.connected);
  const googleConnected = restaurant?.googleAdsConnected === true;
  const integrationsLoading = !restaurant || metaStatusQuery.isPending;

  const missingIntegrations = useMemo(() => {
    const missing: MissingIntegration[] = [];
    if (!stripeConnected) missing.push("stripe");
    if (!twilioConnected) missing.push("twilio");
    if (!metaConnected) missing.push("facebook");
    if (!googleConnected) missing.push("google");
    return missing;
  }, [stripeConnected, twilioConnected, metaConnected, googleConnected]);

  const showIntegrationsInfo =
    businessId != null &&
    restaurant?.isOwner === true &&
    !integrationsLoading &&
    missingIntegrations.length > 0;

  if (isScannerUser()) return null;

  const integrationsHref =
    businessId != null
      ? businessSettingsHref(businessId, "integrations", {
          focus:
            missingIntegrations.length === 1
              ? INTEGRATION_FOCUS[missingIntegrations[0]]
              : undefined,
        })
      : "/dashboard/settings/integrations";

  const infoMessage = (() => {
    if (missingIntegrations.length === 0) return "";
    if (missingIntegrations.length === 1) {
      const only = missingIntegrations[0];
      if (only === "stripe") {
        return "Connect Stripe to accept funnel and campaign payments for this business.";
      }
      if (only === "twilio") {
        return "Connect a Twilio number so this business can send SMS to guests.";
      }
      if (only === "facebook") {
        return "Connect Meta (Facebook) Ads to pull ad performance into Dealioo for this business.";
      }
      return "Connect Google Ads to pull Google ad performance into Dealioo for this business.";
    }
    const labels = missingIntegrations.map((id) => INTEGRATION_LABEL[id]);
    if (labels.length === 2) {
      return `Connect ${labels[0]} and ${labels[1]} to finish setup for this business.`;
    }
    return `Connect ${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]} to finish setup for this business.`;
  })();

  return (
    <section className="rd-premium w-full" aria-label="Business dashboard">
      <div className="flex w-full flex-col gap-4 sm:gap-[1.1rem]">
        {businessId != null && canViewPerformance ? (
          <section
            className="rounded-[1.35rem] border border-[#e8edf5] bg-white px-4 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02] sm:px-5"
            aria-label="Performance"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#1877f2]/12 text-[#1877f2] ring-1 ring-[#1877f2]/20">
                  <ChartColumn className="size-4" strokeWidth={2.25} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="m-0 text-base font-semibold text-[#07111f]">
                    Performance
                  </h2>
                  <p className="m-0 mt-1 text-sm font-medium leading-relaxed text-slate-600">
                    Highest-earning campaigns, conversion, and bundle opportunities.
                  </p>
                </div>
              </div>
              <Link
                href={`/business/${businessId}/dashboard/performance`}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-4 text-sm font-semibold text-white no-underline shadow-[0_8px_20px_rgba(24,119,242,0.25)] transition hover:bg-[#166fe0]"
              >
                View Performance
                <ArrowRight className="size-4" strokeWidth={2.25} aria-hidden />
              </Link>
            </div>
          </section>
        ) : null}

        {showIntegrationsInfo ? (
          <aside
            className="flex flex-col gap-3 rounded-[1.25rem] border border-[#e8edf5] bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
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
                  {!twilioConnected ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-slate-600 ring-1 ring-[#e8edf5]">
                      <MessageSquare className="size-3.5 text-[#F22F46]" aria-hidden />
                      Twilio not connected
                    </span>
                  ) : null}
                  {!metaConnected ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-slate-600 ring-1 ring-[#e8edf5]">
                      <Megaphone className="size-3.5 text-[#1877f2]" aria-hidden />
                      Meta Ads not connected
                    </span>
                  ) : null}
                  {!googleConnected ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-slate-600 ring-1 ring-[#e8edf5]">
                      <Target className="size-3.5 text-[#4285F4]" aria-hidden />
                      Google Ads not connected
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
            businessId={businessId}
            businessName={restaurant?.name}
          />
        </section>
      </div>
    </section>
  );
}
