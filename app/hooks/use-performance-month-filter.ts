"use client";

import {
  ACTIVITY_ALL_MONTHS_ID,
  activityCalendarYearMonthCount,
  buildActivityMonthFilterOptions,
  currentActivityMonthKey,
} from "@/app/lib/activity-month-filter";
import {
  readStoredPerformanceMonth,
  writeStoredPerformanceMonth,
} from "@/app/lib/performance-month-filter-storage";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export function usePerformanceMonthFilter(businessId: number) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dashboardMonthCount = useMemo(
    () => activityCalendarYearMonthCount(),
    [],
  );
  const monthOptions = useMemo(
    () => buildActivityMonthFilterOptions(dashboardMonthCount),
    [dashboardMonthCount],
  );

  const isValidMonth = useCallback(
    (value: string) =>
      value === ACTIVITY_ALL_MONTHS_ID ||
      monthOptions.some((option) => option.id === value),
    [monthOptions],
  );

  const monthFromQuery = useMemo(() => {
    const fromQuery = searchParams.get("month")?.trim() ?? "";
    return isValidMonth(fromQuery) ? fromQuery : null;
  }, [isValidMonth, searchParams]);

  const [monthFilter, setMonthFilterState] = useState(
    () => monthFromQuery ?? currentActivityMonthKey(),
  );

  useEffect(() => {
    if (monthFromQuery) {
      setMonthFilterState(monthFromQuery);
      writeStoredPerformanceMonth(businessId, monthFromQuery);
      return;
    }

    const stored = readStoredPerformanceMonth(businessId);
    if (!stored || !isValidMonth(stored)) return;

    setMonthFilterState(stored);
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", stored);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    businessId,
    isValidMonth,
    monthFromQuery,
    pathname,
    router,
    searchParams,
  ]);

  const setMonthFilter = useCallback(
    (nextMonth: string) => {
      setMonthFilterState(nextMonth);
      writeStoredPerformanceMonth(businessId, nextMonth);
      const params = new URLSearchParams(searchParams.toString());
      params.set("month", nextMonth);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [businessId, pathname, router, searchParams],
  );

  return {
    monthFilter,
    setMonthFilter,
    monthOptions,
    dashboardMonthCount,
  };
}
