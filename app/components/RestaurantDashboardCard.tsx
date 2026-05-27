"use client";

import type { AdminRestaurant } from "@/app/services/restaurant/get-my-restaurant";
import {
  ArrowUpRight,
  Building2,
  MapPin,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";

const CARD_HEIGHT_CLASS = "h-[23.75rem]";

type Props = {
  restaurant: AdminRestaurant;
};

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex h-[3.75rem] flex-col rounded-xl bg-zinc-50/90 p-2.5 ring-1 ring-zinc-950/[0.04]">
      <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        <Icon className="size-3 shrink-0" strokeWidth={2.25} aria-hidden />
        {label}
      </div>
      <p className="mt-1 line-clamp-2 min-h-0 flex-1 text-xs font-medium leading-snug text-zinc-800">
        {value}
      </p>
    </div>
  );
}

export default function RestaurantDashboardCard({ restaurant }: Props) {
  const {
    name,
    description,
    branchCount,
    city,
    state,
    country,
    logoUrl,
    cuisineType,
  } = restaurant;

  const location = [city, state, country].filter(Boolean).join(", ");
  const logoSrc = logoUrl?.trim() ?? "";
  const dashboardHref =
    typeof restaurant.id === "number" && restaurant.id >= 1
      ? `/restaurant/${restaurant.id}/dashboard`
      : "/dashboard";

  const cuisine = cuisineType?.trim();
  const branchLabel =
    branchCount != null
      ? `${branchCount} ${branchCount === 1 ? "branch" : "branches"}`
      : "—";

  const descriptionText = description?.trim() ?? "";

  return (
    <Link
      href={dashboardHref}
      className={`group block ${CARD_HEIGHT_CLASS} outline-none focus-visible:rounded-[1.25rem] focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-2`}
    >
      <article
        className={`relative flex ${CARD_HEIGHT_CLASS} flex-col overflow-hidden rounded-[1.25rem] bg-zinc-100 shadow-[0_8px_30px_rgba(15,23,42,0.08)] ring-1 ring-zinc-950/[0.06] transition duration-500 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(15,23,42,0.14)]`}
      >
        <div className="relative h-36 shrink-0 overflow-hidden sm:h-40">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote restaurant logos vary by host
            <img
              src={logoSrc}
              alt=""
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300"
              aria-hidden
            >
              <Store className="size-11 text-zinc-400/80" strokeWidth={1.25} />
            </div>
          )}

          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-transparent"
            aria-hidden
          />

          {cuisine ? (
            <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-yellow-300/80 bg-yellow-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-950 shadow-sm shadow-yellow-900/15">
              <UtensilsCrossed className="size-3 text-yellow-900/80" strokeWidth={2.25} aria-hidden />
              {cuisine}
            </span>
          ) : null}
        </div>

        <div className="relative z-10 -mt-5 flex min-h-0 flex-1 flex-col px-3 pb-3">
          <div className="flex h-full min-h-0 flex-1 flex-col rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-[0_4px_20px_rgba(15,23,42,0.08)] ring-1 ring-zinc-950/[0.04]">
            <div className="h-[4.25rem] shrink-0">
              <h2 className="line-clamp-2 text-base font-bold leading-tight tracking-tight text-zinc-900">
                {name}
              </h2>
              <p
                className={`mt-1.5 line-clamp-1 text-xs leading-relaxed ${
                  descriptionText ? "text-zinc-500" : "text-transparent"
                }`}
              >
                {descriptionText || "No description"}
              </p>
            </div>

            <div className="mt-3 grid h-[3.75rem] shrink-0 grid-cols-2 gap-2">
              <StatTile
                icon={MapPin}
                label="Location"
                value={location || "Not set"}
              />
              <StatTile icon={Building2} label="Branches" value={branchLabel} />
            </div>

            <span className="mt-auto flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-semibold text-white shadow-md shadow-zinc-900/20 transition duration-300 group-hover:bg-zinc-800 group-hover:shadow-lg">
              Open dashboard
              <ArrowUpRight
                className="size-4 opacity-90 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={2.25}
                aria-hidden
              />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
