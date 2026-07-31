"use client";

import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  ChevronUp,
  CreditCard,
  CircleHelp,
  Info,
  Link2,
  MapPin,
  MoreVertical,
} from "lucide-react";
import { GoogleAdsStarIcon } from "@/app/components/google-ads/GoogleAdsStarIcon";
import { GoogleAdsPerformanceMaxBidding } from "@/app/components/google-ads/GoogleAdsPerformanceMaxBidding";

type SearchGoalId = "WEBSITE_VISITS" | "PHONE_CALLS" | "STORE_VISITS";

type SalesCampaignTypeId =
  | "PERFORMANCE_MAX"
  | "SEARCH"
  | "DEMAND_GEN"
  | "VIDEO"
  | "DISPLAY"
  | "SHOPPING";

type GoogleAdsSalesCampaignSetupProps = {
  onCancel: () => void;
  onContinue: () => void;
  onClose?: () => void;
  onPmaxBiddingChange?: (open: boolean) => void;
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

const CAMPAIGN_TYPES: {
  id: SalesCampaignTypeId;
  title: string;
  description: string;
  icons: ReactNode;
}[] = [
  {
    id: "PERFORMANCE_MAX",
    title: "Performance Max",
    description:
      "Drive sales by reaching the right people wherever they're browsing with ads on Google Search, YouTube, Display, and more",
    icons: (
      <>
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
      </>
    ),
  },
  {
    id: "SEARCH",
    title: "Search",
    description: "Drive sales on Google Search with text ads",
    icons: (
      <IconChip>
        <GoogleGIcon />
      </IconChip>
    ),
  },
  {
    id: "DEMAND_GEN",
    title: "Demand Gen",
    description:
      "Drive demand and conversions on YouTube, Google Display Network, and more with image and video ads",
    icons: (
      <>
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
      </>
    ),
  },
  {
    id: "VIDEO",
    title: "Video",
    description: "Drive sales on YouTube with your video ads",
    icons: (
      <>
        <IconChip className="bg-[#FF0000]">
          <YoutubeIcon />
        </IconChip>
        <IconChip className="bg-[#34A853]/15 text-[#188038]">
          <DisplayIcon />
        </IconChip>
      </>
    ),
  },
  {
    id: "DISPLAY",
    title: "Display",
    description:
      "Reach potential customers across 3 million sites and apps with your creative",
    icons: (
      <>
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
        <IconChip className="bg-[#34A853]/15 text-[#188038]">
          <DisplayIcon />
        </IconChip>
      </>
    ),
  },
  {
    id: "SHOPPING",
    title: "Shopping",
    description:
      "Promote your products from Merchant Center on Google Search with Shopping ads",
    icons: (
      <IconChip>
        <GoogleGIcon />
      </IconChip>
    ),
  },
];

export function GoogleAdsSalesCampaignSetup({
  onCancel,
  onContinue,
  onClose,
  onPmaxBiddingChange,
}: GoogleAdsSalesCampaignSetupProps) {
  const [campaignType, setCampaignType] =
    useState<SalesCampaignTypeId>("PERFORMANCE_MAX");
  const [showCampaignTypes, setShowCampaignTypes] = useState(false);
  const [campaignName, setCampaignName] = useState("Sales-Performance Max-1");
  const [finalUrl, setFinalUrl] = useState("");
  const [searchGoals, setSearchGoals] = useState<Record<SearchGoalId, boolean>>(
    {
      WEBSITE_VISITS: false,
      PHONE_CALLS: false,
      STORE_VISITS: false,
    },
  );
  const [showPmaxBidding, setShowPmaxBidding] = useState(false);

  const openPmaxBidding = (open: boolean) => {
    setShowPmaxBidding(open);
    onPmaxBiddingChange?.(open);
  };

  if (showPmaxBidding) {
    return (
      <GoogleAdsPerformanceMaxBidding
        onBack={() => openPmaxBidding(false)}
        onNext={onContinue}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f8f9fa]">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
          <section className="rounded-xl border border-[#dadce0] bg-white p-5 sm:p-7">
            <h1 className="text-xl font-light tracking-tight text-[#202124] sm:text-2xl">
              Use these conversion goals to improve Sales.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#5f6368]">
              Conversion goals labeled as account default will use data from all
              of your campaigns to improve your bid strategy and campaign
              performance, even if they don&apos;t seem directly related to
              Sales.
            </p>

            <div className="mt-8 overflow-x-auto">
              <div className="min-w-[36rem]">
                <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-3 border-b border-[#dadce0] px-3 pb-2 text-xs font-light text-[#5f6368]">
                  <span>Conversion Goals</span>
                  <span>Conversion Source</span>
                  <span>Conversion Actions</span>
                  <span className="sr-only">More</span>
                </div>

                <div className="mt-3 rounded-lg border border-[#dadce0] bg-white">
                  <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem] items-center gap-3 px-3 py-3.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-[#f1f3f4] text-[#5f6368]">
                        <CreditCard className="size-4" aria-hidden />
                      </span>
                      <p className="truncate text-sm text-[#202124]">
                        <span className="font-light">Purchases</span>{" "}
                        <span className="text-[#5f6368]">(account default)</span>
                      </p>
                    </div>
                    <p className="text-sm text-[#202124]">Website</p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-left text-sm text-[#202124]"
                    >
                      <AlertTriangle
                        className="size-4 shrink-0 text-[#e37400]"
                        aria-hidden
                      />
                      <span className="underline decoration-dashed decoration-[#dadce0] underline-offset-2">
                        1 action
                      </span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex size-8 items-center justify-center rounded-full text-[#5f6368] transition hover:bg-[#f1f3f4]"
                      aria-label="More options"
                    >
                      <MoreVertical className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="mt-5 cursor-pointer text-sm font-light text-[#1877f2] transition hover:underline"
            >
              Add goal
            </button>
          </section>

          {showCampaignTypes ? (
            <section className="overflow-hidden rounded-xl border border-[#dadce0] bg-white">
              <div className="border-b border-[#dadce0] px-5 py-4 sm:px-7">
                <h2 className="text-lg font-light tracking-tight text-[#202124]">
                  Select a campaign type
                </h2>
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-2 sm:px-7 lg:grid-cols-3">
                {CAMPAIGN_TYPES.map((type) => {
                  const selected = campaignType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setCampaignType(type.id);
                        if (type.id === "PERFORMANCE_MAX") {
                          setCampaignName("Sales-Performance Max-1");
                        }
                        if (type.id === "SEARCH") {
                          setCampaignName("Sales-Search-2");
                        }
                        if (type.id === "DISPLAY") {
                          setCampaignName("Sales-Display-1");
                        }
                        if (type.id === "SHOPPING") {
                          setCampaignName("Sales-Shopping-1");
                        }
                      }}
                      className={`relative rounded-xl border bg-white p-4 text-left transition ${
                        selected
                          ? "border-[#1877f2] ring-1 ring-[#1877f2]"
                          : "border-[#dadce0] hover:border-[#1877f2]"
                      }`}
                    >
                      {selected ? (
                        <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-[#1877f2] text-white">
                          <Check
                            className="size-3.5"
                            aria-hidden
                            strokeWidth={3}
                          />
                        </span>
                      ) : null}
                      <div className="mb-3 flex flex-wrap items-center gap-1.5">
                        {type.icons}
                      </div>
                      <p className="pr-8 text-sm font-light text-[#202124]">
                        {type.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[#5f6368]">
                        {type.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {showCampaignTypes && campaignType === "PERFORMANCE_MAX" ? (
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

          {showCampaignTypes && campaignType === "SEARCH" ? (
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
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-light tracking-tight text-[#202124]">
                    Select the ways you&apos;d like to reach your goal
                  </h2>
                  <button
                    type="button"
                    className="inline-flex size-5 items-center justify-center text-[#5f6368] transition hover:text-[#1877f2]"
                    aria-label="Help"
                  >
                    <CircleHelp className="size-4" aria-hidden />
                  </button>
                </div>
                <fieldset className="mt-5 space-y-3">
                  <legend className="sr-only">Goal reach methods</legend>
                  {(
                    [
                      { id: "WEBSITE_VISITS" as const, label: "Website visits" },
                      { id: "PHONE_CALLS" as const, label: "Phone calls" },
                      { id: "STORE_VISITS" as const, label: "Store visits" },
                    ]
                  ).map((option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center gap-3"
                    >
                      <input
                        type="checkbox"
                        checked={searchGoals[option.id]}
                        onChange={(e) =>
                          setSearchGoals((prev) => ({
                            ...prev,
                            [option.id]: e.target.checked,
                          }))
                        }
                        className="size-4 rounded border-[#5f6368] text-[#1877f2] accent-[#1877f2]"
                      />
                      <span className="text-sm font-light text-[#202124]">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </fieldset>
              </section>
            </>
          ) : null}

          {showCampaignTypes && campaignType === "DEMAND_GEN" ? (
            <section className="rounded-xl border border-[#dadce0] bg-white p-5 sm:p-7">
              <p className="text-sm leading-relaxed text-[#3c4043]">
                Capturing engagement and action across YouTube, including Shorts,
                Discover, and Gmail, Demand Gen campaigns are ideal for social
                advertisers who want to serve visually-appealing, multi-format
                ads on Google&apos;s most impactful surfaces available to any
                advertiser.{" "}
                <button
                  type="button"
                  className="font-light text-[#1877f2] hover:underline"
                >
                  See how it works
                </button>
              </p>
            </section>
          ) : null}

          {showCampaignTypes && campaignType === "VIDEO" ? (
            <section className="rounded-xl border border-[#dadce0] bg-white p-5 sm:p-7">
              <p className="text-sm leading-relaxed text-[#3c4043]">
                Get more conversions with video ads designed to encourage
                valuable interactions with your business{" "}
                <button
                  type="button"
                  className="font-light text-[#1877f2] underline hover:no-underline"
                >
                  Learn more
                </button>
              </p>
            </section>
          ) : null}

          {showCampaignTypes && campaignType === "DISPLAY" ? (
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
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-light tracking-tight text-[#202124]">
                    This is the web page people will go to after clicking your
                    ad
                  </h2>
                  <button
                    type="button"
                    className="inline-flex size-5 shrink-0 items-center justify-center text-[#5f6368] transition hover:text-[#1877f2]"
                    aria-label="Help"
                  >
                    <CircleHelp className="size-4" aria-hidden />
                  </button>
                </div>
                <label className="relative mt-4 block">
                  <span className="sr-only">Your business&apos;s website</span>
                  <Link2
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5f6368]"
                    aria-hidden
                  />
                  <input
                    type="url"
                    value={finalUrl}
                    onChange={(e) => setFinalUrl(e.target.value)}
                    placeholder="Your business's website"
                    className="w-full rounded-md border border-[#dadce0] bg-white py-2.5 pl-10 pr-3 text-sm text-[#202124] outline-none transition placeholder:text-[#80868b] focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2]"
                  />
                </label>
              </section>
            </>
          ) : null}

          {showCampaignTypes && campaignType === "SHOPPING" ? (
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
                <div className="flex items-center justify-between border-b border-[#dadce0] px-5 py-4 sm:px-7">
                  <h2 className="text-lg font-light tracking-tight text-[#202124]">
                    Add products to this campaign
                  </h2>
                  <ChevronUp className="size-4 text-[#5f6368]" aria-hidden />
                </div>
                <div className="px-5 py-5 sm:px-7">
                  <div className="flex flex-col gap-4 rounded-lg bg-[#e8f0fe] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <Info
                        className="mt-0.5 size-4 shrink-0 text-[#1967d2]"
                        aria-hidden
                      />
                      <p className="text-sm leading-relaxed text-[#3c4043]">
                        To run a Shopping campaign, create a Merchant Center
                        account with the products you want to advertise. You can
                        create the account now and finish setting it up after
                        you&apos;ve published this campaign.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 cursor-pointer rounded-md bg-[#1877f2] px-4 py-2.5 text-sm font-light text-white transition hover:bg-[#166fe0]"
                    >
                      Create Merchant Center account
                    </button>
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#e8edf5] bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              if (showCampaignTypes) {
                setShowCampaignTypes(false);
                return;
              }
              onCancel();
            }}
            className="cursor-pointer px-2 py-2 text-sm font-light text-[#1877f2] transition hover:underline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!showCampaignTypes) {
                setShowCampaignTypes(true);
                return;
              }
              if (campaignType === "PERFORMANCE_MAX") {
                openPmaxBidding(true);
                return;
              }
              onContinue();
            }}
            className="cursor-pointer rounded-md bg-[#1877f2] px-5 py-2.5 text-sm font-light text-white transition hover:bg-[#166fe0]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
