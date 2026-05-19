"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CampaignFunnelCard from "@/app/components/CampaignFunnelCard";
import {
  CampaignFunnelCardSkeleton,
  SkeletonGrid,
} from "@/app/components/skeleton";
import CreateCampaigns from "@/app/components/CreateCampaigns";
import SearchBar from "@/app/components/SearchBar";
import SearchNoMatchFound from "@/app/components/SearchNoMatchFound";
import { Plus } from "lucide-react";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { parseOfferPrice } from "@/app/lib/campaign-form";
import {
  createCampaign,
  extractCampaignIdFromCreateResponse,
} from "@/app/services/funnel/create-campaign";
import {
  fetchCampaignsByRestaurant,
  type Funnel,
} from "@/app/services/funnel/get-campaigns-by-restaurant";

function parseRestaurantIdParam(raw: unknown): number | undefined {
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return undefined;
  const n = Number.parseInt(raw, 10);
  return n >= 1 ? n : undefined;
}

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
  const params = useParams();
  const skipPostCreateNavRef = useRef(false);
  const restaurantId = useMemo(
    () => parseRestaurantIdParam(params.restaurantId),
    [params.restaurantId],
  );
  const dashboardHref =
    restaurantId != null
      ? `/restaurant/${restaurantId}/dashboard`
      : "/dashboard";

  const [funnels, setFunnels] = useState<Funnel[] | undefined>(undefined);
  const [funnelsLoading, setFunnelsLoading] = useState(true);
  const [funnelsError, setFunnelsError] = useState<string | null>(null);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);

  const [open, setOpen] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFunnels = useMemo(() => {
    if (!funnels) return [];
    return funnels.filter((f) => funnelMatchesQuery(f, searchQuery));
  }, [funnels, searchQuery]);

  const loadFunnels = useCallback(async () => {
    if (restaurantId == null) return;
    const token = getSetupAccessToken();
    if (!token.trim()) return;
    setFunnelsLoading(true);
    setFunnelsError(null);
    try {
      const data = await fetchCampaignsByRestaurant(token, restaurantId);
      const list = Array.isArray(data) ? data : [];
      setFunnels(list);
      setShowCreateCampaign(list.length === 0);
    } catch (e) {
      setFunnels(undefined);
      setFunnelsError(
        e instanceof Error ? e.message : "Could not load campaigns.",
      );
    } finally {
      setFunnelsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId == null) return;
    void loadFunnels();
  }, [restaurantId, loadFunnels]);

  useEffect(() => {
    setSearchQuery("");
  }, [restaurantId]);

  if (restaurantId == null) {
    return (
      <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center gap-4 px-4 py-10">
        <p className="text-center text-sm text-zinc-700">
          Invalid restaurant link.
        </p>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-zinc-900 underline underline-offset-2"
        >
          Back to your restaurants
        </Link>
      </div>
    );
  }

  const centerEmptyCreateFlow =
    !funnelsLoading &&
    funnelsError == null &&
    funnels !== undefined &&
    funnels.length === 0;

  const centerCreateWithExistingFunnels =
    showCreateCampaign &&
    !funnelsLoading &&
    funnelsError == null &&
    funnels !== undefined &&
    funnels.length > 0;

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
      {!showCreateCampaign &&
      !funnelsLoading &&
      funnels !== undefined &&
      funnels.length > 0 ? (
        <header className="mx-auto mb-8 w-full max-w-[min(100%,77.62rem)] text-center">
          <div className="mx-auto flex w-full justify-center sm:mt-1">
            <div className="flex w-full max-w-xl min-w-0 flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:gap-3">
              <SearchBar
                id="campaigns-search"
                className="min-w-0 w-full sm:w-72 md:w-80"
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search…"
              />
              <button
                type="button"
                onClick={() => {
                  setOpen(true);
                  setShowCreateCampaign(true);
                }}
                aria-label="Create campaign"
                title="Create campaign"
                className="mx-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm transition-colors hover:bg-black"
              >
                <Plus className="h-5 w-5" strokeWidth={2.25} aria-hidden />
              </button>
            </div>
          </div>
        </header>
      ) : null}

      {funnelsLoading ? (
        <SkeletonGrid
          className="mx-auto grid w-full max-w-[min(100%,77.62rem)] grid-cols-1 gap-6 md:grid-cols-3"
          Card={CampaignFunnelCardSkeleton}
        />
      ) : funnelsError ? (
        <div
          className="mx-auto w-full max-w-[min(100%,77.62rem)] rounded-2xl border border-red-200 bg-red-50/90 px-4 py-4 text-sm text-red-900 shadow-sm"
          role="alert"
        >
          <p>{funnelsError}</p>
          <button
            type="button"
            onClick={() => void loadFunnels()}
            className="mt-3 rounded-lg bg-red-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-950"
          >
            Try again
          </button>
        </div>
      ) : funnels !== undefined &&
        funnels.length > 0 &&
        filteredFunnels.length === 0 &&
        !showCreateCampaign ? (
        <SearchNoMatchFound className="mx-auto w-full max-w-[min(100%,77.62rem)]" />
      ) : filteredFunnels.length > 0 && !showCreateCampaign ? (
        <div className="mx-auto grid w-full max-w-[min(100%,77.62rem)] grid-cols-1 gap-6 md:grid-cols-3">
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
                : funnels !== undefined && funnels.length > 0
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
              : funnels !== undefined && funnels.length > 0
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
                if (funnels?.length === 0) {
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
                const createdBody = await createCampaign(
                  getSetupAccessToken(),
                  {
                    restaurantId,
                    campaignName: payload.campaignName,
                    websiteUrl: payload.websiteUrl,
                    image: payload.offerImage,
                    offer: payload.offerName,
                    price: parseOfferPrice(payload.offerPrice),
                  },
                );
                skipPostCreateNavRef.current = true;
                const next = await fetchCampaignsByRestaurant(
                  getSetupAccessToken(),
                  restaurantId,
                );
                const list = Array.isArray(next) ? next : [];
                setFunnels(list);
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
                // Do not hide the create flow here when we have an id: that would paint the
                // campaigns list for a frame before `router.push` runs in CreateCampaigns.
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
