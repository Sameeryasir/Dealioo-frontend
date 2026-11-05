export const MEETING_FOLLOW_UP_DAYS = 3;

export type MeetingAlertInput = {
  attendance?: string | null;
  salesOutcome?: string | null;
  businessId?: number | null;
  outcomeUpdatedAt?: string | null;
  scheduledDate?: string | null;
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

export function needsMeetingFollowUp(
  meeting: MeetingAlertInput,
  thresholdDays: number = MEETING_FOLLOW_UP_DAYS,
  nowMs: number = Date.now(),
): boolean {
  if (meeting.attendance !== "ATTENDED") return false;
  if (meeting.businessId) return false;
  if (
    meeting.salesOutcome === "DEAL_WON" ||
    meeting.salesOutcome === "DEAL_LOST"
  ) {
    return false;
  }

  if (!meeting.salesOutcome) return true;

  if (
    meeting.salesOutcome !== "PENDING_DECISION" &&
    meeting.salesOutcome !== "FOLLOW_UP_REQUIRED"
  ) {
    return false;
  }

  const anchor =
    meeting.outcomeUpdatedAt?.trim() ||
    (meeting.scheduledDate ? `${meeting.scheduledDate}T00:00:00.000Z` : null) ||
    meeting.createdAt;
  const days = daysSinceIso(anchor, nowMs);
  return days !== null && days >= thresholdDays;
}

export function isReadyForOnboarding(meeting: MeetingAlertInput): boolean {
  return (
    meeting.attendance === "ATTENDED" &&
    meeting.salesOutcome === "DEAL_WON" &&
    !meeting.businessId
  );
}
