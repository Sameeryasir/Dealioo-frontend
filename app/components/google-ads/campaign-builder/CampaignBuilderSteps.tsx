"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  Globe,
  ImageIcon,
  Layers,
  Megaphone,
  MousePointerClick,
  Phone,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Store,
  Trash2,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AdLivePreview } from "@/app/components/google-ads/campaign-builder/AdLivePreview";
import {
  enabledKeywords,
  estimateMetrics,
  generateAdSuggestions,
  generateCallouts,
  generateCampaignName,
  generateKeywordsForBusinessType,
  generateNegativeKeywordSuggestions,
  generateSitelinks,
  generateSnippetValues,
  MAX_SITELINKS,
} from "@/app/components/google-ads/campaign-builder/auto-generate";
import {
  BudgetSlider,
  ChipToggleGroup,
  Field,
  Panel,
  SearchableMultiSelect,
  SearchableSelect,
  SelectableCard,
  StepShell,
  ToggleSwitch,
  inputClass,
} from "@/app/components/google-ads/campaign-builder/builder-controls";
import { LocationAutocomplete } from "@/app/components/google-ads/campaign-builder/LocationAutocomplete";
import {
  deriveLegacyLocationFields,
  PRESENCE_OPTIONS,
  resolveLocationCoordinates,
  type GoogleAdsLocationRef,
  type PresenceOptionId,
  type RadiusUnitId,
} from "@/app/components/google-ads/campaign-builder/location-targeting";

const LocationRadiusMap = dynamic(
  () =>
    import("@/app/components/google-ads/campaign-builder/LocationRadiusMap").then(
      (mod) => mod.LocationRadiusMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 items-center justify-center rounded-xl border border-[#e8edf5] bg-[#f4f8ff] text-sm text-slate-500">
        Loading map…
      </div>
    ),
  },
);
import {
  AGE_RANGE_OPTIONS,
  BUSINESS_CATEGORY_OPTIONS,
  BUSINESS_TYPE_OPTIONS,
  CTA_OPTIONS,
  GOAL_OPTIONS,
  HOUSEHOLD_INCOME_OPTIONS,
  INTEREST_OPTIONS,
  LANGUAGE_OPTIONS,
  LEAD_CONTACT_OPTIONS,
  SALES_CHANNEL_OPTIONS,
  TOTAL_WIZARD_STEPS,
  TRAFFIC_ACTION_OPTIONS,
  createEmptySitelink,
  type AgeRangeId,
  type CallToActionId,
  type CampaignGoalId,
  type GenderId,
  type GoogleCampaignBuilderDraft,
  type LeadContactMethodId,
  type SalesChannelId,
  type TrafficActionId,
} from "@/app/components/google-ads/campaign-builder/types";
import {
  DESCRIPTION_MAX,
  HEADLINE_MAX,
  PATH_MAX,
  sitelinkUrlError,
} from "@/app/components/google-ads/campaign-builder/validation";

function formatRadiusLabel(value: number, unit: RadiusUnitId): string {
  const unitLabel = unit === "MILES" ? "miles" : "km";
  return `${value} ${unitLabel} radius`;
}

function PresenceTargetingDropdown({
  value,
  onChange,
}: {
  value: PresenceOptionId;
  onChange: (value: PresenceOptionId) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected =
    PRESENCE_OPTIONS.find((option) => option.id === value) ??
    PRESENCE_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="space-y-2">
      <p className="text-sm font-bold text-[#07111f]">
        Who do you want to target?
      </p>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-start justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-left transition ${
          open
            ? "border-[#4285F4] ring-2 ring-[#4285F4]/15"
            : "border-[#e8edf5] hover:border-[#4285F4]/50"
        }`}
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#07111f]">
            {selected.label}
          </span>
          {selected.recommended ? (
            <span className="mt-1 inline-flex rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[11px] font-bold text-[#4285F4]">
              Recommended
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={`mt-0.5 size-4 shrink-0 text-slate-500 transition ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Presence targeting options"
          className="max-h-72 w-full overflow-auto rounded-xl border border-[#e8edf5] bg-white py-1 shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
        >
          {PRESENCE_OPTIONS.map((option) => {
            const isSelected = option.id === value;
            return (
              <li key={option.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                    isSelected ? "bg-[#f4f8ff]" : "hover:bg-[#f8fafc]"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                      isSelected
                        ? "border-[#4285F4] bg-[#4285F4] text-white"
                        : "border-[#dbe3ef] bg-white"
                    }`}
                  >
                    {isSelected ? (
                      <Check className="size-3" strokeWidth={3} aria-hidden />
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-semibold ${
                        isSelected ? "text-[#4285F4]" : "text-[#07111f]"
                      }`}
                    >
                      {option.label}
                    </span>
                    {option.recommended ? (
                      <span className="mt-1 inline-flex rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[11px] font-bold text-[#4285F4]">
                        Recommended
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

type StepProps = {
  draft: GoogleCampaignBuilderDraft;
  errors: Record<string, string>;
  onChange: (patch: Partial<GoogleCampaignBuilderDraft>) => void;
};

const GOAL_ICONS: Record<
  Exclude<CampaignGoalId, "APP_PROMOTION">,
  LucideIcon
> = {
  SALES: ShoppingBag,
  LEADS: Users,
  WEBSITE_TRAFFIC: MousePointerClick,
  AWARENESS: Megaphone,
};

const SALES_CHANNEL_ICONS: Record<SalesChannelId, LucideIcon> = {
  WEBSITE: Globe,
  ONLINE_STORE: ShoppingCart,
  PHYSICAL_STORE: Store,
  PHONE_ORDERS: Phone,
  MULTIPLE: Layers,
};

function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span className={`text-xs ${over ? "font-semibold text-red-500" : "text-slate-400"}`}>
      {value.length}/{max}
    </span>
  );
}

function MetricTiles({ dailyBudget }: { dailyBudget: number }) {
  const m = estimateMetrics(dailyBudget);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        ["Est. monthly spend", m.monthlySpend],
        ["Est. clicks", m.clicks],
        ["Est. impressions", m.impressions],
      ].map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-3"
        >
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-sm font-bold text-[#07111f]">{value}</p>
        </div>
      ))}
    </div>
  );
}

export function StepGoal({ draft, errors, onChange }: StepProps) {
  return (
    <StepShell
      step={1}
      total={TOTAL_WIZARD_STEPS}
      title="Campaign Objective"
      description="Pick one goal. We’ll personalize every next screen for you."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {GOAL_OPTIONS.map((goal) => {
          const Icon = GOAL_ICONS[goal.id];
          return (
            <SelectableCard
              key={goal.id}
              selected={draft.goal === goal.id}
              title={goal.title}
              description={goal.description}
              icon={<Icon className="size-5" aria-hidden />}
              onClick={() =>
                onChange({
                  goal: goal.id,
                  goalDetailSubstep: 0,
                  campaignName: generateCampaignName(goal.id, draft.businessName),
                })
              }
            />
          );
        })}
      </div>
      {errors.goal ? (
        <p className="text-sm font-medium text-red-500">{errors.goal}</p>
      ) : null}
    </StepShell>
  );
}

export function StepGoalDetails({ draft, errors, onChange }: StepProps) {
  if (draft.goal === "SALES") {
    return (
      <StepShell
        step={2}
        total={TOTAL_WIZARD_STEPS}
        title="How do customers buy from you?"
        description="Choose the main way people purchase — we’ll tailor the rest."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {SALES_CHANNEL_OPTIONS.map((option) => {
            const Icon = SALES_CHANNEL_ICONS[option.id];
            return (
              <SelectableCard
                key={option.id}
                selected={draft.salesChannel === option.id}
                title={option.title}
                description={option.description}
                icon={<Icon className="size-5" aria-hidden />}
                onClick={() => onChange({ salesChannel: option.id })}
              />
            );
          })}
        </div>
        {errors.salesChannel ? (
          <p className="text-sm font-medium text-red-500">{errors.salesChannel}</p>
        ) : null}

        {(draft.salesChannel === "WEBSITE" ||
          draft.salesChannel === "ONLINE_STORE" ||
          draft.salesChannel === "MULTIPLE") && (
          <Panel>
            <Field label="Website URL" required error={errors.websiteUrl}>
              <input
                className={inputClass(errors.websiteUrl)}
                value={draft.websiteUrl}
                onChange={(e) => onChange({ websiteUrl: e.target.value })}
                placeholder="https://www.example.com"
              />
            </Field>
          </Panel>
        )}

        {(draft.salesChannel === "PHYSICAL_STORE" ||
          draft.salesChannel === "MULTIPLE") && (
          <Panel>
            <SearchableSelect
              label="Business location"
              required
              options={[
                "Downtown",
                "City Center",
                "Mall Location",
                "Suburb",
                "Airport Area",
                ...draft.cities,
              ].filter(Boolean)}
              value={draft.businessLocation}
              onChange={(businessLocation) => onChange({ businessLocation })}
              placeholder="Search location type"
              error={errors.businessLocation}
            />
          </Panel>
        )}

        {draft.salesChannel === "PHONE_ORDERS" && (
          <Panel>
            <Field label="Business phone" required error={errors.businessPhone}>
              <input
                className={inputClass(errors.businessPhone)}
                value={draft.businessPhone}
                onChange={(e) =>
                  onChange({
                    businessPhone: e.target.value,
                    phoneNumber: e.target.value,
                  })
                }
                placeholder="+1 555 0100"
              />
            </Field>
          </Panel>
        )}
      </StepShell>
    );
  }

  if (draft.goal === "LEADS") {
    const toggleMethod = (id: LeadContactMethodId) => {
      const exists = draft.leadContactMethods.includes(id);
      onChange({
        leadContactMethods: exists
          ? draft.leadContactMethods.filter((m) => m !== id)
          : [...draft.leadContactMethods, id],
      });
    };

    return (
      <StepShell
        step={2}
        total={TOTAL_WIZARD_STEPS}
        title="How should customers contact you?"
        description="Select every option that fits. We’ll only ask for what’s needed."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {LEAD_CONTACT_OPTIONS.map((option) => {
            const selected = draft.leadContactMethods.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleMethod(option.id)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                  selected
                    ? "border-[#4285F4] bg-[#f4f8ff] ring-1 ring-[#4285F4]"
                    : "border-[#e8edf5] bg-white hover:border-[#4285F4]/40"
                }`}
              >
                <span
                  className={`flex size-5 items-center justify-center rounded border ${
                    selected
                      ? "border-[#4285F4] bg-[#4285F4] text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {selected ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
                <span className="text-sm font-bold text-[#07111f]">
                  {option.title}
                </span>
              </button>
            );
          })}
        </div>
        {errors.leadContactMethods ? (
          <p className="text-sm font-medium text-red-500">
            {errors.leadContactMethods}
          </p>
        ) : null}

        {draft.leadContactMethods.includes("CONTACT_FORM") ? (
          <Panel>
            <Field label="Landing page URL" required error={errors.landingPageUrl}>
              <input
                className={inputClass(errors.landingPageUrl)}
                value={draft.landingPageUrl || draft.websiteUrl}
                onChange={(e) =>
                  onChange({
                    landingPageUrl: e.target.value,
                    websiteUrl: draft.websiteUrl || e.target.value,
                  })
                }
                placeholder="https://www.example.com/contact"
              />
            </Field>
          </Panel>
        ) : null}

        {draft.leadContactMethods.includes("PHONE_CALLS") ? (
          <Panel>
            <Field label="Business phone" required error={errors.businessPhone}>
              <input
                className={inputClass(errors.businessPhone)}
                value={draft.businessPhone}
                onChange={(e) =>
                  onChange({
                    businessPhone: e.target.value,
                    phoneNumber: e.target.value,
                  })
                }
                placeholder="+1 555 0100"
              />
            </Field>
          </Panel>
        ) : null}
      </StepShell>
    );
  }

  if (draft.goal === "WEBSITE_TRAFFIC") {
    if (draft.goalDetailSubstep <= 0) {
      return (
        <StepShell
          step={2}
          total={TOTAL_WIZARD_STEPS}
          title="Where should visitors go?"
          description="Add the page you want people to land on."
        >
          <Panel>
            <Field label="Website URL" required error={errors.websiteUrl}>
              <input
                className={inputClass(errors.websiteUrl)}
                value={draft.websiteUrl}
                onChange={(e) => onChange({ websiteUrl: e.target.value })}
                placeholder="https://www.example.com"
              />
            </Field>
          </Panel>
        </StepShell>
      );
    }

    return (
      <StepShell
        step={2}
        total={TOTAL_WIZARD_STEPS}
        title="What action should visitors take?"
        description="Pick the main next step you want people to take."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {TRAFFIC_ACTION_OPTIONS.map((option) => (
            <SelectableCard
              key={option.id}
              selected={draft.trafficAction === option.id}
              title={option.label}
              onClick={() =>
                onChange({ trafficAction: option.id as TrafficActionId })
              }
            />
          ))}
        </div>
        {errors.trafficAction ? (
          <p className="text-sm font-medium text-red-500">{errors.trafficAction}</p>
        ) : null}
      </StepShell>
    );
  }

  if (draft.goal === "AWARENESS") {
    return (
      <StepShell
        step={2}
        total={TOTAL_WIZARD_STEPS}
        title="Tell us about your business"
        description="We’ll use this to promote your brand clearly."
      >
        <Panel className="space-y-4">
          <Field label="Business name" required error={errors.businessName}>
            <input
              className={inputClass(errors.businessName)}
              value={draft.businessName}
              onChange={(e) =>
                onChange({
                  businessName: e.target.value,
                  extensionBusinessName: e.target.value,
                })
              }
              placeholder="Acme Coffee"
            />
          </Field>
          <SearchableSelect
            label="Business category"
            required
            options={BUSINESS_CATEGORY_OPTIONS}
            value={draft.businessCategory}
            onChange={(businessCategory) => onChange({ businessCategory })}
            error={errors.businessCategory}
          />
          <Field label="Business address">
            <input
              className={inputClass()}
              value={draft.businessAddress}
              onChange={(e) => onChange({ businessAddress: e.target.value })}
              placeholder="123 Main Street"
            />
          </Field>
          <Field label="Business phone">
            <input
              className={inputClass()}
              value={draft.businessPhone}
              onChange={(e) =>
                onChange({
                  businessPhone: e.target.value,
                  phoneNumber: e.target.value,
                })
              }
              placeholder="+1 555 0100"
            />
          </Field>
          <SearchableSelect
            label="Business hours"
            options={[
              "Open 24/7",
              "Mon–Fri 9am–5pm",
              "Mon–Sat 10am–8pm",
              "Weekends only",
              "By appointment",
            ]}
            value={draft.businessHours}
            onChange={(businessHours) => onChange({ businessHours })}
            placeholder="Select hours"
          />
        </Panel>
      </StepShell>
    );
  }

  return (
    <StepShell
      step={2}
      total={TOTAL_WIZARD_STEPS}
      title="Which app are you promoting?"
      description="Just the basics — we’ll handle the rest."
    >
      <Panel>
        <Field label="App name" required error={errors.appName}>
          <input
            className={inputClass(errors.appName)}
            value={draft.appName}
            onChange={(e) => onChange({ appName: e.target.value })}
            placeholder="My App"
          />
        </Field>
      </Panel>
    </StepShell>
  );
}

export function StepCampaignInfo({ draft, errors, onChange }: StepProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!draft.campaignName.trim() && draft.goal) {
      onChange({
        campaignName: generateCampaignName(draft.goal, draft.businessName),
      });
    }
  }, [draft.goal, draft.businessName, draft.campaignName, onChange]);

  const clearLogo = () => {
    if (draft.logoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(draft.logoPreviewUrl);
    }
    onChange({ logoPreviewUrl: "", logoFileName: "" });
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const onLogoSelected = (file: File | undefined) => {
    if (!file) {
      clearLogo();
      return;
    }
    if (draft.logoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(draft.logoPreviewUrl);
    }
    onChange({
      logoPreviewUrl: URL.createObjectURL(file),
      logoFileName: file.name,
    });
  };

  return (
    <StepShell
      step={3}
      total={TOTAL_WIZARD_STEPS}
      title="Campaign information"
      description="We filled this in for you. Edit anything you like."
    >
      <Panel className="space-y-4">
        <Field
          label="Campaign name"
          required
          hint="Auto-generated — feel free to rename"
          error={errors.campaignName}
        >
          <input
            className={inputClass(errors.campaignName)}
            value={draft.campaignName}
            onChange={(e) => onChange({ campaignName: e.target.value })}
          />
        </Field>
        <Field label="Business name" required error={errors.businessName}>
          <input
            className={inputClass(errors.businessName)}
            value={draft.businessName}
            onChange={(e) =>
              onChange({
                businessName: e.target.value,
                extensionBusinessName:
                  draft.extensionBusinessName || e.target.value,
              })
            }
          />
        </Field>
        <Field label="Website" error={errors.websiteUrl}>
          <input
            className={inputClass(errors.websiteUrl)}
            value={draft.websiteUrl}
            onChange={(e) => onChange({ websiteUrl: e.target.value })}
            placeholder="https://www.example.com"
          />
        </Field>
        <SearchableSelect
          label="Business category"
          options={BUSINESS_CATEGORY_OPTIONS}
          value={draft.businessCategory}
          onChange={(businessCategory) => onChange({ businessCategory })}
          placeholder="Search categories"
        />

        <div className="space-y-1.5">
          <div>
            <p className="text-sm font-bold text-[#07111f]">Logo</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Optional — shown in ad previews when you add extensions
            </p>
          </div>

          <div className="grid gap-4 rounded-2xl border border-[#e8edf5] bg-[#f8fafc] p-4 sm:grid-cols-[minmax(0,1fr)_140px] sm:items-center">
            <div className="min-w-0 space-y-3">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => onLogoSelected(e.target.files?.[0])}
              />

              {draft.logoPreviewUrl ? (
                <>
                  <p className="truncate text-sm font-semibold text-[#07111f]">
                    {draft.logoFileName || "Logo selected"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Looks good — you can change or remove it anytime.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#4285F4]/30 bg-white px-3 py-2 text-sm font-semibold text-[#4285F4] transition hover:bg-[#e8f0fe]"
                    >
                      <Upload className="size-3.5" aria-hidden />
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={clearLogo}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8edf5] bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#07111f]">
                    Upload a square logo
                  </p>
                  <p className="text-xs leading-relaxed text-slate-500">
                    PNG or JPG works best. Aim for a clear square image.
                  </p>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#4285F4] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3367d6]"
                  >
                    <Upload className="size-3.5" aria-hidden />
                    Choose logo
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="relative mx-auto flex size-[120px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#c5d4f0] bg-white shadow-sm transition hover:border-[#4285F4] hover:bg-[#f4f8ff] sm:mx-0 sm:justify-self-end"
              aria-label={
                draft.logoPreviewUrl ? "Change logo" : "Upload logo"
              }
            >
              {draft.logoPreviewUrl ? (
                <img
                  src={draft.logoPreviewUrl}
                  alt="Logo preview"
                  className="size-full object-contain p-2"
                />
              ) : (
                <span className="flex flex-col items-center gap-1 text-slate-400">
                  <ImageIcon className="size-7" aria-hidden />
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wide">
                    Preview
                  </span>
                </span>
              )}
            </button>
          </div>
        </div>
      </Panel>
    </StepShell>
  );
}

export function StepBudget({ draft, errors, onChange }: StepProps) {
  return (
    <StepShell
      step={4}
      total={TOTAL_WIZARD_STEPS}
      title="Set a comfortable daily budget"
      description="No jargon — just how much you’re happy to spend each day."
    >
      <BudgetSlider
        value={draft.dailyBudget}
        onChange={(dailyBudget) => onChange({ dailyBudget })}
      />
      {errors.dailyBudget ? (
        <p className="text-sm font-medium text-red-500">{errors.dailyBudget}</p>
      ) : null}
      <MetricTiles dailyBudget={draft.dailyBudget} />
      <Panel className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" hint="Optional">
          <input
            type="date"
            className={inputClass()}
            value={draft.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
          />
        </Field>
        <Field label="End date" hint="Optional" error={errors.endDate}>
          <input
            type="date"
            className={inputClass(errors.endDate)}
            value={draft.endDate}
            onChange={(e) => onChange({ endDate: e.target.value })}
          />
        </Field>
      </Panel>
    </StepShell>
  );
}

export function StepLocations({ draft, errors, onChange }: StepProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [mapFocusToken, setMapFocusToken] = useState(0);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(
    draft.targetLocations[0]?.id ?? null,
  );

  
  const activeLocation = useMemo(() => {
    const fromId = draft.targetLocations.find(
      (row) => row.id === activeLocationId,
    );
    if (fromId) return fromId;
    return draft.targetLocations[draft.targetLocations.length - 1] ?? null;
  }, [activeLocationId, draft.targetLocations]);

  const activeCoords = useMemo(
    () => resolveLocationCoordinates(activeLocation),
    [activeLocation],
  );

  
  const usesRadiusOnMap =
    activeLocation != null &&
    activeLocation.type !== "country" &&
    activeCoords != null;

  const syncRadiusFromLocation = (
    location: GoogleAdsLocationRef | null,
    extras?: Partial<{
      radiusValue: number;
      radiusUnit: RadiusUnitId;
      latitude: number;
      longitude: number;
    }>,
  ) => {
    if (!location) {
      onChange({
        radiusEnabled: false,
        radiusCenter: null,
        radiusTargeting: "",
      });
      return;
    }

    const coords =
      extras?.latitude != null && extras?.longitude != null
        ? { latitude: extras.latitude, longitude: extras.longitude }
        : resolveLocationCoordinates(location);

    const isPinLocation = location.type !== "country" && coords != null;
    const nextValue = extras?.radiusValue ?? draft.radiusValue;
    const nextUnit = extras?.radiusUnit ?? draft.radiusUnit;
    const nextCenter =
      isPinLocation && coords
        ? {
            ...location,
            latitude: coords.latitude,
            longitude: coords.longitude,
          }
        : null;

    onChange({
      radiusEnabled: Boolean(isPinLocation),
      radiusCenter: nextCenter,
      radiusValue: nextValue,
      radiusUnit: nextUnit,
      radiusLat: coords?.latitude ?? null,
      radiusLng: coords?.longitude ?? null,
      radiusTargeting: isPinLocation
        ? formatRadiusLabel(nextValue, nextUnit)
        : "",
    });
  };

  const applyTargetLocations = (targetLocations: GoogleAdsLocationRef[]) => {
    const legacy = deriveLegacyLocationFields(targetLocations);
    const nextActive =
      targetLocations.find((row) => row.id === activeLocationId) ??
      targetLocations[targetLocations.length - 1] ??
      null;
    const coords = resolveLocationCoordinates(nextActive);
    const isPinLocation =
      nextActive != null && nextActive.type !== "country" && coords != null;

    setActiveLocationId(nextActive?.id ?? null);
    onChange({
      targetLocations,
      ...legacy,
      radiusEnabled: Boolean(isPinLocation),
      radiusCenter:
        isPinLocation && nextActive && coords
          ? {
              ...nextActive,
              latitude: coords.latitude,
              longitude: coords.longitude,
            }
          : null,
      radiusLat: coords?.latitude ?? null,
      radiusLng: coords?.longitude ?? null,
      radiusTargeting: isPinLocation
        ? formatRadiusLabel(draft.radiusValue, draft.radiusUnit)
        : "",
    });
    setMapFocusToken((token) => token + 1);
  };

  const activateLocation = (location: GoogleAdsLocationRef) => {
    setActiveLocationId(location.id);
    syncRadiusFromLocation(location);
    setMapFocusToken((token) => token + 1);
  };

  const applyExcludedLocations = (
    excludedLocationTargets: GoogleAdsLocationRef[],
  ) => {
    onChange({
      excludedLocationTargets,
      excludedLocations: excludedLocationTargets.map((row) => row.name),
    });
  };

  const handleMapPinMove = (latitude: number, longitude: number) => {
    if (!activeLocation || activeLocation.type === "country") return;

    const updated: GoogleAdsLocationRef = {
      ...activeLocation,
      latitude,
      longitude,
    };
    const nextTargets = draft.targetLocations.map((row) =>
      row.id === activeLocation.id ? updated : row,
    );

    onChange({
      targetLocations: nextTargets,
      ...deriveLegacyLocationFields(nextTargets),
    });
    syncRadiusFromLocation(updated, { latitude, longitude });
    setMapFocusToken((token) => token + 1);
  };

  const handleMapRadiusChange = (radiusValue: number) => {
    if (!activeLocation || !usesRadiusOnMap) return;
    syncRadiusFromLocation(activeLocation, { radiusValue });
  };

  return (
    <StepShell
      step={5}
      total={TOTAL_WIZARD_STEPS}
      title="Location Targeting"
      description="Search and add places. Click a place to focus the map — cities get a radius, countries target the whole area."
    >
      <Panel className="space-y-4">
        <LocationAutocomplete
          label="Target Locations"
          required
          values={draft.targetLocations}
          onChange={applyTargetLocations}
          onActivate={activateLocation}
          activeId={activeLocation?.id ?? null}
          placeholder="Search countries, states, cities, postal codes..."
          error={errors.targetLocations}
        />

        {activeLocation && activeCoords ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-[#07111f]">
                Map · {activeLocation.name}
              </p>
              <p className="text-xs text-slate-500">
                {usesRadiusOnMap
                  ? "Pin + radius for this place (like Meta Ads)"
                  : "Whole country selected — no radius needed"}
              </p>
            </div>

            <LocationRadiusMap
              latitude={activeCoords.latitude}
              longitude={activeCoords.longitude}
              radiusValue={draft.radiusValue}
              radiusUnit={draft.radiusUnit}
              showRadius={usesRadiusOnMap}
              countryZoom={!usesRadiusOnMap}
              focusToken={mapFocusToken}
              onPinMove={handleMapPinMove}
              onRadiusChange={
                usesRadiusOnMap ? handleMapRadiusChange : undefined
              }
            />

            {usesRadiusOnMap ? (
              <div className="rounded-xl border border-[#e8edf5] bg-[#f4f8ff] p-4">
                <p className="mb-2 text-xs font-semibold text-slate-500">
                  Radius around this place
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={80}
                    value={Math.min(80, Math.max(1, draft.radiusValue))}
                    onChange={(e) =>
                      handleMapRadiusChange(
                        Number.parseInt(e.target.value, 10),
                      )
                    }
                    className="h-2 min-w-[140px] flex-1 cursor-pointer appearance-none rounded-full bg-[#e8edf5] accent-[#4285F4]"
                    aria-label="Radius slider"
                  />
                  <input
                    type="number"
                    min={1}
                    max={80}
                    value={draft.radiusValue}
                    onChange={(e) =>
                      handleMapRadiusChange(
                        Math.min(
                          80,
                          Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                        ),
                      )
                    }
                    className="w-14 rounded border border-[#e8edf5] bg-white px-2 py-1 text-sm text-[#07111f]"
                    aria-label="Radius value"
                  />
                  <select
                    value={
                      draft.radiusUnit === "MILES" ? "mile" : "kilometer"
                    }
                    onChange={(e) =>
                      syncRadiusFromLocation(activeLocation, {
                        radiusUnit:
                          e.target.value === "mile" ? "MILES" : "KILOMETERS",
                      })
                    }
                    className="rounded border border-[#e8edf5] bg-white px-2 py-1 text-sm text-[#07111f]"
                    aria-label="Radius unit"
                  >
                    <option value="kilometer">km</option>
                    <option value="mile">mi</option>
                  </select>
                </div>
                {errors.radiusValue ? (
                  <p className="mt-2 text-xs font-medium text-red-500">
                    {errors.radiusValue}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    {draft.radiusValue}{" "}
                    {draft.radiusUnit === "MILES" ? "mi" : "km"} radius · drag
                    the white handle on the map to resize
                  </p>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-[#dbeafe] bg-[#f4f8ff] px-4 py-3 text-sm text-slate-500">
            Add a location above, then click its chip to show it on the map.
          </p>
        )}
      </Panel>

      <Panel className="space-y-4">
        <LocationAutocomplete
          label="Exclude Locations"
          values={draft.excludedLocationTargets}
          onChange={applyExcludedLocations}
          placeholder="Search locations to exclude..."
          description="Optional — ads will avoid these places"
        />
      </Panel>

      <div
        className={`rounded-2xl border border-[#e8edf5] bg-white ${
          advancedOpen ? "overflow-visible" : "overflow-hidden"
        }`}
      >
        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#f8fafc]"
          aria-expanded={advancedOpen}
        >
          <div>
            <p className="text-sm font-bold text-[#07111f]">Advanced Settings</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Presence targeting for who sees your ads
            </p>
          </div>
          <ChevronDown
            className={`size-4 text-slate-500 transition ${
              advancedOpen ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>

        {advancedOpen ? (
          <div className="space-y-3 border-t border-[#e8edf5] p-5">
            <PresenceTargetingDropdown
              value={draft.presenceOption}
              onChange={(presenceOption) => onChange({ presenceOption })}
            />
          </div>
        ) : null}
      </div>
    </StepShell>
  );
}

export function StepLanguages({ draft, errors, onChange }: StepProps) {
  return (
    <StepShell
      step={6}
      total={TOTAL_WIZARD_STEPS}
      title="Which languages should your ads use?"
      description="Select every language your customers speak."
    >
      <Panel>
        <SearchableMultiSelect
          label="Languages"
          required
          options={LANGUAGE_OPTIONS}
          values={draft.languages}
          onChange={(languages) => onChange({ languages })}
          error={errors.languages}
        />
      </Panel>
    </StepShell>
  );
}

export function StepAudience({ draft, errors, onChange }: StepProps) {
  return (
    <StepShell
      step={7}
      total={TOTAL_WIZARD_STEPS}
      title="Who should see your ads?"
      description="Tap the groups that fit. You can select more than one age range."
    >
      <Panel className="space-y-3">
        <p className="text-sm font-bold text-[#07111f]">Age</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {AGE_RANGE_OPTIONS.map((age) => {
            const selected = draft.ageRanges.includes(age);
            return (
              <SelectableCard
                key={age}
                selected={selected}
                title={age}
                onClick={() => {
                  const ageRanges = selected
                    ? draft.ageRanges.filter((a) => a !== age)
                    : [...draft.ageRanges, age];
                  onChange({ ageRanges: ageRanges as AgeRangeId[] });
                }}
              />
            );
          })}
        </div>
        {errors.ageRanges ? (
          <p className="text-xs font-medium text-red-500">{errors.ageRanges}</p>
        ) : null}
      </Panel>

      <Panel className="space-y-3">
        <p className="text-sm font-bold text-[#07111f]">Gender</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["ALL", "All"],
              ["MALE", "Male"],
              ["FEMALE", "Female"],
            ] as const
          ).map(([id, label]) => (
            <SelectableCard
              key={id}
              selected={draft.gender === id}
              title={label}
              onClick={() => onChange({ gender: id as GenderId })}
            />
          ))}
        </div>
      </Panel>

      <Panel className="space-y-4">
        <SearchableSelect
          label="Household income"
          options={HOUSEHOLD_INCOME_OPTIONS}
          value={draft.householdIncome}
          onChange={(householdIncome) => onChange({ householdIncome })}
          placeholder="Optional"
        />
        <SearchableMultiSelect
          label="Interests"
          options={INTEREST_OPTIONS}
          values={draft.interests}
          onChange={(interests) => onChange({ interests })}
          placeholder="Search interests"
        />
      </Panel>
    </StepShell>
  );
}

export function StepKeywords({ draft, errors, onChange }: StepProps) {
  const [customText, setCustomText] = useState("");

  const applyBusinessType = (businessType: string) => {
    onChange({
      businessType,
      suggestedKeywords: generateKeywordsForBusinessType(businessType),
      negativeKeywords: generateNegativeKeywordSuggestions(businessType),
    });
  };

  return (
    <StepShell
      step={8}
      total={TOTAL_WIZARD_STEPS}
      title="What type of business do you run?"
      description="We’ll suggest the searches that should show your ads. Just turn them on or off."
    >
      <Panel>
        <SearchableSelect
          label="Business type"
          required
          options={BUSINESS_TYPE_OPTIONS}
          value={draft.businessType}
          onChange={applyBusinessType}
          error={errors.businessType}
          placeholder="Search business types"
        />
      </Panel>

      {draft.suggestedKeywords.length > 0 ? (
        <Panel className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-[#07111f]">
              Suggested searches
            </p>
            <p className="text-xs text-slate-500">
              {enabledKeywords(draft).length} selected
            </p>
          </div>
          <div className="space-y-2">
            {draft.suggestedKeywords.map((keyword) => (
              <div
                key={keyword.id}
                className="flex items-center gap-3 rounded-xl border border-[#e8edf5] px-3 py-2.5"
              >
                <button
                  type="button"
                  role="switch"
                  aria-checked={keyword.enabled}
                  onClick={() =>
                    onChange({
                      suggestedKeywords: draft.suggestedKeywords.map((k) =>
                        k.id === keyword.id
                          ? { ...k, enabled: !k.enabled }
                          : k,
                      ),
                    })
                  }
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    keyword.enabled ? "bg-[#4285F4]" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${
                      keyword.enabled ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
                <span
                  className={`min-w-0 flex-1 text-sm font-semibold ${
                    keyword.enabled ? "text-[#07111f]" : "text-slate-400 line-through"
                  }`}
                >
                  {keyword.text}
                </span>
                <button
                  type="button"
                  aria-label="Remove keyword"
                  onClick={() =>
                    onChange({
                      suggestedKeywords: draft.suggestedKeywords.filter(
                        (k) => k.id !== keyword.id,
                      ),
                    })
                  }
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
          {errors.keywords ? (
            <p className="text-xs font-medium text-red-500">{errors.keywords}</p>
          ) : null}
        </Panel>
      ) : null}

      <Panel className="space-y-3">
        <Field label="Add your own search term" hint="Optional">
          <div className="flex gap-2">
            <input
              className={inputClass()}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="custom keyword"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const value = customText.trim();
                  if (!value) return;
                  onChange({
                    customKeywords: [...draft.customKeywords, value],
                  });
                  setCustomText("");
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                const value = customText.trim();
                if (!value) return;
                onChange({
                  customKeywords: [...draft.customKeywords, value],
                });
                setCustomText("");
              }}
              className="inline-flex items-center gap-1 rounded-xl bg-[#4285F4] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="size-3.5" />
              Add
            </button>
          </div>
        </Field>
        {draft.customKeywords.length > 0 ? (
          <ChipToggleGroup
            options={draft.customKeywords}
            values={draft.customKeywords}
            onChange={(customKeywords) => onChange({ customKeywords })}
          />
        ) : null}
      </Panel>

      <Panel>
        <SearchableMultiSelect
          label="Searches to avoid"
          options={generateNegativeKeywordSuggestions(
            draft.businessType || "default",
          )}
          values={draft.negativeKeywords}
          onChange={(negativeKeywords) => onChange({ negativeKeywords })}
          placeholder="Search negative suggestions"
        />
      </Panel>
    </StepShell>
  );
}

export function StepAds({ draft, errors, onChange }: StepProps) {
  useEffect(() => {
    if (!draft.adsGenerated) {
      onChange({
        ads: [generateAdSuggestions(draft)],
        adsGenerated: true,
      });
    }
  }, [draft, draft.adsGenerated, onChange]);

  const ad = draft.ads[0];
  if (!ad) return null;

  const updateAd = (patch: Partial<typeof ad>) => {
    onChange({ ads: [{ ...ad, ...patch }] });
  };

  return (
    <StepShell
      step={9}
      total={TOTAL_WIZARD_STEPS}
      title="Here’s your ad — ready to edit"
      description="We wrote headlines and descriptions for you. Tweak anything before publishing."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#07111f]">Ad copy</p>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ads: [generateAdSuggestions(draft)],
                  adsGenerated: true,
                })
              }
              className="text-xs font-bold text-[#4285F4] hover:underline"
            >
              Regenerate suggestions
            </button>
          </div>

          <Field label="Final URL" required error={errors.finalUrl}>
            <input
              className={inputClass(errors.finalUrl)}
              value={ad.finalUrl}
              onChange={(e) => updateAd({ finalUrl: e.target.value })}
            />
          </Field>

          <div className="space-y-2">
            <p className="text-sm font-bold text-[#07111f]">Headlines</p>
            {errors.headlines ? (
              <p className="text-xs font-medium text-red-500">{errors.headlines}</p>
            ) : null}
            {ad.headlines.map((headline, index) => (
              <div key={`h-${index}`} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Headline {index + 1}
                  </span>
                  <CharCount value={headline} max={HEADLINE_MAX} />
                </div>
                <input
                  className={inputClass()}
                  value={headline}
                  maxLength={HEADLINE_MAX}
                  onChange={(e) => {
                    const headlines = [...ad.headlines];
                    headlines[index] = e.target.value;
                    updateAd({ headlines });
                  }}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold text-[#07111f]">Descriptions</p>
            {errors.descriptions ? (
              <p className="text-xs font-medium text-red-500">
                {errors.descriptions}
              </p>
            ) : null}
            {ad.descriptions.map((description, index) => (
              <div key={`d-${index}`} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Description {index + 1}
                  </span>
                  <CharCount value={description} max={DESCRIPTION_MAX} />
                </div>
                <textarea
                  className={`${inputClass()} min-h-[72px]`}
                  value={description}
                  maxLength={DESCRIPTION_MAX}
                  onChange={(e) => {
                    const descriptions = [...ad.descriptions];
                    descriptions[index] = e.target.value;
                    updateAd({ descriptions });
                  }}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Display path 1">
              <div className="space-y-1">
                <div className="flex justify-end">
                  <CharCount value={ad.path1} max={PATH_MAX} />
                </div>
                <input
                  className={inputClass()}
                  value={ad.path1}
                  maxLength={PATH_MAX}
                  onChange={(e) => updateAd({ path1: e.target.value })}
                />
              </div>
            </Field>
            <Field label="Display path 2">
              <div className="space-y-1">
                <div className="flex justify-end">
                  <CharCount value={ad.path2} max={PATH_MAX} />
                </div>
                <input
                  className={inputClass()}
                  value={ad.path2}
                  maxLength={PATH_MAX}
                  onChange={(e) => updateAd({ path2: e.target.value })}
                />
              </div>
            </Field>
          </div>

          <Field label="Call to action">
            <select
              className={inputClass()}
              value={ad.callToAction}
              onChange={(e) =>
                updateAd({ callToAction: e.target.value as CallToActionId })
              }
            >
              {CTA_OPTIONS.map((cta) => (
                <option key={cta.id} value={cta.id}>
                  {cta.label}
                </option>
              ))}
            </select>
          </Field>
        </Panel>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <AdLivePreview ad={ad} businessName={draft.businessName} />
        </div>
      </div>
    </StepShell>
  );
}

export function StepAssets({ draft, onChange }: StepProps) {
  useEffect(() => {
    const type = draft.businessType || "Restaurant";
    const hasLegacyHardcodedSitelinks = draft.sitelinks.some((link) =>
      Boolean(link.description1?.trim() || link.description2?.trim()),
    );

    if (draft.assetsGenerated && !hasLegacyHardcodedSitelinks) return;

    onChange({
      extensionBusinessName:
        draft.extensionBusinessName || draft.businessName,
      phoneNumber: draft.phoneNumber || draft.businessPhone,
      callouts: draft.assetsGenerated
        ? draft.callouts
        : generateCallouts(type),
      structuredSnippetHeader: draft.assetsGenerated
        ? draft.structuredSnippetHeader
        : "Services",
      structuredSnippetValues: draft.assetsGenerated
        ? draft.structuredSnippetValues
        : generateSnippetValues(type),
      sitelinks: generateSitelinks(draft.websiteUrl, type),
      assetsGenerated: true,
    });
  }, [draft, draft.assetsGenerated, onChange]);

  return (
    <StepShell
      step={10}
      total={TOTAL_WIZARD_STEPS}
      title="Extra details that make ads stronger"
      description="We suggested these for you. Toggle or edit anything."
    >
      <Panel className="space-y-4">
        <Field label="Business name">
          <input
            className={inputClass()}
            value={draft.extensionBusinessName}
            onChange={(e) => onChange({ extensionBusinessName: e.target.value })}
          />
        </Field>
        <Field label="Phone number">
          <input
            className={inputClass()}
            value={draft.phoneNumber}
            onChange={(e) => onChange({ phoneNumber: e.target.value })}
          />
        </Field>
      </Panel>

      <Panel className="space-y-3">
        <p className="text-sm font-bold text-[#07111f]">Callouts</p>
        <ChipToggleGroup
          options={draft.callouts}
          values={draft.callouts}
          onChange={(callouts) => onChange({ callouts })}
        />
        <button
          type="button"
          className="text-xs font-bold text-[#4285F4]"
          onClick={() =>
            onChange({
              callouts: generateCallouts(draft.businessType || "Restaurant"),
            })
          }
        >
          Refresh suggestions
        </button>
      </Panel>

      <Panel className="space-y-4">
        <SearchableSelect
          label="Snippet type"
          options={["Services", "Brands", "Products", "Amenities"]}
          value={draft.structuredSnippetHeader}
          onChange={(structuredSnippetHeader) =>
            onChange({ structuredSnippetHeader })
          }
        />
        <SearchableMultiSelect
          label="Snippet values"
          options={generateSnippetValues(draft.businessType || "Restaurant")}
          values={draft.structuredSnippetValues}
          onChange={(structuredSnippetValues) =>
            onChange({ structuredSnippetValues })
          }
        />
      </Panel>

      <ToggleSwitch
        checked={draft.useLocationExtension}
        onChange={(useLocationExtension) => onChange({ useLocationExtension })}
        label="Show my business location"
        description="Uses your connected location when available"
      />

      <Panel className="space-y-4">
        <div>
          <p className="text-sm font-bold text-[#07111f]">
            Helpful Links (Sitelinks)
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            These links appear below your Google Ad and allow customers to
            quickly navigate to important pages on your website.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Up to {MAX_SITELINKS} links · edit labels and URLs · same URL is OK
            if you only have one page
          </p>
        </div>

        {draft.sitelinks.map((link) => {
          const urlError = sitelinkUrlError(link.url, link.enabled);
          const labelError =
            link.enabled && !link.text.trim()
              ? "Add a link label."
              : null;

          return (
            <div
              key={link.id}
              className="space-y-3 rounded-xl border border-[#e8edf5] bg-white px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <ToggleSwitch
                    checked={link.enabled}
                    label={link.text.trim() || "Sitelink"}
                    description={
                      link.enabled ? "Shown under your ad" : "Hidden for now"
                    }
                    onChange={(enabled) =>
                      onChange({
                        sitelinks: draft.sitelinks.map((item) =>
                          item.id === link.id ? { ...item, enabled } : item,
                        ),
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  aria-label="Remove sitelink"
                  onClick={() =>
                    onChange({
                      sitelinks: draft.sitelinks.filter(
                        (item) => item.id !== link.id,
                      ),
                    })
                  }
                  className="mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#e8edf5] text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Link label" error={labelError ?? undefined}>
                  <input
                    className={inputClass(labelError ?? undefined)}
                    value={link.text}
                    maxLength={25}
                    onChange={(e) =>
                      onChange({
                        sitelinks: draft.sitelinks.map((item) =>
                          item.id === link.id
                            ? { ...item, text: e.target.value }
                            : item,
                        ),
                      })
                    }
                    placeholder="e.g. Menu, Book Now, Contact"
                  />
                </Field>
                <Field
                  label="Destination URL"
                  error={urlError ?? undefined}
                >
                  <input
                    className={inputClass(urlError ?? undefined)}
                    value={link.url}
                    onChange={(e) =>
                      onChange({
                        sitelinks: draft.sitelinks.map((item) =>
                          item.id === link.id
                            ? { ...item, url: e.target.value }
                            : item,
                        ),
                      })
                    }
                    placeholder="https://www.example.com/page"
                  />
                </Field>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          disabled={draft.sitelinks.length >= MAX_SITELINKS}
          onClick={() => {
            if (draft.sitelinks.length >= MAX_SITELINKS) return;
            onChange({
              sitelinks: [
                ...draft.sitelinks,
                createEmptySitelink(
                  "",
                  draft.websiteUrl.trim()
                    ? draft.websiteUrl.trim().replace(/^http:\/\//i, "https://")
                    : "",
                ),
              ],
            });
          }}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#4285F4] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-4" aria-hidden />
          Add custom sitelink
          {draft.sitelinks.length >= MAX_SITELINKS
            ? ` (max ${MAX_SITELINKS})`
            : ""}
        </button>

        <button
          type="button"
          className="block text-xs font-semibold text-slate-500 underline-offset-2 hover:text-[#4285F4] hover:underline"
          onClick={() =>
            onChange({
              sitelinks: generateSitelinks(
                draft.websiteUrl,
                draft.businessType || "Restaurant",
              ),
            })
          }
        >
          Reset to common sitelink suggestions
        </button>
      </Panel>
    </StepShell>
  );
}

export function StepReviewPublish({
  draft,
  onEditStep,
  publishing,
  publishProgress,
  publishPhase,
  publishError,
  publishSuccess,
}: {
  draft: GoogleCampaignBuilderDraft;
  onEditStep: (step: number) => void;
  publishing: boolean;
  publishProgress: number;
  publishPhase: string | null;
  publishError: string | null;
  publishSuccess: boolean;
}) {
  const goalTitle =
    GOAL_OPTIONS.find((g) => g.id === draft.goal)?.title ?? "Not set";
  const metrics = estimateMetrics(draft.dailyBudget);
  const keywordCount = enabledKeywords(draft).length;

  const rows: [string, string, number][] = [
    ["Campaign goal", goalTitle, 1],
    ["Campaign name", draft.campaignName || "—", 3],
    ["Business", draft.businessName || "—", 3],
    ["Website", draft.websiteUrl || draft.landingPageUrl || "—", 3],
    ["Budget", `$${draft.dailyBudget}/day`, 4],
    [
      "Locations",
      [
        draft.targetLocations.map((row) => row.name).join(", ") || null,
        draft.radiusEnabled && draft.radiusCenter
          ? `${formatRadiusLabel(draft.radiusValue, draft.radiusUnit)} around ${draft.radiusCenter.name}`
          : draft.radiusEnabled
            ? formatRadiusLabel(draft.radiusValue, draft.radiusUnit)
            : null,
        draft.excludedLocationTargets.length
          ? `Exclude: ${draft.excludedLocationTargets.map((row) => row.name).join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ") || "—",
      5,
    ],
    [
      "Audience",
      `${draft.ageRanges.join(", ") || "Any age"} · ${draft.gender}`,
      7,
    ],
    ["Keywords", `${keywordCount} selected`, 8],
    ["Ads", `${draft.ads[0]?.headlines.filter(Boolean).length || 0} headlines`, 9],
    [
      "Extras",
      [
        draft.phoneNumber ? "Phone" : null,
        draft.callouts.length ? `${draft.callouts.length} callouts` : null,
        draft.sitelinks.filter((s) => s.enabled).length
          ? `${draft.sitelinks.filter((s) => s.enabled).length} links`
          : null,
      ]
        .filter(Boolean)
        .join(" · ") || "None",
      10,
    ],
  ];

  return (
    <StepShell
      step={11}
      total={TOTAL_WIZARD_STEPS}
      title="Review & publish"
      description="Look everything over. When you publish, we handle the technical setup for you."
    >
      <div className="space-y-3">
        {rows.map(([title, value, step]) => (
          <div
            key={title}
            className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[#e8edf5] bg-white px-5 py-4"
          >
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                {title}
              </p>
              <p className="mt-1 break-words text-sm font-semibold text-[#07111f]">
                {value}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(step)}
              className="text-xs font-bold text-[#4285F4] hover:underline"
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-3">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-400">
            Estimated reach
          </p>
          <p className="mt-1 text-sm font-bold text-[#07111f]">{metrics.reach}</p>
        </div>
        <div className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-3">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-400">
            Estimated clicks
          </p>
          <p className="mt-1 text-sm font-bold text-[#07111f]">{metrics.clicks}</p>
        </div>
        <div className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-3">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-400">
            Estimated cost
          </p>
          <p className="mt-1 text-sm font-bold text-[#07111f]">{metrics.cost}</p>
        </div>
      </div>

      {draft.ads[0] ? (
        <AdLivePreview ad={draft.ads[0]} businessName={draft.businessName} />
      ) : null}

      {(publishing || publishSuccess) && (
        <Panel>
          <p className="text-sm font-bold text-[#07111f]">
            {publishSuccess ? "Campaign published" : "Publishing your campaign…"}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8edf5]">
            <div
              className="h-full rounded-full bg-[#4285F4] transition-all duration-500"
              style={{ width: `${publishSuccess ? 100 : publishProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {publishSuccess
              ? "You’re all set. We handled the technical setup behind the scenes."
              : publishPhase || "Preparing your campaign"}
          </p>
        </Panel>
      )}

      {publishError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {publishError}
        </p>
      ) : null}
    </StepShell>
  );
}

export function renderCampaignBuilderStep(
  step: number,
  props: StepProps & {
    onEditStep: (step: number) => void;
    publishing: boolean;
    publishProgress: number;
    publishPhase: string | null;
    publishError: string | null;
    publishSuccess: boolean;
  },
): ReactNode {
  switch (step) {
    case 1:
      return <StepGoal {...props} />;
    case 2:
      return <StepGoalDetails {...props} />;
    case 3:
      return <StepCampaignInfo {...props} />;
    case 4:
      return <StepBudget {...props} />;
    case 5:
      return <StepLocations {...props} />;
    case 6:
      return <StepLanguages {...props} />;
    case 7:
      return <StepAudience {...props} />;
    case 8:
      return <StepKeywords {...props} />;
    case 9:
      return <StepAds {...props} />;
    case 10:
      return <StepAssets {...props} />;
    case 11:
      return (
        <StepReviewPublish
          draft={props.draft}
          onEditStep={props.onEditStep}
          publishing={props.publishing}
          publishProgress={props.publishProgress}
          publishPhase={props.publishPhase}
          publishError={props.publishError}
          publishSuccess={props.publishSuccess}
        />
      );
    default:
      return null;
  }
}
