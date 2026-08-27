import type {
  MetaCampaignObjective,
  MetaOptimizationGoal,
} from "@/app/lib/meta-campaign-builder-types";

export type OptimizationGoalOption = {
  value: MetaOptimizationGoal;
  label: string;
  description?: string;
  group?: "primary" | "conversion" | "other" | "video" | "engagement";
  recommended?: boolean;
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
      recommended: true,
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
      label: "Maximise number of leads",
      description:
        "We'll try to show your ads to the people most likely to become a lead on your website.",
      group: "primary",
      recommended: true,
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
        "We'll try to show your ads to the people most likely to take a specific action on your website.",
      group: "conversion",
      recommended: true,
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
      description: "We'll try to show your ads to as many people as possible.",
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
  OUTCOME_ENGAGEMENT: [
    {
      value: "THRUPLAY",
      label: "Maximise ThruPlay views",
      description:
        "We'll try to show your video ads to people who will watch the entire video when it's shorter than 15 seconds. For longer videos, we'll try to show it to people who are likely to watch at least 15 seconds.",
      group: "primary",
      recommended: true,
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
      recommended: true,
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

export function defaultOptimizationGoalForObjective(
  objective: MetaCampaignObjective,
): MetaOptimizationGoal {
  const options = OPTIMIZATION_GOALS_BY_OBJECTIVE[objective];
  const recommended = options.find((option) => option.recommended);
  if (recommended) return recommended.value;
  const primary = options.find((option) => option.group === "primary");
  if (primary) return primary.value;
  return options[0]?.value ?? "LINK_CLICKS";
}

/** Pick the performance goal when opening ad set setup for a campaign objective. */
export function resolveOptimizationGoalForObjective(
  objective: MetaCampaignObjective,
  saved: MetaOptimizationGoal | undefined,
): MetaOptimizationGoal {
  const options = OPTIMIZATION_GOALS_BY_OBJECTIVE[objective];
  const defaultGoal = defaultOptimizationGoalForObjective(objective);

  if (!saved || !options.some((option) => option.value === saved)) {
    return defaultGoal;
  }

  const savedOption = options.find((option) => option.value === saved);

  if (objective === "OUTCOME_TRAFFIC") {
    return savedOption?.group === "primary" ? saved : defaultGoal;
  }

  if (objective === "OUTCOME_SALES" || objective === "OUTCOME_LEADS") {
    const isPreferredGoal =
      saved === defaultGoal ||
      savedOption?.recommended === true ||
      savedOption?.group === "conversion" ||
      savedOption?.group === "primary";
    return isPreferredGoal ? saved : defaultGoal;
  }

  return saved;
}

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

export function listAllIanaTimezones(): string[] {
  try {
    const intlWithZones = Intl as typeof Intl & {
      supportedValuesOf?: (key: string) => string[];
    };
    if (typeof intlWithZones.supportedValuesOf === "function") {
      return intlWithZones.supportedValuesOf("timeZone");
    }
  } catch {
  }
  return [...COMMON_TIMEZONES];
}

export function timezoneOffsetMinutes(
  timezone: string,
  at = new Date(),
): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    }).formatToParts(at);
    const raw = parts.find((part) => part.type === "timeZoneName")?.value ?? "";
    const match = raw.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) return 0;
    const sign = match[1] === "-" ? -1 : 1;
    const hours = Number(match[2]);
    const minutes = Number(match[3] ?? 0);
    return sign * (hours * 60 + minutes);
  } catch {
    return 0;
  }
}

export function buildTimezoneSelectOptions(
  at = new Date(),
): Array<{ value: string; label: string }> {
  return listAllIanaTimezones()
    .map((tz) => ({
      value: tz,
      label: formatTimezoneOptionLabel(tz, at),
      offsetMinutes: timezoneOffsetMinutes(tz, at),
    }))
    .sort((a, b) => {
      if (a.offsetMinutes !== b.offsetMinutes) {
        return a.offsetMinutes - b.offsetMinutes;
      }
      return a.value.localeCompare(b.value);
    })
    .map(({ value, label }) => ({ value, label }));
}

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
  return localIsoDateFromDate(date);
}

export function localIsoDateFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function defaultStartDateIso(): string {
  return localIsoDateFromDate(new Date());
}

export function defaultStartTimeLocal(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
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

export function timezoneGmtOffset(timezone: string, at = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    }).formatToParts(at);
    const raw = parts.find((part) => part.type === "timeZoneName")?.value;
    if (!raw) return "";
    return raw.replace(
      /GMT([+-])0?(\d+)(?::00|:(\d+))?/,
      (_m, sign: string, hours: string, minutes?: string) =>
        minutes && minutes !== "00"
          ? `GMT${sign}${Number(hours)}:${minutes}`
          : `GMT${sign}${Number(hours)}`,
    );
  } catch {
    return "";
  }
}

export function formatTimezoneOptionLabel(
  timezone: string,
  at = new Date(),
): string {
  const offset = timezoneGmtOffset(timezone, at);
  return offset ? `${timezone} (${offset})` : timezone;
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return defaultEndDateIso();
  }
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isEndScheduleAfterStart(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): boolean {
  const startMs = Date.parse(`${startDate.trim()}T${startTime.trim()}:00`);
  const endMs = Date.parse(`${endDate.trim()}T${endTime.trim()}:00`);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return false;
  return endMs > startMs;
}

export function ensureEndScheduleAfterStart(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): { endDate: string; endTime: string } {
  if (isEndScheduleAfterStart(startDate, startTime, endDate, endTime)) {
    return { endDate, endTime };
  }

  const nextDay = addDaysToIsoDate(startDate, 1);
  if (isEndScheduleAfterStart(startDate, startTime, nextDay, DEFAULT_END_TIME_LOCAL)) {
    return { endDate: nextDay, endTime: DEFAULT_END_TIME_LOCAL };
  }

  const startMs = Date.parse(`${startDate.trim()}T${startTime.trim()}:00`);
  if (Number.isFinite(startMs)) {
    const bumped = new Date(startMs + 60_000);
    const bumpedTime = `${String(bumped.getHours()).padStart(2, "0")}:${String(
      bumped.getMinutes(),
    ).padStart(2, "0")}`;
    if (isEndScheduleAfterStart(startDate, startTime, startDate, bumpedTime)) {
      return { endDate: startDate, endTime: bumpedTime };
    }
  }

  return { endDate: nextDay, endTime: DEFAULT_END_TIME_LOCAL };
}

export function defaultEndScheduleAfterStart(
  startDate: string,
  startTime: string,
  durationDays = DEFAULT_END_DURATION_DAYS,
): { endDate: string; endTime: string } {
  const endDate = addDaysToIsoDate(startDate, Math.max(1, durationDays));
  return ensureEndScheduleAfterStart(
    startDate,
    startTime,
    endDate,
    DEFAULT_END_TIME_LOCAL,
  );
}

export const DEFAULT_END_TIME_LOCAL = "23:59";

export const DEFAULT_END_DURATION_DAYS = 14;

export const END_DATE_DURATION_OPTIONS = [
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 30, label: "30 days" },
] as const;
