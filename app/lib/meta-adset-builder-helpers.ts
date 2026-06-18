import type {
  MetaCampaignObjective,
  MetaOptimizationGoal,
} from "@/app/lib/meta-campaign-builder-types";

export const OPTIMIZATION_GOALS_BY_OBJECTIVE: Record<
  MetaCampaignObjective,
  { value: MetaOptimizationGoal; label: string }[]
> = {
  OUTCOME_TRAFFIC: [
    { value: "LINK_CLICKS", label: "Link clicks" },
    { value: "LANDING_PAGE_VIEWS", label: "Landing page views" },
  ],
  OUTCOME_LEADS: [{ value: "LEAD_GENERATION", label: "Lead generation" }],
  OUTCOME_SALES: [
    { value: "OFFSITE_CONVERSIONS", label: "Offsite conversions" },
  ],
  OUTCOME_ENGAGEMENT: [
    { value: "POST_ENGAGEMENT", label: "Post engagement" },
  ],
  OUTCOME_AWARENESS: [
    { value: "REACH", label: "Reach" },
    { value: "IMPRESSIONS", label: "Impressions" },
  ],
};

export const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Australia/Sydney",
];

export const COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "AU", label: "Australia" },
  { code: "PK", label: "Pakistan" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "IN", label: "India" },
];

export function splitCsv(value: string): string[] | undefined {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

export function joinCsv(items?: string[]): string {
  return items?.join(", ") ?? "";
}

export function defaultEndDateIso(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

export function defaultStartDateIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/New_York";
  }
}
