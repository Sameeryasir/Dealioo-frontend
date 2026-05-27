"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import CampaignFunnelCard from "@/app/components/CampaignFunnelCard";
import {
  CampaignFunnelCardSkeleton,
  SkeletonGrid,
} from "@/app/components/skeleton";
import CreateCampaigns from "@/app/components/CreateCampaigns";
import SearchBar from "@/app/components/SearchBar";
import SearchNoMatchFound from "@/app/components/SearchNoMatchFound";
import { Megaphone, Plus } from "lucide-react";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { useCampaignsByRestaurantQuery } from "@/app/hooks/use-campaigns-by-restaurant-query";
import { parseOfferPrice } from "@/app/lib/campaign-form";
import { funnelQueryKeys } from "@/app/services/funnel/funnel-query-keys";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import {
  createCampaign,
  extractCampaignIdFromCreateResponse,
} from "@/app/services/funnel/create-campaign";
import type { Funnel } from "@/app/services/funnel/get-campaigns-by-restaurant";

function funnelMatchesQuery(f: Funnel, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    f.campaignName,
    f.offer,
    f.websiteUrl,
    f.imageUrl,
    f.price != null ? String(f.price) : "",
    f.status,
    f.published === true ? "published" : "unpublished",
    String(f.id),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export default function RestaurantCampaignsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const skipPostCreateNavRef = useRef(false);
  const restaurantId = useMemo(
    () => parseRoutePositiveInt(params.restaurantId),
    [params.restaurantId],
  );
  const dashboardHref =
    restaurantId != null
      ? `/restaurant/${restaurantId}/dashboard`
      : "/dashboard";

  const [showCreateCampaign, setShowCreateCampaign] = useState(false);

  const [open, setOpen] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: funnelList,
    isLoading: funnelsLoading,
    error: funnelsError,
    refetch: loadFunnels,
  } = useCampaignsByRestaurantQuery(restaurantId);

  const filteredFunnels = useMemo(() => {
    return funnelList.filter((f) => funnelMatchesQuery(f, searchQuery));
  }, [funnelList, searchQuery]);

  useEffect(() => {
    if (funnelsLoading || funnelsError) return;
    setShowCreateCampaign(funnelList.length === 0);
  }, [funnelList.length, funnelsLoading, funnelsError]);

  useEffect(() => {
    setSearchQuery("");
  }, [restaurantId]);

  if (restaurantId == null) {
    return (
      <InvalidRouteMessage
        message="Invalid restaurant link."
        backLabel="Back to your restaurants"
      />
    );
  }

  const centerEmptyCreateFlow =
    !funnelsLoading && !funnelsError && funnelList.length === 0;

  const centerCreateWithExistingFunnels =
    showCreateCampaign &&
    !funnelsLoading &&
    !funnelsError &&
    funnelList.length > 0;

  const shouldVerticallyCenterPage =
    centerEmptyCreateFlow || centerCreateWithExistingFunnels;

  return (
    <div
      className={
        shouldVerticallyCenterPage
          ? "flex min-h-[calc(100dvh-8rem)] w-full flex-col justify-center px-4 py-8 sm:px-8 lg:px-10"
          : "flex min-h-[calc(100dvh-8rem)] w-full flex-col px-4 py-8 sm:px-8 lg:px-10"
      }
    >
      {!showCreateCampaign && !funnelsLoading && !funnelsError && funnelList.length > 0 ? (
        <header className="mx-auto mb-8 w-full max-w-[min(100%,77.62rem)] text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Campaigns
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl sm:leading-tight">
            Your Campaigns
          </h1>

          <div className="mt-6 flex justify-center px-2">
            <div className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white p-3 shadow-[0_4px_24px_rgba(15,23,42,0.06)] ring-1 ring-zinc-950/[0.04] sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:gap-3 sm:p-3.5">
              <span
                className="mx-auto flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white shadow-sm sm:mx-0"
                aria-hidden
              >
                <Megaphone className="size-5" strokeWidth={2.25} />
              </span>
              <SearchBar
                id="campaigns-search"
                variant="toolbar"
                className="w-full sm:w-56 md:w-64"
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search campaigns…"
              />
              <button
                type="button"
                onClick={() => {
                  setOpen(true);
                  setShowCreateCampaign(true);
                }}
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white shadow-md shadow-zinc-900/15 transition hover:bg-zinc-800 hover:shadow-lg"
              >
                <Plus className="size-4" strokeWidth={2.5} aria-hidden />
                Add campaign
              </button>
            </div>
          </div>
        </header>
      ) : null}

      {funnelsLoading ? (
        <SkeletonGrid
          className="mx-auto grid w-full max-w-[min(100%,77.62rem)] grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
          Card={CampaignFunnelCardSkeleton}
        />
      ) : funnelsError ? (
        <AsyncErrorRetry
          layout="inline"
          className="mx-auto w-full max-w-[min(100%,77.62rem)]"
          message={funnelsError}
          onRetry={() => loadFunnels()}
        />
      ) : funnelList.length > 0 &&
        filteredFunnels.length === 0 &&
        !showCreateCampaign ? (
        <SearchNoMatchFound className="mx-auto w-full max-w-[min(100%,77.62rem)]" />
      ) : filteredFunnels.length > 0 && !showCreateCampaign ? (
        <div className="mx-auto grid w-full max-w-[min(100%,77.62rem)] grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredFunnels.map((f) => (
            <CampaignFunnelCard
              key={f.id}
              funnel={f}
              restaurantId={restaurantId}
            />
          ))}
        </div>
      ) : null}

        <div
          className={
            centerEmptyCreateFlow
              ? "mx-auto w-full max-w-[min(100%,77.62rem)]"
              : centerCreateWithExistingFunnels
                ? "mx-auto flex w-full max-w-[min(100%,77.62rem)] flex-col items-center"
                : funnelList.length > 0
                  ? "contents"
                  : ""
          }
        >
      {submitError ? (
        <p
          className={`mb-4 max-w-lg rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800 ${
            centerEmptyCreateFlow || centerCreateWithExistingFunnels
              ? "mx-auto mt-0"
              : "mt-6"
          }`}
          role="alert"
        >
          {submitError}
        </p>
      ) : null}

      {showCreateCampaign ? (
        <div
          className={
            centerCreateWithExistingFunnels
              ? "w-full"
              : funnelList.length > 0
                ? "mt-10 w-full"
                : centerEmptyCreateFlow
                  ? "w-full"
                  : "mt-6 w-full"
          }
        >
          <CreateCampaigns
            variant="inline"
            open={open}
            restaurantId={restaurantId}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) {
                if (skipPostCreateNavRef.current) {
                  skipPostCreateNavRef.current = false;
                  return;
                }
                if (funnelList.length === 0) {
                  router.push(dashboardHref);
                } else {
                  setShowCreateCampaign(false);
                }
              }
            }}
            onComplete={async (payload) => {
              setSubmitError(null);
              setSubmitting(true);
              try {
                const createdBody = await createCampaign({
                  restaurantId,
                  campaignName: payload.campaignName,
                  websiteUrl: payload.websiteUrl,
                  image: payload.offerImage,
                  offer: payload.offerName,
                  price: parseOfferPrice(payload.offerPrice),
                });
                skipPostCreateNavRef.current = true;
                await queryClient.invalidateQueries({
                  queryKey: funnelQueryKeys.campaignsByRestaurant(restaurantId),
                });
                const list =
                  queryClient.getQueryData<Funnel[]>(
                    funnelQueryKeys.campaignsByRestaurant(restaurantId),
                  ) ?? [];
                setShowCreateCampaign(list.length === 0);
                const fromApi =
                  extractCampaignIdFromCreateResponse(createdBody);
                const name = payload.campaignName.trim();
                const sameName = list.filter(
                  (f) => f.campaignName.trim() === name,
                );
                const fallbackId =
                  sameName.length === 1
                    ? sameName[0].id
                    : sameName.length > 1
                      ? Math.max(...sameName.map((f) => f.id))
                      : list.length > 0
                        ? Math.max(...list.map((f) => f.id))
                        : undefined;
                const campaignId = fromApi ?? fallbackId;
                if (campaignId == null) {
                  setShowCreateCampaign(false);
                }
                return campaignId ?? undefined;
              } catch (e) {
                setSubmitError(
                  e instanceof Error ? e.message : "Could not create campaign.",
                );
                throw e;
              } finally {
                setSubmitting(false);
              }
            }}
          />
        </div>
      ) : null}

      {submitting ? (
        <p
          className={`text-sm text-zinc-600 ${
            centerEmptyCreateFlow || centerCreateWithExistingFunnels
              ? "mx-auto mt-4 text-center"
              : "mt-4"
          }`}
          aria-live="polite"
        >
          Creating campaign…
        </p>
      ) : null}
      </div>
    </div>
  );
}
