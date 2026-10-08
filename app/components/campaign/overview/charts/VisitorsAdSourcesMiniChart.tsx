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
  OVERVIEW_AD_SOURCE_COLORS,
  OVERVIEW_LINE_ANIMATION,
  OVERVIEW_MINI_LINE_CHART_MARGIN,
  formatMonthLabel,
  overviewAxisInterval,
  shortenMonthAxisLabel,
} from "@/app/components/campaign/overview/charts/overview-chart-config";

export type VisitorsAdSourceChartPoint = {
  month: string;
  label: string;
  meta: number;
  google: number;
};

export function VisitorsAdSourcesMiniChart({
  data,
  metaTotal,
  googleTotal,
  caption,
  title = "Unique visitors",
  formatTotal,
  yAxisWidth = 36,
  accent = "blue",
}: {
  data: VisitorsAdSourceChartPoint[];
  metaTotal: number;
  googleTotal: number;
  caption?: string;
  title?: string;
  formatTotal?: (value: number) => string;
  yAxisWidth?: number;
  accent?: "green" | "blue" | "pink" | "orange" | "multi";
}) {
  const formatLegend = formatTotal ?? ((value: number) => value.toLocaleString());

  let peak: { label: string; total: number; winner: "meta" | "google" | "tie" } | null =
    null;
  for (const row of data) {
    const total = row.meta + row.google;
    if (total <= 0) continue;
    if (!peak || total > peak.total) {
      peak = {
        label: row.label,
        total,
        winner:
          row.meta === row.google
            ? "tie"
            : row.meta > row.google
              ? "meta"
              : "google",
      };
    }
  }
  const periodWinner =
    metaTotal <= 0 && googleTotal <= 0
      ? null
      : metaTotal === googleTotal
        ? "tie"
        : metaTotal > googleTotal
          ? "meta"
          : "google";

  return (
    <OverviewChartShell
      title={title}
      subtitle={caption ?? "Meta vs Google"}
      minHeightClass="min-h-[300px]"
      className="h-full"
      accent={accent}
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
                width={yAxisWidth}
                tickFormatter={
                  formatTotal
                    ? (value: number) => formatTotal(Number(value) || 0)
                    : undefined
                }
              />
              <Tooltip content={<OverviewChartTooltip />} />
              <Line
                type="monotone"
                dataKey="meta"
                name="Meta"
                stroke={OVERVIEW_AD_SOURCE_COLORS.meta}
                strokeWidth={3}
                {...OVERVIEW_LINE_ANIMATION}
                dot={{
                  r: 3.5,
                  fill: "#ffffff",
                  stroke: OVERVIEW_AD_SOURCE_COLORS.meta,
                  strokeWidth: 2.5,
                }}
                activeDot={{
                  r: 6,
                  fill: OVERVIEW_AD_SOURCE_COLORS.meta,
                  stroke: "#ffffff",
                  strokeWidth: 3,
                }}
              />
              <Line
                type="monotone"
                dataKey="google"
                name="Google"
                stroke={OVERVIEW_AD_SOURCE_COLORS.google}
                strokeWidth={3}
                {...OVERVIEW_LINE_ANIMATION}
                dot={{
                  r: 3.5,
                  fill: "#ffffff",
                  stroke: OVERVIEW_AD_SOURCE_COLORS.google,
                  strokeWidth: 2.5,
                }}
                activeDot={{
                  r: 6,
                  fill: OVERVIEW_AD_SOURCE_COLORS.google,
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
            label: "Meta",
            value: formatLegend(metaTotal),
            color: OVERVIEW_AD_SOURCE_COLORS.meta,
          },
          {
            label: "Google",
            value: formatLegend(googleTotal),
            color: OVERVIEW_AD_SOURCE_COLORS.google,
          },
        ]}
      />

      {peak || periodWinner ? (
        <p className="m-0 mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.72rem] font-medium text-slate-500">
          {peak ? (
            <span>
              Peak{" "}
              <span className="font-semibold text-slate-800">{peak.label}</span>
              {" · "}
              <span className="font-semibold tabular-nums text-slate-800">
                {formatLegend(peak.total)}
              </span>
            </span>
          ) : null}
          {peak && periodWinner ? (
            <span className="text-slate-300" aria-hidden>
              ·
            </span>
          ) : null}
          {periodWinner ? (
            <span>
              Winner{" "}
              <span
                className="font-extrabold"
                style={{
                  color:
                    periodWinner === "google"
                      ? OVERVIEW_AD_SOURCE_COLORS.google
                      : periodWinner === "meta"
                        ? OVERVIEW_AD_SOURCE_COLORS.meta
                        : "#07111f",
                }}
              >
                {periodWinner === "tie"
                  ? "Meta & Google"
                  : periodWinner === "meta"
                    ? "Meta"
                    : "Google"}
              </span>
            </span>
          ) : null}
        </p>
      ) : null}
    </OverviewChartShell>
  );
}

export function buildVisitorsAdSourceSeries(
  points: Array<{ month: string; meta: number; google: number }>,
): VisitorsAdSourceChartPoint[] {
  return points.map((row) => ({
    month: row.month,
    label: formatMonthLabel(row.month),
    meta: row.meta,
    google: row.google,
  }));
}
