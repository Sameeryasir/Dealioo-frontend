"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileEdit,
  Loader2,
  Plus,
  RefreshCw,
  Rocket,
  Target,
  X,
} from "lucide-react";
import {
  STEP_TITLES,
  TOTAL_WIZARD_STEPS,
} from "@/app/components/google-ads/campaign-builder/types";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import { useGoogleCampaignDraftsQuery } from "@/app/hooks/use-google-campaign-drafts-query";
import type { GoogleCampaignDraftListItem } from "@/app/services/google-ads/google-campaign-draft";

export type GoogleDraftPickerAction =
  | { type: "create" }
  | { type: "continue"; draft: GoogleCampaignDraftListItem }
  | { type: "retry"; draft: GoogleCampaignDraftListItem }
  | { type: "progress"; draft: GoogleCampaignDraftListItem };

type GoogleDraftPickerProps = {
  open: boolean;
  businessId: number;
  adsConsoleUrl?: string | null;
  onClose: () => void;
  onSelect: (action: GoogleDraftPickerAction) => void;
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

function draftBucket(draft: GoogleCampaignDraftListItem): DraftBucket {
  const status = (draft.status ?? "").toUpperCase();
  const publishStatus = (draft.publishStatus ?? "").toUpperCase();

  if (status === "PUBLISHED" || publishStatus === "PUBLISHED") {
    return "published";
  }
  if (
    status === "PUBLISHING" ||
    status === "VALIDATING" ||
    publishStatus === "QUEUED" ||
    publishStatus === "PUBLISHING"
  ) {
    return "publishing";
  }
  if (status === "FAILED" || publishStatus === "FAILED") {
    return "failed";
  }
  return "draft";
}

function draftDisplayName(draft: GoogleCampaignDraftListItem): string {
  return draft.campaignName?.trim() || "Untitled campaign";
}

function stepLabel(draft: GoogleCampaignDraftListItem): string {
  const step = Math.min(
    Math.max(draft.currentStep || 1, 1),
    TOTAL_WIZARD_STEPS,
  );
  const title = STEP_TITLES[step - 1] ?? "Campaign";
  return `Step ${step} of ${TOTAL_WIZARD_STEPS} · ${title}`;
}

function stepProgress(draft: GoogleCampaignDraftListItem): number {
  const step = Math.min(
    Math.max(draft.currentStep || 1, 1),
    TOTAL_WIZARD_STEPS,
  );
  return (step / TOTAL_WIZARD_STEPS) * 100;
}

function goalLabel(draft: GoogleCampaignDraftListItem): string | null {
  const raw = draft.goal?.trim();
  if (!raw) return null;
  return raw
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function draftThumb(draft: GoogleCampaignDraftListItem): string | null {
  const raw = draft.logoPreviewUrl?.trim() || "";
  if (!raw) return null;
  return resolveUploadImageUrl(raw) || raw;
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
  if (bucket === "publishing") return "bg-[#e8f0fe] text-[#1a73e8]";
  if (bucket === "failed") return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
}

export function GoogleDraftPicker({
  open,
  businessId,
  adsConsoleUrl,
  onClose,
  onSelect,
}: GoogleDraftPickerProps) {
  const { data: drafts, isLoading, error, refetch, isFetching } =
    useGoogleCampaignDraftsQuery(businessId, { enabled: true });
  const [filter, setFilter] = useState<DraftBucket | "all">("all");

  const grouped = useMemo(() => {
    const map: Record<DraftBucket, GoogleCampaignDraftListItem[]> = {
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

  const consoleUrl =
    adsConsoleUrl?.trim() || "https://ads.google.com/aw/campaigns";

  if (!open) return null;

  return (
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
        aria-labelledby="google-draft-picker-title"
        className="relative z-10 flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-[#e8edf5] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#e8edf5] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#1a73e8]">
              Google Ads
            </p>
            <h2
              id="google-draft-picker-title"
              className="mt-0.5 text-lg font-extrabold tracking-tight text-[#07111f]"
            >
              Your Google campaigns
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create new, continue a draft, or open published campaigns.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#e8edf5] bg-white p-2 text-slate-500 transition hover:bg-[#f8fbff] hover:text-[#1a73e8]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 border-b border-[#e8edf5] px-5 py-4">
          <button
            type="button"
            onClick={() => onSelect({ type: "create" })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a73e8] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1765cc]"
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
                    ? "bg-[#e8f0fe] text-[#1a73e8]"
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a73e8] hover:underline disabled:opacity-60"
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
              <Loader2 className="size-4 animate-spin text-[#1a73e8]" />
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

          {!isLoading && !error && drafts.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-[#f8fbff] text-[#1a73e8]">
                <Target className="size-5" aria-hidden />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#07111f]">
                No Google campaigns yet
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
                        const goal = goalLabel(draft);
                        const updated = relativeTime(
                          draft.updatedAt || draft.lastSavedAt,
                        );
                        return (
                          <li
                            key={draft.id}
                            className="rounded-xl border border-[#e8edf5] bg-white p-3.5 transition hover:border-[#c9d8f0]"
                          >
                            <div className="flex gap-3">
                              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f8fbff] text-[#1a73e8]">
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
                                  {goal ? ` · ${goal}` : ""}
                                  {draft.selectedFunnelName?.trim()
                                    ? ` · ${draft.selectedFunnelName.trim()}`
                                    : ""}
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
                                          : "bg-[#1a73e8]"
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

                                <div className="mt-3 flex flex-wrap gap-2">
                                  {bucket === "draft" ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onSelect({ type: "continue", draft })
                                      }
                                      className="rounded-lg border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-semibold text-[#1a73e8] transition hover:bg-[#f8fbff]"
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
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a73e8] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#1765cc]"
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
                                        className="rounded-lg border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-[#f8fbff]"
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
                                      className="rounded-lg border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-semibold text-[#1a73e8] transition hover:bg-[#f8fbff]"
                                    >
                                      View progress
                                    </button>
                                  ) : null}

                                  {bucket === "published" ? (
                                    <a
                                      href={consoleUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-semibold text-[#1a73e8] transition hover:bg-[#f8fbff]"
                                    >
                                      Open in Google Ads
                                      <ExternalLink
                                        className="size-3.5"
                                        aria-hidden
                                      />
                                    </a>
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
  );
}
