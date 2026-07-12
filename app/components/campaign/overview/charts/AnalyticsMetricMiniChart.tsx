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
import { OverviewChartCanvas } from "@/app/components/campaign/overview/charts/OverviewChartCanvas";
import { OverviewChartShell } from "@/app/components/campaign/overview/charts/OverviewChartShell";
import { OverviewChartTooltip } from "@/app/components/campaign/overview/charts/OverviewChartTooltip";
import {
  OverviewChartGradientDefs,
  useLineChartGradient,
} from "@/app/components/campaign/overview/charts/overview-chart-gradients";
import {
  OVERVIEW_MINI_LINE_CHART_MARGIN,
  OVERVIEW_MONTH_COUNT,
  shortenMonthAxisLabel,
  type MonthlyMetricPoint,
} from "@/app/components/campaign/overview/charts/overview-chart-config";

function strokeToAccent(
  color: string,
): "green" | "blue" | "pink" | "orange" {
  if (color.includes("34a853") || color.includes("22c55e")) return "green";
  if (color.includes("e1306c") || color.includes("ec4899")) return "pink";
  if (color.includes("f77737") || color.includes("f97316")) return "orange";
  return "blue";
}

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
  const gradient = useLineChartGradient(strokeColor);

  return (
    <OverviewChartShell
      title={title}
      subtitle={`${subtitle}, last ${OVERVIEW_MONTH_COUNT} months`}
      minHeightClass="min-h-0"
      className="h-full"
      accent={strokeToAccent(strokeColor)}
      stat={total.toLocaleString()}
    >
      <OverviewChartCanvas variant="mini">
        {({ width, height }) => (
          <ResponsiveContainer width={width} height={height}>
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
                id={`${gradient.lineId}-fill`}
                type="monotone"
                dataKey="value"
                stroke="none"
                fill={`url(#${gradient.areaId})`}
                fillOpacity={1}
                tooltipType="none"
              />
              <Line
                id={`${gradient.lineId}-stroke`}
                type="monotone"
                dataKey="value"
                name={title}
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
        )}
      </OverviewChartCanvas>
    </OverviewChartShell>
  );
}
