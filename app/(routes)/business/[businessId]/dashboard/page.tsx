"use client";

import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import { hasAuthSession } from "@/app/lib/auth-session";
import { isScannerUser } from "@/app/lib/is-scanner-user";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import { getSetupUser } from "@/app/lib/setup-user";
import { userAvatarUrl } from "@/app/lib/user-initials";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import { getRestaurantActivityMonthly } from "@/app/services/activity/get-business-activity";
import { BusinessActivityOverviewPanel } from "@/app/components/business/BusinessActivityOverviewPanel";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Building2,
  Check,
  MapPin,
  Plus,
  Store,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

function AvatarStatusRing({
  percent,
  ownerAvatarUrl,
  ownerInitial,
  size = 96,
}: {
  percent: number;
  ownerAvatarUrl: string | null;
  ownerInitial: string | null;
  size?: number;
}) {
  const stroke = size >= 120 ? 8 : 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const avatarPx = size - stroke * 2 - 2;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c - (clamped / 100) * c;
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = Boolean(ownerAvatarUrl) && !imageFailed;
  const initialSize =
    size >= 120 ? "text-[1.75rem]" : size >= 100 ? "text-[1.35rem]" : "text-[1.15rem]";

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e8edf5"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#rdAvatarRing)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="rdAvatarRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1877f2" />
            <stop offset="100%" stopColor="#e1306c" />
          </linearGradient>
        </defs>
      </svg>

      <div
        className="absolute left-1/2 top-1/2 z-[1] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#eef2f7]"
        style={{ width: avatarPx, height: avatarPx }}
      >
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ownerAvatarUrl!}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : ownerInitial ? (
          <span
            className={`${initialSize} font-extrabold tracking-tight text-[#1877f2]`}
          >
            {ownerInitial}
          </span>
        ) : (
          <UserRound className="size-6 text-[#1877f2]" strokeWidth={1.75} />
        )}
      </div>

      <span className="absolute -top-0.5 -right-0.5 z-[2] rounded-full bg-[#1877f2] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-[0_6px_14px_rgba(24,119,242,0.35)]">
        {clamped}%
      </span>
    </div>
  );
}

export default function BusinessDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const [owner, setOwner] = useState<VerifyOtpUser | null>(null);
  const businessIdParam = params?.businessId;
  const businessId =
    typeof businessIdParam === "string" && /^\d+$/.test(businessIdParam)
      ? Number(businessIdParam)
      : null;

  useEffect(() => {
    queueMicrotask(() => {
      setOwner(getSetupUser());
    });
  }, []);

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

  const baseHref = useMemo(
    () =>
      businessId != null
        ? `/business/${businessId}/dashboard`
        : "/dashboard",
    [businessId],
  );

  if (isScannerUser()) return null;

  const name = formatTitleCase(restaurant?.name?.trim() || "Your business");
  const cuisine = formatTitleCase(
    restaurant?.cuisineType?.trim() || "Business",
  );
  const location = formatLocation(
    restaurant?.city,
    restaurant?.state,
    restaurant?.country,
  );
  const branchCount = restaurant?.branchCount ?? 0;
  const logoSrc = resolveUploadImageUrl(restaurant?.logoUrl ?? null);
  const hasLocation = Boolean(location);
  const hasMenu = Boolean(restaurant?.menu?.length);

  const ownerAvatar = userAvatarUrl(owner);
  const ownerInitial = owner?.name?.trim()
    ? owner.name.trim().charAt(0).toUpperCase()
    : null;

  let score = 0;
  if (hasLocation) score += 34;
  if (branchCount > 0) score += 33;
  if (hasMenu || restaurant?.cuisineType?.trim()) score += 33;
  const readyPercent = Math.min(100, score);

  return (
    <section
      className="rd-premium rd-premium--fill"
      aria-label="Business dashboard"
    >
      <div className="flex h-full min-h-0 flex-1 flex-col gap-4 sm:gap-[1.1rem]">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(14.5rem,16.5rem)] lg:items-stretch lg:gap-4">
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
                  <span className="inline-flex items-center rounded-full bg-[#1877f2]/30 px-2.5 py-1 text-[0.68rem] font-bold text-sky-100 ring-1 ring-[#1877f2]/35">
                    {cuisine}
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <Link
                  href={`${baseHref}/campaigns`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[0.8rem] font-bold text-[#07111f] no-underline shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition hover:bg-[#f8faff]"
                >
                  <Plus className="size-3.5" strokeWidth={2.5} aria-hidden />
                  New campaign
                  <ArrowUpRight className="size-3.5" strokeWidth={2.25} />
                </Link>
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

          <aside className="min-w-0" aria-label="Setup progress">
            <article className="relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-gradient-to-b from-white via-white to-[#f4f8ff] px-3.5 py-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]">
              <span
                className="pointer-events-none absolute -top-8 left-1/2 size-28 -translate-x-1/2 rounded-full bg-[#1877f2]/10 blur-3xl"
                aria-hidden
              />

              <p className="relative m-0 text-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">
                Setup Progress
              </p>

              <div className="relative mt-2 flex flex-1 flex-col items-center justify-center">
                <AvatarStatusRing
                  percent={readyPercent}
                  ownerAvatarUrl={ownerAvatar}
                  ownerInitial={ownerInitial}
                  size={88}
                />

                <h2 className="mt-2 mb-0 text-center text-[0.95rem] font-extrabold tracking-tight text-black">
                  {readyPercent >= 100
                    ? "Ready to grow"
                    : `${readyPercent}% set up`}
                </h2>
              </div>

              <ul
                className="relative mt-2.5 mb-0 flex list-none flex-col gap-1 p-0"
                aria-label="Setup checklist"
              >
                {[
                  { label: "Location", ok: hasLocation },
                  { label: "Branch", ok: branchCount > 0 },
                  { label: "Menu", ok: hasMenu },
                ].map((item) => (
                  <li
                    key={item.label}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[0.75rem] font-semibold ${
                      item.ok
                        ? "bg-[#f0fdf4] text-black"
                        : "bg-[#f4f7fb] text-slate-400"
                    }`}
                  >
                    <span
                      className={`inline-flex size-4 shrink-0 items-center justify-center rounded-full ${
                        item.ok
                          ? "bg-[#34a853] text-white"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      <Check className="size-2.5" strokeWidth={2.75} aria-hidden />
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </article>
          </aside>
        </div>

        <section aria-label="Restaurant activity overview">
          <BusinessActivityOverviewPanel
            businessName={restaurant?.name}
            data={activityChartQuery.data?.data ?? []}
            months={activityChartQuery.data?.months ?? activityMonths}
            activeCampaigns={activityChartQuery.data?.activeCampaigns ?? 0}
            totalOrders={activityChartQuery.data?.totalOrders ?? 0}
            totalMembers={activityChartQuery.data?.totalMembers ?? 0}
            todayRevenueCents={activityChartQuery.data?.todayRevenueCents ?? 0}
            isLoading={activityChartQuery.isPending}
          />
        </section>
      </div>
    </section>
  );
}
