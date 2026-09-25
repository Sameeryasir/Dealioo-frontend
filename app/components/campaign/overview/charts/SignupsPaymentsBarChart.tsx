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
import { OverviewChartCanvas } from "@/app/components/campaign/overview/charts/OverviewChartCanvas";
import { OverviewChartLegend } from "@/app/components/campaign/overview/charts/OverviewChartLegend";
import { OverviewChartShell } from "@/app/components/campaign/overview/charts/OverviewChartShell";
import { OverviewChartTooltip } from "@/app/components/campaign/overview/charts/OverviewChartTooltip";
import {
  OVERVIEW_CHART_COLORS,
  OVERVIEW_LINE_ANIMATION,
  OVERVIEW_MINI_LINE_CHART_MARGIN,
  OVERVIEW_MONTH_COUNT,
  overviewAxisInterval,
  shortenMonthAxisLabel,
  type MonthlySignupsPaymentsPoint,
} from "@/app/components/campaign/overview/charts/overview-chart-config";

export function SignupsPaymentsBarChart({
  data,
  caption,
}: {
  data: MonthlySignupsPaymentsPoint[];
  caption?: string;
}) {
  const signupTotal = data.reduce((sum, row) => sum + row.signups, 0);
  const paymentTotal = data.reduce((sum, row) => sum + row.payments, 0);

  return (
    <OverviewChartShell
      title="Signups vs payments"
      subtitle={caption ?? `Month view, last ${OVERVIEW_MONTH_COUNT} months`}
      minHeightClass="min-h-0"
      accent="multi"
    >
      <OverviewChartCanvas>
        {({ width, height }) => (
          <ResponsiveContainer width={width} height={height}>
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
                dataKey="signups"
                name="Signups"
                stroke={OVERVIEW_CHART_COLORS.green}
                strokeWidth={3}
                {...OVERVIEW_LINE_ANIMATION}
                dot={{
                  r: 3.5,
                  fill: "#ffffff",
                  stroke: OVERVIEW_CHART_COLORS.green,
                  strokeWidth: 2.5,
                }}
                activeDot={{
                  r: 6,
                  fill: OVERVIEW_CHART_COLORS.green,
                  stroke: "#ffffff",
                  strokeWidth: 3,
                }}
              />
              <Line
                type="monotone"
                dataKey="payments"
                name="Payments"
                stroke={OVERVIEW_CHART_COLORS.blue}
                strokeWidth={3}
                {...OVERVIEW_LINE_ANIMATION}
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
        )}
      </OverviewChartCanvas>

      <OverviewChartLegend
        items={[
          {
            label: "Signups",
            value: signupTotal.toLocaleString(),
            color: OVERVIEW_CHART_COLORS.green,
          },
          {
            label: "Payments",
            value: paymentTotal.toLocaleString(),
            color: OVERVIEW_CHART_COLORS.blue,
          },
        ]}
      />
    </OverviewChartShell>
  );
}
