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
  OVERVIEW_CHART_COLORS,
  OVERVIEW_MINI_LINE_CHART_MARGIN,
  shortenMonthAxisLabel,
} from "@/app/components/campaign/overview/charts/overview-chart-config";
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
  const strokeColor = OVERVIEW_CHART_COLORS.pink;

  return (
    <OverviewChartShell
      title="New members"
      subtitle={`Customers registered, last ${months} months`}
      minHeightClass="min-h-[220px]"
      className="h-full"
      accent="pink"
      stat={total.toLocaleString()}
    >
      <div className="h-[190px] w-full min-w-0">
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={data} margin={OVERVIEW_MINI_LINE_CHART_MARGIN}>
            <CartesianGrid
              strokeDasharray="4 6"
              stroke="#e8edf5"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              tickFormatter={shortenMonthAxisLabel}
              height={30}
              dy={4}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#cbd5e1", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<OverviewChartTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              name="New members"
              stroke={strokeColor}
              strokeWidth={3}
              dot={{
                r: 3.5,
                fill: "#ffffff",
                stroke: strokeColor,
                strokeWidth: 2.5,
              }}
              activeDot={{
                r: 6,
                fill: strokeColor,
                stroke: "#ffffff",
                strokeWidth: 3,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </OverviewChartShell>
  );
}
