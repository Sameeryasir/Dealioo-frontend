"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  BuilderField,
  builderInputClass,
} from "@/app/components/campaign/meta-builder/builder-ui";
import type {
  BidStrategyId,
  CampaignTypeId,
  GoogleCampaignBuilderDraft,
} from "@/app/components/google-ads/campaign-builder/types";

type AdvancedOptionsProps = {
  draft: GoogleCampaignBuilderDraft;
  onChange: (patch: Partial<GoogleCampaignBuilderDraft>) => void;
};

const CAMPAIGN_TYPES: { id: CampaignTypeId; label: string }[] = [
  { id: "SEARCH", label: "Search" },
  { id: "DISPLAY", label: "Display" },
  { id: "PERFORMANCE_MAX", label: "Performance Max" },
];

const BID_STRATEGIES: { id: BidStrategyId; label: string }[] = [
  { id: "MAXIMIZE_CLICKS", label: "Get the most clicks" },
  { id: "MAXIMIZE_CONVERSIONS", label: "Get the most conversions" },
  { id: "MANUAL_CPC", label: "Set my own click bids" },
  { id: "TARGET_CPA", label: "Target cost per conversion" },
  { id: "TARGET_ROAS", label: "Target return on ad spend" },
];

const DEVICE_OPTIONS = ["Mobile", "Desktop", "Tablet"];
const NETWORK_OPTIONS = ["Google Search", "Search partners", "Display Network"];

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function AdvancedOptions({ draft, onChange }: AdvancedOptionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#f8fafc]"
        aria-expanded={open}
      >
        <div>
          <p className="text-sm font-bold text-[#07111f]">Advanced Options</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Optional settings for bidding, schedule, devices, and tracking
          </p>
        </div>
        <ChevronDown
          className={`size-4 text-slate-500 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="space-y-4 border-t border-[#e8edf5] p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <BuilderField label="Campaign type" hint="Usually Search is best for text ads.">
              <select
                className={builderInputClass}
                value={draft.campaignType}
                onChange={(e) =>
                  onChange({ campaignType: e.target.value as CampaignTypeId })
                }
              >
                {CAMPAIGN_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </BuilderField>
            <BuilderField label="Bidding focus">
              <select
                className={builderInputClass}
                value={draft.bidStrategy}
                onChange={(e) =>
                  onChange({ bidStrategy: e.target.value as BidStrategyId })
                }
              >
                {BID_STRATEGIES.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.label}
                  </option>
                ))}
              </select>
            </BuilderField>
          </div>

          {(draft.bidStrategy === "TARGET_CPA" ||
            draft.bidStrategy === "TARGET_ROAS") && (
            <div className="grid gap-4 sm:grid-cols-2">
              {draft.bidStrategy === "TARGET_CPA" ? (
                <BuilderField label="Target cost per conversion ($)">
                  <input
                    className={builderInputClass}
                    inputMode="decimal"
                    value={draft.targetCpa}
                    onChange={(e) => onChange({ targetCpa: e.target.value })}
                    placeholder="25.00"
                  />
                </BuilderField>
              ) : null}
              {draft.bidStrategy === "TARGET_ROAS" ? (
                <BuilderField label="Target return on ad spend (%)">
                  <input
                    className={builderInputClass}
                    inputMode="decimal"
                    value={draft.targetRoas}
                    onChange={(e) => onChange({ targetRoas: e.target.value })}
                    placeholder="400"
                  />
                </BuilderField>
              ) : null}
            </div>
          )}

          <BuilderField
            label="Ad schedule"
            hint="Leave blank to run all day, every day."
          >
            <input
              className={builderInputClass}
              value={draft.adSchedule}
              onChange={(e) => onChange({ adSchedule: e.target.value })}
              placeholder="e.g. Mon–Fri 9am–6pm"
            />
          </BuilderField>

          <BuilderField label="Devices">
            <div className="flex flex-wrap gap-2">
              {DEVICE_OPTIONS.map((device) => {
                const selected = draft.deviceTargeting.includes(device);
                return (
                  <button
                    key={device}
                    type="button"
                    onClick={() =>
                      onChange({
                        deviceTargeting: toggleInList(
                          draft.deviceTargeting,
                          device,
                        ),
                      })
                    }
                    className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                      selected
                        ? "border-[#1877f2] bg-[#e8f2ff] text-[#1877f2]"
                        : "border-[#e8edf5] bg-white text-[#07111f] hover:bg-[#f4f8ff]"
                    }`}
                  >
                    {device}
                  </button>
                );
              })}
            </div>
          </BuilderField>

          <BuilderField label="Where ads can show">
            <div className="flex flex-wrap gap-2">
              {NETWORK_OPTIONS.map((network) => {
                const selected = draft.networkSelection.includes(network);
                return (
                  <button
                    key={network}
                    type="button"
                    onClick={() =>
                      onChange({
                        networkSelection: toggleInList(
                          draft.networkSelection,
                          network,
                        ),
                      })
                    }
                    className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                      selected
                        ? "border-[#1877f2] bg-[#e8f2ff] text-[#1877f2]"
                        : "border-[#e8edf5] bg-white text-[#07111f] hover:bg-[#f4f8ff]"
                    }`}
                  >
                    {network}
                  </button>
                );
              })}
            </div>
          </BuilderField>

          <div className="grid gap-4 sm:grid-cols-2">
            <BuilderField label="IP exclusions" hint="Optional. One per line.">
              <textarea
                className={`${builderInputClass} min-h-[88px]`}
                value={draft.ipExclusions}
                onChange={(e) => onChange({ ipExclusions: e.target.value })}
                placeholder="203.0.113.0"
              />
            </BuilderField>
            <BuilderField label="URL tracking parameters">
              <input
                className={builderInputClass}
                value={draft.urlTrackingParams}
                onChange={(e) => onChange({ urlTrackingParams: e.target.value })}
                placeholder="utm_source=google&utm_medium=cpc"
              />
            </BuilderField>
          </div>

          <BuilderField label="Conversion goals" hint="Optional notes for your team.">
            <input
              className={builderInputClass}
              value={draft.conversionGoals}
              onChange={(e) => onChange({ conversionGoals: e.target.value })}
              placeholder="Purchases, form fills, calls"
            />
          </BuilderField>

          <div className="grid gap-4 sm:grid-cols-2">
            <BuilderField label="Brand exclusions">
              <input
                className={builderInputClass}
                value={draft.brandExclusions}
                onChange={(e) => onChange({ brandExclusions: e.target.value })}
                placeholder="Competitor brands to avoid"
              />
            </BuilderField>
            <BuilderField
              label="Frequency capping (Display)"
              hint="Optional. How often someone can see your ad."
            >
              <input
                className={builderInputClass}
                value={draft.frequencyCapping}
                onChange={(e) => onChange({ frequencyCapping: e.target.value })}
                placeholder="e.g. 3 impressions / day"
              />
            </BuilderField>
          </div>

          <BuilderField label="Content exclusions">
            <input
              className={builderInputClass}
              value={draft.contentExclusions}
              onChange={(e) => onChange({ contentExclusions: e.target.value })}
              placeholder="Topics or categories to avoid"
            />
          </BuilderField>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-4 py-3">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-slate-300 text-[#1877f2] focus:ring-[#1877f2]"
              checked={draft.audienceExpansion}
              onChange={(e) =>
                onChange({ audienceExpansion: e.target.checked })
              }
            />
            <span>
              <span className="block text-sm font-bold text-[#07111f]">
                Audience expansion
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Let the system find similar people beyond your selected audiences
              </span>
            </span>
          </label>
        </div>
      ) : null}
    </div>
  );
}
