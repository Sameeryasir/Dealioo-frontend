"use client";

import { useId } from "react";
import { OVERVIEW_CHART_COLORS } from "@/app/components/campaign/overview/charts/overview-chart-config";

type GradientStop = {
  id: string;
  from: string;
  to: string;
  fromOpacity?: number;
  toOpacity?: number;
};

export function OverviewChartGradientDefs({ stops }: { stops: GradientStop[] }) {
  return (
    <defs>
      {stops.map((stop) => (
        <linearGradient
          key={stop.id}
          id={stop.id}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor={stop.from}
            stopOpacity={stop.fromOpacity ?? 1}
          />
          <stop
            offset="100%"
            stopColor={stop.to}
            stopOpacity={stop.toOpacity ?? 0.72}
          />
        </linearGradient>
      ))}
      {stops.map((stop) => (
        <linearGradient
          key={`${stop.id}-area`}
          id={`${stop.id}-area`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={stop.from} stopOpacity={0.28} />
          <stop offset="95%" stopColor={stop.from} stopOpacity={0.02} />
        </linearGradient>
      ))}
    </defs>
  );
}

export function useBarChartGradients() {
  const uid = useId().replace(/:/g, "");
  return {
    signups: `signup-bar-${uid}`,
    payments: `payment-bar-${uid}`,
    stops: [
      {
        id: `signup-bar-${uid}`,
        from: OVERVIEW_CHART_COLORS.green,
        to: "#86efac",
      },
      {
        id: `payment-bar-${uid}`,
        from: OVERVIEW_CHART_COLORS.blue,
        to: "#93c5fd",
      },
    ] satisfies GradientStop[],
  };
}

export function useLineChartGradient(color: string) {
  const uid = useId().replace(/:/g, "");
  const lineId = `line-area-${uid}`;
  return {
    lineId,
    areaId: `${lineId}-area`,
    stops: [
      {
        id: lineId,
        from: color,
        to: color,
      },
    ] satisfies GradientStop[],
  };
}

export function usePieChartGradients() {
  const uid = useId().replace(/:/g, "");
  return {
    signupOnly: `pie-signup-${uid}`,
    paid: `pie-paid-${uid}`,
    stops: [
      {
        id: `pie-signup-${uid}`,
        from: OVERVIEW_CHART_COLORS.orange,
        to: "#fdba74",
      },
      {
        id: `pie-paid-${uid}`,
        from: OVERVIEW_CHART_COLORS.green,
        to: "#86efac",
      },
    ] satisfies GradientStop[],
  };
}
