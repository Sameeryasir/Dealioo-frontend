"use client";

import { useState, type ReactNode } from "react";
import {
  Ban,
  ChevronDown,
  Clock,
  DollarSign,
  EyeOff,
  Filter,
  Flag,
  Globe2,
  Link2,
  Megaphone,
  MonitorSmartphone,
  ShieldOff,
  SlidersHorizontal,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { SimpleSelect } from "@/app/components/google-ads/campaign-builder/builder-controls";
import { googleBuilderInputClass } from "@/app/components/google-ads/campaign-builder/google-builder-ui";
import type {
  BidStrategyId,
  CampaignTypeId,
  GoogleCampaignBuilderDraft,
} from "@/app/components/google-ads/campaign-builder/types";

type AdvancedOptionsProps = {
  draft: GoogleCampaignBuilderDraft;
  onChange: (patch: Partial<GoogleCampaignBuilderDraft>) => void;
  layout?: "auto" | "stack";
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
  icon: Icon,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full flex-col gap-3 rounded-2xl border border-[#e8edf5] bg-[#f8fafc] p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#4285F4] shadow-sm">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#07111f]">{label}</p>
          {hint ? (
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {hint}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-auto w-full min-w-0">{children}</div>
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

export function AdvancedOptions({
  draft,
  onChange,
  layout = "auto",
}: AdvancedOptionsProps) {
  const [open, setOpen] = useState(false);
  const pairGrid =
    layout === "stack"
      ? "grid gap-3 grid-cols-1"
      : "grid gap-3 grid-cols-1 md:grid-cols-2 md:items-stretch";

  return (
    <div
      className={`rounded-2xl border border-[#e8edf5] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.04)] ${
        open ? "overflow-visible" : "overflow-hidden"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[#f8fafc]"
        aria-expanded={open}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f0fe] text-[#4285F4]">
          <SlidersHorizontal className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-[#07111f]">Advanced Settings</p>
            <span className="rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[#4285F4]">
              Optional
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Optional, expert-level settings — hidden by default. Most campaigns
            never need to touch these.
          </p>
        </div>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="space-y-3 border-t border-[#e8edf5] bg-[#fcfdff] p-4 sm:p-5">
          <div className={pairGrid}>
            <AdvField
              icon={Megaphone}
              label="Campaign type"
              hint="Usually Search is best for text ads."
            >
              <SimpleSelect
                aria-label="Campaign type"
                value={draft.campaignType}
                options={CAMPAIGN_TYPES}
                onChange={(value) =>
                  onChange({ campaignType: value as CampaignTypeId })
                }
                placeholder="Select campaign type"
              />
            </AdvField>
            <AdvField
              icon={Target}
              label="Bidding focus"
              hint="Choose how Google spends your budget."
            >
              <SimpleSelect
                aria-label="Bidding focus"
                value={draft.bidStrategy}
                options={BID_STRATEGIES}
                onChange={(value) =>
                  onChange({ bidStrategy: value as BidStrategyId })
                }
                placeholder="Select bidding focus"
              />
            </AdvField>
          </div>

          {(draft.bidStrategy === "TARGET_CPA" ||
            draft.bidStrategy === "TARGET_ROAS") && (
            <div className={pairGrid}>
              {draft.bidStrategy === "TARGET_CPA" ? (
                <AdvField
                  icon={DollarSign}
                  label="Target cost per conversion ($)"
                >
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
                <AdvField
                  icon={TrendingUp}
                  label="Target return on ad spend (%)"
                >
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
            icon={Clock}
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

          <div className={pairGrid}>
            <AdvField
              icon={MonitorSmartphone}
              label="Devices"
              hint="Pick where people can see your ads."
            >
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
              icon={Globe2}
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

          <AdvField
            icon={ShieldOff}
            label="IP exclusions"
            hint="Optional. One per line."
          >
            <textarea
              className={`${googleBuilderInputClass} min-h-[88px] resize-y`}
              value={draft.ipExclusions}
              onChange={(e) => onChange({ ipExclusions: e.target.value })}
              placeholder="203.0.113.0"
            />
          </AdvField>

          <div className={pairGrid}>
            <AdvField
              icon={Link2}
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
              icon={Flag}
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

          <div className={pairGrid}>
            <AdvField
              icon={Ban}
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
              icon={EyeOff}
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
            icon={Filter}
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

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e8edf5] bg-[#f8fafc] p-4 transition hover:border-[#d2e3fc]">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#4285F4] shadow-sm">
              <Users className="size-4" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-1 items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 rounded border-slate-300 text-[#4285F4] focus:ring-[#4285F4]"
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
                  Let the system find similar people beyond your selected
                  audiences
                </span>
              </span>
            </span>
          </label>
        </div>
      ) : null}
    </div>
  );
}
