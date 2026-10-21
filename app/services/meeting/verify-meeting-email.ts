import axios from "axios";
import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";

function parseError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error) && error.response?.data?.message != null) {
    return new Error(parseApiMessage(error.response.data.message, fallback));
  }
  return error instanceof Error ? error : new Error(fallback);
}

export async function sendMeetingEmailOtp(email: string): Promise<void> {
  try {
    await axios.post(
      `${getApiBaseUrl()}/meeting-requests/verify-email/send`,
      { email: email.trim().toLowerCase() },
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    throw parseError(error, "Could not send verification code.");
  }
}

export async function confirmMeetingEmailOtp(
  email: string,
  otp: number,
): Promise<{ emailVerificationToken: string }> {
  try {
    const response = await axios.post<{
      message: string;
      emailVerificationToken: string;
    }>(
      `${getApiBaseUrl()}/meeting-requests/verify-email/confirm`,
      { email: email.trim().toLowerCase(), otp },
      { headers: { "Content-Type": "application/json" } },
    );
    return {
      emailVerificationToken: response.data.emailVerificationToken,
    };
  } catch (error) {
    throw parseError(error, "Could not verify code.");
  }
}
