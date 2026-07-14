"use client";

/**
 * Change: Funnel monthly revenue mini chart for campaign overview.
 * Why: Fill the 4th behavior slot with paid revenue trend (no extra API).
 * Related: FunnelOverviewPanel, get-funnel-stats-monthly, fee/payment flow.
 */

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
  OVERVIEW_CHART_COLORS,
  OVERVIEW_MINI_LINE_CHART_MARGIN,
  OVERVIEW_MONTH_COUNT,
  shortenMonthAxisLabel,
  type MonthlyMetricPoint,
} from "@/app/components/campaign/overview/charts/overview-chart-config";
import { formatCents } from "@/app/lib/money";

function formatAxisDollars(value: number, currency: string): string {
  const code = currency?.trim() || "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${Math.round(value)}`;
  }
}

export function FunnelRevenueMiniChart({
  data,
  totalRevenueCents,
  currency = "usd",
}: {
  /** Monthly points; `value` is revenue in minor units (cents). */
  data: MonthlyMetricPoint[];
  totalRevenueCents: number;
  currency?: string | null;
}) {
  const strokeColor = OVERVIEW_CHART_COLORS.orange;
  const gradient = useLineChartGradient(strokeColor);
  const currencyCode = currency?.trim() || "usd";

  // Why: chart axis/tooltip read better in major units; totals stay in cents for money helpers.
  const chartData = data.map((row) => ({
    ...row,
    value: row.value / 100,
  }));

  return (
    <OverviewChartShell
      title="Revenue by month"
      subtitle={`Funnel paid revenue, last ${OVERVIEW_MONTH_COUNT} months`}
      minHeightClass="min-h-0"
      className="h-full"
      accent="orange"
      stat={formatCents(totalRevenueCents, currencyCode)}
    >
      <OverviewChartCanvas variant="mini">
        {({ width, height }) => (
          <ResponsiveContainer width={width} height={height}>
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
                width={40}
                tickFormatter={(value: number) =>
                  formatAxisDollars(value, currencyCode)
                }
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
        )}
      </OverviewChartCanvas>
    </OverviewChartShell>
  );
}
