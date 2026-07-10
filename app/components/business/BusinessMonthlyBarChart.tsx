"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OverviewChartLegend } from "@/app/components/campaign/overview/charts/OverviewChartLegend";
import { OverviewChartShell } from "@/app/components/campaign/overview/charts/OverviewChartShell";
import { OverviewChartTooltip } from "@/app/components/campaign/overview/charts/OverviewChartTooltip";
import {
  OVERVIEW_BAR_CHART_MARGIN,
  OVERVIEW_MONTH_COUNT,
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
}) {
  const total = data.reduce(
    (sum, row) => sum + Number(row[dataKey] ?? 0),
    0,
  );

  return (
    <OverviewChartShell
      title={title}
      subtitle={`${subtitle}, last ${months} months`}
      minHeightClass="min-h-[300px]"
      accent={accent}
    >
      <div className="h-[250px] w-full min-w-0">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={OVERVIEW_BAR_CHART_MARGIN}>
            <CartesianGrid
              strokeDasharray="4 6"
              stroke="#e8edf5"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
              axisLine={{ stroke: "#e8edf5" }}
              tickLine={false}
              interval={0}
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
            <Tooltip
              content={<OverviewChartTooltip />}
              cursor={{ fill: "rgba(24,119,242,0.06)", radius: 8 }}
            />
            <Bar
              dataKey={dataKey}
              name={seriesName}
              fill={barFill}
              radius={[8, 8, 2, 2]}
              maxBarSize={42}
            />
          </BarChart>
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
