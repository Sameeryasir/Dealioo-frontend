export const ACTIVITY_MONTH_COUNT = 120;

export function activityCalendarYearMonthCount(): number {
  return ACTIVITY_MONTH_COUNT;
}

export const ACTIVITY_ALL_MONTHS_ID = "all";

export type ActivityMonthFilterOption = {
  id: string;
  label: string;
  from: string;
  to: string;
};

function localYmd(date = new Date()): { year: number; month: number; day: number } {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function localDayStart(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function localDayEnd(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

function monthKeyFromLocalDate(date: Date): string {
  const { year, month } = localYmd(date);
  return buildActivityMonthKey(year, month);
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
  return new Date(now.getFullYear(), now.getMonth() - (monthCount - 1), 1);
}

export function isActivityMonthSelectable(
  monthKey: string,
  monthCount = ACTIVITY_MONTH_COUNT,
): boolean {
  const parsed = parseActivityMonthKey(monthKey);
  if (!parsed) return false;

  const monthStart = new Date(parsed.year, parsed.month - 1, 1);
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  if (monthStart > currentMonthStart) {
    return false;
  }

  if (!Number.isFinite(monthCount) || monthCount <= 0) {
    return true;
  }

  const earliest = getEarliestSelectableActivityMonth(monthCount);
  return monthStart >= earliest;
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
  const start = localDayStart(parsed.year, parsed.month, 1);
  const currentMonthKey = monthKeyFromLocalDate(now);
  const end =
    monthKey === currentMonthKey
      ? localDayEnd(now.getFullYear(), now.getMonth() + 1, now.getDate())
      : localDayEnd(parsed.year, parsed.month + 1, 0);

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
  }).format(new Date(year, month - 1, 1));
}

export function buildActivityMonthFilterOptions(
  monthCount = ACTIVITY_MONTH_COUNT,
): ActivityMonthFilterOption[] {
  const now = new Date();
  const endOfTodayLocal = localDayEnd(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );
  const options: ActivityMonthFilterOption[] = [];

  const allFrom = new Date(
    now.getFullYear(),
    now.getMonth() - (monthCount - 1),
    1,
    0,
    0,
    0,
    0,
  );

  options.push({
    id: ACTIVITY_ALL_MONTHS_ID,
    label: "All months",
    from: allFrom.toISOString(),
    to: endOfTodayLocal.toISOString(),
  });

  for (let offset = 0; offset < monthCount; offset += 1) {
    const start = new Date(
      now.getFullYear(),
      now.getMonth() - offset,
      1,
      0,
      0,
      0,
      0,
    );
    const end =
      offset === 0
        ? endOfTodayLocal
        : localDayEnd(start.getFullYear(), start.getMonth() + 2, 0);

    const monthKey = monthKeyFromLocalDate(start);
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
  const { year, month, day } = localYmd();
  return buildActivityDateKey(year, month, day);
}

export function currentActivityMonthKey(): string {
  const { year, month } = localYmd();
  return buildActivityMonthKey(year, month);
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
  const local = new Date(year, month - 1, day);
  if (
    local.getFullYear() !== year ||
    local.getMonth() !== month - 1 ||
    local.getDate() !== day
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

  const dayStart = localDayStart(parsed.year, parsed.month, parsed.day);
  const earliest = getEarliestSelectableActivityMonth(monthCount);
  const today = parseActivityDateKey(currentActivityDateKey());
  if (!today) return false;
  const todayStart = localDayStart(today.year, today.month, today.day);
  return dayStart >= earliest && dayStart <= todayStart;
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

  const from = localDayStart(parsed.year, parsed.month, parsed.day);
  const to = localDayEnd(parsed.year, parsed.month, parsed.day);
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

  const from = localDayStart(parsed.year, parsed.month, 1);
  const monthEnd = localDayEnd(parsed.year, parsed.month + 1, 0);
  const today = parseActivityDateKey(currentActivityDateKey());
  const todayEnd = today
    ? localDayEnd(today.year, today.month, today.day)
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
  }).format(new Date(parsed.year, parsed.month - 1, parsed.day));
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
      now.getFullYear(),
      now.getMonth() - (ACTIVITY_MONTH_COUNT - 1),
      1,
      0,
      0,
      0,
      0,
    );
    return { from: from.toISOString(), to: now.toISOString() };
  }

  return { from: match.from, to: match.to };
}

function shiftLocalByMonths(date: Date, monthDelta: number): Date {
  const year = date.getFullYear();
  const monthIndex = date.getMonth() + monthDelta;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ms = date.getMilliseconds();

  const shifted = new Date(year, monthIndex, 1, hours, minutes, seconds, ms);
  const lastDayOfMonth = new Date(
    shifted.getFullYear(),
    shifted.getMonth() + 1,
    0,
  ).getDate();
  shifted.setDate(Math.min(day, lastDayOfMonth));
  return shifted;
}

export function resolveActivityPreviousComparisonRange(
  fromIso: string,
  toIso: string,
): { from: string; to: string } | null {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return null;
  }

  const durationMs = to.getTime() - from.getTime();
  if (durationMs <= 0) {
    return null;
  }

  const sameLocalCalendarDay =
    from.getFullYear() === to.getFullYear() &&
    from.getMonth() === to.getMonth() &&
    from.getDate() === to.getDate();
  if (sameLocalCalendarDay) {
    return {
      from: shiftLocalByMonths(from, -1).toISOString(),
      to: shiftLocalByMonths(to, -1).toISOString(),
    };
  }

  const isSingleCalendarMonth =
    from.getDate() === 1 &&
    from.getFullYear() === to.getFullYear() &&
    from.getMonth() === to.getMonth();

  if (isSingleCalendarMonth) {
    const previousFrom = shiftLocalByMonths(from, -1);
    const lastDayOfSelectedMonth = new Date(
      to.getFullYear(),
      to.getMonth() + 1,
      0,
    ).getDate();
    const selectedMonthIsComplete = to.getDate() === lastDayOfSelectedMonth;
    let previousTo = selectedMonthIsComplete
      ? new Date(
          previousFrom.getFullYear(),
          previousFrom.getMonth() + 1,
          0,
          to.getHours(),
          to.getMinutes(),
          to.getSeconds(),
          to.getMilliseconds(),
        )
      : shiftLocalByMonths(to, -1);
    if (previousTo.getTime() < previousFrom.getTime()) {
      previousTo = new Date(previousFrom.getTime());
    }
    return {
      from: previousFrom.toISOString(),
      to: previousTo.toISOString(),
    };
  }

  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - durationMs);
  return {
    from: previousFrom.toISOString(),
    to: previousTo.toISOString(),
  };
}
