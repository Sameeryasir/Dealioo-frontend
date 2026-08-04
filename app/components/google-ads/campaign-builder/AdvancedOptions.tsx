"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { googleBuilderInputClass } from "@/app/components/google-ads/campaign-builder/google-builder-ui";
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

function AdvField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col gap-1.5">
      <div className="min-h-[2.85rem]">
        <p className="text-sm font-bold text-[#07111f]">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
          {hint || "\u00A0"}
        </p>
      </div>
      <div className="mt-auto w-full">{children}</div>
    </div>
  );
}

function ChipButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
        selected
          ? "border-[#4285F4] bg-[#e8f0fe] text-[#4285F4]"
          : "border-[#e8edf5] bg-white text-[#07111f] hover:bg-[#f4f8ff]"
      }`}
    >
      {label}
    </button>
  );
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
          <p className="text-sm font-bold text-[#07111f]">Advanced Settings</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Optional, expert-level settings — hidden by default. Most campaigns
            never need to touch these.
          </p>
        </div>
        <ChevronDown
          className={`size-4 text-slate-500 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="space-y-5 border-t border-[#e8edf5] p-5">
          <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
            <AdvField
              label="Campaign type"
              hint="Usually Search is best for text ads."
            >
              <select
                className={googleBuilderInputClass}
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
            </AdvField>
            <AdvField
              label="Bidding focus"
              hint="Choose how Google spends your budget."
            >
              <select
                className={googleBuilderInputClass}
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
            </AdvField>
          </div>

          {(draft.bidStrategy === "TARGET_CPA" ||
            draft.bidStrategy === "TARGET_ROAS") && (
            <div className="grid gap-4 sm:grid-cols-2">
              {draft.bidStrategy === "TARGET_CPA" ? (
                <AdvField label="Target cost per conversion ($)">
                  <input
                    className={googleBuilderInputClass}
                    inputMode="decimal"
                    value={draft.targetCpa}
                    onChange={(e) => onChange({ targetCpa: e.target.value })}
                    placeholder="25.00"
                  />
                </AdvField>
              ) : null}
              {draft.bidStrategy === "TARGET_ROAS" ? (
                <AdvField label="Target return on ad spend (%)">
                  <input
                    className={googleBuilderInputClass}
                    inputMode="decimal"
                    value={draft.targetRoas}
                    onChange={(e) => onChange({ targetRoas: e.target.value })}
                    placeholder="400"
                  />
                </AdvField>
              ) : null}
            </div>
          )}

          <AdvField
            label="Ad schedule"
            hint="Leave blank to run all day, every day."
          >
            <input
              className={googleBuilderInputClass}
              value={draft.adSchedule}
              onChange={(e) => onChange({ adSchedule: e.target.value })}
              placeholder="e.g. Mon–Fri 9am–6pm"
            />
          </AdvField>

          <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
            <AdvField label="Devices" hint="Pick where people can see your ads.">
              <div className="flex flex-wrap gap-2">
                {DEVICE_OPTIONS.map((device) => (
                  <ChipButton
                    key={device}
                    label={device}
                    selected={draft.deviceTargeting.includes(device)}
                    onClick={() =>
                      onChange({
                        deviceTargeting: toggleInList(
                          draft.deviceTargeting,
                          device,
                        ),
                      })
                    }
                  />
                ))}
              </div>
            </AdvField>
            <AdvField
              label="Where ads can show"
              hint="Search is recommended for text ads."
            >
              <div className="flex flex-wrap gap-2">
                {NETWORK_OPTIONS.map((network) => (
                  <ChipButton
                    key={network}
                    label={network}
                    selected={draft.networkSelection.includes(network)}
                    onClick={() =>
                      onChange({
                        networkSelection: toggleInList(
                          draft.networkSelection,
                          network,
                        ),
                      })
                    }
                  />
                ))}
              </div>
            </AdvField>
          </div>

          <AdvField label="IP exclusions" hint="Optional. One per line.">
            <textarea
              className={`${googleBuilderInputClass} min-h-[88px] resize-y`}
              value={draft.ipExclusions}
              onChange={(e) => onChange({ ipExclusions: e.target.value })}
              placeholder="203.0.113.0"
            />
          </AdvField>

          <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
            <AdvField
              label="URL tracking parameters"
              hint="Optional. Appended to your final URL."
            >
              <input
                className={googleBuilderInputClass}
                value={draft.urlTrackingParams}
                onChange={(e) =>
                  onChange({ urlTrackingParams: e.target.value })
                }
                placeholder="utm_source=google&utm_medium=cpc"
              />
            </AdvField>
            <AdvField
              label="Conversion goals"
              hint="Optional notes for your team."
            >
              <input
                className={googleBuilderInputClass}
                value={draft.conversionGoals}
                onChange={(e) =>
                  onChange({ conversionGoals: e.target.value })
                }
                placeholder="Purchases, form fills, calls"
              />
            </AdvField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
            <AdvField
              label="Brand exclusions"
              hint="Optional. Competitor brands to avoid."
            >
              <input
                className={googleBuilderInputClass}
                value={draft.brandExclusions}
                onChange={(e) => onChange({ brandExclusions: e.target.value })}
                placeholder="Competitor brands to avoid"
              />
            </AdvField>
            <AdvField
              label="Frequency capping (Display)"
              hint="Optional. How often someone can see your ad."
            >
              <input
                className={googleBuilderInputClass}
                value={draft.frequencyCapping}
                onChange={(e) =>
                  onChange({ frequencyCapping: e.target.value })
                }
                placeholder="e.g. 3 impressions / day"
              />
            </AdvField>
          </div>

          <AdvField
            label="Content exclusions"
            hint="Optional. Topics or categories to avoid."
          >
            <input
              className={googleBuilderInputClass}
              value={draft.contentExclusions}
              onChange={(e) => onChange({ contentExclusions: e.target.value })}
              placeholder="Topics or categories to avoid"
            />
          </AdvField>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-4 py-3">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-slate-300 text-[#4285F4] focus:ring-[#4285F4]"
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
