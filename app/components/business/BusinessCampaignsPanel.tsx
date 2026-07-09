"use client";

import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Megaphone,
  Plus,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import CampaignFunnelCard from "@/app/components/CampaignFunnelCard";
import CreateCampaigns from "@/app/components/CreateCampaigns";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import {
  CampaignFunnelCardSkeleton,
  SkeletonGrid,
} from "@/app/components/skeleton";
import { useCampaignsByBusinessQuery } from "@/app/hooks/use-campaigns-by-business-query";
import { parseOfferPrice } from "@/app/lib/campaign-form";
import { standardEase } from "@/app/lib/motion";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { automationQueryKeys } from "@/app/services/automation/automation-query-keys";
import { provisionCampaignDefaultAutomations } from "@/app/services/automation/provision-campaign-default-automations";
import {
  createCampaign,
  extractCampaignIdFromCreateResponse,
} from "@/app/services/funnel/create-campaign";
import { funnelQueryKeys } from "@/app/services/funnel/funnel-query-keys";
import {
  CAMPAIGNS_PAGE_SIZE,
  type Funnel,
} from "@/app/services/funnel/get-campaigns-by-business";

const CAMPAIGNS_FETCH_LIMIT = 200;
const CAMPAIGNS_GRID_PAGE_SIZE = CAMPAIGNS_PAGE_SIZE;

const campaignsCardClass =
  "rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

type StatusFilter = "all" | "published" | "unpublished";

const STATUS_FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "unpublished", label: "Unpublished" },
];

function isCampaignPublished(funnel: Funnel): boolean {
  if (funnel.published === true) return true;
  if (funnel.published === false) return false;
  return funnel.status?.trim().toLowerCase() === "published";
}

function matchesSearch(funnel: Funnel, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const name = funnel.campaignName?.trim().toLowerCase() ?? "";
  const offer = funnel.offer?.trim().toLowerCase() ?? "";
  return name.includes(needle) || offer.includes(needle);
}

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 cursor-pointer rounded-full px-2 py-1.5 text-[0.75rem] font-bold transition ${
        active
          ? "bg-[#1877f2] text-white shadow-[0_4px_12px_rgba(24,119,242,0.25)]"
          : "bg-[#f4f7fb] text-slate-600 hover:bg-[#e8f2ff] hover:text-[#1877f2]"
      }`}
    >
      {label}
    </button>
  );
}

function CampaignsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center px-6 py-14 text-center sm:py-16">
      <div className="relative mb-5 flex size-28 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full bg-[#e8f2ff]/80 blur-xl"
          aria-hidden
        />
        <span className="relative flex size-24 items-center justify-center rounded-[1.75rem] border border-[#dbeafe] bg-gradient-to-br from-[#f4f8ff] to-white shadow-[0_12px_32px_rgba(24,119,242,0.12)]">
          <Megaphone
            className="size-10 text-[#1877f2]"
            strokeWidth={1.75}
            aria-hidden
          />
        </span>
        <span className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#e1306c] text-white shadow-md">
          <Plus className="size-4" strokeWidth={2.5} aria-hidden />
        </span>
      </div>

      <h2 className="m-0 text-[1.05rem] font-extrabold tracking-tight text-[#07111f]">
        No campaigns yet
      </h2>
      <p className="m-0 mt-2 max-w-md text-[0.82rem] font-medium leading-relaxed text-slate-500">
        Create your first offer to collect signups, payments and guest activity.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-6 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1877f2] px-4 py-2.5 text-[0.82rem] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5]"
      >
        Create Campaign
        <ArrowUpRight className="size-3.5" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}

export function BusinessCampaignsPanel({
  businessId,
}: {
  businessId: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const dashboardHref = `/business/${businessId}/dashboard`;
  const skipPostCreateNavRef = useRef(false);
  const keepCreateFlowOpenRef = useRef(false);

  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [createOpen, setCreateOpen] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const {
    data: campaigns,
    meta,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useCampaignsByBusinessQuery(businessId, {
    page: 1,
    search: "",
    limit: CAMPAIGNS_FETCH_LIMIT,
  });

  const loading = isLoading || (isFetching && campaigns.length === 0);
  const hasAnyCampaigns = (meta?.total ?? campaigns.length) > 0;

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    if (loading || error) return;
    if (keepCreateFlowOpenRef.current || submitting) return;
    if (!hasAnyCampaigns && !searchQuery.trim()) {
      setShowCreateFlow(true);
    }
  }, [hasAnyCampaigns, loading, error, searchQuery, submitting]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((funnel) => {
      if (statusFilter === "published" && !isCampaignPublished(funnel)) {
        return false;
      }
      if (statusFilter === "unpublished" && isCampaignPublished(funnel)) {
        return false;
      }
      return matchesSearch(funnel, searchQuery);
    });
  }, [campaigns, searchQuery, statusFilter]);

  const totalFilteredPages = Math.max(
    1,
    Math.ceil(filteredCampaigns.length / CAMPAIGNS_GRID_PAGE_SIZE),
  );

  const pagedCampaigns = useMemo(() => {
    const start = (page - 1) * CAMPAIGNS_GRID_PAGE_SIZE;
    return filteredCampaigns.slice(start, start + CAMPAIGNS_GRID_PAGE_SIZE);
  }, [filteredCampaigns, page]);

  useEffect(() => {
    if (page > totalFilteredPages) {
      setPage(totalFilteredPages);
    }
  }, [page, totalFilteredPages]);

  const hasActiveFilters =
    statusFilter !== "all" || searchQuery.trim().length > 0;
  const showEmpty =
    !loading && !error && !hasAnyCampaigns && !searchQuery.trim();
  const showNoFilterResults =
    !loading && !error && hasAnyCampaigns && filteredCampaigns.length === 0;
  const showGrid = !loading && !error && pagedCampaigns.length > 0;
  const showCreateInCard = showCreateFlow && !loading && !error;

  function openCreateFlow() {
    setCreateOpen(true);
    setShowCreateFlow(true);
    setSubmitError(null);
  }

  async function handleCreateComplete(payload: {
    campaignName: string;
    websiteUrl: string;
    offerName: string;
    offerPrice: string;
    offerImage: File;
  }) {
    setSubmitError(null);
    setAlertDismissed(false);
    keepCreateFlowOpenRef.current = true;
    setSubmitting(true);
    try {
      const createdBody = await createCampaign({
        businessId,
        campaignName: payload.campaignName,
        websiteUrl: payload.websiteUrl,
        image: payload.offerImage,
        offer: payload.offerName,
        price: parseOfferPrice(payload.offerPrice),
      });
      skipPostCreateNavRef.current = true;
      await queryClient.invalidateQueries({
        queryKey: [...funnelQueryKeys.campaigns(), businessId],
      });
      const campaignId = extractCampaignIdFromCreateResponse(createdBody);
      if (campaignId != null) {
        void provisionCampaignDefaultAutomations(businessId, campaignId)
          .then(async () => {
            await queryClient.invalidateQueries({
              queryKey: automationQueryKeys.list(businessId),
            });
          })
          .catch((automationError) => {
            const message = getApiErrorMessage(
              automationError,
              "Could not set up default automations for this campaign.",
            );
            toast.error(message);
            setSubmitError(
              `Campaign was created, but automations could not be set up: ${message}`,
            );
          });
      }
      setShowCreateFlow(false);
      setCreateOpen(false);
      keepCreateFlowOpenRef.current = false;
      return campaignId ?? undefined;
    } catch (e) {
      keepCreateFlowOpenRef.current = false;
      setSubmitError(
        e instanceof Error ? e.message : "Could not create campaign.",
      );
      throw e;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rd-premium rd-premium--fill" aria-label="Campaigns">
      <OverviewAlertDialog
        open={submitError != null && !alertDismissed}
        message={submitError ?? ""}
        onClose={() => setAlertDismissed(true)}
      />

      <div className="rd-premium-page">
        <header className="shrink-0 px-0.5">
          <h1 className="m-0 text-[clamp(1.15rem,2vw,1.45rem)] font-extrabold tracking-tight text-[#07111f]">
            Campaigns
          </h1>
          <p className="m-0 mt-1 max-w-[42ch] text-[0.8rem] font-medium leading-snug text-slate-500">
            Launch offers, track performance and manage your guest funnels.
          </p>
        </header>

        <article className={`${campaignsCardClass} rd-premium-panel`}>
          {showEmpty && !showCreateInCard ? (
            <div className="rd-premium-panel__body rd-premium-panel__body--center">
              <CampaignsEmptyState onCreate={openCreateFlow} />
            </div>
          ) : showCreateInCard && !hasAnyCampaigns ? (
            <div className="rd-premium-panel__body px-4 py-4 sm:px-5 sm:py-5">
              <CreateCampaigns
                variant="inline"
                open={createOpen}
                businessId={businessId}
                onOpenChange={(next) => {
                  setCreateOpen(next);
                  if (!next) {
                    keepCreateFlowOpenRef.current = false;
                    const skipDashboardNav = skipPostCreateNavRef.current;
                    if (skipDashboardNav) {
                      skipPostCreateNavRef.current = false;
                    }
                    setShowCreateFlow(false);
                    if (skipDashboardNav) return;
                    if (!hasAnyCampaigns) {
                      router.push(dashboardHref);
                    }
                  }
                }}
                onComplete={handleCreateComplete}
              />
            </div>
          ) : (
            <>
              <div
                className="flex shrink-0 flex-col gap-3 px-4 py-3.5 sm:px-5"
                aria-label="Campaign filters"
              >
                <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex shrink-0 items-center gap-1.5">
                    {STATUS_FILTERS.map((filter) => (
                      <FilterPill
                        key={filter.id}
                        label={filter.label}
                        active={statusFilter === filter.id}
                        onClick={() => setStatusFilter(filter.id)}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative min-w-0">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search campaigns..."
                    className="w-full rounded-full border border-[#e8edf5] bg-[#f8fafc] py-2 pr-4 pl-9 text-[0.82rem] font-medium text-[#07111f] outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/45 focus:bg-white focus:ring-2 focus:ring-[#1877f2]/15"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="m-0 text-[1.1rem] font-extrabold tracking-tight text-[#07111f]">
                      Your campaigns
                    </h2>
                    <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-500">
                      {hasActiveFilters
                        ? `${filteredCampaigns.length} matching campaigns`
                        : "Offers and funnels for your guests"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#f4f8ff] px-2.5 py-1 text-[0.72rem] font-bold tabular-nums text-[#1877f2] ring-1 ring-[#1877f2]/15">
                      {hasActiveFilters
                        ? `${filteredCampaigns.length} shown`
                        : `${meta?.total ?? campaigns.length} total`}
                    </span>
                    <button
                      type="button"
                      onClick={openCreateFlow}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1877f2] px-3 py-1.5 text-[0.75rem] font-bold text-white shadow-[0_4px_12px_rgba(24,119,242,0.25)] transition hover:bg-[#166fe5]"
                    >
                      <Plus className="size-3.5" strokeWidth={2.5} aria-hidden />
                      Add campaign
                    </button>
                  </div>
                </div>
              </div>

              <div className="rd-premium-panel__body px-4 pt-4 pb-4 sm:px-5 sm:pt-5 sm:pb-5">
                {loading ? (
                  <SkeletonGrid
                    count={CAMPAIGNS_GRID_PAGE_SIZE}
                    className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    Card={CampaignFunnelCardSkeleton}
                  />
                ) : error ? (
                  <AsyncErrorRetry
                    layout="inline"
                    message={error}
                    onRetry={() => void refetch()}
                  />
                ) : showCreateInCard && hasAnyCampaigns ? (
                  <div className="pb-2">
                    <CreateCampaigns
                      variant="inline"
                      open={createOpen}
                      businessId={businessId}
                      onOpenChange={(next) => {
                        setCreateOpen(next);
                        if (!next) {
                          keepCreateFlowOpenRef.current = false;
                          setShowCreateFlow(false);
                        }
                      }}
                      onComplete={handleCreateComplete}
                    />
                  </div>
                ) : showNoFilterResults ? (
                  <div className="flex flex-col items-center px-6 py-10 text-center">
                    <p className="m-0 text-[0.95rem] font-extrabold text-[#07111f]">
                      No matching campaigns
                    </p>
                    <p className="m-0 mt-1 max-w-sm text-[0.8rem] font-medium text-slate-500">
                      Try a different filter or search term.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("all");
                        setSearchQuery("");
                      }}
                      className="mt-4 cursor-pointer rounded-full border border-[#e8edf5] bg-white px-4 py-2 text-[0.8rem] font-bold text-[#1877f2] transition hover:bg-[#f4f8ff]"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : showGrid ? (
                  <motion.div
                    key={`campaigns-page-${page}-${statusFilter}-${searchQuery}`}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: standardEase }}
                  >
                    <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {pagedCampaigns.map((funnel) => (
                        <CampaignFunnelCard
                          key={funnel.id}
                          funnel={funnel}
                          businessId={businessId}
                        />
                      ))}
                    </div>

                    {totalFilteredPages > 1 ? (
                      <div className="mt-5 overflow-hidden rounded-[1rem] border border-[#e8edf5] bg-[#f8fafc]/50">
                        <OffsetPagination
                          page={page}
                          totalPages={totalFilteredPages}
                          total={filteredCampaigns.length}
                          limit={CAMPAIGNS_GRID_PAGE_SIZE}
                          loading={isFetching}
                          onPageChange={setPage}
                          itemLabel="campaigns"
                        />
                      </div>
                    ) : null}
                  </motion.div>
                ) : null}
              </div>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
