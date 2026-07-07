"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
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
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { useCampaignsByRestaurantQuery } from "@/app/hooks/use-campaigns-by-restaurant-query";
import { parseOfferPrice } from "@/app/lib/campaign-form";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { funnelQueryKeys } from "@/app/services/funnel/funnel-query-keys";
import { CAMPAIGNS_PAGE_SIZE } from "@/app/services/funnel/get-campaigns-by-restaurant";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { automationQueryKeys } from "@/app/services/automation/automation-query-keys";
import { provisionCampaignDefaultAutomations } from "@/app/services/automation/provision-campaign-default-automations";
import {
  createCampaign,
  extractCampaignIdFromCreateResponse,
} from "@/app/services/funnel/create-campaign";
import type { Funnel } from "@/app/services/funnel/get-campaigns-by-restaurant";

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
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, restaurantId]);

  const {
    data: funnelList,
    meta,
    isLoading: funnelsLoading,
    isFetching: funnelsFetching,
    error: funnelsError,
    refetch: loadFunnels,
  } = useCampaignsByRestaurantQuery(restaurantId, {
    page,
    search: searchQuery,
  });

  const hasAnyCampaigns = meta.total > 0 || searchQuery.trim().length > 0;

  useEffect(() => {
    if (funnelsLoading || funnelsError) return;
    setShowCreateCampaign(!hasAnyCampaigns && !searchQuery.trim());
  }, [hasAnyCampaigns, funnelsLoading, funnelsError, searchQuery]);

  useEffect(() => {
    setSearchQuery("");
    setPage(1);
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
    !funnelsLoading && !funnelsError && !hasAnyCampaigns && !searchQuery.trim();

  const centerCreateWithExistingFunnels =
    showCreateCampaign &&
    !funnelsLoading &&
    !funnelsError &&
    hasAnyCampaigns;

  const shouldVerticallyCenterPage =
    centerEmptyCreateFlow || centerCreateWithExistingFunnels;

  const showCampaignSkeleton =
    funnelsLoading || (funnelsFetching && !funnelsLoading);

  const isConfirmedEmpty =
    !funnelsLoading &&
    !funnelsFetching &&
    !hasAnyCampaigns &&
    !searchQuery.trim();

  const showCampaignsHeader =
    !showCreateCampaign && !funnelsError && !isConfirmedEmpty;

  return (
    <div
      className={
        shouldVerticallyCenterPage
          ? "flex min-h-[calc(100dvh-8rem)] w-full flex-col justify-center px-4 py-8 sm:px-8 lg:px-10"
          : "flex min-h-[calc(100dvh-8rem)] w-full flex-col px-4 py-8 sm:px-8 lg:px-10"
      }
    >
      {showCampaignsHeader ? (
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

      {showCampaignSkeleton && !showCreateCampaign ? (
        <>
          <SkeletonGrid
            count={CAMPAIGNS_PAGE_SIZE}
            className="mx-auto grid w-full max-w-[min(100%,77.62rem)] grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
            Card={CampaignFunnelCardSkeleton}
          />
          {meta.totalPages > 1 ? (
            <div className="mx-auto mt-6 w-full max-w-[min(100%,77.62rem)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <OffsetPagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                limit={CAMPAIGNS_PAGE_SIZE}
                loading={funnelsFetching}
                onPageChange={setPage}
                itemLabel="campaigns"
              />
            </div>
          ) : null}
        </>
      ) : funnelsError ? (
        <AsyncErrorRetry
          layout="inline"
          className="mx-auto w-full max-w-[min(100%,77.62rem)]"
          message={funnelsError}
          onRetry={() => loadFunnels()}
        />
      ) : funnelList.length === 0 &&
        searchQuery.trim() &&
        !showCreateCampaign ? (
        <SearchNoMatchFound className="mx-auto w-full max-w-[min(100%,77.62rem)]" />
      ) : funnelList.length > 0 && !showCreateCampaign ? (
        <>
          <div className="mx-auto grid w-full max-w-[min(100%,77.62rem)] grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {funnelList.map((f) => (
              <CampaignFunnelCard
                key={f.id}
                funnel={f}
                restaurantId={restaurantId}
              />
            ))}
          </div>

          {meta.totalPages > 1 ? (
            <div className="mx-auto mt-6 w-full max-w-[min(100%,77.62rem)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <OffsetPagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                limit={CAMPAIGNS_PAGE_SIZE}
                loading={funnelsFetching}
                onPageChange={setPage}
                itemLabel="campaigns"
              />
            </div>
          ) : null}
        </>
      ) : null}

        <div
          className={
            centerEmptyCreateFlow
              ? "mx-auto w-full max-w-[min(100%,77.62rem)]"
              : centerCreateWithExistingFunnels
                ? "mx-auto flex w-full max-w-[min(100%,77.62rem)] flex-col items-center"
                : hasAnyCampaigns
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
              : hasAnyCampaigns
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
                if (!hasAnyCampaigns) {
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
                  queryKey: [...funnelQueryKeys.campaigns(), restaurantId],
                });
                setShowCreateCampaign(false);
                const fromApi =
                  extractCampaignIdFromCreateResponse(createdBody);
                const campaignId = fromApi;
                if (campaignId != null) {
                  try {
                    await provisionCampaignDefaultAutomations(
                      restaurantId,
                      campaignId,
                    );
                    await queryClient.invalidateQueries({
                      queryKey: automationQueryKeys.list(restaurantId),
                    });
                  } catch (automationError) {
                    const message = getApiErrorMessage(
                      automationError,
                      "Could not set up default automations for this campaign.",
                    );
                    toast.error(message);
                    setSubmitError(
                      `Campaign was created, but automations could not be set up: ${message}`,
                    );
                  }
                } else {
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
