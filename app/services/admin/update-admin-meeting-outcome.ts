import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";
import type { AdminMeetingRequest } from "@/app/services/admin/get-admin-meeting-requests";

export type MeetingAttendance = "ATTENDED" | "NO_SHOW" | "CANCELLED";
export type MeetingSalesOutcome =
  | "PENDING_DECISION"
  | "DEAL_WON"
  | "FOLLOW_UP_REQUIRED"
  | "DEAL_LOST";

export type UpdateMeetingOutcomeInput = {
  attendance?: MeetingAttendance | null;
  salesOutcome?: MeetingSalesOutcome | null;
  meetingNotes?: string | null;
  followUpNotes?: string | null;
};

export async function updateAdminMeetingOutcome(
  meetingId: number,
  input: UpdateMeetingOutcomeInput,
): Promise<AdminMeetingRequest> {
  try {
    const { data } = await authAxios.patch<AdminMeetingRequest>(
      `/admin/meeting-requests/${meetingId}/outcome`,
      input,
    );
    return data;
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not update meeting outcome."),
    );
  }
}
