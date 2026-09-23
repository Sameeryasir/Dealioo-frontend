"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ExternalLink, ImageIcon, Layers } from "lucide-react";
import { useCampaignsByBusinessQuery } from "@/app/hooks/use-campaigns-by-business-query";
import {
  applyFunnelDestination,
  isFunnelPublished,
  resolveCampaignDestinationUrl,
  withSyncedAdFinalUrl,
} from "@/app/components/google-ads/campaign-builder/destination";
import { Panel } from "@/app/components/google-ads/campaign-builder/builder-controls";
import type { GoogleCampaignBuilderDraft } from "@/app/components/google-ads/campaign-builder/types";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import type { Funnel } from "@/app/services/funnel/get-campaigns-by-business";

type DestinationPickerProps = {
  businessId: number;
  draft: GoogleCampaignBuilderDraft;
  errors: Record<string, string>;
  onChange: (patch: Partial<GoogleCampaignBuilderDraft>) => void;
  title?: string;
  mode?: "landing";
};

function FunnelOptionImage({ funnel }: { funnel: Funnel }) {
  const src = resolveUploadImageUrl(funnel.imageUrl?.trim() ?? "");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [funnel.id, src]);

  if (!src || failed) {
    return (
      <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#eef3fb] text-[#4285F4]">
        <ImageIcon className="size-5" aria-hidden />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-[#e8edf5]"
      onError={() => setFailed(true)}
    />
  );
}

export function DestinationPicker({
  businessId,
  draft,
  errors,
  onChange,
  title = "Choose a Dealioo funnel",
  mode = "landing",
}: DestinationPickerProps) {
  const { data: funnels, isLoading } = useCampaignsByBusinessQuery(businessId, {
    page: 1,
    limit: 50,
  });

  const publishedFunnels = useMemo(
    () => funnels.filter(isFunnelPublished),
    [funnels],
  );

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const didAutoSelectRef = useRef(false);

  const patch = (next: Partial<GoogleCampaignBuilderDraft>) => {
    onChangeRef.current(withSyncedAdFinalUrl(draftRef.current, next));
  };

  useEffect(() => {
    if (publishedFunnels.length === 0) return;

    const current = draftRef.current;
    if (current.selectedFunnelId != null) {
      const stillThere = publishedFunnels.some(
        (f) => f.id === current.selectedFunnelId,
      );
      if (stillThere) {
        if (current.destinationType !== "dealioo_funnel") {
          const match = publishedFunnels.find(
            (f) => f.id === current.selectedFunnelId,
          );
          if (match) patch(applyFunnelDestination(match, businessId));
        }
        return;
      }
    }

    if (didAutoSelectRef.current) return;
    didAutoSelectRef.current = true;
    patch(applyFunnelDestination(publishedFunnels[0], businessId));
  }, [businessId, publishedFunnels]);

  if (mode !== "landing") return null;

  const destinationUrl = resolveCampaignDestinationUrl(draft);
  const pickerError =
    errors.destinationType || errors.websiteUrl || errors.landingPageUrl;

  return (
    <Panel className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
          <Layers className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-bold text-[#07111f]">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Tap a published Dealioo funnel — we fill the Google Ads destination
            link for you.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading funnels…</p>
      ) : publishedFunnels.length === 0 ? (
        <p className="rounded-xl border border-[#e8edf5] bg-[#f4f8ff]/80 px-4 py-3 text-sm text-slate-500">
          No published funnels yet. Publish a Dealioo funnel to continue.
        </p>
      ) : (
        <div className="grid gap-2">
          {publishedFunnels.map((funnel) => {
            const selected = draft.selectedFunnelId === funnel.id;
            return (
              <button
                key={funnel.id}
                type="button"
                onClick={() =>
                  patch(applyFunnelDestination(funnel, businessId))
                }
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                  selected
                    ? "border-[#4285F4] bg-white ring-1 ring-[#4285F4]"
                    : "border-[#e8edf5] bg-white hover:border-[#4285F4]/50"
                }`}
              >
                <FunnelOptionImage funnel={funnel} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#07111f]">
                    {funnel.campaignName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {funnel.offer?.trim()
                      ? funnel.offer.trim()
                      : "Sales Funnel · Published"}
                  </p>
                </div>
                {selected ? (
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#4285F4] text-white">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {destinationUrl.trim() ? (
        <div className="flex items-start gap-2 rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-3 py-2.5">
          <p
            className="min-w-0 flex-1 truncate text-xs text-slate-600"
            title={destinationUrl}
          >
            <span className="font-semibold text-[#07111f]">Link: </span>
            {destinationUrl}
          </p>
          <a
            href={destinationUrl.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[#e8edf5] bg-white px-2 py-1 text-slate-500 hover:bg-[#f4f8ff]"
            aria-label="Open destination URL"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      ) : null}

      {pickerError ? (
        <p className="text-sm font-medium text-red-500">{pickerError}</p>
      ) : null}
    </Panel>
  );
}
