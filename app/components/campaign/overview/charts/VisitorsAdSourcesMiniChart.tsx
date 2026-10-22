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
import {
  shouldShowOverviewChartDots,
  useCompactChartDots,
} from "@/app/hooks/use-compact-chart-dots";

export type VisitorsAdSourceChartPoint = {
  month: string;
  label: string;
  meta: number;
  google: number;
  inStore: number;
  newVisitors?: number;
  repeatVisitors?: number;
};

const VISITOR_AUDIENCE_COLORS = {
  newVisitors: "#0f766e",
  repeatVisitors: "#7c3aed",
} as const;

type SourceWinner = "meta" | "google" | "inStore" | "tie";

function resolveWinner(
  meta: number,
  google: number,
  inStore: number,
): SourceWinner | null {
  const max = Math.max(meta, google, inStore);
  if (max <= 0) return null;
  const leaders = [
    meta === max ? ("meta" as const) : null,
    google === max ? ("google" as const) : null,
    inStore === max ? ("inStore" as const) : null,
  ].filter((value): value is Exclude<SourceWinner, "tie"> => value != null);
  if (leaders.length !== 1) return "tie";
  return leaders[0];
}

function winnerLabel(winner: SourceWinner): string {
  if (winner === "tie") return "Meta, Google & In store";
  if (winner === "meta") return "Meta";
  if (winner === "google") return "Google";
  return "In store";
}

function winnerColor(winner: SourceWinner): string {
  if (winner === "google") return OVERVIEW_AD_SOURCE_COLORS.google;
  if (winner === "meta") return OVERVIEW_AD_SOURCE_COLORS.meta;
  if (winner === "inStore") return OVERVIEW_AD_SOURCE_COLORS.inStore;
  return "#07111f";
}

export function VisitorsAdSourcesMiniChart({
  data,
  metaTotal,
  googleTotal,
  inStoreTotal = 0,
  showInStore = false,
  caption,
  title = "Visitors",
  formatTotal,
  yAxisWidth = 36,
  accent = "blue",
  singleSeriesLabel,
  audience,
}: {
  data: VisitorsAdSourceChartPoint[];
  metaTotal: number;
  googleTotal: number;
  inStoreTotal?: number;
  showInStore?: boolean;
  caption?: string;
  title?: string;
  formatTotal?: (value: number) => string;
  yAxisWidth?: number;
  accent?: "green" | "blue" | "pink" | "orange" | "multi";
  singleSeriesLabel?: string;
  audience?: {
    newVisitors: number;
    repeatVisitors: number;
    data: Array<{
      month: string;
      newVisitors: number;
      repeatVisitors: number;
    }>;
  };
}) {
  const compactScreen = useCompactChartDots();
  const showDots = shouldShowOverviewChartDots(compactScreen, data.length);
  const formatLegend = formatTotal ?? ((value: number) => value.toLocaleString());
  const audienceByMonth = new Map(
    (audience?.data ?? []).map((row) => [row.month, row]),
  );
  const chartData = audience
    ? data.map((row) => ({
        ...row,
        newVisitors: audienceByMonth.get(row.month)?.newVisitors ?? 0,
        repeatVisitors: audienceByMonth.get(row.month)?.repeatVisitors ?? 0,
      }))
    : data;

  const hasMetaData =
    metaTotal > 0 || data.some((row) => Number(row.meta) > 0);
  const hasGoogleData =
    googleTotal > 0 || data.some((row) => Number(row.google) > 0);
  const hasInStoreData =
    showInStore &&
    (inStoreTotal > 0 || data.some((row) => Number(row.inStore) > 0));

  let peak: { label: string; total: number; winner: SourceWinner } | null = null;
  for (const row of data) {
    const inStore = showInStore ? row.inStore : 0;
    const total = row.meta + row.google + inStore;
    if (total <= 0) continue;
    if (!peak || total > peak.total) {
      peak = {
        label: row.label,
        total,
        winner: resolveWinner(row.meta, row.google, inStore) ?? "tie",
      };
    }
  }
  const inStoreForWinner = showInStore ? inStoreTotal : 0;
  const hasSourceStats = metaTotal + googleTotal + inStoreForWinner > 0;
  const periodWinner = hasSourceStats
    ? resolveWinner(metaTotal, googleTotal, inStoreForWinner)
    : null;

  const singleSeriesColor = "#34a853";
  const legendItems = singleSeriesLabel
    ? [
        {
          label: singleSeriesLabel,
          value: formatLegend(metaTotal),
          color: singleSeriesColor,
        },
      ]
    : [
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
    ...(showInStore
      ? [
          {
            label: "In store",
            value: formatLegend(inStoreTotal),
            color: OVERVIEW_AD_SOURCE_COLORS.inStore,
          },
        ]
      : []),
    ...(audience
      ? [
          {
            label: "New",
            value: formatLegend(audience.newVisitors),
            color: VISITOR_AUDIENCE_COLORS.newVisitors,
          },
          {
            label: "Repeat",
            value: formatLegend(audience.repeatVisitors),
            color: VISITOR_AUDIENCE_COLORS.repeatVisitors,
          },
        ]
      : []),
  ];

  return (
    <OverviewChartShell
      title={title}
      subtitle={
        caption ??
        (showInStore ? "Meta vs Google vs In store" : "Meta vs Google")
      }
      minHeightClass="min-h-[300px]"
      className="h-full"
      accent={accent}
    >
      <OverviewChartCanvas>
        {({ width, height }) => (
          <ResponsiveContainer width={width} height={height}>
            <LineChart data={chartData} margin={OVERVIEW_MINI_LINE_CHART_MARGIN}>
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
              {hasMetaData ? (
                <Line
                  type="monotone"
                  dataKey="meta"
                  name={singleSeriesLabel ?? "Meta"}
                  stroke={
                    singleSeriesLabel
                      ? singleSeriesColor
                      : OVERVIEW_AD_SOURCE_COLORS.meta
                  }
                  strokeWidth={3}
                  {...OVERVIEW_LINE_ANIMATION}
                  dot={
                    showDots
                      ? {
                          r: 3.5,
                          fill: "#ffffff",
                          stroke: singleSeriesLabel
                            ? singleSeriesColor
                            : OVERVIEW_AD_SOURCE_COLORS.meta,
                          strokeWidth: 2.5,
                        }
                      : false
                  }
                  activeDot={{
                    r: 6,
                    fill: singleSeriesLabel
                      ? singleSeriesColor
                      : OVERVIEW_AD_SOURCE_COLORS.meta,
                    stroke: "#ffffff",
                    strokeWidth: 3,
                  }}
                />
              ) : null}
              {!singleSeriesLabel && hasGoogleData ? (
                <Line
                  type="monotone"
                  dataKey="google"
                  name="Google"
                  stroke={OVERVIEW_AD_SOURCE_COLORS.google}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={0.92}
                  {...OVERVIEW_LINE_ANIMATION}
                  dot={
                    showDots
                      ? {
                          r: 3,
                          fill: "#ffffff",
                          stroke: OVERVIEW_AD_SOURCE_COLORS.google,
                          strokeWidth: 2,
                        }
                      : false
                  }
                  activeDot={{
                    r: 5.5,
                    fill: OVERVIEW_AD_SOURCE_COLORS.google,
                    stroke: "#ffffff",
                    strokeWidth: 2.5,
                  }}
                />
              ) : null}
              {audience ? (
                <Line
                  type="monotone"
                  dataKey="newVisitors"
                  name="New"
                  stroke={VISITOR_AUDIENCE_COLORS.newVisitors}
                  strokeWidth={2.5}
                  {...OVERVIEW_LINE_ANIMATION}
                  dot={
                    showDots
                      ? {
                          r: 3,
                          fill: "#ffffff",
                          stroke: VISITOR_AUDIENCE_COLORS.newVisitors,
                          strokeWidth: 2,
                        }
                      : false
                  }
                  activeDot={{
                    r: 5.5,
                    fill: VISITOR_AUDIENCE_COLORS.newVisitors,
                    stroke: "#ffffff",
                    strokeWidth: 2.5,
                  }}
                />
              ) : null}
              {audience ? (
                <Line
                  type="monotone"
                  dataKey="repeatVisitors"
                  name="Repeat"
                  stroke={VISITOR_AUDIENCE_COLORS.repeatVisitors}
                  strokeWidth={2.5}
                  {...OVERVIEW_LINE_ANIMATION}
                  dot={
                    showDots
                      ? {
                          r: 3,
                          fill: "#ffffff",
                          stroke: VISITOR_AUDIENCE_COLORS.repeatVisitors,
                          strokeWidth: 2,
                        }
                      : false
                  }
                  activeDot={{
                    r: 5.5,
                    fill: VISITOR_AUDIENCE_COLORS.repeatVisitors,
                    stroke: "#ffffff",
                    strokeWidth: 2.5,
                  }}
                />
              ) : null}
              {!singleSeriesLabel && hasInStoreData ? (
                <Line
                  type="monotone"
                  dataKey="inStore"
                  name="In store"
                  stroke={OVERVIEW_AD_SOURCE_COLORS.inStore}
                  strokeWidth={3}
                  {...OVERVIEW_LINE_ANIMATION}
                  dot={
                    showDots
                      ? {
                          r: 3.5,
                          fill: "#ffffff",
                          stroke: OVERVIEW_AD_SOURCE_COLORS.inStore,
                          strokeWidth: 2.5,
                        }
                      : false
                  }
                  activeDot={{
                    r: 6,
                    fill: OVERVIEW_AD_SOURCE_COLORS.inStore,
                    stroke: "#ffffff",
                    strokeWidth: 3,
                  }}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        )}
      </OverviewChartCanvas>

      <OverviewChartLegend items={legendItems} />

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
          {!singleSeriesLabel && peak && periodWinner ? (
            <span className="text-slate-300" aria-hidden>
              ·
            </span>
          ) : null}
          {!singleSeriesLabel && periodWinner ? (
            <span>
              Winner{" "}
              <span
                className="font-extrabold"
                style={{ color: winnerColor(periodWinner) }}
              >
                {winnerLabel(periodWinner)}
              </span>
            </span>
          ) : null}
        </p>
      ) : null}
    </OverviewChartShell>
  );
}

export function buildVisitorsAdSourceSeries(
  points: Array<{
    month: string;
    meta: number;
    google: number;
    inStore?: number;
  }>,
): VisitorsAdSourceChartPoint[] {
  return points.map((row) => ({
    month: row.month,
    label: formatMonthLabel(row.month),
    meta: row.meta,
    google: row.google,
    inStore: Number(row.inStore) || 0,
  }));
}
