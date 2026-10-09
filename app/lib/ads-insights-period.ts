export const DEFAULT_ADS_INSIGHTS_PERIOD = "this_month" as const;

export const ADS_PERIOD_PRESETS = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_7d", label: "Last 7 days" },
  { value: "last_30d", label: "Last 30 days" },
  { value: "maximum", label: "Maximum" },
] as const;

export type AdsPeriodPresetValue =
  (typeof ADS_PERIOD_PRESETS)[number]["value"];

export function parseAdsMonthPeriod(
  period: string,
): { year: number; month: number; key: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(period.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }
  return {
    year,
    month,
    key: `${year}-${String(month).padStart(2, "0")}`,
  };
}

export function buildAdsMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function isAdsMaximumPeriod(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "maximum" ||
    normalized === "all_time" ||
    normalized === "data_maximum"
  );
}

export function adsInsightsPeriodsMatch(
  selected: string,
  fromApi: string,
): boolean {
  const a = selected.trim().toLowerCase();
  const b = fromApi.trim().toLowerCase();
  if (a === b) return true;
  if (isAdsMaximumPeriod(a) && isAdsMaximumPeriod(b)) return true;
  return false;
}

export function formatAdsInsightsPeriodLabel(
  preset: string | null | undefined,
): string {
  const value = (preset ?? "").trim();
  const monthMatch = /^m?:?(\d{4})-(\d{2})$/.exec(value);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    if (month >= 1 && month <= 12) {
      return new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(year, month - 1, 1)));
    }
  }

  switch (value.toLowerCase()) {
    case "today":
      return "Today";
    case "yesterday":
      return "Yesterday";
    case "last_3d":
      return "Last 3 days";
    case "last_7d":
      return "Last 7 days";
    case "last_14d":
      return "Last 14 days";
    case "last_28d":
      return "Last 28 days";
    case "last_30d":
      return "Last 30 days";
    case "last_90d":
      return "Last 90 days";
    case "this_month":
      return "This month";
    case "last_month":
      return "Last month";
    case "this_quarter":
      return "This quarter";
    case "last_quarter":
      return "Last quarter";
    case "this_year":
      return "This year";
    case "last_year":
      return "Last year";
    case "maximum":
    case "data_maximum":
    case "all_time":
      return "All available history";
    default:
      return "This month";
  }
}

export const DEFAULT_META_AD_STATS_DATE_PRESET = DEFAULT_ADS_INSIGHTS_PERIOD;
export const formatMetaAdStatsDatePresetLabel = formatAdsInsightsPeriodLabel;
