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
import type { MonthlyMetricBarPoint } from "@/app/components/business/business-activity-chart-config";

/**
 * Change summary:
 * - Replaced AnalyticsMetricMiniChart with an explicit-height line chart.
 * - Why: the mini chart canvas depends on funnel-overview CSS variables that are
 *   not present on the business dashboard, so the chart area collapsed to 0px.
 * - Related: BusinessRevenueMiniChart, BusinessActivityOverviewPanel.
 * - MCP context 7: matches the working revenue chart sizing pattern.
 */
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
  const gradient = useLineChartGradient(strokeColor);

  return (
    <OverviewChartShell
      title="New members"
      subtitle={`Guest conversations, last ${months} months`}
      minHeightClass="min-h-[220px]"
      className="h-full"
      accent="pink"
      stat={total.toLocaleString()}
    >
      {/* --- Chart area: fixed height so Recharts always has pixels to render --- */}
      <div className="h-[190px] w-full min-w-0">
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={data} margin={OVERVIEW_MINI_LINE_CHART_MARGIN}>
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
              width={28}
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
