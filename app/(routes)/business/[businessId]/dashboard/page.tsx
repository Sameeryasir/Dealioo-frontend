"use client";

import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import { hasAuthSession } from "@/app/lib/auth-session";
import { isScannerUser } from "@/app/lib/is-scanner-user";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import { getSetupUser } from "@/app/lib/setup-user";
import { userAvatarUrl } from "@/app/lib/user-initials";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import { getRestaurantChatCustomers } from "@/app/services/chat/get-business-chat-customers";
import { fetchCampaignsByBusiness } from "@/app/services/funnel/get-campaigns-by-business";
import { getBusinessFunnelEvents } from "@/app/services/funnel-event/get-business-registrations";
import { getRedemptionStats } from "@/app/services/redemption/scan-redemption";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Building2,
  Check,
  MapPin,
  Megaphone,
  MessageSquare,
  Plus,
  ScanLine,
  ShoppingBag,
  Store,
  UserRound,
  Users,
  UtensilsCrossed,
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

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-US", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10000 ? 1 : 0,
  }).format(value);
}

function formatMoneyFromCents(cents: number, currency = "USD"): string {
  if (!Number.isFinite(cents) || cents <= 0) return "$0";
  const dollars = cents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(dollars);
  } catch {
    return `$${formatCompactNumber(Math.round(dollars))}`;
  }
}

function isSameLocalDay(iso: string, now = new Date()): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
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

  const metricsEnabled = businessId != null && hasAuthSession();

  const campaignsQuery = useQuery({
    queryKey: ["rd-home-campaigns", businessId],
    enabled: metricsEnabled,
    staleTime: 60_000,
    queryFn: () =>
      fetchCampaignsByBusiness(businessId!, { page: 1, limit: 50 }),
  });

  const redemptionQuery = useQuery({
    queryKey: ["rd-home-redemptions", businessId],
    enabled: metricsEnabled,
    staleTime: 60_000,
    queryFn: () => getRedemptionStats(businessId!),
  });

  const eventsQuery = useQuery({
    queryKey: ["rd-home-events", businessId],
    enabled: metricsEnabled,
    staleTime: 60_000,
    queryFn: () => getBusinessFunnelEvents(businessId!, 1, 50),
  });

  const guestsQuery = useQuery({
    queryKey: ["rd-home-guests", businessId],
    enabled: metricsEnabled,
    staleTime: 60_000,
    queryFn: () =>
      getRestaurantChatCustomers(businessId!, { page: 1, limit: 1 }),
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

  const campaignRows = campaignsQuery.data?.data ?? [];
  const activeCampaigns = campaignRows.filter((c) => {
    const status = (c.status ?? "").toLowerCase();
    return (
      c.published === true ||
      status === "published" ||
      status === "active" ||
      status === "live"
    );
  }).length;
  const campaignsValue =
    activeCampaigns > 0
      ? activeCampaigns
      : (campaignsQuery.data?.meta.total ?? campaignRows.length);

  const guestsTotal = guestsQuery.data?.meta.total ?? 0;
  const scansTotal =
    redemptionQuery.data?.restaurantVisits ??
    redemptionQuery.data?.couponsRedeemed ??
    0;

  const todayEvents = (eventsQuery.data?.data ?? []).filter((event) =>
    isSameLocalDay(event.createdAt),
  );
  const todayOrders = todayEvents.filter(
    (event) => event.eventType === "payment" || event.orderStatus !== "not_paid",
  ).length;
  const todayRevenueCents = todayEvents.reduce((sum, event) => {
    const online = event.onlineAmountCents ?? 0;
    const restaurantAmt = event.restaurantAmount ?? 0;
    const amount = event.amount ?? 0;
    if (online > 0) return sum + online;
    if (restaurantAmt > 0) return sum + Math.round(restaurantAmt * 100);
    if (amount > 0) return sum + Math.round(amount * 100);
    return sum;
  }, 0);
  const todayCurrency =
    todayEvents.find((e) => e.currency)?.currency?.toUpperCase() || "USD";

  const kpiStrip = [
    {
      label: "Campaigns",
      value: formatCompactNumber(campaignsValue),
      hint: activeCampaigns > 0 ? "Active" : "Total",
      href: `${baseHref}/campaigns`,
    },
    {
      label: "Members",
      value: formatCompactNumber(guestsTotal),
      hint: "Guests",
      href: `${baseHref}/members`,
    },
    {
      label: "Today's orders",
      value: formatCompactNumber(todayOrders),
      hint: "Payments",
      href: `${baseHref}/orders`,
    },
    {
      label: "QR check-ins",
      value: formatCompactNumber(scansTotal),
      hint: "Visits",
      href: `${baseHref}/scanning`,
    },
    {
      label: "Revenue",
      value: formatMoneyFromCents(todayRevenueCents, todayCurrency),
      hint: "Today",
      href: `${baseHref}/orders`,
    },
  ];

  const quickAccess = [
    {
      label: "Campaigns",
      meta: "Launch offers",
      href: `${baseHref}/campaigns`,
      icon: Megaphone,
      tone: "blue" as const,
      image: "/dashboard/shortcuts/shortcut-campaigns.png",
      mediaBg: "from-[#dbeafe] to-[#eff6ff]",
    },
    {
      label: "Members",
      meta: "Your guests",
      href: `${baseHref}/members`,
      icon: Users,
      tone: "pink" as const,
      image: "/dashboard/shortcuts/shortcut-members.png",
      mediaBg: "from-[#fce7f3] to-[#fdf2f8]",
    },
    {
      label: "Scanning",
      meta: "Check-ins",
      href: `${baseHref}/scanning`,
      icon: ScanLine,
      tone: "green" as const,
      image: "/dashboard/shortcuts/shortcut-scanning.png",
      mediaBg: "from-[#dcfce7] to-[#f0fdf4]",
    },
    {
      label: hasMenu ? "Menu is live" : "Upload menu",
      meta: hasMenu ? "Ready for guests" : "Finish setup",
      href: hasMenu
        ? `${baseHref}/ad-library`
        : businessId != null
          ? `/business/upload-menu?businessId=${businessId}`
          : "/business/upload-menu",
      icon: UtensilsCrossed,
      tone: "amber" as const,
      image: "/dashboard/shortcuts/shortcut-menu.png",
      mediaBg: "from-[#ffedd5] to-[#fff7ed]",
    },
    {
      label: "Orders",
      meta: "Incoming tickets",
      href: `${baseHref}/orders`,
      icon: ShoppingBag,
      tone: "blue" as const,
      image: "/dashboard/shortcuts/shortcut-orders.png",
      mediaBg: "from-[#dbeafe] to-[#eff6ff]",
    },
    {
      label: "Chats",
      meta: "Reply to guests",
      href: `${baseHref}/chats`,
      icon: MessageSquare,
      tone: "pink" as const,
      image: "/dashboard/shortcuts/shortcut-chats.png",
      mediaBg: "from-[#fce7f3] to-[#fdf2f8]",
    },
  ];

  return (
    <section
      className="rd-premium rd-premium--fill"
      aria-label="Business dashboard"
    >
      <div className="flex h-full min-h-0 flex-1 flex-col gap-4 sm:gap-[1.1rem]">
        {/* Top row: compact Overview + Setup Progress */}
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

        {/* KPI strip — full width under the top row */}
        <section
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 sm:gap-2.5"
          aria-label="Live business metrics"
        >
          {kpiStrip.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex flex-col items-center justify-center rounded-[1.1rem] border border-[#e8edf5] bg-white px-3.5 py-3 text-center no-underline shadow-[0_6px_18px_rgba(15,23,42,0.03)] transition duration-200 hover:-translate-y-[3px] hover:border-[#1877f2]/45 hover:shadow-[0_14px_32px_rgba(24,119,242,0.14)]"
            >
              <p className="m-0 w-full truncate text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-600 transition group-hover:text-[#1877f2]">
                {item.label}
              </p>
              <p className="mt-1 mb-0 w-full truncate text-[1.2rem] font-extrabold tracking-tight text-black transition group-hover:text-[#1877f2]">
                {item.value}
              </p>
              <p className="mt-0.5 mb-0 w-full truncate text-[0.72rem] font-medium text-slate-500">
                {item.hint}
              </p>
            </Link>
          ))}
        </section>

        <section
          className="rd-premium-section mt-auto flex min-h-0 flex-1 flex-col pb-4 sm:mt-3 xl:flex-none"
          aria-label="Quick access"
        >
          <div className="rd-premium-section-head">
            <h2>Quick access</h2>
            <Link href={`${baseHref}/activity`}>See activity</Link>
          </div>
          <ul className="m-0 grid min-h-[8rem] flex-1 list-none auto-rows-fr grid-cols-2 gap-3 p-0 sm:grid-cols-3 sm:gap-3.5 xl:min-h-0 xl:flex-none xl:auto-rows-auto xl:grid-cols-6">
            {quickAccess.map((card) => {
              const Icon = card.icon;
              const badgeTone =
                card.tone === "blue"
                  ? "bg-[#1877f2] text-white"
                  : card.tone === "pink"
                    ? "bg-[#e1306c] text-white"
                    : card.tone === "green"
                      ? "bg-[#34a853] text-white"
                      : "bg-[#f77737] text-white";
              const ringTone =
                card.tone === "blue"
                  ? "group-hover:ring-[#1877f2]/25"
                  : card.tone === "pink"
                    ? "group-hover:ring-[#e1306c]/25"
                    : card.tone === "green"
                      ? "group-hover:ring-[#34a853]/25"
                      : "group-hover:ring-[#f77737]/25";
              return (
                <li key={card.label} className="flex min-h-0 xl:items-start">
                  <Link
                    href={card.href}
                    className={`group relative flex h-full min-h-[8.25rem] w-full flex-col overflow-hidden rounded-[1.2rem] border border-[#e8edf5] bg-white no-underline shadow-[0_8px_22px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02] transition duration-300 hover:-translate-y-[2px] hover:border-[#1877f2]/35 hover:shadow-[0_14px_32px_rgba(24,119,242,0.12)] xl:h-auto xl:min-h-0 ${ringTone}`}
                  >
                    <span
                      className={`relative flex shrink-0 items-end justify-center overflow-hidden bg-gradient-to-br ${card.mediaBg} px-3.5 pt-2.5 pb-1 min-h-[5.25rem] sm:min-h-[5.5rem] xl:min-h-[6.5rem] xl:px-4 xl:pt-3 xl:pb-1.5 2xl:min-h-[7rem] 2xl:px-4 2xl:pt-3.5`}
                      aria-hidden
                    >
                      <span
                        className="pointer-events-none absolute -right-4 -top-6 size-16 rounded-full bg-white/50 blur-xl xl:size-20"
                        aria-hidden
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.image}
                        alt=""
                        className="relative z-[1] h-[4.15rem] w-auto max-w-[96%] object-contain transition duration-300 group-hover:scale-[1.05] sm:h-[4.65rem] xl:h-[5.25rem] 2xl:h-[5.75rem]"
                      />
                      <span
                        className={`absolute bottom-2.5 right-2.5 z-[2] inline-flex size-7 items-center justify-center rounded-xl border-2 border-white shadow-[0_3px_8px_rgba(15,23,42,0.14)] xl:bottom-3 xl:right-3 xl:size-8 2xl:size-9 ${badgeTone}`}
                      >
                        <Icon className="size-3 xl:size-3.5 2xl:size-4" strokeWidth={2.35} />
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-2.5 border-t border-[#eef2f7] px-3 py-2 sm:gap-3 sm:px-3.5 sm:py-2.5 xl:px-4 xl:py-3 2xl:gap-3.5 2xl:px-4 2xl:py-3.5">
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5 xl:gap-1">
                        <span className="truncate text-[0.88rem] font-extrabold leading-tight tracking-tight text-black transition group-hover:text-[#0f5ed7] sm:text-[0.94rem] xl:text-[1rem] 2xl:text-[1.05rem]">
                          {card.label}
                        </span>
                        <span className="truncate text-[0.7rem] font-medium text-slate-500 sm:text-[0.74rem] xl:text-[0.8rem] 2xl:text-[0.84rem]">
                          {card.meta}
                        </span>
                      </span>

                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[#e8edf5] bg-[#f8fafc] text-[#1877f2] transition duration-300 group-hover:border-[#1877f2] group-hover:bg-[#1877f2] group-hover:text-white xl:size-9 2xl:size-10">
                        <ArrowUpRight className="size-3.5 xl:size-4" strokeWidth={2.35} />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </section>
  );
}
