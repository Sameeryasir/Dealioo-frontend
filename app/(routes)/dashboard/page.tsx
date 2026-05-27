"use client";

import RestaurantDashboardCard from "@/app/components/RestaurantDashboardCard";
import SearchBar from "@/app/components/SearchBar";
import SearchNoMatchFound from "@/app/components/SearchNoMatchFound";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import {
  RestaurantCardSkeleton,
  SkeletonGrid,
} from "@/app/components/skeleton";
import { useMyRestaurantsQuery } from "@/app/hooks/use-my-restaurants-query";
import { Plus, Store } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { AdminRestaurant } from "@/app/services/restaurant/get-my-restaurant";

function restaurantMatchesQuery(r: AdminRestaurant, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    r.name,
    r.description,
    r.email,
    r.cuisineType,
    r.city,
    r.state,
    r.country,
    r.websiteUrl,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    data: restaurants,
    isLoading: loading,
    error: errorMessage,
    refetch: loadRestaurants,
  } = useMyRestaurantsQuery();

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => restaurantMatchesQuery(r, searchQuery));
  }, [restaurants, searchQuery]);

  const showSkeleton = loading;
  const list = restaurants;

  const showCreateInHeader = !showSkeleton && !errorMessage;
  const showDashboardSearch =
    !showSkeleton && !errorMessage && list.length > 0;

  return (
    <div className="w-full px-4 py-8 sm:px-8 lg:px-10">
      <header className="mx-auto mb-8 w-full max-w-[min(100%,77.62rem)] text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Dashboard
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl sm:leading-tight">
          Your Organizations
        </h1>

        {showCreateInHeader ? (
          <div className="mt-6 flex justify-center px-2">
            <div className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white p-3 shadow-[0_4px_24px_rgba(15,23,42,0.06)] ring-1 ring-zinc-950/[0.04] sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:gap-3 sm:p-3.5">
              <span
                className="mx-auto flex size-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-yellow-950 shadow-sm sm:mx-0"
                aria-hidden
              >
                <Store className="size-5" strokeWidth={2.25} />
              </span>

              {showDashboardSearch ? (
                <SearchBar
                  id="dashboard-search"
                  variant="toolbar"
                  className="w-full sm:w-56 md:w-64"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search restaurants…"
                />
              ) : (
                <p className="px-1 text-sm text-zinc-500 sm:text-left">
                  Create your first restaurant to get started.
                </p>
              )}

              <Link
                href="/restaurant/register"
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white shadow-md shadow-zinc-900/15 transition hover:bg-zinc-800 hover:shadow-lg"
              >
                <Plus className="size-4" strokeWidth={2.5} aria-hidden />
                Add restaurant
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <div className="mx-auto max-w-[min(100%,77.62rem)]">
        {showSkeleton ? (
          <SkeletonGrid
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
            Card={RestaurantCardSkeleton}
          />
        ) : errorMessage ? (
          <AsyncErrorRetry
            layout="inline"
            title="Something went wrong"
            message={errorMessage}
            onRetry={() => loadRestaurants()}
          />
        ) : list.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200">
              <Store className="h-7 w-7" strokeWidth={1.75} aria-hidden />
            </div>
            <p className="mt-4 text-base font-semibold text-zinc-900">
              No restaurant yet
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
              Tap <span className="font-medium text-zinc-700">Add restaurant</span> above to
              create your first one.
            </p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <SearchNoMatchFound />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRestaurants.map((r, index) => (
              <RestaurantDashboardCard
                key={r.id ?? `restaurant-${index}`}
                restaurant={r}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
