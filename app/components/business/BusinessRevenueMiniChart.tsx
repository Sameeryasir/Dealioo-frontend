"use client";

import {
  Area,
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
  OverviewChartGradientDefs,
  useLineChartGradient,
} from "@/app/components/campaign/overview/charts/overview-chart-gradients";
import {
  OVERVIEW_CHART_COLORS,
  OVERVIEW_MINI_LINE_CHART_MARGIN,
  shortenMonthAxisLabel,
} from "@/app/components/campaign/overview/charts/overview-chart-config";
import type { MonthlyRevenuePoint } from "@/app/components/business/business-activity-chart-config";
import { formatCents } from "@/app/lib/money";

export function BusinessRevenueMiniChart({
  data,
  totalRevenueCents,
  months,
}: {
  data: MonthlyRevenuePoint[];
  totalRevenueCents: number;
  months: number;
}) {
  const strokeColor = OVERVIEW_CHART_COLORS.pink;
  const gradient = useLineChartGradient(strokeColor);
  const chartData = data.map((row) => ({
    ...row,
    value: row.value / 100,
  }));

  return (
    <OverviewChartShell
      title="Revenue by month"
      subtitle={`Prepaid offer revenue, last ${months} months`}
      minHeightClass="min-h-[220px]"
      className="h-full"
      accent="pink"
      stat={formatCents(totalRevenueCents, "usd")}
    >
      <div className="h-[190px] w-full min-w-0">
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={chartData} margin={OVERVIEW_MINI_LINE_CHART_MARGIN}>
            <OverviewChartGradientDefs stops={gradient.stops} />
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
              width={36}
              tickFormatter={(value: number) =>
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(value)
              }
            />
            <Tooltip content={<OverviewChartTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill={`url(#${gradient.areaId})`}
              fillOpacity={1}
              tooltipType="none"
            />
            <Line
              type="monotone"
              dataKey="value"
              name="Revenue"
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
