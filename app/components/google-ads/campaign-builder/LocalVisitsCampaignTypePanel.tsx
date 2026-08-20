"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Check, Info } from "lucide-react";
import { GoogleAdsStarIcon } from "@/app/components/google-ads/GoogleAdsStarIcon";
import type {
  CampaignTypeId,
  GoogleCampaignBuilderDraft,
} from "@/app/components/google-ads/campaign-builder/types";
import { getGoogleAdsConversionGoals } from "@/app/services/google-ads/get-google-ads-conversion-goals";

type LocalVisitsCampaignTypePanelProps = {
  businessId: number;
  campaignType: CampaignTypeId;
  onChange: (patch: Partial<GoogleCampaignBuilderDraft>) => void;
};

const LOCAL_GOAL_CATEGORIES = new Set([
  "STORE_VISIT",
  "GET_DIRECTIONS",
  "STORE_SALE",
  "PHONE_CALL_LEAD",
  "CONTACT",
  "LEAD",
]);

function GoogleGIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
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
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#FF0000"
        d="M23.5 6.2a3.05 3.05 0 0 0-2.14-2.16C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.36.54A3.05 3.05 0 0 0 .5 6.2 31.9 31.9 0 0 0 0 12a31.9 31.9 0 0 0 .5 5.8 3.05 3.05 0 0 0 2.14 2.16C4.5 20.5 12 20.5 12 20.5s7.5 0 9.36-.54a3.05 3.05 0 0 0 2.14-2.16A31.9 31.9 0 0 0 24 12a31.9 31.9 0 0 0-.5-5.8z"
      />
      <path fill="#fff" d="M9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  );
}

function GmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M2 6.5V19h4.2V10.8L12 15l5.8-4.2V19H22V6.5L12 13.8 2 6.5z"
      />
      <path fill="#34A853" d="M22 6.5v2.1L17.8 11.6V6.5H22z" />
      <path fill="#FBBC05" d="M2 6.5h4.2v5.1L2 8.6V6.5z" />
      <path
        fill="#EA4335"
        d="M22 6.5 12 13.8 2 6.5h4.2L12 10.9l5.8-4.4H22z"
      />
    </svg>
  );
}

function MapsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
      />
      <circle cx="12" cy="9" r="2.5" fill="#fff" />
      <circle cx="12" cy="9" r="1.4" fill="#4285F4" />
    </svg>
  );
}

function DisplayNetworkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <rect x="2" y="3" width="20" height="5" rx="1.2" fill="#34A853" />
      <rect x="2" y="10" width="9" height="11" rx="1.2" fill="#4285F4" />
      <rect x="13" y="10" width="9" height="11" rx="1.2" fill="#FBBC05" />
    </svg>
  );
}

function IconChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex size-7 items-center justify-center rounded-md bg-white ring-1 ring-[#dadce0]">
      {children}
    </span>
  );
}

export function LocalVisitsCampaignTypePanel({
  businessId,
  campaignType,
  onChange,
}: LocalVisitsCampaignTypePanelProps) {
  const isSelected = true;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (campaignType !== "PERFORMANCE_MAX") {
      onChangeRef.current({ campaignType: "PERFORMANCE_MAX" });
    }
  }, [campaignType]);

  useEffect(() => {
    let cancelled = false;

    async function loadLocalGoals() {
      if (businessId < 1) {
        return;
      }

      try {
        const response = await getGoogleAdsConversionGoals(businessId);
        if (cancelled) {
          return;
        }
        const localGoals = (response.goals ?? []).filter((goal) =>
          LOCAL_GOAL_CATEGORIES.has(goal.category),
        );
        onChangeRef.current({
          selectedConversionGoals: localGoals.map((goal) => ({
            category: goal.category,
            origin: goal.origin,
            accountDefault: goal.accountDefault,
            name: goal.name,
          })),
          conversionGoals: localGoals.map((goal) => goal.name).join(", "),
        });
      } catch {
        if (!cancelled) {
          onChangeRef.current({
            selectedConversionGoals: [],
            conversionGoals: "",
          });
        }
      }
    }

    void loadLocalGoals();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  return (
    <section className="rounded-xl border border-[#dadce0] bg-white p-5 sm:p-6">
      <h2 className="text-base font-normal text-[#202124] sm:text-lg">
        Select a campaign type
      </h2>

      <div className="mt-4 max-w-md">
        <button
          type="button"
          onClick={() => onChange({ campaignType: "PERFORMANCE_MAX" })}
          className={`relative w-full rounded-lg border bg-white p-4 text-left transition ${
            isSelected
              ? "border-[#1a73e8] ring-1 ring-[#1a73e8]"
              : "border-[#dadce0] hover:border-[#bdc1c6]"
          }`}
        >
          {isSelected ? (
            <span className="absolute right-3 top-3 inline-flex size-5 items-center justify-center rounded-full bg-[#1a73e8] text-white">
              <Check className="size-3" aria-hidden strokeWidth={3} />
            </span>
          ) : null}

          <div className="flex flex-wrap items-center gap-1.5 pr-8">
            <IconChip>
              <GoogleGIcon />
            </IconChip>
            <IconChip>
              <YoutubeIcon />
            </IconChip>
            <IconChip>
              <GmailIcon />
            </IconChip>
            <IconChip>
              <MapsIcon />
            </IconChip>
            <IconChip>
              <GoogleAdsStarIcon className="size-4" />
            </IconChip>
            <IconChip>
              <DisplayNetworkIcon />
            </IconChip>
          </div>

          <p className="mt-3 text-sm font-medium text-[#202124]">
            Performance Max
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-[#3c4043]">
            Reach the right people wherever they&apos;re browsing with ads on
            Google Search, YouTube, Display, and more
          </p>
        </button>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-lg bg-[#e8f0fe] px-4 py-3">
        <Info
          className="mt-0.5 size-4 shrink-0 text-[#1a73e8]"
          aria-hidden
        />
        <p className="text-sm leading-relaxed text-[#3c4043]">
          <span className="font-medium text-[#202124]">
            Performance Max has replaced Local campaigns.
          </span>{" "}
          Performance Max brings you the same optimization benefits, including
          store visits, call clicks, and directions to help you meet your
          offline goals.{" "}
          <a
            href="https://support.google.com/google-ads/answer/10724817"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#1a73e8] hover:underline"
          >
            Learn more
          </a>
        </p>
      </div>
    </section>
  );
}
