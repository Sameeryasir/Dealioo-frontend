/**
 * Month filter options for restaurant activity log.
 * Maps calendar months to API `from` / `to` ISO ranges.
 */

export const ACTIVITY_MONTH_COUNT = 6;

export const ACTIVITY_ALL_MONTHS_ID = "all";

export type ActivityMonthFilterOption = {
  id: string;
  label: string;
  from: string;
  to: string;
};

function monthKeyFromDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function buildActivityMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseActivityMonthKey(
  monthKey: string,
): { year: number; month: number } | null {
  const [yearRaw, monthRaw] = monthKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }
  return { year, month };
}

export function getEarliestSelectableActivityMonth(
  monthCount = ACTIVITY_MONTH_COUNT,
): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthCount - 1), 1),
  );
}

export function isActivityMonthSelectable(
  monthKey: string,
  monthCount = ACTIVITY_MONTH_COUNT,
): boolean {
  const parsed = parseActivityMonthKey(monthKey);
  if (!parsed) return false;

  const monthStart = new Date(Date.UTC(parsed.year, parsed.month - 1, 1));
  const earliest = getEarliestSelectableActivityMonth(monthCount);
  const now = new Date();
  const currentMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );

  return monthStart >= earliest && monthStart <= currentMonthStart;
}

export function getActivityMonthRangeForKey(
  monthKey: string,
  monthCount = ACTIVITY_MONTH_COUNT,
): { from: string; to: string } | null {
  if (monthKey === ACTIVITY_ALL_MONTHS_ID) {
    return resolveActivityMonthRange(
      ACTIVITY_ALL_MONTHS_ID,
      buildActivityMonthFilterOptions(monthCount),
    );
  }

  const parsed = parseActivityMonthKey(monthKey);
  if (!parsed || !isActivityMonthSelectable(monthKey, monthCount)) {
    return null;
  }

  const now = new Date();
  const start = new Date(Date.UTC(parsed.year, parsed.month - 1, 1));
  const currentMonthKey = monthKeyFromDate(now);
  const end =
    monthKey === currentMonthKey
      ? now
      : new Date(
          Date.UTC(parsed.year, parsed.month, 0, 23, 59, 59, 999),
        );

  return { from: start.toISOString(), to: end.toISOString() };
}

export const ACTIVITY_MONTH_SHORT_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatActivityMonthLabel(monthKey: string): string {
  const [yearRaw, monthRaw] = monthKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return monthKey;
  }
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function buildActivityMonthFilterOptions(
  monthCount = ACTIVITY_MONTH_COUNT,
): ActivityMonthFilterOption[] {
  const now = new Date();
  const options: ActivityMonthFilterOption[] = [];

  const allFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthCount - 1), 1),
  );

  options.push({
    id: ACTIVITY_ALL_MONTHS_ID,
    label: `All months (last ${monthCount})`,
    from: allFrom.toISOString(),
    to: now.toISOString(),
  });

  for (let offset = 0; offset < monthCount; offset += 1) {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1),
    );
    const end =
      offset === 0
        ? now
        : new Date(
            Date.UTC(
              start.getUTCFullYear(),
              start.getUTCMonth() + 1,
              0,
              23,
              59,
              59,
              999,
            ),
          );

    const monthKey = monthKeyFromDate(start);
    options.push({
      id: monthKey,
      label: formatActivityMonthLabel(monthKey),
      from: start.toISOString(),
      to: end.toISOString(),
    });
  }

  return options;
}

export function resolveActivityMonthRange(
  monthFilterId: string,
  options: ActivityMonthFilterOption[],
): { from: string; to: string } {
  const match =
    options.find((option) => option.id === monthFilterId) ?? options[0];

  if (!match) {
    const now = new Date();
    const from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (ACTIVITY_MONTH_COUNT - 1), 1),
    );
    return { from: from.toISOString(), to: now.toISOString() };
  }

  return { from: match.from, to: match.to };
}
