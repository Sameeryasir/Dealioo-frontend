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
import { OverviewChartLegend } from "@/app/components/campaign/overview/charts/OverviewChartLegend";
import { OverviewChartShell } from "@/app/components/campaign/overview/charts/OverviewChartShell";
import { OverviewChartTooltip } from "@/app/components/campaign/overview/charts/OverviewChartTooltip";
import {
  OVERVIEW_MINI_LINE_CHART_MARGIN,
  OVERVIEW_MONTH_COUNT,
  overviewAxisInterval,
  shortenMonthAxisLabel,
} from "@/app/components/campaign/overview/charts/overview-chart-config";
import type { MonthlyMetricBarPoint } from "@/app/components/business/business-activity-chart-config";

export function BusinessMonthlyBarChart({
  title,
  subtitle,
  data,
  dataKey,
  seriesName,
  accent = "blue",
  barFill,
  legendColor,
  months = OVERVIEW_MONTH_COUNT,
  caption,
}: {
  title: string;
  subtitle: string;
  data: MonthlyMetricBarPoint[];
  dataKey: keyof MonthlyMetricBarPoint & string;
  seriesName: string;
  accent?: "green" | "blue" | "pink" | "orange";
  barFill: string;
  legendColor: string;
  months?: number;
  caption?: string;
}) {
  const total = data.reduce(
    (sum, row) => sum + Number(row[dataKey] ?? 0),
    0,
  );

  return (
    <OverviewChartShell
      title={title}
      subtitle={caption ?? `${subtitle}, last ${months} months`}
      minHeightClass="min-h-[300px]"
      accent={accent}
    >
      <div className="h-[250px] w-full min-w-0">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={OVERVIEW_MINI_LINE_CHART_MARGIN}>
            <CartesianGrid
              strokeDasharray="4 6"
              stroke="#e8edf5"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              interval={overviewAxisInterval(data.length)}
              tickFormatter={shortenMonthAxisLabel}
              height={34}
              dy={6}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<OverviewChartTooltip />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              name={seriesName}
              stroke={barFill}
              strokeWidth={3}
              dot={{
                r: 3.5,
                fill: "#ffffff",
                stroke: barFill,
                strokeWidth: 2.5,
              }}
              activeDot={{
                r: 6,
                fill: barFill,
                stroke: "#ffffff",
                strokeWidth: 3,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <OverviewChartLegend
        items={[
          {
            label: seriesName,
            value: total.toLocaleString(),
            color: legendColor,
          },
        ]}
      />
    </OverviewChartShell>
  );
}
