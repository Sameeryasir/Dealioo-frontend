"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  CirclePlay,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";

const BID_FOCUS_OPTIONS = [
  "Maximize conversions",
  "Target CPA",
  "Maximize conversion value",
  "Target ROAS",
] as const;

type StepId = "bidding" | "settings" | "assets" | "budget" | "summary";
type SettingsSubId = "locations" | "eu-political";
type AssetSubId =
  | "name"
  | "final-url"
  | "assets"
  | "optimization"
  | "search-themes"
  | "audience-signal";

type GoogleAdsPerformanceMaxBiddingProps = {
  onBack: () => void;
  onNext: () => void;
  onClose?: () => void;
};

const STEPS: { id: StepId; label: string }[] = [
  { id: "bidding", label: "Bidding" },
  { id: "settings", label: "Campaign settings" },
  { id: "assets", label: "Asset group" },
  { id: "budget", label: "Budget" },
  { id: "summary", label: "Summary" },
];

const SETTINGS_SUB_SECTIONS: { id: SettingsSubId; label: string }[] = [
  { id: "locations", label: "Locations" },
  { id: "eu-political", label: "EU political ads" },
];

const ASSET_SUB_SECTIONS: { id: AssetSubId; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "final-url", label: "Final URL" },
  { id: "assets", label: "Assets" },
  { id: "optimization", label: "Asset optimization" },
  { id: "search-themes", label: "Search themes" },
  { id: "audience-signal", label: "Audience signal" },
];

export function GoogleAdsPerformanceMaxBidding({
  onBack,
  onNext,
  onClose,
}: GoogleAdsPerformanceMaxBiddingProps) {
  const [activeStep, setActiveStep] = useState<StepId>("bidding");
  const [settingsSub, setSettingsSub] = useState<SettingsSubId>("locations");
  const [assetSub, setAssetSub] = useState<AssetSubId>("name");
  const [biddingOpen, setBiddingOpen] = useState(true);
  const [locationsOpen, setLocationsOpen] = useState(true);
  const [euPoliticalOpen, setEuPoliticalOpen] = useState(true);
  const [assetNameOpen, setAssetNameOpen] = useState(true);
  const [finalUrlOpen, setFinalUrlOpen] = useState(true);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [optimizationOpen, setOptimizationOpen] = useState(false);
  const [searchThemesOpen, setSearchThemesOpen] = useState(true);
  const [audienceSignalOpen, setAudienceSignalOpen] = useState(true);
  const [locationChoice, setLocationChoice] = useState<
    "all" | "canada" | "other"
  >("all");
  const [euPoliticalAds, setEuPoliticalAds] = useState<"yes" | "no" | null>(
    null,
  );
  const [locationOptionsOpen, setLocationOptionsOpen] = useState(false);
  const [assetGroupName, setAssetGroupName] = useState("Asset Group 1");
  const [finalUrl, setFinalUrl] = useState("");
  const [searchThemes, setSearchThemes] = useState("");
  const [audienceName, setAudienceName] = useState("");
  const [headlines, setHeadlines] = useState(["", "", ""]);
  const [longHeadlines, setLongHeadlines] = useState([""]);
  const [descriptions, setDescriptions] = useState(["", ""]);
  const [businessName, setBusinessName] = useState("");
  const [headlineSectionOpen, setHeadlineSectionOpen] = useState(true);
  const [longHeadlineSectionOpen, setLongHeadlineSectionOpen] = useState(true);
  const [descriptionSectionOpen, setDescriptionSectionOpen] = useState(true);
  const [imagesSectionOpen, setImagesSectionOpen] = useState(true);
  const [logosSectionOpen, setLogosSectionOpen] = useState(true);
  const [businessNameSectionOpen, setBusinessNameSectionOpen] = useState(true);
  const [previewTab, setPreviewTab] = useState<
    "search" | "display" | "youtube" | "discover"
  >("search");
  const [focus, setFocus] =
    useState<(typeof BID_FOCUS_OPTIONS)[number]>("Maximize conversions");
  const [focusMenuOpen, setFocusMenuOpen] = useState(false);
  const focusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!focusMenuRef.current?.contains(e.target as Node)) {
        setFocusMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocusMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [focusMenuOpen]);

  const selectStep = (id: StepId) => {
    setActiveStep(id);
    setFocusMenuOpen(false);
    if (id === "settings") setSettingsSub("locations");
    if (id === "assets") setAssetSub("name");
  };

  const selectSettingsSub = (id: SettingsSubId) => {
    setActiveStep("settings");
    setSettingsSub(id);
    if (id === "locations") setLocationsOpen(true);
    if (id === "eu-political") setEuPoliticalOpen(true);
    document.getElementById(`pmax-settings-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const selectAssetSub = (id: AssetSubId) => {
    setActiveStep("assets");
    setAssetSub(id);
    if (id === "name") setAssetNameOpen(true);
    if (id === "final-url") setFinalUrlOpen(true);
    if (id === "assets") setAssetsOpen(true);
    if (id === "optimization") setOptimizationOpen(true);
    if (id === "search-themes") setSearchThemesOpen(true);
    if (id === "audience-signal") setAudienceSignalOpen(true);
    document.getElementById(`pmax-assets-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleBack = () => {
    if (activeStep === "assets") {
      setActiveStep("settings");
      return;
    }
    if (activeStep === "settings") {
      setActiveStep("bidding");
      return;
    }
    onBack();
  };

  const handleNext = () => {
    if (activeStep === "bidding") {
      setActiveStep("settings");
      setSettingsSub("locations");
      return;
    }
    if (activeStep === "settings") {
      setActiveStep("assets");
      setAssetSub("name");
      return;
    }
    onNext();
  };

  const pageTitle =
    activeStep === "settings"
      ? "Campaign settings"
      : activeStep === "assets"
        ? "Asset group"
        : "Bidding";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f8f9fa]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <aside className="shrink-0 border-b border-[#dadce0] bg-white px-5 py-5 lg:w-56 lg:border-b-0 lg:border-r lg:py-6">
          <div className="flex items-center justify-between gap-2 text-[#202124]">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-[#5f6368]" aria-hidden />
              <p className="text-sm font-light">Performance Max</p>
            </div>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#f4f8ff] hover:text-[#1877f2]"
                aria-label="Close"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
          <nav className="mt-6 space-y-1" aria-label="Campaign steps">
            {STEPS.map((step) => {
              const selected = activeStep === step.id;
              const showSettingsSubs = step.id === "settings" && selected;
              const showAssetSubs = step.id === "assets" && selected;

              return (
                <div key={step.id}>
                  <button
                    type="button"
                    onClick={() => selectStep(step.id)}
                    className={`flex w-full items-center gap-2.5 rounded-md px-1 py-2 text-left transition ${
                      selected &&
                      (step.id === "settings" || step.id === "assets")
                        ? "bg-[#f8f9fa]"
                        : "hover:bg-[#f8f9fa]"
                    }`}
                  >
                    <span
                      className={`size-3.5 shrink-0 rounded-full border-2 ${
                        selected
                          ? "border-[#1877f2] bg-[#1877f2]"
                          : "border-[#dadce0] bg-white"
                      }`}
                    />
                    <span
                      className={`text-sm font-light ${
                        selected ? "text-[#1877f2]" : "text-[#5f6368]"
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>

                  {showSettingsSubs ? (
                    <div className="ml-[7px] space-y-3 border-l border-[#dadce0] py-2 pl-4">
                      {SETTINGS_SUB_SECTIONS.map((item) => {
                        const subSelected = settingsSub === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectSettingsSub(item.id)}
                            className={`block w-full text-left text-xs font-light transition ${
                              subSelected
                                ? "text-[#1877f2]"
                                : "text-[#5f6368] hover:text-[#202124]"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {showAssetSubs ? (
                    <div className="ml-[7px] space-y-3 border-l border-[#dadce0] py-2 pl-4">
                      {ASSET_SUB_SECTIONS.map((item) => {
                        const subSelected = assetSub === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectAssetSub(item.id)}
                            className={`block w-full text-left text-xs font-light transition ${
                              subSelected
                                ? "text-[#1877f2]"
                                : "text-[#5f6368] hover:text-[#202124]"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-light tracking-tight text-[#202124]">
            {pageTitle}
          </h1>
          {activeStep === "settings" ? (
            <p className="mt-2 text-sm font-light text-[#5f6368]">
              To reach the right people, start by defining key settings for
              your campaign
            </p>
          ) : null}
          {activeStep === "assets" ? (
            <p className="mt-2 text-sm font-light text-[#5f6368]">
              An asset group contains your creative assets, which are used to
              build ads for your campaign
            </p>
          ) : null}

          {activeStep === "bidding" ? (
            <div className="mt-5 space-y-4">
              <section
                id="pmax-section-bidding"
                className={`rounded-xl border border-[#dadce0] bg-white ${
                  focusMenuOpen
                    ? "relative z-30 overflow-visible"
                    : "overflow-hidden"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setBiddingOpen((v) => !v);
                    setFocusMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-base font-light text-[#202124]">
                    Bidding
                  </span>
                  {biddingOpen ? (
                    <ChevronUp className="size-4 text-[#5f6368]" aria-hidden />
                  ) : (
                    <ChevronDown className="size-4 text-[#5f6368]" aria-hidden />
                  )}
                </button>
                {biddingOpen ? (
                  <div className="border-t border-[#dadce0] px-5 py-5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-light text-[#202124]">
                        What do you want to focus on?
                      </p>
                      <CircleHelp
                        className="size-4 text-[#5f6368]"
                        aria-hidden
                      />
                    </div>
                    <div ref={focusMenuRef} className="relative mt-3 max-w-md">
                      <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={focusMenuOpen}
                        onClick={() => setFocusMenuOpen((open) => !open)}
                        className="flex w-full items-center justify-between rounded-md border border-[#dadce0] bg-white px-3 py-2.5 text-left text-sm font-light text-[#202124] outline-none transition hover:border-[#80868b]"
                      >
                        <span>{focus}</span>
                        <ChevronDown
                          className={`size-4 shrink-0 text-[#5f6368] transition ${
                            focusMenuOpen ? "rotate-180" : ""
                          }`}
                          aria-hidden
                        />
                      </button>

                      {focusMenuOpen ? (
                        <ul
                          role="listbox"
                          aria-label="Bidding focus"
                          className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-lg border border-[#dadce0] bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
                        >
                          {BID_FOCUS_OPTIONS.map((option) => {
                            const selected = focus === option;
                            return (
                              <li
                                key={option}
                                role="option"
                                aria-selected={selected}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFocus(option);
                                    setFocusMenuOpen(false);
                                  }}
                                  className={`w-full px-4 py-2.5 text-left text-sm font-light transition ${
                                    selected
                                      ? "bg-[#e8f0fe] text-[#202124]"
                                      : "text-[#3c4043] hover:bg-[#f1f3f4]"
                                  }`}
                                >
                                  {option}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          ) : null}

          {activeStep === "settings" ? (
            <div className="mt-5 space-y-4">
              <section
                id="pmax-settings-locations"
                className="overflow-hidden rounded-xl border border-[#dadce0] bg-white"
              >
                <button
                  type="button"
                  onClick={() => {
                    setLocationsOpen((v) => !v);
                    setSettingsSub("locations");
                  }}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-base font-light text-[#202124]">
                    Locations
                  </span>
                  {locationsOpen ? (
                    <ChevronUp className="size-4 text-[#5f6368]" aria-hidden />
                  ) : (
                    <ChevronDown className="size-4 text-[#5f6368]" aria-hidden />
                  )}
                </button>
                {locationsOpen ? (
                  <div className="border-t border-[#dadce0] px-5 py-5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-light text-[#202124]">
                        Select locations for this campaign
                      </p>
                      <CircleHelp
                        className="size-4 text-[#5f6368]"
                        aria-hidden
                      />
                    </div>
                    <fieldset className="mt-4 space-y-3">
                      <legend className="sr-only">Campaign locations</legend>
                      {(
                        [
                          {
                            id: "all" as const,
                            label: "All countries and territories",
                          },
                          { id: "canada" as const, label: "Canada" },
                          {
                            id: "other" as const,
                            label: "Enter another location",
                          },
                        ] as const
                      ).map((option) => {
                        const selected = locationChoice === option.id;
                        return (
                          <label
                            key={option.id}
                            className="flex cursor-pointer items-center gap-3"
                          >
                            <span className="relative flex size-4 shrink-0 items-center justify-center">
                              <input
                                type="radio"
                                name="pmax-location-choice"
                                checked={selected}
                                onChange={() => setLocationChoice(option.id)}
                                className="sr-only"
                              />
                              <span
                                className={`size-4 rounded-full border-2 ${
                                  selected
                                    ? "border-[#1877f2]"
                                    : "border-[#5f6368]"
                                }`}
                              />
                              {selected ? (
                                <span className="absolute size-2 rounded-full bg-[#1877f2]" />
                              ) : null}
                            </span>
                            <span className="text-sm font-light text-[#202124]">
                              {option.label}
                            </span>
                          </label>
                        );
                      })}
                    </fieldset>
                    <button
                      type="button"
                      onClick={() => setLocationOptionsOpen((v) => !v)}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-light text-[#1877f2] hover:underline"
                    >
                      Location options
                      <ChevronDown
                        className={`size-3.5 transition ${
                          locationOptionsOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    </button>
                  </div>
                ) : null}
              </section>

              <section
                id="pmax-settings-eu-political"
                className="overflow-hidden rounded-xl border border-[#dadce0] bg-white"
              >
                <button
                  type="button"
                  onClick={() => {
                    setEuPoliticalOpen((v) => !v);
                    setSettingsSub("eu-political");
                  }}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-base font-light text-[#202124]">
                    EU political ads
                  </span>
                  {euPoliticalOpen ? (
                    <ChevronUp className="size-4 text-[#5f6368]" aria-hidden />
                  ) : (
                    <ChevronDown className="size-4 text-[#5f6368]" aria-hidden />
                  )}
                </button>
                {euPoliticalOpen ? (
                  <div className="grid gap-6 border-t border-[#dadce0] px-5 py-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                    <div>
                      <p className="text-sm font-light text-[#202124]">
                        Does your campaign have European Union political ads?
                      </p>
                      <p className="mt-1 text-xs font-light text-[#5f6368]">
                        Required
                      </p>
                      <fieldset className="mt-4 space-y-3">
                        <legend className="sr-only">EU political ads</legend>
                        {(
                          [
                            {
                              id: "yes" as const,
                              label: "Yes, this campaign has EU political ads",
                            },
                            {
                              id: "no" as const,
                              label:
                                "No, this campaign doesn't have EU political ads",
                            },
                          ] as const
                        ).map((option) => {
                          const selected = euPoliticalAds === option.id;
                          return (
                            <label
                              key={option.id}
                              className="flex cursor-pointer items-center gap-3"
                            >
                              <span className="relative flex size-4 shrink-0 items-center justify-center">
                                <input
                                  type="radio"
                                  name="pmax-eu-political"
                                  checked={selected}
                                  onChange={() =>
                                    setEuPoliticalAds(option.id)
                                  }
                                  className="sr-only"
                                />
                                <span
                                  className={`size-4 rounded-full border-2 ${
                                    selected
                                      ? "border-[#1877f2]"
                                      : "border-[#5f6368]"
                                  }`}
                                />
                                {selected ? (
                                  <span className="absolute size-2 rounded-full bg-[#1877f2]" />
                                ) : null}
                              </span>
                              <span className="text-sm font-light text-[#202124]">
                                {option.label}
                              </span>
                            </label>
                          );
                        })}
                      </fieldset>
                    </div>
                    <p className="border-t border-[#dadce0] pt-4 text-sm leading-relaxed text-[#5f6368] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                      EU regulation requires Google to ask this question.{" "}
                      <button
                        type="button"
                        className="font-light text-[#1877f2] hover:underline"
                      >
                        Learn how an EU political ad is defined
                      </button>
                    </p>
                  </div>
                ) : null}
              </section>
            </div>
          ) : null}

          {activeStep === "assets" ? (
            <div className="mt-5 space-y-4">
              <section
                id="pmax-assets-name"
                className="overflow-hidden rounded-xl border border-[#dadce0] bg-white"
              >
                <button
                  type="button"
                  onClick={() => {
                    setAssetNameOpen((v) => !v);
                    setAssetSub("name");
                  }}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-base font-light text-[#202124]">
                    Asset group name
                  </span>
                  {assetNameOpen ? (
                    <ChevronUp className="size-4 text-[#5f6368]" aria-hidden />
                  ) : (
                    <ChevronDown className="size-4 text-[#5f6368]" aria-hidden />
                  )}
                </button>
                {assetNameOpen ? (
                  <div className="border-t border-[#dadce0] px-5 py-5">
                    <input
                      type="text"
                      value={assetGroupName}
                      onChange={(e) => setAssetGroupName(e.target.value)}
                      className="w-full max-w-xl rounded-md border border-[#dadce0] bg-white px-3 py-2.5 text-sm font-light text-[#202124] outline-none focus:border-[#80868b]"
                    />
                  </div>
                ) : null}
              </section>

              <section
                id="pmax-assets-final-url"
                className="overflow-hidden rounded-xl border border-[#dadce0] bg-white"
              >
                <button
                  type="button"
                  onClick={() => {
                    setFinalUrlOpen((v) => !v);
                    setAssetSub("final-url");
                  }}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-base font-light text-[#202124]">
                    Final URL
                  </span>
                  {finalUrlOpen ? (
                    <ChevronUp className="size-4 text-[#5f6368]" aria-hidden />
                  ) : (
                    <ChevronDown className="size-4 text-[#5f6368]" aria-hidden />
                  )}
                </button>
                {finalUrlOpen ? (
                  <div className="border-t border-[#dadce0] px-5 py-5">
                    <input
                      type="url"
                      value={finalUrl}
                      onChange={(e) => setFinalUrl(e.target.value)}
                      placeholder="https://www.example.com"
                      className="w-full max-w-xl rounded-md border border-[#dadce0] bg-white px-3 py-2.5 text-sm font-light text-[#202124] outline-none placeholder:text-[#80868b] focus:border-[#80868b]"
                    />
                  </div>
                ) : null}
              </section>

              <section
                id="pmax-assets-assets"
                className="rounded-xl border border-[#dadce0] bg-white"
              >
                <button
                  type="button"
                  onClick={() => {
                    setAssetsOpen((v) => !v);
                    setAssetSub("assets");
                  }}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <div>
                    <p className="text-base font-light text-[#202124]">
                      Assets
                    </p>
                    {!assetsOpen ? (
                      <p className="mt-1 text-sm font-light text-[#5f6368]">
                        Provide assets to help build your ads
                      </p>
                    ) : null}
                  </div>
                  {assetsOpen ? (
                    <ChevronUp
                      className="size-4 shrink-0 text-[#5f6368]"
                      aria-hidden
                    />
                  ) : (
                    <ChevronDown
                      className="size-4 shrink-0 text-[#5f6368]"
                      aria-hidden
                    />
                  )}
                </button>
                {assetsOpen ? (
                  <div className="border-t border-[#dadce0] px-5 py-5">
                    <div className="rounded-lg border border-[#d2e3fc] bg-[#e8f0fe] px-4 py-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <p className="text-sm font-light text-[#202124]">
                          Let&apos;s start adding ad assets.
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-full border-2 border-[#fbbc04]">
                            <span className="text-[10px] font-light text-[#5f6368]">
                              Ad
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-light text-[#5f6368]">
                              Ad strength
                            </p>
                            <p className="text-sm font-light text-[#202124]">
                              Incomplete
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-light text-[#5f6368]">
                          {[
                            "Images",
                            "Videos",
                            "Headlines",
                            "Descriptions",
                            "Sitelinks",
                          ].map((item) => (
                            <span
                              key={item}
                              className="inline-flex items-center gap-1.5"
                            >
                              <span className="size-3 rounded-full border border-[#5f6368]" />
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.9fr)]">
                      <div className="space-y-3">
                        <div className="overflow-hidden rounded-xl border border-[#dadce0]">
                          <button
                            type="button"
                            onClick={() =>
                              setHeadlineSectionOpen((v) => !v)
                            }
                            className="flex w-full items-center gap-3 px-4 py-3 text-left"
                          >
                            <span className="size-3.5 shrink-0 rounded-full border-2 border-[#dadce0]" />
                            <span className="flex-1 text-sm font-light text-[#202124]">
                              Headline ({headlines.filter(Boolean).length})
                            </span>
                            {headlineSectionOpen ? (
                              <ChevronUp
                                className="size-4 text-[#5f6368]"
                                aria-hidden
                              />
                            ) : (
                              <ChevronDown
                                className="size-4 text-[#5f6368]"
                                aria-hidden
                              />
                            )}
                          </button>
                          {headlineSectionOpen ? (
                            <div className="space-y-3 border-t border-[#dadce0] px-4 py-4">
                              {headlines.map((value, index) => (
                                <label key={`headline-${index}`} className="block">
                                  <div className="mb-1 flex items-center justify-between">
                                    <span className="text-sm font-light text-[#202124]">
                                      Headline
                                    </span>
                                    <span className="text-xs font-light text-[#5f6368]">
                                      Required · {value.length} / 30
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    value={value}
                                    maxLength={30}
                                    onChange={(e) => {
                                      const next = [...headlines];
                                      next[index] = e.target.value;
                                      setHeadlines(next);
                                    }}
                                    className="w-full rounded-md border border-[#dadce0] bg-white px-3 py-2.5 text-sm font-light text-[#202124] outline-none focus:border-[#80868b]"
                                  />
                                </label>
                              ))}
                              <div className="flex flex-wrap gap-3 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setHeadlines((list) => [...list, ""])
                                  }
                                  className="text-sm font-light text-[#1877f2] hover:underline"
                                >
                                  + Headline
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 text-sm font-light text-[#1877f2] hover:underline"
                                >
                                  <Sparkles className="size-3.5" aria-hidden />
                                  Generate headlines
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="overflow-hidden rounded-xl border border-[#dadce0]">
                          <button
                            type="button"
                            onClick={() =>
                              setLongHeadlineSectionOpen((v) => !v)
                            }
                            className="flex w-full items-center gap-3 px-4 py-3 text-left"
                          >
                            <span className="size-3.5 shrink-0 rounded-full border-2 border-[#dadce0]" />
                            <span className="flex-1 text-sm font-light text-[#202124]">
                              Long headlines (
                              {longHeadlines.filter(Boolean).length})
                            </span>
                            {longHeadlineSectionOpen ? (
                              <ChevronUp
                                className="size-4 text-[#5f6368]"
                                aria-hidden
                              />
                            ) : (
                              <ChevronDown
                                className="size-4 text-[#5f6368]"
                                aria-hidden
                              />
                            )}
                          </button>
                          {longHeadlineSectionOpen ? (
                            <div className="space-y-3 border-t border-[#dadce0] px-4 py-4">
                              {longHeadlines.map((value, index) => (
                                <label
                                  key={`long-headline-${index}`}
                                  className="block"
                                >
                                  <div className="mb-1 flex items-center justify-between">
                                    <span className="text-sm font-light text-[#202124]">
                                      Long headline
                                    </span>
                                    <span className="text-xs font-light text-[#5f6368]">
                                      Required · {value.length} / 90
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    value={value}
                                    maxLength={90}
                                    onChange={(e) => {
                                      const next = [...longHeadlines];
                                      next[index] = e.target.value;
                                      setLongHeadlines(next);
                                    }}
                                    className="w-full rounded-md border border-[#dadce0] bg-white px-3 py-2.5 text-sm font-light text-[#202124] outline-none focus:border-[#80868b]"
                                  />
                                </label>
                              ))}
                              <div className="flex flex-wrap gap-3 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLongHeadlines((list) => [...list, ""])
                                  }
                                  className="text-sm font-light text-[#1877f2] hover:underline"
                                >
                                  + Long headline
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 text-sm font-light text-[#1877f2] hover:underline"
                                >
                                  <Sparkles className="size-3.5" aria-hidden />
                                  Generate long headlines
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="overflow-hidden rounded-xl border border-[#dadce0]">
                          <button
                            type="button"
                            onClick={() =>
                              setDescriptionSectionOpen((v) => !v)
                            }
                            className="flex w-full items-center gap-3 px-4 py-3 text-left"
                          >
                            <span className="size-3.5 shrink-0 rounded-full border-2 border-[#dadce0]" />
                            <span className="flex-1 text-sm font-light text-[#202124]">
                              Descriptions (
                              {descriptions.filter(Boolean).length})
                            </span>
                            {descriptionSectionOpen ? (
                              <ChevronUp
                                className="size-4 text-[#5f6368]"
                                aria-hidden
                              />
                            ) : (
                              <ChevronDown
                                className="size-4 text-[#5f6368]"
                                aria-hidden
                              />
                            )}
                          </button>
                          {descriptionSectionOpen ? (
                            <div className="space-y-3 border-t border-[#dadce0] px-4 py-4">
                              {descriptions.map((value, index) => (
                                <label
                                  key={`description-${index}`}
                                  className="block"
                                >
                                  <div className="mb-1 flex items-center justify-between">
                                    <span className="text-sm font-light text-[#202124]">
                                      Description
                                    </span>
                                    <span className="text-xs font-light text-[#5f6368]">
                                      Required · {value.length} / 90
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    value={value}
                                    maxLength={90}
                                    onChange={(e) => {
                                      const next = [...descriptions];
                                      next[index] = e.target.value;
                                      setDescriptions(next);
                                    }}
                                    className="w-full rounded-md border border-[#dadce0] bg-white px-3 py-2.5 text-sm font-light text-[#202124] outline-none focus:border-[#80868b]"
                                  />
                                </label>
                              ))}
                              <div className="flex flex-wrap gap-3 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDescriptions((list) => [...list, ""])
                                  }
                                  className="text-sm font-light text-[#1877f2] hover:underline"
                                >
                                  + Description
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 text-sm font-light text-[#1877f2] hover:underline"
                                >
                                  <Sparkles className="size-3.5" aria-hidden />
                                  Generate descriptions
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="overflow-hidden rounded-xl border border-[#dadce0]">
                          <button
                            type="button"
                            onClick={() => setImagesSectionOpen((v) => !v)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left"
                          >
                            <span className="size-3.5 shrink-0 rounded-full border-2 border-[#dadce0]" />
                            <span className="flex-1 text-sm font-light text-[#202124]">
                              Images (0)
                            </span>
                            {imagesSectionOpen ? (
                              <ChevronUp
                                className="size-4 text-[#5f6368]"
                                aria-hidden
                              />
                            ) : (
                              <ChevronDown
                                className="size-4 text-[#5f6368]"
                                aria-hidden
                              />
                            )}
                          </button>
                          {imagesSectionOpen ? (
                            <div className="flex flex-wrap gap-3 border-t border-[#dadce0] px-4 py-4">
                              <button
                                type="button"
                                className="text-sm font-light text-[#1877f2] hover:underline"
                              >
                                + Images
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 text-sm font-light text-[#1877f2] hover:underline"
                              >
                                <Sparkles className="size-3.5" aria-hidden />
                                Generate images
                              </button>
                            </div>
                          ) : null}
                        </div>

                        <div className="overflow-hidden rounded-xl border border-[#dadce0]">
                          <button
                            type="button"
                            onClick={() => setLogosSectionOpen((v) => !v)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left"
                          >
                            <span className="size-3.5 shrink-0 rounded-full border-2 border-[#dadce0]" />
                            <span className="flex-1 text-sm font-light text-[#202124]">
                              Logos (0)
                            </span>
                            {logosSectionOpen ? (
                              <ChevronUp
                                className="size-4 text-[#5f6368]"
                                aria-hidden
                              />
                            ) : (
                              <ChevronDown
                                className="size-4 text-[#5f6368]"
                                aria-hidden
                              />
                            )}
                          </button>
                          {logosSectionOpen ? (
                            <div className="border-t border-[#dadce0] px-4 py-4">
                              <button
                                type="button"
                                className="text-sm font-light text-[#1877f2] hover:underline"
                              >
                                + Logos
                              </button>
                            </div>
                          ) : null}
                        </div>

                        <div className="overflow-hidden rounded-xl border border-[#dadce0]">
                          <button
                            type="button"
                            onClick={() =>
                              setBusinessNameSectionOpen((v) => !v)
                            }
                            className="flex w-full items-center gap-3 px-4 py-3 text-left"
                          >
                            <span className="size-3.5 shrink-0 rounded-full border-2 border-[#dadce0]" />
                            <span className="flex-1 text-sm font-light text-[#202124]">
                              Business name
                            </span>
                            {businessNameSectionOpen ? (
                              <ChevronUp
                                className="size-4 text-[#5f6368]"
                                aria-hidden
                              />
                            ) : (
                              <ChevronDown
                                className="size-4 text-[#5f6368]"
                                aria-hidden
                              />
                            )}
                          </button>
                          {businessNameSectionOpen ? (
                            <div className="border-t border-[#dadce0] px-4 py-4">
                              <label className="block">
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-sm font-light text-[#202124]">
                                    Business name
                                  </span>
                                  <span className="text-xs font-light text-[#5f6368]">
                                    Required · {businessName.length} / 25
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  value={businessName}
                                  maxLength={25}
                                  onChange={(e) =>
                                    setBusinessName(e.target.value)
                                  }
                                  className="w-full rounded-md border border-[#dadce0] bg-white px-3 py-2.5 text-sm font-light text-[#202124] outline-none focus:border-[#80868b]"
                                />
                              </label>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <aside className="rounded-xl border border-[#dadce0] bg-[#f8f9fa] p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-light text-[#202124]">
                            Preview
                          </p>
                          <div className="flex gap-3 text-xs font-light text-[#1877f2]">
                            <button type="button" className="hover:underline">
                              Share
                            </button>
                            <button type="button" className="hover:underline">
                              View more
                            </button>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-4 border-b border-[#dadce0] pb-2">
                          {(
                            [
                              {
                                id: "search" as const,
                                label: "Search",
                                icon: Search,
                              },
                              {
                                id: "display" as const,
                                label: "Display",
                                icon: Activity,
                              },
                              {
                                id: "youtube" as const,
                                label: "YouTube",
                                icon: CirclePlay,
                              },
                              {
                                id: "discover" as const,
                                label: "Discover",
                                icon: TrendingUp,
                              },
                            ] as const
                          ).map((tab) => {
                            const Icon = tab.icon;
                            const selected = previewTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setPreviewTab(tab.id)}
                                className={`flex flex-col items-center gap-1 pb-2 text-[11px] font-light ${
                                  selected
                                    ? "border-b-2 border-[#1877f2] text-[#1877f2]"
                                    : "text-[#5f6368]"
                                }`}
                              >
                                <Icon className="size-4" aria-hidden />
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-5 flex items-center justify-center gap-2">
                          <button
                            type="button"
                            className="inline-flex size-8 items-center justify-center rounded-full text-[#5f6368] hover:bg-white"
                            aria-label="Previous preview"
                          >
                            <ChevronLeft className="size-4" aria-hidden />
                          </button>
                          <div className="w-full max-w-[220px] rounded-[28px] border border-[#dadce0] bg-white p-3 shadow-sm">
                            <div className="rounded-2xl border border-[#dadce0] bg-[#f8f9fa] p-3">
                              <p className="text-xs font-light text-[#202124]">
                                To unlock this format, add the following
                                assets: 3 headlines, 2 descriptions, 1 final
                                url.
                              </p>
                              <div className="mt-4 space-y-2">
                                <div className="h-2 rounded bg-[#e8eaed]" />
                                <div className="h-2 w-4/5 rounded bg-[#e8eaed]" />
                                <div className="h-2 w-3/5 rounded bg-[#e8eaed]" />
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="inline-flex size-8 items-center justify-center rounded-full text-[#5f6368] hover:bg-white"
                            aria-label="Next preview"
                          >
                            <ChevronRight className="size-4" aria-hidden />
                          </button>
                        </div>
                        <p className="mt-4 text-[11px] leading-relaxed text-[#5f6368]">
                          Previews are estimates. Actual ads may vary.{" "}
                          <button
                            type="button"
                            className="text-[#1877f2] hover:underline"
                          >
                            Google Terms of Service
                          </button>
                        </p>
                      </aside>
                    </div>
                  </div>
                ) : null}
              </section>

              <section
                id="pmax-assets-optimization"
                className="overflow-hidden rounded-xl border border-[#dadce0] bg-white"
              >
                <button
                  type="button"
                  onClick={() => {
                    setOptimizationOpen((v) => !v);
                    setAssetSub("optimization");
                  }}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <div>
                    <p className="text-base font-light text-[#202124]">
                      Asset optimization
                    </p>
                    {!optimizationOpen ? (
                      <p className="mt-1 text-sm font-light text-[#5f6368]">
                        Text customization, final URL expansion, and 2 more
                        are turned on
                      </p>
                    ) : null}
                  </div>
                  {optimizationOpen ? (
                    <ChevronUp
                      className="size-4 shrink-0 text-[#5f6368]"
                      aria-hidden
                    />
                  ) : (
                    <ChevronDown
                      className="size-4 shrink-0 text-[#5f6368]"
                      aria-hidden
                    />
                  )}
                </button>
                {optimizationOpen ? (
                  <div className="border-t border-[#dadce0] px-5 py-5">
                    <p className="text-sm font-light text-[#5f6368]">
                      Text customization, final URL expansion, and 2 more are
                      turned on
                    </p>
                  </div>
                ) : null}
              </section>

              <div className="pt-2">
                <h2 className="text-xl font-light text-[#202124]">Signals</h2>
                <p className="mt-1 text-sm font-light text-[#5f6368]">
                  Add signals to help Google Ads find the right customers for
                  your ads
                </p>
              </div>

              <section
                id="pmax-assets-search-themes"
                className="overflow-hidden rounded-xl border border-[#dadce0] bg-white"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSearchThemesOpen((v) => !v);
                    setAssetSub("search-themes");
                  }}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-base font-light text-[#202124]">
                    Search themes
                  </span>
                  {searchThemesOpen ? (
                    <ChevronUp className="size-4 text-[#5f6368]" aria-hidden />
                  ) : (
                    <ChevronDown className="size-4 text-[#5f6368]" aria-hidden />
                  )}
                </button>
                {searchThemesOpen ? (
                  <div className="border-t border-[#dadce0] px-5 py-5">
                    <p className="text-sm font-light text-[#202124]">
                      What are some words or phrases people use when searching
                      for your products or services?
                    </p>
                    <textarea
                      value={searchThemes}
                      onChange={(e) => setSearchThemes(e.target.value)}
                      placeholder="Add search themes (up to 25)"
                      rows={4}
                      className="mt-3 w-full max-w-xl resize-y rounded-md border border-[#dadce0] bg-white px-3 py-2.5 text-sm font-light text-[#202124] outline-none placeholder:text-[#80868b] focus:border-[#80868b]"
                    />
                  </div>
                ) : null}
              </section>

              <section
                id="pmax-assets-audience-signal"
                className="overflow-hidden rounded-xl border border-[#dadce0] bg-white"
              >
                <button
                  type="button"
                  onClick={() => {
                    setAudienceSignalOpen((v) => !v);
                    setAssetSub("audience-signal");
                  }}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-base font-light text-[#202124]">
                    Audience signal
                  </span>
                  {audienceSignalOpen ? (
                    <ChevronUp className="size-4 text-[#5f6368]" aria-hidden />
                  ) : (
                    <ChevronDown className="size-4 text-[#5f6368]" aria-hidden />
                  )}
                </button>
                {audienceSignalOpen ? (
                  <div className="space-y-5 border-t border-[#dadce0] px-5 py-5">
                    <p className="text-sm font-light text-[#5f6368]">
                      Add an audience signal to help reach customers faster
                    </p>
                    <button
                      type="button"
                      className="text-sm font-light text-[#1877f2] hover:underline"
                    >
                      Add saved audience signal
                    </button>
                    <div>
                      <p className="text-sm font-light text-[#202124]">
                        Your data
                      </p>
                      <button
                        type="button"
                        className="mt-2 text-sm font-light text-[#1877f2] hover:underline"
                      >
                        + New segment
                      </button>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-light text-[#1877f2] hover:underline"
                    >
                      Additional signals
                    </button>
                    <div>
                      <label
                        htmlFor="pmax-audience-name"
                        className="text-sm font-light text-[#202124]"
                      >
                        Audience name
                      </label>
                      <input
                        id="pmax-audience-name"
                        type="text"
                        value={audienceName}
                        onChange={(e) => setAudienceName(e.target.value)}
                        placeholder="Optional"
                        className="mt-2 w-full max-w-xl rounded-md border border-[#dadce0] bg-white px-3 py-2.5 text-sm font-light text-[#202124] outline-none placeholder:text-[#80868b] focus:border-[#80868b]"
                      />
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          ) : null}

          {activeStep !== "bidding" &&
          activeStep !== "settings" &&
          activeStep !== "assets" ? (
            <div className="mt-5 overflow-hidden rounded-xl border border-[#dadce0] bg-white px-5 py-8">
              <p className="text-sm font-light text-[#5f6368]">
                This step will be available next.
              </p>
            </div>
          ) : null}

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="cursor-pointer px-2 py-2 text-sm font-light text-[#1877f2] transition hover:underline"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="cursor-pointer rounded-md bg-[#1877f2] px-5 py-2.5 text-sm font-light text-white transition hover:bg-[#166fe0]"
            >
              Next
            </button>
          </div>
        </main>

        <aside className="shrink-0 border-t border-[#dadce0] bg-white px-5 py-5 lg:w-72 lg:border-l lg:border-t-0 lg:py-6">
          <p className="text-sm font-light text-[#202124]">
            Campaign optimization score
          </p>
          <p className="mt-2 text-3xl font-light tabular-nums text-[#5f6368]">
            --.-%
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#5f6368]">
            Your score will be shown after more updates are made to this
            campaign.
          </p>

          <div className="mt-8 border-t border-[#dadce0] pt-6">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-[#5f6368]" aria-hidden />
              <p className="text-sm font-light text-[#202124]">
                Weekly estimates
              </p>
            </div>
            <p className="mt-3 text-sm text-[#5f6368]">
              Estimates aren&apos;t currently available.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
