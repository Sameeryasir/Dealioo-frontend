"use client";

import { useMemo } from "react";
import {
  AlertCircle,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Rocket,
  X,
} from "lucide-react";
import type { MetaCampaignDraft } from "@/app/lib/meta-campaign-builder-types";
import {
  BUILDER_STEPS,
  buildMetaAdsManagerUrl,
} from "@/app/lib/meta-campaign-builder-types";
import {
  metaBuilderSecondaryButtonClass,
  metaBuilderShellClass,
} from "@/app/components/campaign/meta-builder/builder-ui";
import { useMetaCampaignDraftsQuery } from "@/app/hooks/use-meta-campaign-drafts-query";

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
  return `Step ${step}/4 · ${label}`;
}

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

function bucketBadgeClass(bucket: DraftBucket): string {
  if (bucket === "published") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }
  if (bucket === "publishing") {
    return "bg-[#e8f2ff] text-[#1877f2] ring-[#1877f2]/20";
  }
  if (bucket === "failed") {
    return "bg-red-50 text-red-700 ring-red-600/20";
  }
  return "bg-slate-100 text-slate-600 ring-slate-500/15";
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

  const adsManagerUrl = metaAdAccountId
    ? buildMetaAdsManagerUrl(metaAdAccountId)
    : "https://www.facebook.com/adsmanager";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-[#07111f]/45 backdrop-blur-[2px]"
        aria-label="Close draft picker"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="meta-draft-picker-title"
        className={`relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[#e8edf5] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] sm:rounded-2xl ${metaBuilderShellClass}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#e8edf5] bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#1877f2]">
              Meta campaign
            </p>
            <h2
              id="meta-draft-picker-title"
              className="mt-0.5 text-lg font-extrabold tracking-tight text-[#07111f]"
            >
              Create or continue
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Start fresh or pick up a saved draft.
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

        <div className="border-b border-[#e8edf5] bg-[#f4f8ff]/60 px-5 py-4">
          <button
            type="button"
            onClick={() => onSelect({ type: "create" })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-4 py-3 text-sm font-bold text-white shadow-[0_6px_18px_rgba(24,119,242,0.3)] transition hover:bg-[#166fe5]"
          >
            <Plus className="size-4" aria-hidden />
            Create New Campaign
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-[#e8edf5] px-5 py-2.5">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
            Saved drafts
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
              Loading drafts…
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
            <p className="py-8 text-center text-sm text-slate-500">
              No saved drafts yet. Create a new campaign to get started.
            </p>
          ) : null}

          {!isLoading && !error
            ? BUCKET_ORDER.map((bucket) => {
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
                      {items.map((draft) => (
                        <li
                          key={draft.id}
                          className="rounded-xl border border-[#e8edf5] bg-white p-3.5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-bold text-[#07111f]">
                                  {draftDisplayName(draft)}
                                </p>
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${bucketBadgeClass(bucket)}`}
                                >
                                  {BUCKET_TITLE[bucket]}
                                </span>
                              </div>
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                <FileText className="size-3.5 shrink-0" aria-hidden />
                                {stepLabel(draft)}
                              </p>
                              {draft.errorMessage?.trim() && bucket === "failed" ? (
                                <p className="mt-1 line-clamp-2 text-xs text-red-600">
                                  {draft.errorMessage}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {bucket === "draft" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onSelect({ type: "continue", draft })
                                }
                                className={metaBuilderSecondaryButtonClass}
                              >
                                Continue Editing
                              </button>
                            ) : null}

                            {bucket === "failed" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSelect({ type: "retry", draft })
                                  }
                                  className="rounded-xl bg-[#1877f2] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#166fe5]"
                                >
                                  <span className="inline-flex items-center gap-1.5">
                                    <Rocket className="size-3.5" aria-hidden />
                                    Retry Publish
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSelect({ type: "continue", draft })
                                  }
                                  className={metaBuilderSecondaryButtonClass}
                                >
                                  Continue Editing
                                </button>
                              </>
                            ) : null}

                            {bucket === "publishing" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onSelect({ type: "progress", draft })
                                }
                                className={metaBuilderSecondaryButtonClass}
                              >
                                View Progress
                              </button>
                            ) : null}

                            {bucket === "published" ? (
                              <a
                                href={adsManagerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[#1877F2]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#1877F2] shadow-sm transition hover:bg-[#1877F2]/5"
                              >
                                Open in Meta Ads Manager
                                <ExternalLink className="size-3.5" aria-hidden />
                              </a>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })
            : null}
        </div>
      </div>
    </div>
  );
}
