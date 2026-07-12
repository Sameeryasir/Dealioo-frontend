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
import { OverviewChartCanvas } from "@/app/components/campaign/overview/charts/OverviewChartCanvas";
import { OverviewChartLegend } from "@/app/components/campaign/overview/charts/OverviewChartLegend";
import { OverviewChartShell } from "@/app/components/campaign/overview/charts/OverviewChartShell";
import { OverviewChartTooltip } from "@/app/components/campaign/overview/charts/OverviewChartTooltip";
import {
  OverviewChartGradientDefs,
  useBarChartGradients,
} from "@/app/components/campaign/overview/charts/overview-chart-gradients";
import {
  OVERVIEW_BAR_CHART_MARGIN,
  OVERVIEW_CHART_COLORS,
  OVERVIEW_MONTH_COUNT,
  shortenMonthAxisLabel,
  type MonthlySignupsPaymentsPoint,
} from "@/app/components/campaign/overview/charts/overview-chart-config";

export function SignupsPaymentsBarChart({
  data,
}: {
  data: MonthlySignupsPaymentsPoint[];
}) {
  const gradients = useBarChartGradients();
  const signupTotal = data.reduce((sum, row) => sum + row.signups, 0);
  const paymentTotal = data.reduce((sum, row) => sum + row.payments, 0);

  return (
    <OverviewChartShell
      title="Signups vs payments"
      subtitle={`Month view, last ${OVERVIEW_MONTH_COUNT} months`}
      minHeightClass="min-h-0"
      accent="multi"
    >
      <OverviewChartCanvas>
        {({ width, height }) => (
          <ResponsiveContainer width={width} height={height}>
            <BarChart data={data} margin={OVERVIEW_BAR_CHART_MARGIN} barGap={6}>
              <OverviewChartGradientDefs stops={gradients.stops} />
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
                dataKey="signups"
                name="Signups"
                fill={`url(#${gradients.signups})`}
                radius={[8, 8, 2, 2]}
                maxBarSize={34}
              />
              <Bar
                dataKey="payments"
                name="Payments"
                fill={`url(#${gradients.payments})`}
                radius={[8, 8, 2, 2]}
                maxBarSize={34}
              />
            </BarChart>
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
