"use client";

import { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { OverviewChartShell } from "@/app/components/campaign/overview/charts/OverviewChartShell";
import { OverviewChartTooltip } from "@/app/components/campaign/overview/charts/OverviewChartTooltip";
import {
  hasSignupBreakdownData,
  OVERVIEW_CHART_COLORS,
  OVERVIEW_MONTH_COUNT,
  type ChartNameValue,
} from "@/app/components/campaign/overview/charts/overview-chart-config";

const SLICE_COLORS = [OVERVIEW_CHART_COLORS.amber, OVERVIEW_CHART_COLORS.emerald];

const PIE_CHART_MARGIN = { top: 8, right: 16, bottom: 36, left: 16 };

export function SignupBreakdownPieChart({ data }: { data: ChartNameValue[] }) {
  const hasData = hasSignupBreakdownData(data);
  const total = useMemo(
    () => data.reduce((sum, point) => sum + point.value, 0),
    [data],
  );

  return (
    <OverviewChartShell
      title="Signup breakdown"
      subtitle={`Month view, last ${OVERVIEW_MONTH_COUNT} months combined`}
      minHeightClass="min-h-[300px]"
    >
      {hasData ? (
        <div className="h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart margin={PIE_CHART_MARGIN}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="48%"
                innerRadius="48%"
                outerRadius="72%"
                paddingAngle={2}
                label={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={SLICE_COLORS[index] ?? SLICE_COLORS[0]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<OverviewChartTooltip />} />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) => {
                  const item = data.find((point) => point.name === value);
                  const percent =
                    total > 0 && item
                      ? ((item.value / total) * 100).toFixed(0)
                      : "0";

                  return (
                    <span className="text-zinc-600">
                      {value}{" "}
                      <span className="font-medium text-zinc-800">{percent}%</span>
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="flex flex-1 items-center justify-center text-sm text-zinc-500">
          No signup breakdown in this period.
        </p>
      )}
    </OverviewChartShell>
  );
}
