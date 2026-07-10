"use client";

import { AnalyticsMetricMiniChart } from "@/app/components/campaign/overview/charts/AnalyticsMetricMiniChart";
import { OVERVIEW_CHART_COLORS } from "@/app/components/campaign/overview/charts/overview-chart-config";
import type { MonthlyMetricBarPoint } from "@/app/components/business/business-activity-chart-config";

export function BusinessMembersMiniChart({
  data,
  total,
  months,
}: {
  data: MonthlyMetricBarPoint[];
  total: number;
  months: number;
}) {
  return (
    <AnalyticsMetricMiniChart
      title="New members"
      subtitle="Guest conversations"
      total={total}
      data={data}
      strokeColor={OVERVIEW_CHART_COLORS.pink}
    />
  );
}
