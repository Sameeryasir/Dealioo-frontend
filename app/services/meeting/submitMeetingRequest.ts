import axios from "axios";
import type { MeetingFormValues } from "@/app/components/book-meeting/book-meeting-config";
import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";

export type SubmitMeetingRequestResponse = {
  id: number;
  message?: string;
};

export async function submitMeetingRequest(
  values: MeetingFormValues,
): Promise<SubmitMeetingRequestResponse> {
  try {
    const response = await axios.post<SubmitMeetingRequestResponse>(
      `${getApiBaseUrl()}/meeting-requests`,
      values,
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
