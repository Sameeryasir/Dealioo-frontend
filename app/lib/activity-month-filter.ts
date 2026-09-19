export const ACTIVITY_MONTH_COUNT = 6;

// Business dashboard year arrows already reach last year. This count makes every past month in that view selectable, not only the last six.
export function activityCalendarYearMonthCount(): number {
  const now = new Date();
  return now.getUTCMonth() + 13;
}

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
      ? new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            23,
            59,
            59,
            999,
          ),
        )
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
  const endOfTodayUtc = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
  const options: ActivityMonthFilterOption[] = [];

  const allFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthCount - 1), 1),
  );

  options.push({
    id: ACTIVITY_ALL_MONTHS_ID,
    label: `All months (last ${monthCount})`,
    from: allFrom.toISOString(),
    to: endOfTodayUtc.toISOString(),
  });

  for (let offset = 0; offset < monthCount; offset += 1) {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1),
    );
    const end =
      offset === 0
        ? endOfTodayUtc
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

export function currentActivityDateKey(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
    .toISOString()
    .slice(0, 10);
}

export function buildActivityDateKey(
  year: number,
  month: number,
  day: number,
): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseActivityDateKey(
  dateKey: string,
): { year: number; month: number; day: number } | null {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function isActivityDateSelectable(
  dateKey: string,
  monthCount = ACTIVITY_MONTH_COUNT,
): boolean {
  const parsed = parseActivityDateKey(dateKey);
  if (!parsed) return false;

  const dayStart = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  const earliest = getEarliestSelectableActivityMonth(monthCount);
  const today = new Date(currentActivityDateKey() + "T00:00:00.000Z");
  return dayStart >= earliest && dayStart <= today;
}

export function resolveActivityDateRange(
  dateKey: string,
  monthCount = ACTIVITY_MONTH_COUNT,
): { from: string; to: string } {
  const selected = isActivityDateSelectable(dateKey, monthCount)
    ? dateKey
    : currentActivityDateKey();
  const parsed = parseActivityDateKey(selected);
  if (!parsed) {
    const now = new Date();
    return { from: now.toISOString(), to: now.toISOString() };
  }

  const from = new Date(
    Date.UTC(parsed.year, parsed.month - 1, parsed.day, 0, 0, 0, 0),
  );
  const to = new Date(
    Date.UTC(parsed.year, parsed.month - 1, parsed.day, 23, 59, 59, 999),
  );
  return { from: from.toISOString(), to: to.toISOString() };
}

export function resolveCollectiveMonthRange(
  dateKey: string,
  monthCount = ACTIVITY_MONTH_COUNT,
): { from: string; to: string; inProgress: boolean } {
  const selected = isActivityDateSelectable(dateKey, monthCount)
    ? dateKey
    : currentActivityDateKey();
  const parsed = parseActivityDateKey(selected);
  if (!parsed) {
    const now = new Date().toISOString();
    return { from: now, to: now, inProgress: true };
  }

  const from = new Date(Date.UTC(parsed.year, parsed.month - 1, 1, 0, 0, 0, 0));
  const lastDay = new Date(Date.UTC(parsed.year, parsed.month, 0)).getUTCDate();
  const monthEnd = new Date(
    Date.UTC(parsed.year, parsed.month - 1, lastDay, 23, 59, 59, 999),
  );
  const today = parseActivityDateKey(currentActivityDateKey());
  const todayEnd = today
    ? new Date(Date.UTC(today.year, today.month - 1, today.day, 23, 59, 59, 999))
    : monthEnd;
  const inProgress = monthEnd.getTime() > todayEnd.getTime();
  const to = inProgress ? todayEnd : monthEnd;
  return { from: from.toISOString(), to: to.toISOString(), inProgress };
}

export function formatActivityDateLabel(dateKey: string): string {
  const parsed = parseActivityDateKey(dateKey);
  if (!parsed) return "Select date";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)));
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
