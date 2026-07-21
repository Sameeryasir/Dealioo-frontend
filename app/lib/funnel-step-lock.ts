export type FunnelLockedStep = "signup" | "payment" | "confirmation";

export type FunnelGuardStep = FunnelLockedStep | "landing";

const STEP_RANK: Record<FunnelLockedStep, number> = {
  signup: 1,
  payment: 2,
  confirmation: 3,
};

function storageKey(funnelId: number): string {
  return `dealioo:funnel-step:${funnelId}`;
}

export function getFunnelLockedStep(
  funnelId: number | null | undefined,
): FunnelLockedStep | null {
  if (funnelId == null || funnelId < 1 || typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(storageKey(funnelId))?.trim();
    if (raw === "signup" || raw === "payment" || raw === "confirmation") {
      return raw;
    }
  } catch {
    // ignore
  }
  return null;
}

export function clearFunnelLockedStep(
  funnelId: number | null | undefined,
): void {
  if (funnelId == null || funnelId < 1 || typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(storageKey(funnelId));
  } catch {
    // ignore
  }
}

export function forceFunnelLockedStep(
  funnelId: number | null | undefined,
  step: FunnelLockedStep,
): void {
  if (funnelId == null || funnelId < 1 || typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(storageKey(funnelId), step);
  } catch {
    // ignore
  }
}

export function markFunnelLockedStep(
  funnelId: number | null | undefined,
  step: FunnelLockedStep,
): void {
  if (funnelId == null || funnelId < 1 || typeof window === "undefined") {
    return;
  }
  const current = getFunnelLockedStep(funnelId);
  if (current && STEP_RANK[current] >= STEP_RANK[step]) {
    return;
  }
  forceFunnelLockedStep(funnelId, step);
}

export function funnelStepIsAtLeast(
  funnelId: number | null | undefined,
  step: FunnelLockedStep,
): boolean {
  const current = getFunnelLockedStep(funnelId);
  if (!current) return false;
  return STEP_RANK[current] >= STEP_RANK[step];
}

export function buildFunnelStepPath(
  funnelId: number,
  step: FunnelLockedStep,
  search: string,
): string {
  const qs = search.startsWith("?") ? search : search ? `?${search}` : "";
  return `/funnel/${funnelId}/${step}${qs}`;
}
