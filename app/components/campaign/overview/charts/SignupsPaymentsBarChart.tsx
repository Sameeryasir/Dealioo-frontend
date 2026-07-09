"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OverviewChartShell } from "@/app/components/campaign/overview/charts/OverviewChartShell";
import { OverviewChartTooltip } from "@/app/components/campaign/overview/charts/OverviewChartTooltip";
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
  return (
    <OverviewChartShell
      title="Signups vs payments"
      subtitle={`Month view, last ${OVERVIEW_MONTH_COUNT} months`}
      minHeightClass="min-h-[280px]"
    >
      <div className="h-[260px] w-full min-w-0">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={OVERVIEW_BAR_CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#e8edf5" }}
              tickLine={false}
              interval={0}
              tickFormatter={shortenMonthAxisLabel}
              height={32}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              content={<OverviewChartTooltip />}
              cursor={{ fill: "#f4f7fb" }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              formatter={(value) => (
                <span className="text-slate-600">{value}</span>
              )}
            />
            <Bar
              dataKey="signups"
              name="Signups"
              fill={OVERVIEW_CHART_COLORS.green}
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="payments"
              name="Payments"
              fill={OVERVIEW_CHART_COLORS.blue}
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </OverviewChartShell>
  );
}
