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
  OVERVIEW_LINE_ANIMATION,
  OVERVIEW_MINI_LINE_CHART_MARGIN,
  overviewAxisInterval,
  shortenMonthAxisLabel,
} from "@/app/components/campaign/overview/charts/overview-chart-config";
import type { MonthlyRevenuePoint } from "@/app/components/business/business-activity-chart-config";
import { formatCents } from "@/app/lib/money";

const MIN_VISIBLE_RATIO = 0.06;
const RANGE_TRIGGER_RATIO = 25;

type RevenuePlotPoint = MonthlyRevenuePoint & {
  value: number;
  actualValue: number;
};

function buildVisibleRevenuePlot(
  dollars: MonthlyRevenuePoint[],
): RevenuePlotPoint[] {
  const values = dollars.map((row) => row.value);
  const max = Math.max(...values, 0);
  const nonZero = values.filter((v) => v > 0);

  if (max <= 0 || nonZero.length === 0) {
    return dollars.map((row) => ({
      ...row,
      actualValue: row.value,
    }));
  }

  const minNonZero = Math.min(...nonZero);
  const needsFloor = max / minNonZero >= RANGE_TRIGGER_RATIO;
  const floor = max * MIN_VISIBLE_RATIO;

  return dollars.map((row) => {
    const actualValue = row.value;
    const plotValue =
      needsFloor && actualValue > 0 && actualValue < floor
        ? floor
        : actualValue;
    return {
      ...row,
      value: plotValue,
      actualValue,
    };
  });
}

export function BusinessRevenueMiniChart({
  data,
  totalRevenueCents,
  months,
  caption,
}: {
  data: MonthlyRevenuePoint[];
  totalRevenueCents: number;
  months: number;
  caption?: string;
}) {
  const strokeColor = OVERVIEW_CHART_COLORS.pink;

  const chartData = buildVisibleRevenuePlot(
    data.map((row) => ({
      ...row,
      value: row.value / 100,
    })),
  );

  return (
    <OverviewChartShell
      title="Revenue"
      subtitle={caption ?? `Paid revenue, last ${months} months`}
      minHeightClass="min-h-[300px]"
      className="h-full"
      accent="pink"
      stat={formatCents(totalRevenueCents, "usd")}
    >
      <div className="h-[250px] w-full min-w-0">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={OVERVIEW_MINI_LINE_CHART_MARGIN}>
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
              interval={overviewAxisInterval(data.length)}
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
            <Line
              type="monotone"
              dataKey="value"
              name="Revenue"
              stroke={strokeColor}
              strokeWidth={3}
              {...OVERVIEW_LINE_ANIMATION}
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
