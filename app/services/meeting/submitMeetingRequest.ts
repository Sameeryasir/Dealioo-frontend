import axios from "axios";
import type { MeetingFormValues } from "@/app/components/book-meeting/book-meeting-config";
import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";

export type SubmitMeetingRequestResponse = {
  id: number;
  message?: string;
  googleMeetLink?: string | null;
};

export async function submitMeetingRequest(
  values: MeetingFormValues,
): Promise<SubmitMeetingRequestResponse> {
  try {
    const { meetingDate, meetingTime, meetingDuration, meetingTimeZone, ...answers } = values;
    const response = await axios.post<SubmitMeetingRequestResponse>(
      `${getApiBaseUrl()}/meeting-requests`,
      {
        ...answers,
        scheduledDate: meetingDate,
        scheduledTime: meetingTime,
        scheduledDuration: meetingDuration,
        scheduledTimeZone: meetingTimeZone,
      },
      { headers: { "Content-Type": "application/json" } },
    );
    return response.data;
  } catch (error) {
    console.error("Meeting request error:", error);

    if (axios.isAxiosError(error) && error.response?.data?.message != null) {
      throw new Error(
        parseApiMessage(
          error.response.data.message,
          "Could not submit your request. Please try again.",
        ),
      );
    }

    throw error instanceof Error
      ? error
      : new Error("Could not submit your request. Please try again.");
  }
}
