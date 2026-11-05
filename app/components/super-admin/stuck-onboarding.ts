export const STUCK_ONBOARDING_DAYS = 3;

export type StuckOnboardingInput = {
  businessId?: number | null;
  outcomeUpdatedAt?: string | null;
  createdAt: string;
};

export function daysSinceIso(
  iso: string | null | undefined,
  nowMs: number = Date.now(),
): number | null {
  if (!iso?.trim()) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((nowMs - t) / (24 * 60 * 60 * 1000)));
}

export function getStuckOnboardingDays(
  meeting: StuckOnboardingInput,
  thresholdDays: number = STUCK_ONBOARDING_DAYS,
  nowMs: number = Date.now(),
): number | null {
  if (meeting.businessId) return null;

  const anchor = meeting.outcomeUpdatedAt?.trim() || meeting.createdAt;
  const days = daysSinceIso(anchor, nowMs);
  if (days === null || days < thresholdDays) return null;
  return days;
}

export function isStuckOnboarding(
  meeting: StuckOnboardingInput,
  thresholdDays: number = STUCK_ONBOARDING_DAYS,
  nowMs: number = Date.now(),
): boolean {
  return getStuckOnboardingDays(meeting, thresholdDays, nowMs) !== null;
}
