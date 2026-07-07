"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OverviewChartShell } from "@/app/components/campaign/overview/charts/OverviewChartShell";
import { OverviewChartTooltip } from "@/app/components/campaign/overview/charts/OverviewChartTooltip";
import {
  OVERVIEW_MINI_LINE_CHART_MARGIN,
  OVERVIEW_MONTH_COUNT,
  shortenMonthAxisLabel,
  type MonthlyMetricPoint,
} from "@/app/components/campaign/overview/charts/overview-chart-config";

export function AnalyticsMetricMiniChart({
  title,
  subtitle,
  total,
  data,
  strokeColor,
}: {
  title: string;
  subtitle: string;
  total: number;
  data: MonthlyMetricPoint[];
  strokeColor: string;
}) {
  return (
    <OverviewChartShell
      title={title}
      subtitle={`${subtitle}, last ${OVERVIEW_MONTH_COUNT} months`}
      minHeightClass="min-h-[200px]"
      className="h-full"
    >
      <p className="mb-3 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900">
        {total.toLocaleString()}
      </p>
      <div className="h-[180px] w-full min-w-0">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={OVERVIEW_MINI_LINE_CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#a1a1aa", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              tickFormatter={shortenMonthAxisLabel}
              height={28}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#a1a1aa", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<OverviewChartTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2.5}
              dot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: strokeColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </OverviewChartShell>
  );
}
