"use client";

import { useEffect, useState } from "react";

export function useCountUp(
  target: number,
  ready = true,
  durationMs = 900,
): number {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!ready) {
      setDisplay(0);
      return;
    }

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || target === 0) {
      setDisplay(target);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(target * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    };

    setDisplay(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, ready, target]);

  return display;
}
