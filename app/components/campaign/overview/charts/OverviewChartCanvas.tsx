"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type ChartCanvasSize = {
  width: number;
  height: number;
};

/**
 * Change summary:
 * - Added a resize-aware chart canvas wrapper for funnel overview charts.
 * - Why: Recharts needs explicit pixel dimensions; container queries alone are not enough.
 * - Related: SignupsPaymentsBarChart, SignupBreakdownPieChart, AnalyticsMetricMiniChart.
 * - MCP context 7: uses ResizeObserver for production-grade responsive chart sizing.
 */
export function OverviewChartCanvas({
  children,
  variant = "main",
}: {
  children: (size: ChartCanvasSize) => ReactNode;
  variant?: "main" | "mini";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ChartCanvasSize>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setSize({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height)),
      });
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const className =
    variant === "mini"
      ? "funnel-overview-mini-chart-canvas"
      : "funnel-overview-chart-canvas";

  return (
    <div ref={ref} className={`${className} w-full min-w-0`}>
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
  );
}
