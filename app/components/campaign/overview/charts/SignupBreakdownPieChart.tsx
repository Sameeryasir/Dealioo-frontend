"use client";

import { useMemo } from "react";
import {
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { OverviewChartCanvas } from "@/app/components/campaign/overview/charts/OverviewChartCanvas";
import { OverviewChartLegend } from "@/app/components/campaign/overview/charts/OverviewChartLegend";
import { OverviewChartShell } from "@/app/components/campaign/overview/charts/OverviewChartShell";
import { OverviewChartTooltip } from "@/app/components/campaign/overview/charts/OverviewChartTooltip";
import {
  OverviewChartGradientDefs,
  usePieChartGradients,
} from "@/app/components/campaign/overview/charts/overview-chart-gradients";
import {
  hasSignupBreakdownData,
  OVERVIEW_CHART_COLORS,
  OVERVIEW_MONTH_COUNT,
  type ChartNameValue,
} from "@/app/components/campaign/overview/charts/overview-chart-config";

const PIE_CHART_MARGIN = { top: 4, right: 8, bottom: 4, left: 8 };

function PieCenterLabel({
  cx = 0,
  cy = 0,
  total,
}: {
  cx?: number;
  cy?: number;
  total: number;
}) {
  return (
    <g>
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fill="#07111f"
        fontSize={30}
        fontWeight={800}
      >
        {total.toLocaleString()}
      </text>
      <text
        x={cx}
        y={cy + 18}
        textAnchor="middle"
        fill="#64748b"
        fontSize={12}
        fontWeight={600}
      >
        total signups
      </text>
    </g>
  );
}

export function SignupBreakdownPieChart({ data }: { data: ChartNameValue[] }) {
  const hasData = hasSignupBreakdownData(data);
  const gradients = usePieChartGradients();
  const total = useMemo(
    () => data.reduce((sum, point) => sum + point.value, 0),
    [data],
  );

  const legendItems = data.map((entry, index) => {
    const percent =
      total > 0 ? `${((entry.value / total) * 100).toFixed(0)}%` : "0%";
    return {
      label: entry.name,
      value: percent,
      color:
        index === 0 ? OVERVIEW_CHART_COLORS.orange : OVERVIEW_CHART_COLORS.green,
    };
  });

  const sliceIds = [gradients.signupOnly, gradients.paid];

  return (
    <OverviewChartShell
      title="Signup breakdown"
      subtitle={`Month view, last ${OVERVIEW_MONTH_COUNT} months combined`}
      minHeightClass="min-h-0"
      accent="orange"
    >
      {hasData ? (
        <>
          <OverviewChartCanvas>
            {({ width, height }) => (
              <ResponsiveContainer width={width} height={height}>
                <PieChart margin={PIE_CHART_MARGIN}>
                  <OverviewChartGradientDefs stops={gradients.stops} />
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="54%"
                    outerRadius="78%"
                    paddingAngle={3}
                    cornerRadius={6}
                    stroke="#ffffff"
                    strokeWidth={3}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={`url(#${sliceIds[index] ?? sliceIds[0]})`}
                      />
                    ))}
                    <Label
                      position="center"
                      content={({ viewBox }) => {
                        if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                          return null;
                        }
                        return (
                          <PieCenterLabel
                            cx={viewBox.cx}
                            cy={viewBox.cy}
                            total={total}
                          />
                        );
                      }}
                    />
                  </Pie>
                  <Tooltip content={<OverviewChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </OverviewChartCanvas>

          <OverviewChartLegend items={legendItems} />
        </>
      ) : (
        <p className="flex flex-1 items-center justify-center text-[0.82rem] font-medium text-slate-500">
          No signup breakdown in this period.
        </p>
      )}
    </OverviewChartShell>
  );
}
