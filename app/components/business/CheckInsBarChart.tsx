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
  OVERVIEW_LINE_ANIMATION,
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
  scannedCount,
  inStoreCount,
  peakDayLabel,
  peakDayValue,
}: {
  data: MonthlyCheckInsPoint[];
  months?: number;
  caption?: string;
  scannedCount?: number;
  inStoreCount?: number;
  peakDayLabel?: string | null;
  peakDayValue?: number | null;
}) {
  const checkInTotal = data.reduce((sum, row) => sum + row.checkIns, 0);
  const hasChannelSplit =
    typeof scannedCount === "number" && typeof inStoreCount === "number";
  const showPeakDay =
    typeof peakDayLabel === "string" &&
    peakDayLabel.length > 0 &&
    typeof peakDayValue === "number" &&
    peakDayValue > 0;

  return (
    <OverviewChartShell
      title="Check-ins"
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
              name="Check-ins"
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
      </div>

      <OverviewChartLegend
        items={
          hasChannelSplit
            ? [
                {
                  label: "Total",
                  value: checkInTotal.toLocaleString(),
                  color: OVERVIEW_CHART_COLORS.blue,
                },
                {
                  label: "QR",
                  value: scannedCount.toLocaleString(),
                  color: "#60a5fa",
                },
                {
                  label: "Store",
                  value: inStoreCount.toLocaleString(),
                  color: "#94a3b8",
                },
              ]
            : [
                {
                  label: "Check-ins",
                  value: checkInTotal.toLocaleString(),
                  color: OVERVIEW_CHART_COLORS.blue,
                },
              ]
        }
      />
      {showPeakDay ? (
        <p className="m-0 mt-2 text-[0.72rem] font-medium text-slate-500">
          Peak{" "}
          <span className="font-semibold text-slate-800">{peakDayLabel}</span>
          {" · "}
          <span className="font-semibold tabular-nums text-slate-800">
            {peakDayValue.toLocaleString()}
          </span>
        </p>
      ) : null}
    </OverviewChartShell>
  );
}
