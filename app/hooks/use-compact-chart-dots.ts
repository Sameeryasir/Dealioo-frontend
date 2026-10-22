"use client";

import { useEffect, useState } from "react";

export function useCompactChartDots(maxWidthPx = 900): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${maxWidthPx}px)`);
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [maxWidthPx]);

  return compact;
}

export function shouldShowOverviewChartDots(
  compactScreen: boolean,
  pointCount: number,
  maxPoints = 8,
): boolean {
  return !compactScreen && pointCount > 0 && pointCount <= maxPoints;
}
