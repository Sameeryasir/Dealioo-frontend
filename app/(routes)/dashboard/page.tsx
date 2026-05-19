"use client";

import RestaurantDashboardCard from "@/app/components/RestaurantDashboardCard";
import SearchBar from "@/app/components/SearchBar";
import SearchNoMatchFound from "@/app/components/SearchNoMatchFound";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import {
  fetchMyRestaurants,
  type AdminRestaurant,
} from "@/app/services/restaurant/get-my-restaurant";
import {
  RestaurantCardSkeleton,
  SkeletonGrid,
} from "@/app/components/skeleton";
import { AlertCircle, Plus, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  const router = useRouter();
  const [tokenReady, setTokenReady] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<
    AdminRestaurant[] | undefined
  >(undefined);

  useEffect(() => {
    queueMicrotask(() => {
      setAccessToken(getSetupAccessToken());
      setTokenReady(true);
    });
  }, []);

  useEffect(() => {
    if (!tokenReady) return;
    if (!accessToken) {
      router.replace("/auth/login");
    }
  }, [tokenReady, accessToken, router]);

  const loadRestaurants = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchMyRestaurants(accessToken);
      setRestaurants(data);
    } catch (e) {
      setRestaurants(undefined);
      setErrorMessage(
        e instanceof Error ? e.message : "Could not load restaurants.",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!tokenReady || !accessToken) return;
    queueMicrotask(() => {
      void loadRestaurants();
    });
  }, [tokenReady, accessToken, loadRestaurants]);

  const filteredRestaurants = useMemo(() => {
    if (!restaurants) return [];
    return restaurants.filter((r) => restaurantMatchesQuery(r, searchQuery));
  }, [restaurants, searchQuery]);

  const showSkeleton = !tokenReady || loading;

  const showCreateInHeader =
    !showSkeleton && !errorMessage && restaurants !== undefined;

  const showDashboardSearch =
    !showSkeleton &&
    !errorMessage &&
    restaurants !== undefined &&
    restaurants.length > 0;

  return (
    <div className="w-full px-4 py-8 sm:px-8 lg:px-10">
      <header className="mx-auto mb-8 w-full max-w-[min(100%,77.62rem)] text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Your Restaurants
        </h1>
        {showCreateInHeader ? (
          <div className="mx-auto mt-5 flex w-full justify-center sm:mt-6">
            <div className="flex w-full max-w-xl min-w-0 flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:gap-3">
              {showDashboardSearch ? (
                <SearchBar
                  id="dashboard-search"
                  className="min-w-0 w-full sm:w-72 md:w-80"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search…"
                />
              ) : null}
              <Link
                href="/restaurant/register"
                aria-label="Create restaurant"
                title="Create restaurant"
                className="mx-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm transition-colors hover:bg-black"
              >
                <Plus className="h-5 w-5" strokeWidth={2.25} aria-hidden />
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <div className="mx-auto max-w-[min(100%,77.62rem)]">
        {showSkeleton ? (
          <SkeletonGrid
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            Card={RestaurantCardSkeleton}
          />
        ) : errorMessage ? (
          <div
            className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-4 text-sm text-red-900 shadow-sm"
            role="alert"
          >
            <div className="flex gap-3">
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                aria-hidden
              />
              <div>
                <p className="font-semibold">Something went wrong</p>
                <p className="mt-1 text-red-800/90">{errorMessage}</p>
                <button
                  type="button"
                  onClick={() => void loadRestaurants()}
                  className="mt-3 rounded-lg bg-red-900/90 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-950"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : restaurants !== undefined && restaurants.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200">
              <Store className="h-7 w-7" strokeWidth={1.75} aria-hidden />
            </div>
            <p className="mt-4 text-base font-semibold text-zinc-900">
              No restaurant yet
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
              Use the <span className="font-medium text-zinc-700">plus (+) button</span>{" "}
              above to add your first one.
            </p>
          </div>
        ) : restaurants !== undefined &&
          restaurants.length > 0 &&
          filteredRestaurants.length === 0 ? (
          <SearchNoMatchFound />
        ) : filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRestaurants.map((r, index) => (
              <RestaurantDashboardCard
                key={r.id ?? `restaurant-${index}`}
                restaurant={r}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
