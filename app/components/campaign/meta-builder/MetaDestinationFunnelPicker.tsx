"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ExternalLink, ImageIcon, Layers } from "lucide-react";
import {
  isFunnelPublished,
  toDealiooPublicAdsUrl,
} from "@/app/components/google-ads/campaign-builder/destination";
import { useCampaignsByBusinessQuery } from "@/app/hooks/use-campaigns-by-business-query";
import { buildFunnelLandingTrackingUrl } from "@/app/lib/funnel-public-path";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import type { Funnel } from "@/app/services/funnel/get-campaigns-by-business";

type MetaDestinationFunnelPickerProps = {
  businessId: number;
  selectedFunnelId: number | null;
  destinationUrl: string;
  error?: string;
  onSelect: (payload: {
    funnelId: number;
    funnelName: string;
    destinationUrl: string;
  }) => void;
};

function FunnelOptionImage({ funnel }: { funnel: Funnel }) {
  const src = resolveUploadImageUrl(funnel.imageUrl?.trim() ?? "");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [funnel.id, src]);

  if (!src || failed) {
    return (
      <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#eef3fb] text-[#1877F2]">
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

export function resolveMetaFunnelDestinationUrl(
  funnel: Funnel,
  businessId: number,
): string {
  return toDealiooPublicAdsUrl(
    buildFunnelLandingTrackingUrl({
      funnelId: funnel.id,
      campaignId: funnel.id,
      businessId,
      price: funnel.price,
      campaignType: funnel.campaignType,
    }),
  );
}

export function MetaDestinationFunnelPicker({
  businessId,
  selectedFunnelId,
  destinationUrl,
  error,
  onSelect,
}: MetaDestinationFunnelPickerProps) {
  const { data: funnels, isLoading } = useCampaignsByBusinessQuery(businessId, {
    page: 1,
    limit: 50,
  });

  const publishedFunnels = useMemo(
    () => funnels.filter(isFunnelPublished),
    [funnels],
  );

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const didAutoSelectRef = useRef(false);

  useEffect(() => {
    if (publishedFunnels.length === 0) return;

    if (selectedFunnelId != null) {
      const stillThere = publishedFunnels.some((f) => f.id === selectedFunnelId);
      if (stillThere) return;
    }

    const currentUrl = destinationUrl.trim();
    if (currentUrl) {
      const matched = publishedFunnels.find(
        (funnel) =>
          resolveMetaFunnelDestinationUrl(funnel, businessId) === currentUrl,
      );
      if (matched) {
        if (selectedFunnelId !== matched.id) {
          onSelectRef.current({
            funnelId: matched.id,
            funnelName: matched.campaignName,
            destinationUrl: currentUrl,
          });
        }
        return;
      }
      return;
    }

    if (didAutoSelectRef.current) return;
    didAutoSelectRef.current = true;
    const first = publishedFunnels[0];
    onSelectRef.current({
      funnelId: first.id,
      funnelName: first.campaignName,
      destinationUrl: resolveMetaFunnelDestinationUrl(first, businessId),
    });
  }, [businessId, destinationUrl, publishedFunnels, selectedFunnelId]);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#1877F2]">
          <Layers className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-bold text-[#07111f]">
            Choose a Dealioo campaign
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Tap a published campaign — we fill the destination link for you.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading campaigns…</p>
      ) : publishedFunnels.length === 0 ? (
        <p className="rounded-xl border border-[#e8edf5] bg-[#f4f8ff]/80 px-4 py-3 text-sm text-slate-500">
          No published campaigns yet. Publish a Dealioo funnel to continue.
        </p>
      ) : (
        <div className="grid gap-2">
          {publishedFunnels.map((funnel) => {
            const selected = selectedFunnelId === funnel.id;
            return (
              <button
                key={funnel.id}
                type="button"
                onClick={() =>
                  onSelect({
                    funnelId: funnel.id,
                    funnelName: funnel.campaignName,
                    destinationUrl: resolveMetaFunnelDestinationUrl(
                      funnel,
                      businessId,
                    ),
                  })
                }
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                  selected
                    ? "border-[#1877F2] bg-white ring-1 ring-[#1877F2]"
                    : "border-[#e8edf5] bg-white hover:border-[#1877F2]/50"
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
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-white">
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
          <p className="min-w-0 flex-1 truncate text-xs text-slate-600" title={destinationUrl}>
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

      {error ? (
        <p className="text-sm font-medium text-red-500">{error}</p>
      ) : null}
    </div>
  );
}
