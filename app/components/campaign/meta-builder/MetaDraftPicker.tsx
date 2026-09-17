"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import type { MetaCampaignDraft } from "@/app/lib/meta-campaign-builder-types";
import {
  BUILDER_STEPS,
  buildMetaAdsManagerUrl,
} from "@/app/lib/meta-campaign-builder-types";
import {
  clearMetaDraftLocalState,
  readActiveMetaDraftId,
} from "@/app/lib/meta-active-draft-storage";
import { resolveMetaImageUrl } from "@/app/lib/resolve-meta-image-url";
import { useMetaCampaignDraftsQuery } from "@/app/hooks/use-meta-campaign-drafts-query";
import { deleteMetaCampaignDraft } from "@/app/services/facebook/meta-campaign-draft";
import { DeleteConfirmationDialog } from "@/app/components/shared/DeleteConfirmationDialog";

export type MetaDraftPickerAction =
  | { type: "create" }
  | { type: "continue"; draft: MetaCampaignDraft }
  | { type: "retry"; draft: MetaCampaignDraft }
  | { type: "progress"; draft: MetaCampaignDraft };

type MetaDraftPickerProps = {
  open: boolean;
  businessId: number;
  metaAdAccountId?: string | null;
  onClose: () => void;
  onSelect: (action: MetaDraftPickerAction) => void;
};

type DraftBucket = "draft" | "publishing" | "failed" | "published";

const BUCKET_ORDER: DraftBucket[] = [
  "draft",
  "publishing",
  "failed",
  "published",
];

const BUCKET_TITLE: Record<DraftBucket, string> = {
  draft: "Drafts",
  publishing: "Publishing",
  failed: "Failed",
  published: "Published",
};

function draftBucket(draft: MetaCampaignDraft): DraftBucket {
  const status = (draft.status ?? "").toLowerCase();
  const publishStatus = (draft.publishStatus ?? "").toUpperCase();

  if (status === "published" || publishStatus === "PUBLISHED") {
    return "published";
  }
  if (
    status === "publishing" ||
    publishStatus === "QUEUED" ||
    publishStatus === "PUBLISHING" ||
    publishStatus === "RUNNING"
  ) {
    return "publishing";
  }
  if (status === "failed" || publishStatus === "FAILED") {
    return "failed";
  }
  return "draft";
}

function draftDisplayName(draft: MetaCampaignDraft): string {
  const name = draft.campaignData?.name?.trim();
  return name || "Untitled campaign";
}

function stepLabel(draft: MetaCampaignDraft): string {
  const step = Math.min(Math.max(draft.currentStep || 1, 1), 4);
  const label = BUILDER_STEPS.find((s) => s.id === step)?.label ?? "Campaign";
  return `Step ${step} of 4 · ${label}`;
}

function objectiveLabel(draft: MetaCampaignDraft): string | null {
  const raw = draft.campaignData?.objective?.trim();
  if (!raw) return null;
  return raw
    .replace(/^OUTCOME_/, "")
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function draftThumb(draft: MetaCampaignDraft): string | null {
  const creative = draft.adCreativeData;
  const raw =
    creative?.imageUrl?.trim() ||
    creative?.thumbnailUrl?.trim() ||
    creative?.carouselCards?.[0]?.imageUrl?.trim() ||
    "";
  if (!raw) return null;
  return resolveMetaImageUrl(raw) || raw;
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function statusTextClass(bucket: DraftBucket): string {
  if (bucket === "published") return "text-emerald-700";
  if (bucket === "publishing") return "text-[#1877f2]";
  if (bucket === "failed") return "text-red-600";
  return "text-slate-500";
}

export function MetaDraftPicker({
  open,
  businessId,
  metaAdAccountId,
  onClose,
  onSelect,
}: MetaDraftPickerProps) {
  const { data: drafts, isLoading, error, refetch, isFetching } =
    useMetaCampaignDraftsQuery(businessId, { enabled: open });
  const [filter, setFilter] = useState<DraftBucket | "all">("all");
  const [draftPendingDelete, setDraftPendingDelete] =
    useState<MetaCampaignDraft | null>(null);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<DraftBucket, MetaCampaignDraft[]> = {
      draft: [],
      publishing: [],
      failed: [],
      published: [],
    };
    for (const draft of drafts) {
      map[draftBucket(draft)].push(draft);
    }
    return map;
  }, [drafts]);

  const counts = useMemo(
    () => ({
      draft: grouped.draft.length,
      publishing: grouped.publishing.length,
      failed: grouped.failed.length,
      published: grouped.published.length,
    }),
    [grouped],
  );

  const visibleBuckets = useMemo(() => {
    if (filter === "all") return BUCKET_ORDER;
    return [filter];
  }, [filter]);

  const adsManagerUrl = metaAdAccountId
    ? buildMetaAdsManagerUrl(metaAdAccountId)
    : "https://www.facebook.com/adsmanager";

  const handleConfirmDeleteDraft = useCallback(async () => {
    if (!draftPendingDelete) return;
    const draft = draftPendingDelete;
    setDeletingDraftId(draft.id);
    setDeleteError(null);
    try {
      await deleteMetaCampaignDraft(businessId, draft.id);
      if (readActiveMetaDraftId(businessId) === draft.id) {
        clearMetaDraftLocalState(businessId);
      }
      setDraftPendingDelete(null);
      await refetch();
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : "Could not delete campaign draft.",
      );
    } finally {
      setDeletingDraftId(null);
    }
  }, [businessId, draftPendingDelete, refetch]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <button
          type="button"
          className="absolute inset-0 bg-black/30"
          aria-label="Close draft picker"
          onClick={onClose}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="meta-draft-picker-title"
          className="relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl sm:border sm:border-[#e8edf5]"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <h2
                id="meta-draft-picker-title"
                className="text-base font-semibold text-[#07111f]"
              >
                Meta campaigns
              </h2>
              <p className="text-xs text-slate-500">
                Create, continue, or open published ads.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-3 border-t border-[#eef2f7] px-4 py-3">
            <button
              type="button"
              onClick={() => onSelect({ type: "create" })}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1877f2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#166fe5]"
            >
              <Plus className="size-4" aria-hidden />
              Create new campaign
            </button>

            <div className="flex flex-wrap gap-1">
              {(
                [
                  { key: "all" as const, label: "All", value: drafts.length },
                  { key: "draft" as const, label: "Drafts", value: counts.draft },
                  {
                    key: "publishing" as const,
                    label: "Publishing",
                    value: counts.publishing,
                  },
                  {
                    key: "failed" as const,
                    label: "Failed",
                    value: counts.failed,
                  },
                  {
                    key: "published" as const,
                    label: "Published",
                    value: counts.published,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`rounded-md px-2 py-1 text-xs font-medium ${
                    filter === tab.key
                      ? "bg-[#e8f2ff] text-[#1877f2]"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label} {tab.value}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-2">
            <p className="text-xs font-medium text-slate-500">
              {filter === "all" ? "All campaigns" : BUCKET_TITLE[filter]}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-60"
              title="Refresh and sync with Meta Ads"
            >
              <RefreshCw
                className={`size-3 ${isFetching ? "animate-spin" : ""}`}
                aria-hidden
              />
              {isFetching ? "Syncing…" : "Refresh"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                Loading…
              </div>
            ) : null}

            {error ? (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-1 text-xs font-semibold underline"
                >
                  Try again
                </button>
              </div>
            ) : null}

            {deleteError ? (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {deleteError}
              </div>
            ) : null}

            {!isLoading && !error && drafts.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                No campaigns yet. Create one to get started.
              </p>
            ) : null}

            {!isLoading && !error
              ? visibleBuckets.map((bucket) => {
                  const items = grouped[bucket];
                  if (items.length === 0) return null;
                  return (
                    <section key={bucket} className="mb-4 last:mb-0">
                      <h3 className="mb-1.5 text-xs font-medium text-slate-500">
                        {BUCKET_TITLE[bucket]} ({items.length})
                      </h3>
                      <ul className="divide-y divide-[#eef2f7] rounded-lg border border-[#eef2f7]">
                        {items.map((draft) => {
                          const thumb = draftThumb(draft);
                          const objective = objectiveLabel(draft);
                          const updated = relativeTime(
                            draft.updatedAt || draft.lastSavedAt,
                          );
                          const initial = draftDisplayName(draft)
                            .charAt(0)
                            .toUpperCase();
                          return (
                            <li key={draft.id} className="px-3 py-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                                  <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8f2ff] text-xs font-semibold text-[#1877f2]">
                                    {thumb ? (
                                      <img
                                        src={thumb}
                                        alt=""
                                        className="size-full object-cover"
                                      />
                                    ) : (
                                      initial
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-[#07111f]">
                                    {draftDisplayName(draft)}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    <span className={statusTextClass(bucket)}>
                                      {BUCKET_TITLE[bucket]}
                                    </span>
                                    {" · "}
                                    {stepLabel(draft)}
                                    {objective ? ` · ${objective}` : ""}
                                    {updated ? ` · ${updated}` : ""}
                                  </p>
                                  {draft.errorMessage?.trim() &&
                                  bucket === "failed" ? (
                                    <p className="mt-1 line-clamp-2 text-xs text-red-600">
                                      {draft.errorMessage}
                                    </p>
                                  ) : null}
                                  </div>
                                </div>

                                {bucket === "draft" || bucket === "failed" ? (
                                  <button
                                    type="button"
                                    title="Delete draft"
                                    aria-label={`Delete ${draftDisplayName(draft)}`}
                                    disabled={deletingDraftId === draft.id}
                                    onClick={() => {
                                      setDeleteError(null);
                                      setDraftPendingDelete(draft);
                                    }}
                                    className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                  >
                                    {deletingDraftId === draft.id ? (
                                      <Loader2
                                        className="size-4 animate-spin"
                                        aria-hidden
                                      />
                                    ) : (
                                      <Trash2 className="size-4" aria-hidden />
                                    )}
                                  </button>
                                ) : null}
                              </div>

                              <div className="mt-2 flex flex-wrap gap-2">
                                {bucket === "draft" ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onSelect({ type: "continue", draft })
                                    }
                                    className="rounded-md bg-[#e8f2ff] px-2.5 py-1.5 text-xs font-semibold text-[#1877f2]"
                                  >
                                    Continue
                                  </button>
                                ) : null}

                                {bucket === "failed" ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onSelect({ type: "retry", draft })
                                      }
                                      className="rounded-md bg-[#1877f2] px-2.5 py-1.5 text-xs font-semibold text-white"
                                    >
                                      Retry publish
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onSelect({ type: "continue", draft })
                                      }
                                      className="rounded-md border border-[#e8edf5] px-2.5 py-1.5 text-xs font-medium text-slate-700"
                                    >
                                      Edit
                                    </button>
                                  </>
                                ) : null}

                                {bucket === "publishing" ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onSelect({ type: "progress", draft })
                                    }
                                    className="rounded-md border border-[#e8edf5] px-2.5 py-1.5 text-xs font-medium text-slate-700"
                                  >
                                    View progress
                                  </button>
                                ) : null}

                                {bucket === "published" ? (
                                  <a
                                    href={adsManagerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-md border border-[#e8edf5] px-2.5 py-1.5 text-xs font-medium text-slate-700"
                                  >
                                    Open in Ads Manager
                                    <ExternalLink className="size-3" aria-hidden />
                                  </a>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })
              : null}

            {!isLoading &&
            !error &&
            drafts.length > 0 &&
            visibleBuckets.every((bucket) => grouped[bucket].length === 0) ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Nothing in this status yet.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={draftPendingDelete != null}
        itemName={
          draftPendingDelete
            ? draftDisplayName(draftPendingDelete)
            : "this draft"
        }
        title="Delete this draft?"
        description={
          <>
            Are you sure you want to delete{" "}
            <span className="font-semibold">
              {draftPendingDelete
                ? draftDisplayName(draftPendingDelete)
                : "this draft"}
            </span>
            ? This only removes the Dealioo draft. It cannot be undone.
          </>
        }
        confirmText="Delete draft"
        checkboxLabel="I understand this draft will be permanently deleted."
        isLoading={deletingDraftId != null}
        onConfirm={() => {
          void handleConfirmDeleteDraft();
        }}
        onCancel={() => {
          if (deletingDraftId == null) {
            setDraftPendingDelete(null);
          }
        }}
      />
    </>
  );
}
