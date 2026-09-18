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
  OVERVIEW_CHART_COLORS,
  OVERVIEW_MINI_LINE_CHART_MARGIN,
  OVERVIEW_MONTH_COUNT,
  overviewAxisInterval,
  shortenMonthAxisLabel,
} from "@/app/components/campaign/overview/charts/overview-chart-config";
import type { MonthlyCheckInsPoint } from "@/app/components/business/business-activity-chart-config";

export function CheckInsBarChart({
  data,
  months = OVERVIEW_MONTH_COUNT,
  caption,
}: {
  data: MonthlyCheckInsPoint[];
  months?: number;
  caption?: string;
}) {
  const checkInTotal = data.reduce((sum, row) => sum + row.checkIns, 0);

  return (
    <OverviewChartShell
      title="QR check-ins"
      subtitle={caption ?? `Month view, last ${months} months`}
      minHeightClass="min-h-[300px]"
      accent="blue"
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
              dataKey="checkIns"
              name="QR check-ins"
              stroke={OVERVIEW_CHART_COLORS.blue}
              strokeWidth={3}
              dot={{
                r: 3.5,
                fill: "#ffffff",
                stroke: OVERVIEW_CHART_COLORS.blue,
                strokeWidth: 2.5,
              }}
              activeDot={{
                r: 6,
                fill: OVERVIEW_CHART_COLORS.blue,
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
            label: "QR check-ins",
            value: checkInTotal.toLocaleString(),
            color: OVERVIEW_CHART_COLORS.blue,
          },
        ]}
      />
    </OverviewChartShell>
  );
}
