"use client";

import { useEffect } from "react";
import { Check, Layers, Link2 } from "lucide-react";
import { useCampaignsByBusinessQuery } from "@/app/hooks/use-campaigns-by-business-query";
import {
  applyFunnelDestination,
  isFunnelPublished,
  withSyncedAdFinalUrl,
} from "@/app/components/google-ads/campaign-builder/destination";
import {
  Panel,
  SelectableCard,
} from "@/app/components/google-ads/campaign-builder/builder-controls";
import type { GoogleCampaignBuilderDraft } from "@/app/components/google-ads/campaign-builder/types";

type DestinationPickerProps = {
  businessId: number;
  draft: GoogleCampaignBuilderDraft;
  errors: Record<string, string>;
  onChange: (patch: Partial<GoogleCampaignBuilderDraft>) => void;
  title?: string;
  mode?: "landing";
};

export function DestinationPicker({
  businessId,
  draft,
  errors,
  onChange,
  title = "Where should customers go after clicking your ad?",
  mode = "landing",
}: DestinationPickerProps) {
  const { data: funnels, isLoading } = useCampaignsByBusinessQuery(businessId, {
    page: 1,
    limit: 50,
  });

  const publishedFunnels = funnels.filter(isFunnelPublished);
  const isFunnel = draft.destinationType === "dealioo_funnel";

  const patch = (next: Partial<GoogleCampaignBuilderDraft>) => {
    onChange(withSyncedAdFinalUrl(draft, next));
  };

  // Only Dealioo funnel is allowed — clear any old "My Website" selection
  useEffect(() => {
    if (draft.destinationType !== "external_website") return;
    const first = publishedFunnels[0];
    if (first) {
      patch(applyFunnelDestination(first, businessId));
      return;
    }
    patch({
      destinationType: "dealioo_funnel",
      selectedFunnelId: null,
      selectedFunnelName: "",
    });
  }, [businessId, draft.destinationType, publishedFunnels.length]);

  if (mode !== "landing") return null;

  return (
    <Panel className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
          <Link2 className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-bold text-[#07111f]">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            We’ll send people to a published Dealioo funnel and connect the URL
            for you.
          </p>
        </div>
      </div>

      <SelectableCard
        selectionMode="radio"
        selected={isFunnel}
        title="Dealioo Funnel"
        description="Use one of your published Dealioo funnels."
        badge="Recommended"
        icon={<Layers className="size-5" aria-hidden />}
        onClick={() => {
          const first = publishedFunnels[0];
          if (first) {
            patch(applyFunnelDestination(first, businessId));
          } else {
            patch({
              destinationType: "dealioo_funnel",
              selectedFunnelId: null,
              selectedFunnelName: "",
            });
          }
        }}
      />

      {isFunnel ? (
        <div className="space-y-3 rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4">
          <p className="text-sm font-bold text-[#07111f]">Published funnels</p>
          {isLoading ? (
            <p className="text-sm text-slate-500">Loading funnels…</p>
          ) : publishedFunnels.length === 0 ? (
            <p className="text-sm text-slate-500">
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
                    className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      selected
                        ? "border-[#4285F4] bg-white ring-1 ring-[#4285F4]"
                        : "border-[#e8edf5] bg-white hover:border-[#4285F4]/50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#07111f]">
                        {funnel.campaignName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Sales Funnel · Published
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
          {errors.destinationType ||
          errors.websiteUrl ||
          errors.landingPageUrl ? (
            <p className="text-sm font-medium text-red-500">
              {errors.destinationType ||
                errors.websiteUrl ||
                errors.landingPageUrl}
            </p>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}
