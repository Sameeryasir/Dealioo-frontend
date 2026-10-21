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
  emailVerificationToken: string,
): Promise<SubmitMeetingRequestResponse> {
  try {
    const { meetingDate, meetingTime, meetingDuration, meetingTimeZone, ...answers } = values;
    const response = await axios.post<SubmitMeetingRequestResponse>(
      `${getApiBaseUrl()}/meeting-requests`,
      {
        ...answers,
        emailVerificationToken,
        selectedPlanSlug: values.selectedPlanSlug.trim(),
        selectedPlanName: values.selectedPlanName.trim(),
        selectedBillingCycle:
          values.selectedBillingCycle === "monthly" ||
          values.selectedBillingCycle === "annual"
            ? values.selectedBillingCycle
            : "monthly",
        scheduledDate: meetingDate,
        scheduledTime: meetingTime,
        scheduledDuration: meetingDuration,
        scheduledTimeZone: meetingTimeZone,
      },
      { headers: { "Content-Type": "application/json" } },
    );
    return response.data;
  } catch (error) {
    throw meetingSubmitError(error);
  }
}

function meetingSubmitError(error: unknown): Error {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error && spokenMessage(error.message)) {
      return new Error(error.message.trim());
    }
    return new Error("Could not submit your request. Please try again.");
  }

  if (!error.response) {
    if (error.code === "ECONNABORTED" || error.message.toLowerCase().includes("timeout")) {
      return new Error("The booking took too long. Please try again.");
    }
    return new Error("We could not reach Dealioo. Check your connection and try again.");
  }

  const status = error.response.status;
  if (status === 429) {
    return new Error(
      "Too many booking attempts. Please wait a minute and try again.",
    );
  }

  const data = error.response.data as { message?: unknown } | string | null;
  const fromBody =
    typeof data === "string"
      ? data
      : parseApiMessage(data?.message, "");
  if (spokenMessage(fromBody)) return new Error(fromBody.trim());

  if (status === 400) {
    return new Error(
      "Some meeting details are missing or not valid. Check the form and try again.",
    );
  }
  if (status === 409) {
    return new Error("That time was just taken. Please pick another time.");
  }
  if (status === 503) {
    return new Error(
      "Google Calendar could not be reached. Please try again in a moment.",
    );
  }
  return new Error("Could not submit your request. Please try again.");
}

function spokenMessage(message: string | undefined): boolean {
  const text = message?.trim() ?? "";
  if (!text) return false;
  if (/^request failed with status code \d+$/i.test(text)) return false;
  return !/^(error|bad request|conflict|unauthorized|forbidden|internal server error|http exception)$/i.test(
    text,
  );
}
