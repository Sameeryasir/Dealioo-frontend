import type {
  MetaCampaignObjective,
  MetaOptimizationGoal,
} from "@/app/lib/meta-campaign-builder-types";

export type OptimizationGoalOption = {
  value: MetaOptimizationGoal;
  label: string;
  description?: string;
  group?: "primary" | "other" | "video";
};

export const OPTIMIZATION_GOALS_BY_OBJECTIVE: Record<
  MetaCampaignObjective,
  OptimizationGoalOption[]
> = {
  OUTCOME_TRAFFIC: [
    {
      value: "LANDING_PAGE_VIEWS",
      label: "Maximise number of landing page views",
      description:
        "We'll try to show your ads to the people most likely to view the website linked in your ad.",
      group: "primary",
    },
    {
      value: "LINK_CLICKS",
      label: "Maximise number of link clicks",
      description:
        "We'll try to show your ads to the people most likely to click on them.",
      group: "primary",
    },
    {
      value: "REACH",
      label: "Maximise daily unique reach",
      description: "We'll try to show your ads to people up to once per day.",
      group: "other",
    },
    {
      value: "CONVERSATIONS",
      label: "Maximise number of conversations",
      description:
        "We'll try to show your ads to people most likely to have a conversation with you through messaging.",
      group: "other",
    },
    {
      value: "IMPRESSIONS",
      label: "Maximise number of impressions",
      description:
        "We'll try to show your ads to people as many times as possible.",
      group: "other",
    },
  ],
  OUTCOME_LEADS: [
    {
      value: "OFFSITE_CONVERSIONS",
      label: "Maximise number of conversions",
      description:
        "We'll try to show your ads to the people most likely to take a specific action on your website.",
      group: "primary",
    },
    {
      value: "LANDING_PAGE_VIEWS",
      label: "Maximise number of landing page views",
      description:
        "We'll try to show your ads to the people most likely to view the website linked in your ad.",
      group: "other",
    },
    {
      value: "LINK_CLICKS",
      label: "Maximise number of link clicks",
      description:
        "We'll try to show your ads to the people most likely to click on them.",
      group: "other",
    },
    {
      value: "REACH",
      label: "Maximise daily unique reach",
      description: "We'll try to show your ads to people up to once per day.",
      group: "other",
    },
    {
      value: "IMPRESSIONS",
      label: "Maximise number of impressions",
      description:
        "We'll try to show your ads to people as many times as possible.",
      group: "other",
    },
  ],
  OUTCOME_SALES: [
    {
      value: "OFFSITE_CONVERSIONS",
      label: "Maximise number of conversions",
      description:
        "We'll try to show your ads to people most likely to take a valuable action on your website.",
      group: "primary",
    },
  ],
  OUTCOME_ENGAGEMENT: [
    {
      value: "THRUPLAY",
      label: "Maximise ThruPlay views",
      description:
        "We'll try to show your video ads to people who will watch the entire video when it's shorter than 15 seconds. For longer videos, we'll try to show it to people who are likely to watch at least 15 seconds.",
      group: "primary",
    },
    {
      value: "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS",
      label: "Maximise 2-second continuous video plays",
      description:
        "We'll try to show your video ads to people who are likely to watch 2 continuous seconds or more. Most 2-second continuous video plays will have at least 50% of the video pixels on screen.",
      group: "primary",
    },
  ],
  OUTCOME_AWARENESS: [
    {
      value: "REACH",
      label: "Maximise reach of ads",
      description:
        "We'll try to show your ads to as many people as possible.",
      group: "primary",
    },
    {
      value: "IMPRESSIONS",
      label: "Maximise number of impressions",
      description:
        "We'll try to show your ads to people as many times as possible.",
      group: "primary",
    },
    {
      value: "AD_RECALL_LIFT",
      label: "Maximise ad recall lift",
      description:
        "We'll try to show your ads to people who are likely to remember seeing them.",
      group: "primary",
    },
    {
      value: "THRUPLAY",
      label: "Maximise ThruPlay views",
      description:
        "We'll try to show your video ads to people who will watch the entire video when it's shorter than 15 seconds. For longer videos, we'll try to show it to people who are likely to watch at least 15 seconds.",
      group: "video",
    },
    {
      value: "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS",
      label: "Maximise 2-second continuous video plays",
      description:
        "We'll try to show your video ads to people who are likely to watch 2 continuous seconds or more. Most 2-second continuous video plays will have at least 50% of the video pixels on screen.",
      group: "video",
    },
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

export function timezoneAbbreviation(timezone: string, at = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    }).formatToParts(at);
    return parts.find((part) => part.type === "timeZoneName")?.value ?? timezone;
  } catch {
    return timezone;
  }
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return defaultEndDateIso();
  }
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export const END_DATE_DURATION_OPTIONS = [
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 30, label: "30 days" },
] as const;
