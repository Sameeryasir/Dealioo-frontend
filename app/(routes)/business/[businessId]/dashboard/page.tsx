"use client";

import { BusinessActivityOverviewPanel } from "@/app/components/business/BusinessActivityOverviewPanel";
import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import { hasAuthSession } from "@/app/lib/auth-session";
import { isScannerUser } from "@/app/lib/is-scanner-user";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import { getRestaurantActivityMonthly } from "@/app/services/activity/get-business-activity";
import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, Store } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

function formatLocation(
  city?: string | null,
  state?: string | null,
  country?: string | null,
): string {
  const raw = [city, state, country]
    .flatMap((part) => (part ?? "").split(","))
    .map((p) => p.trim())
    .filter(Boolean);
  const unique: string[] = [];
  for (const part of raw) {
    const key = part.toLowerCase();
    if (!unique.some((u) => u.toLowerCase() === key)) unique.push(part);
  }
  if (unique.length >= 3) return `${unique[0]}, ${unique[1]}`;
  return unique.join(", ");
}

function formatTitleCase(value: string): string {
  return value
    .trim()
    .split(/[\s/_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

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

  const { data: restaurant, isPending } = useBusinessByIdQuery(businessId);

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

  const name = formatTitleCase(restaurant?.name?.trim() || "Your business");
  const location = formatLocation(
    restaurant?.city,
    restaurant?.state,
    restaurant?.country,
  );
  const branchCount = restaurant?.branchCount ?? 0;
  const logoSrc = resolveUploadImageUrl(restaurant?.logoUrl ?? null);

  const activityData = activityChartQuery.data;

  return (
    <section
      className="rd-premium rd-premium--fill"
      aria-label="Business dashboard"
    >
      <div className="flex h-full min-h-0 flex-1 flex-col gap-4 sm:gap-[1.1rem]">
        <article className="rd-premium-hero relative h-full overflow-hidden md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(12.5rem,0.95fr)] md:items-stretch md:gap-0">
            <span
              className="pointer-events-none absolute top-[-15%] right-[22%] z-0 hidden size-32 rounded-full bg-[#1877f2]/40 blur-2xl md:block"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute bottom-[-20%] left-[30%] z-0 size-28 rounded-full bg-[#e1306c]/30 blur-2xl"
              aria-hidden
            />

            <div className="relative z-[1] flex h-full min-w-0 flex-col py-3 pl-6 pr-2 sm:py-4 sm:pl-8 sm:pr-2 md:pl-10 md:pr-1 lg:pl-11">
              <div className="flex min-h-0 flex-1 flex-col justify-center">
                <div className="flex flex-col gap-1 sm:gap-1.5">
                  <span className="inline-flex w-fit items-center rounded-full bg-sky-400/15 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-sky-200 ring-1 ring-sky-300/25 sm:text-[0.72rem]">
                    Overview
                  </span>
                  <h1 className="m-0 text-[clamp(1.45rem,2.4vw,1.9rem)] font-extrabold leading-tight tracking-tight text-white">
                    {isPending ? "Loading…" : name}
                  </h1>
                  <p className="m-0 max-w-[40ch] text-[0.875rem] font-medium leading-snug text-slate-300/90 sm:text-[0.95rem]">
                    Run campaigns, manage members, track check-ins and grow
                    customer loyalty.
                  </p>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-white/10 px-2.5 py-1 text-[0.68rem] font-semibold text-slate-100 ring-1 ring-white/10">
                    <MapPin className="size-3 shrink-0 opacity-80" strokeWidth={2.25} />
                    <span className="truncate">{location || "Add location"}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[0.68rem] font-semibold text-slate-100 ring-1 ring-white/10">
                    <Building2 className="size-3 shrink-0 opacity-80" strokeWidth={2.25} />
                    {branchCount} {branchCount === 1 ? "branch" : "branches"}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="relative z-[1] hidden self-stretch py-3 pr-3 pl-1 md:block md:pl-0"
              aria-hidden
            >
              <div className="relative h-full min-h-[10.5rem] w-full overflow-hidden rounded-[1.1rem] border border-white/20 bg-white/10 shadow-[0_14px_32px_rgba(0,0,0,0.3)]">
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoSrc}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                ) : (
                  <div className="flex h-full min-h-[10.5rem] w-full items-center justify-center">
                    <Store className="size-8 text-white/90" strokeWidth={1.75} />
                  </div>
                )}
              </div>
            </div>
        </article>

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
