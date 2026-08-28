"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileEdit,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Rocket,
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

function stepProgress(draft: MetaCampaignDraft): number {
  const step = Math.min(Math.max(draft.currentStep || 1, 1), 4);
  return (step / 4) * 100;
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

function BucketIcon({ bucket }: { bucket: DraftBucket }) {
  if (bucket === "published") {
    return <CheckCircle2 className="size-4" aria-hidden />;
  }
  if (bucket === "publishing") {
    return <Loader2 className="size-4 animate-spin" aria-hidden />;
  }
  if (bucket === "failed") {
    return <AlertCircle className="size-4" aria-hidden />;
  }
  return <FileEdit className="size-4" aria-hidden />;
}

function badgeClass(bucket: DraftBucket): string {
  if (bucket === "published") return "bg-emerald-50 text-emerald-700";
  if (bucket === "publishing") return "bg-[#e8f2ff] text-[#1877f2]";
  if (bucket === "failed") return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
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
        className="absolute inset-0 bg-[#07111f]/40 backdrop-blur-[1px]"
        aria-label="Close draft picker"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="meta-draft-picker-title"
        className="relative z-10 flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-[#e8edf5] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#e8edf5] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#1877f2]">
              Meta Ads
            </p>
            <h2
              id="meta-draft-picker-title"
              className="mt-0.5 text-lg font-extrabold tracking-tight text-[#07111f]"
            >
              Your Meta campaigns
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create new, continue a draft, or open published campaigns.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#e8edf5] bg-white p-2 text-slate-500 transition hover:bg-[#f4f8ff] hover:text-[#1877f2]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 border-b border-[#e8edf5] px-5 py-4">
          <button
            type="button"
            onClick={() => onSelect({ type: "create" })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#166fe5]"
          >
            <Plus className="size-4" aria-hidden />
            Create new campaign
          </button>

          <div className="flex flex-wrap gap-1.5">
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
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  filter === tab.key
                    ? "bg-[#e8f2ff] text-[#1877f2]"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
                <span className="ml-1 tabular-nums text-slate-400">
                  {tab.value}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-[#e8edf5] px-5 py-2.5">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
            {filter === "all" ? "All campaigns" : BUCKET_TITLE[filter]}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1877f2] hover:underline disabled:opacity-60"
          >
            <RefreshCw
              className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
              aria-hidden
            />
            Refresh
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin text-[#1877f2]" />
              Loading campaigns…
            </div>
          ) : null}

          {error ? (
            <div
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-2 text-xs font-semibold underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : null}

          {deleteError ? (
            <div
              className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>{deleteError}</p>
            </div>
          ) : null}

          {!isLoading && !error && drafts.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#1877f2]">
                <Megaphone className="size-5" aria-hidden />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#07111f]">
                No Meta campaigns yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Create a new campaign to get started.
              </p>
            </div>
          ) : null}

          {!isLoading && !error
            ? visibleBuckets.map((bucket) => {
                const items = grouped[bucket];
                if (items.length === 0) return null;
                return (
                  <section key={bucket} className="mb-5 last:mb-0">
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                      {BUCKET_TITLE[bucket]}
                      <span className="ml-1.5 font-semibold text-slate-400">
                        ({items.length})
                      </span>
                    </h3>
                    <ul className="space-y-2">
                      {items.map((draft) => {
                        const thumb = draftThumb(draft);
                        const objective = objectiveLabel(draft);
                        const updated = relativeTime(
                          draft.updatedAt || draft.lastSavedAt,
                        );
                        return (
                          <li
                            key={draft.id}
                            className="rounded-xl border border-[#e8edf5] bg-white p-3.5 transition hover:border-[#c9d8f0]"
                          >
                            <div className="flex gap-3">
                              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f4f8ff] text-[#1877f2]">
                                {thumb ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={thumb}
                                    alt=""
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <BucketIcon bucket={bucket} />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-bold text-[#07111f]">
                                    {draftDisplayName(draft)}
                                  </p>
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeClass(bucket)}`}
                                  >
                                    {BUCKET_TITLE[bucket]}
                                  </span>
                                </div>

                                <p className="mt-1 text-xs text-slate-500">
                                  {stepLabel(draft)}
                                  {objective ? ` · ${objective}` : ""}
                                  {updated ? ` · ${updated}` : ""}
                                </p>

                                {(bucket === "draft" ||
                                  bucket === "failed" ||
                                  (bucket === "publishing" &&
                                    typeof draft.publishProgress ===
                                      "number")) && (
                                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className={`h-full rounded-full ${
                                        bucket === "failed"
                                          ? "bg-red-400"
                                          : "bg-[#1877f2]"
                                      }`}
                                      style={{
                                        width: `${
                                          bucket === "publishing" &&
                                          typeof draft.publishProgress ===
                                            "number"
                                            ? Math.min(
                                                100,
                                                Math.max(
                                                  0,
                                                  draft.publishProgress,
                                                ),
                                              )
                                            : stepProgress(draft)
                                        }%`,
                                      }}
                                    />
                                  </div>
                                )}

                                {draft.errorMessage?.trim() &&
                                bucket === "failed" ? (
                                  <p className="mt-1.5 line-clamp-2 text-xs text-red-600">
                                    {draft.errorMessage}
                                  </p>
                                ) : null}

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  {bucket === "draft" ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onSelect({ type: "continue", draft })
                                      }
                                      className="rounded-lg border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-semibold text-[#1877f2] transition hover:bg-[#f4f8ff]"
                                    >
                                      Continue editing
                                    </button>
                                  ) : null}

                                  {bucket === "failed" ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onSelect({ type: "retry", draft })
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1877f2] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#166fe5]"
                                      >
                                        <Rocket
                                          className="size-3.5"
                                          aria-hidden
                                        />
                                        Retry publish
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onSelect({ type: "continue", draft })
                                        }
                                        className="rounded-lg border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-[#f4f8ff]"
                                      >
                                        Continue editing
                                      </button>
                                    </>
                                  ) : null}

                                  {bucket === "publishing" ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onSelect({ type: "progress", draft })
                                      }
                                      className="rounded-lg border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-semibold text-[#1877f2] transition hover:bg-[#f4f8ff]"
                                    >
                                      View progress
                                    </button>
                                  ) : null}

                                  {bucket === "published" ? (
                                    <a
                                      href={adsManagerUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-semibold text-[#1877f2] transition hover:bg-[#f4f8ff]"
                                    >
                                      Open in Meta Ads Manager
                                      <ExternalLink
                                        className="size-3.5"
                                        aria-hidden
                                      />
                                    </a>
                                  ) : null}

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
                                      className="ml-auto rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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
                              </div>
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
          <span className="font-semibold text-[#1877f2]">
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
