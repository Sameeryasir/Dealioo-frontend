"use client";

import { useState, type ReactNode } from "react";
import { Check, Info, Link2, MapPin, Search } from "lucide-react";
import { GoogleAdsStarIcon } from "@/app/components/google-ads/GoogleAdsStarIcon";

type LocalCampaignType = "PERFORMANCE_MAX" | "APP";
type AppSubtype = "INSTALLS" | "ENGAGEMENT" | "PRE_REGISTRATION";
type AppPlatform = "ANDROID" | "IOS" | null;
type StoreLocations = "BUSINESS" | "AFFILIATE";

const APP_SUBTYPES: {
  id: AppSubtype;
  title: string;
  description: string;
}[] = [
  {
    id: "INSTALLS",
    title: "App installs",
    description: "Get new people to install your app",
  },
  {
    id: "ENGAGEMENT",
    title: "App engagement",
    description:
      "Get existing users to take actions in your app (Minimum 50K installs required)",
  },
  {
    id: "PRE_REGISTRATION",
    title: "App pre-registration (Android only)",
    description: "Get new users to pre-register for your app before launch",
  },
];

type GoogleAdsLocalCampaignSetupProps = {
  onCancel: () => void;
  onContinue: () => void;
};

function GoogleGIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 fill-white" aria-hidden>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.8 15.5v-7l6.2 3.5-6.2 3.5z" />
    </svg>
  );
}

function DisplayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <rect x="3" y="10" width="8" height="10" rx="1" />
      <rect x="13" y="10" width="8" height="10" rx="1" />
    </svg>
  );
}

function PlayStoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden>
      <path fill="#EA4335" d="M3 20.5V3.5L14 12 3 20.5z" />
      <path fill="#FBBC05" d="M14 12 3 3.5 17.5 9 14 12z" />
      <path fill="#4285F4" d="M14 12 3 20.5 17.5 15 14 12z" />
      <path
        fill="#34A853"
        d="M17.5 9 21 11.2c.7.4.7 1.2 0 1.6L17.5 15 14 12l3.5-3z"
      />
    </svg>
  );
}

function IconChip({
  children,
  className = "bg-white ring-1 ring-[#dadce0]",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex size-6 items-center justify-center rounded-sm ${className}`}
    >
      {children}
    </span>
  );
}

export function GoogleAdsLocalCampaignSetup({
  onCancel,
  onContinue,
}: GoogleAdsLocalCampaignSetupProps) {
  const [campaignType, setCampaignType] =
    useState<LocalCampaignType>("PERFORMANCE_MAX");
  const [campaignName, setCampaignName] = useState(
    "Local store visits and promotions-Performance Max-1",
  );
  const [finalUrl, setFinalUrl] = useState("");
  const [subtype, setSubtype] = useState<AppSubtype>("INSTALLS");
  const [platform, setPlatform] = useState<AppPlatform>(null);
  const [appQuery, setAppQuery] = useState("");
  const [storeLocations, setStoreLocations] =
    useState<StoreLocations>("BUSINESS");

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f8f9fa]">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
          <section className="rounded-xl border border-[#dadce0] bg-white p-5 sm:p-7">
            <h2 className="text-lg font-light tracking-tight text-[#202124]">
              Select a campaign type
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setCampaignType("PERFORMANCE_MAX");
                  setCampaignName(
                    "Local store visits and promotions-Performance Max-1",
                  );
                }}
                className={`relative rounded-xl border bg-white p-4 text-left transition ${
                  campaignType === "PERFORMANCE_MAX"
                    ? "border-[#1877f2] ring-1 ring-[#1877f2]"
                    : "border-[#dadce0] hover:border-[#1877f2]"
                }`}
              >
                {campaignType === "PERFORMANCE_MAX" ? (
                  <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-[#1877f2] text-white">
                    <Check className="size-3.5" aria-hidden strokeWidth={3} />
                  </span>
                ) : null}
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <IconChip>
                    <GoogleGIcon />
                  </IconChip>
                  <IconChip className="bg-[#FF0000]">
                    <YoutubeIcon />
                  </IconChip>
                  <IconChip>
                    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden>
                      <path
                        fill="#EA4335"
                        d="M2 6.5V18h4.5V11l5.5 4 5.5-4v7H22V6.5L12 13.5 2 6.5z"
                      />
                    </svg>
                  </IconChip>
                  <IconChip className="bg-[#e8f0fe] text-[#1967d2]">
                    <MapPin className="size-3.5" aria-hidden />
                  </IconChip>
                  <IconChip className="bg-white">
                    <GoogleAdsStarIcon className="size-4" />
                  </IconChip>
                  <IconChip className="bg-[#34A853]/15 text-[#188038]">
                    <DisplayIcon />
                  </IconChip>
                </div>
                <p className="text-sm font-light text-[#202124]">
                  Performance Max
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#5f6368]">
                  Reach the right people wherever they&apos;re browsing with ads
                  on Google Search, YouTube, Display, and more
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCampaignType("APP");
                  setCampaignName("Local store visits and promotions-App-1");
                }}
                className={`relative rounded-xl border bg-white p-4 text-left transition ${
                  campaignType === "APP"
                    ? "border-[#1877f2] ring-1 ring-[#1877f2]"
                    : "border-[#dadce0] hover:border-[#1877f2]"
                }`}
              >
                {campaignType === "APP" ? (
                  <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-[#1877f2] text-white">
                    <Check className="size-3.5" aria-hidden strokeWidth={3} />
                  </span>
                ) : null}
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <IconChip>
                    <GoogleGIcon />
                  </IconChip>
                  <IconChip className="bg-[#FF0000]">
                    <YoutubeIcon />
                  </IconChip>
                  <IconChip>
                    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden>
                      <path
                        fill="#EA4335"
                        d="M2 6.5V18h4.5V11l5.5 4 5.5-4v7H22V6.5L12 13.5 2 6.5z"
                      />
                    </svg>
                  </IconChip>
                  <IconChip className="bg-white">
                    <GoogleAdsStarIcon className="size-4" />
                  </IconChip>
                  <IconChip className="bg-[#34A853]/15 text-[#188038]">
                    <DisplayIcon />
                  </IconChip>
                  <IconChip>
                    <PlayStoreIcon />
                  </IconChip>
                </div>
                <p className="text-sm font-light text-[#202124]">App</p>
                <p className="mt-1 text-xs leading-relaxed text-[#5f6368]">
                  Promote your Android or iOS app on Google Search, Play,
                  YouTube and partner sites with app ads
                </p>
              </button>
            </div>

            <div className="mt-5 flex gap-3 rounded-lg bg-[#e8f0fe] px-4 py-3">
              <Info
                className="mt-0.5 size-4 shrink-0 text-[#1967d2]"
                aria-hidden
              />
              <p className="text-sm leading-relaxed text-[#3c4043]">
                Performance Max has replaced Local campaigns. Performance Max
                brings you the same optimization benefits, including{" "}
                <span className="font-light">store visits</span>, call
                clicks, and <span className="font-light">directions</span> to
                help you meet your offline goals.{" "}
                {campaignType === "APP" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCampaignType("PERFORMANCE_MAX");
                      setCampaignName(
                        "Local store visits and promotions-Performance Max-1",
                      );
                    }}
                    className="font-light text-[#1877f2] hover:underline"
                  >
                    Use Performance Max campaign
                  </button>
                ) : (
                  <button
                    type="button"
                    className="font-light text-[#1877f2] hover:underline"
                  >
                    Learn more
                  </button>
                )}
              </p>
            </div>
          </section>

          {campaignType === "PERFORMANCE_MAX" ? (
            <>
              <section className="overflow-hidden rounded-xl border border-[#dadce0] bg-white">
                <div className="border-b border-[#dadce0] px-5 py-4 sm:px-7">
                  <h2 className="text-lg font-light tracking-tight text-[#202124]">
                    Campaign name
                  </h2>
                </div>
                <div className="px-5 py-5 sm:px-7">
                  <label className="block">
                    <span className="sr-only">Campaign name</span>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="w-full rounded-md border border-[#5f6368] bg-white px-3 py-2.5 text-sm text-[#202124] outline-none transition focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2]"
                    />
                  </label>
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border border-[#dadce0] bg-white">
                <div className="border-b border-[#dadce0] px-5 py-4 sm:px-7">
                  <h2 className="text-lg font-light tracking-tight text-[#202124]">
                    Where should people go after clicking your ads?
                  </h2>
                </div>
                <div className="px-5 py-5 sm:px-7">
                  <p className="max-w-3xl text-sm leading-relaxed text-[#5f6368]">
                    Think about the product or service you want to sell and
                    enter the URL you want people to see after clicking your
                    ads. This might be your homepage or a more specific page on
                    your website.
                  </p>
                  <label className="relative mt-4 block">
                    <span className="sr-only">Final URL</span>
                    <Link2
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5f6368]"
                      aria-hidden
                    />
                    <input
                      type="url"
                      value={finalUrl}
                      onChange={(e) => setFinalUrl(e.target.value)}
                      placeholder="Final URL"
                      className="w-full rounded-md border border-[#dadce0] bg-white py-2.5 pl-10 pr-3 text-sm text-[#202124] outline-none transition placeholder:text-[#80868b] focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2]"
                    />
                  </label>
                </div>
              </section>
            </>
          ) : null}

          {campaignType === "APP" ? (
            <>
              <section className="overflow-hidden rounded-xl border border-[#dadce0] bg-white">
                <div className="border-b border-[#dadce0] px-5 py-4 sm:px-7">
                  <h2 className="text-lg font-light tracking-tight text-[#202124]">
                    Campaign name
                  </h2>
                </div>
                <div className="px-5 py-5 sm:px-7">
                  <label className="block">
                    <span className="sr-only">Campaign name</span>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="w-full rounded-md border border-[#5f6368] bg-white px-3 py-2.5 text-sm text-[#202124] outline-none transition focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2]"
                    />
                  </label>
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border border-[#dadce0] bg-white p-5 sm:p-7">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="text-lg font-light tracking-tight text-[#202124]">
                    Select a campaign subtype
                  </h2>
                  <button
                    type="button"
                    className="text-sm font-light text-[#1877f2] hover:underline"
                  >
                    Learn more
                  </button>
                </div>
                <fieldset className="mt-5 space-y-4">
                  <legend className="sr-only">Campaign subtype</legend>
                  {APP_SUBTYPES.map((option) => {
                    const checked = subtype === option.id;
                    return (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-start gap-3"
                      >
                        <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
                          <input
                            type="radio"
                            name="local-app-subtype"
                            checked={checked}
                            onChange={() => setSubtype(option.id)}
                            className="sr-only"
                          />
                          <span
                            className={`size-5 rounded-full border-2 ${
                              checked
                                ? "border-[#1877f2]"
                                : "border-[#5f6368]"
                            }`}
                          />
                          {checked ? (
                            <span className="absolute size-2.5 rounded-full bg-[#1877f2]" />
                          ) : null}
                        </span>
                        <span>
                          <span className="block text-sm font-light text-[#202124]">
                            {option.title}
                          </span>
                          <span className="mt-0.5 block text-sm text-[#5f6368]">
                            {option.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
              </section>

              <section className="overflow-hidden rounded-xl border border-[#dadce0] bg-white p-5 sm:p-7">
                <h2 className="text-base font-light tracking-tight text-[#202124]">
                  Select your mobile app&apos;s platform
                </h2>
                <fieldset className="mt-4 flex flex-wrap gap-6">
                  <legend className="sr-only">Platform</legend>
                  {(
                    [
                      { id: "ANDROID" as const, label: "Android" },
                      { id: "IOS" as const, label: "iOS" },
                    ]
                  ).map((option) => {
                    const checked = platform === option.id;
                    return (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-center gap-2.5"
                      >
                        <span className="relative flex size-5 shrink-0 items-center justify-center">
                          <input
                            type="radio"
                            name="local-app-platform"
                            checked={checked}
                            onChange={() => setPlatform(option.id)}
                            className="sr-only"
                          />
                          <span
                            className={`size-5 rounded-full border-2 ${
                              checked
                                ? "border-[#1877f2]"
                                : "border-[#5f6368]"
                            }`}
                          />
                          {checked ? (
                            <span className="absolute size-2.5 rounded-full bg-[#1877f2]" />
                          ) : null}
                        </span>
                        <span className="text-sm font-light text-[#202124]">
                          {option.label}
                        </span>
                      </label>
                    );
                  })}
                </fieldset>

                <h3 className="mt-8 text-base font-light tracking-tight text-[#202124]">
                  Look up your app
                </h3>
                <label className="relative mt-3 block">
                  <span className="sr-only">Look up your app</span>
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5f6368]"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={appQuery}
                    onChange={(e) => setAppQuery(e.target.value)}
                    placeholder="Enter the app name, package name, publisher, or Play Store URL"
                    className="w-full rounded-md border border-[#dadce0] bg-white py-2.5 pl-10 pr-3 text-sm text-[#202124] outline-none transition placeholder:text-[#80868b] focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2]"
                  />
                </label>
                <p className="mt-2 text-sm text-[#5f6368]">
                  If you cannot find your app, please see{" "}
                  <button
                    type="button"
                    className="font-light text-[#1877f2] hover:underline"
                  >
                    these steps
                  </button>
                </p>
              </section>

              <section className="overflow-hidden rounded-xl border border-[#dadce0] bg-white p-5 sm:p-7">
                <h2 className="text-lg font-light tracking-tight text-[#202124]">
                  Campaign feeds
                </h2>
                <p className="mt-1 text-sm text-[#5f6368]">
                  Expand available ad formats, power ad creatives, and improve
                  targeting.
                </p>
                <p className="mt-5 text-sm font-light text-[#202124]">
                  Which store locations should your ads promote?
                </p>
                <fieldset className="mt-4 space-y-3">
                  <legend className="sr-only">Store locations</legend>
                  {(
                    [
                      {
                        id: "BUSINESS" as const,
                        label: "Your business locations",
                      },
                      {
                        id: "AFFILIATE" as const,
                        label: "Affiliate locations",
                      },
                    ]
                  ).map((option) => {
                    const checked = storeLocations === option.id;
                    return (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-center gap-2.5"
                      >
                        <span className="relative flex size-5 shrink-0 items-center justify-center">
                          <input
                            type="radio"
                            name="local-store-locations"
                            checked={checked}
                            onChange={() => setStoreLocations(option.id)}
                            className="sr-only"
                          />
                          <span
                            className={`size-5 rounded-full border-2 ${
                              checked
                                ? "border-[#1877f2]"
                                : "border-[#5f6368]"
                            }`}
                          />
                          {checked ? (
                            <span className="absolute size-2.5 rounded-full bg-[#1877f2]" />
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
                  className="mt-4 text-sm font-light text-[#1877f2] hover:underline"
                >
                  Link Account
                </button>
              </section>
            </>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#e8edf5] bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer px-2 py-2 text-sm font-light text-[#1877f2] transition hover:underline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="cursor-pointer rounded-md bg-[#1877f2] px-5 py-2.5 text-sm font-light text-white transition hover:bg-[#166fe0]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
