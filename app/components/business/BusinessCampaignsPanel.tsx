"use client";

import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Megaphone,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import CampaignFunnelCard from "@/app/components/CampaignFunnelCard";
import CreateCampaigns from "@/app/components/CreateCampaigns";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import {
  CampaignFunnelCardSkeleton,
} from "@/app/components/skeleton";
import { useCampaignsByBusinessQuery } from "@/app/hooks/use-campaigns-by-business-query";
import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import { parseOfferPrice } from "@/app/lib/campaign-form";
import { standardEase } from "@/app/lib/motion";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { automationQueryKeys } from "@/app/services/automation/automation-query-keys";
import { provisionCampaignDefaultAutomations } from "@/app/services/automation/provision-campaign-default-automations";
import {
  createCampaign,
  extractCampaignIdFromCreateResponse,
} from "@/app/services/funnel/create-campaign";
import { deleteCampaign } from "@/app/services/funnel/delete-campaign";
import { funnelQueryKeys } from "@/app/services/funnel/funnel-query-keys";
import {
  CAMPAIGNS_PAGE_SIZE,
  type Funnel,
} from "@/app/services/funnel/get-campaigns-by-business";
import { DeleteConfirmationDialog } from "@/app/components/shared/DeleteConfirmationDialog";

const CAMPAIGNS_FETCH_LIMIT = 200;
const CAMPAIGNS_GRID_PAGE_SIZE = CAMPAIGNS_PAGE_SIZE;
const CAMPAIGNS_LOADING_SKELETON_COUNT = 3;

const campaignsCardClass =
  "overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.02]";

const campaignsGridClass =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
const campaignCardWrapClass = "min-w-0";

function getEmptyFilterMessage(
  statusFilter: StatusFilter,
  searchQuery: string,
): string {
  const search = searchQuery.trim();
  if (search.length > 0) {
    return "No campaigns found for that search.";
  }
  if (statusFilter === "published") {
    return "No published campaigns found for that.";
  }
  if (statusFilter === "unpublished") {
    return "No unpublished campaigns found for that.";
  }
  return "No campaigns found for that.";
}

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
      className={`shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-[0.75rem] font-bold transition ${
        active
          ? "bg-[#1877f2] text-white shadow-[0_4px_14px_rgba(24,119,242,0.32)]"
          : "text-slate-600 hover:bg-white hover:text-[#1877f2]"
      }`}
    >
      {label}
    </button>
  );
}

function CampaignsFilterEmptyState({
  message,
  onCreate,
  onClearFilters,
  showClearFilters,
}: {
  message: string;
  onCreate: () => void;
  onClearFilters?: () => void;
  showClearFilters?: boolean;
}) {
  return (
    <div className="flex min-h-[280px] w-full flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-[#dbeafe] bg-gradient-to-b from-[#f8fbff] to-white px-6 py-12 text-center">
      <div className="relative mb-5 flex size-20 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full bg-[#1877f2]/10 blur-xl"
          aria-hidden
        />
        <span className="relative flex size-16 items-center justify-center rounded-2xl border border-[#bfdbfe] bg-white shadow-[0_10px_24px_rgba(24,119,242,0.12)]">
          <Megaphone className="size-8 text-[#1877f2]" strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      <p className="m-0 max-w-sm text-[1rem] font-extrabold tracking-tight text-[#07111f]">
        {message}
      </p>
      <p className="m-0 mt-2 max-w-md text-[0.8rem] font-medium leading-relaxed text-slate-500">
        Try another filter, adjust your search, or create a new campaign.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {showClearFilters && onClearFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="cursor-pointer rounded-full border border-[#e8edf5] bg-white px-4 py-2 text-[0.8rem] font-bold text-[#1877f2] transition hover:bg-[#f4f8ff]"
          >
            Clear filters
          </button>
        ) : null}
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1877f2] px-4 py-2.5 text-[0.82rem] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5]"
        >
          Add campaign
          <ArrowUpRight className="size-3.5" strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function BusinessCampaignsPanel({
  businessId,
}: {
  businessId: number;
}) {
  const queryClient = useQueryClient();
  const skipPostCreateNavRef = useRef(false);
  const keepCreateFlowOpenRef = useRef(false);

  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [createOpen, setCreateOpen] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [campaignPendingDelete, setCampaignPendingDelete] =
    useState<Funnel | null>(null);
  const [isDeletingCampaign, setIsDeletingCampaign] = useState(false);

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

  const { data: business } = useBusinessByIdQuery(businessId);

  const loading = isLoading || (isFetching && campaigns.length === 0);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery]);

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
  const showToolbar = !showCreateFlow && !error;
  const showListChrome = !loading && !error;
  const showNoCampaignsForFilter =
    showListChrome && !showCreateFlow && filteredCampaigns.length === 0;
  const showGrid =
    showListChrome && !showCreateFlow && pagedCampaigns.length > 0;
  const emptyFilterMessage = getEmptyFilterMessage(statusFilter, searchQuery);

  function openCreateFlow() {
    setCreateOpen(true);
    setShowCreateFlow(true);
    setSubmitError(null);
  }

  function clearFilters() {
    setStatusFilter("all");
    setSearchQuery("");
  }

  async function handleConfirmDeleteCampaign() {
    if (!campaignPendingDelete || isDeletingCampaign) {
      return;
    }

    setIsDeletingCampaign(true);
    try {
      await deleteCampaign(campaignPendingDelete.id);
      setCampaignPendingDelete(null);
      toast.success("Campaign deleted.");
      await queryClient.invalidateQueries({
        queryKey: [...funnelQueryKeys.campaigns(), businessId],
      });
      await queryClient.invalidateQueries({
        queryKey: automationQueryKeys.list(businessId),
      });
      await queryClient.invalidateQueries({
        queryKey: ["business-activity-events", businessId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["business-activity-summary", businessId],
      });
    } catch (deleteError) {
      toast.error(
        getApiErrorMessage(deleteError, "Could not delete campaign."),
      );
    } finally {
      setIsDeletingCampaign(false);
    }
  }

  const campaignsToolbar = showToolbar ? (
    <div
      className="relative shrink-0 overflow-hidden border-b border-[#e8edf5]/80 bg-gradient-to-br from-[#eef5ff] via-white to-[#f8fafc] px-3 py-4 sm:px-4"
      aria-label="Campaign filters"
    >
      <span
        className="pointer-events-none absolute -top-8 -right-6 size-32 rounded-full bg-[#1877f2]/10 blur-2xl"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -bottom-10 -left-8 size-28 rounded-full bg-[#6366f1]/8 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-[#e8edf5] bg-white/80 p-1 shadow-sm ring-1 ring-black/[0.02] backdrop-blur-sm">
            {STATUS_FILTERS.map((filter) => (
              <FilterPill
                key={filter.id}
                label={filter.label}
                active={statusFilter === filter.id}
                onClick={() => setStatusFilter(filter.id)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={openCreateFlow}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[#1877f2] px-3.5 py-2 text-[0.75rem] font-bold text-white shadow-[0_6px_18px_rgba(24,119,242,0.3)] transition hover:bg-[#166fe5]"
          >
            <Plus className="size-3.5" strokeWidth={2.5} aria-hidden />
            Add campaign
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="relative min-w-0 w-full max-w-md flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search campaigns..."
              className="w-full rounded-xl border border-[#e8edf5] bg-white py-2 pr-3 pl-9 text-[0.82rem] font-medium text-[#07111f] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/45 focus:ring-2 focus:ring-[#1877f2]/15"
            />
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#f4f8ff] px-2.5 py-1 text-[0.72rem] font-bold tabular-nums text-[#1877f2] ring-1 ring-[#1877f2]/12">
            <Sparkles className="size-3" aria-hidden />
            {hasActiveFilters
              ? `${filteredCampaigns.length} shown`
              : `${meta?.total ?? campaigns.length} total`}
          </span>
        </div>
      </div>
    </div>
  ) : null;

  const createCampaignsPanel = (
    <CreateCampaigns
      variant="inline"
      open={createOpen}
      businessId={businessId}
      defaultWebsiteUrl={business?.websiteUrl}
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
        }
      }}
      onComplete={handleCreateComplete}
    />
  );

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
      await queryClient.invalidateQueries({
        queryKey: ["business-activity-events", businessId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["business-activity-summary", businessId],
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
    }
  }

  return (
    <section className="rd-premium rd-premium--fill" aria-label="Campaigns">
      <OverviewAlertDialog
        open={submitError != null && !alertDismissed}
        message={submitError ?? ""}
        onClose={() => setAlertDismissed(true)}
      />

      <DeleteConfirmationDialog
        open={campaignPendingDelete != null}
        itemName={
          campaignPendingDelete?.campaignName?.trim() ||
          campaignPendingDelete?.offer?.trim() ||
          "this campaign"
        }
        title="Delete this campaign?"
        description={
          <>
            This permanently deletes{" "}
            <span className="font-semibold text-[#1877f2]">
              {campaignPendingDelete?.campaignName?.trim() ||
                campaignPendingDelete?.offer?.trim() ||
                "this campaign"}
            </span>
            , including its funnel, orders, and guests for this campaign. This
            cannot be undone.
          </>
        }
        confirmText="Delete campaign"
        checkboxLabel="Are you sure? This can't be undone."
        isLoading={isDeletingCampaign}
        onConfirm={() => {
          void handleConfirmDeleteCampaign();
        }}
        onCancel={() => {
          if (!isDeletingCampaign) {
            setCampaignPendingDelete(null);
          }
        }}
      />

      <div className="rd-premium-page">
        <article className={`${campaignsCardClass} rd-premium-panel`}>
          {campaignsToolbar}

          <div
            className={
              showCreateFlow
                ? "rd-premium-panel__body rd-premium-panel__body--center items-center px-4 py-8 sm:px-6"
                : "rd-premium-panel__body px-2.5 pt-4 pb-4 sm:px-3 sm:pt-5 sm:pb-5"
            }
          >
            {loading ? (
              <div className={campaignsGridClass}>
                {Array.from({ length: CAMPAIGNS_LOADING_SKELETON_COUNT }).map((_, i) => (
                  <div key={i} className={campaignCardWrapClass}>
                    <CampaignFunnelCardSkeleton />
                  </div>
                ))}
              </div>
            ) : error ? (
              <AsyncErrorRetry
                layout="inline"
                message={error}
                onRetry={() => void refetch()}
              />
            ) : showCreateFlow ? (
              <div className="flex w-full max-w-2xl justify-center">
                {createCampaignsPanel}
              </div>
            ) : showGrid ? (
              <motion.div
                key={`campaigns-page-${page}-${statusFilter}-${searchQuery}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: standardEase }}
              >
                <div className={campaignsGridClass}>
                  {pagedCampaigns.map((funnel) => (
                    <div key={funnel.id} className={campaignCardWrapClass}>
                      <CampaignFunnelCard
                        funnel={funnel}
                        businessId={businessId}
                        onDeleteRequest={setCampaignPendingDelete}
                      />
                    </div>
                  ))}
                </div>

                {totalFilteredPages > 1 ? (
                  <div className="mx-auto mt-5 w-full max-w-3xl overflow-hidden rounded-[1rem] border border-[#e8edf5] bg-[#f8fafc]/50">
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
            ) : showNoCampaignsForFilter ? (
              <CampaignsFilterEmptyState
                message={emptyFilterMessage}
                onCreate={openCreateFlow}
                onClearFilters={clearFilters}
                showClearFilters={hasActiveFilters}
              />
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
