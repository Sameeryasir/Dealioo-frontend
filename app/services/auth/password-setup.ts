import axios from "axios";
import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";
import type { VerifyOtpResponse } from "@/app/services/auth/verify-otp";

export type PasswordSetupStartResponse = {
  message: string;
  maskedEmail: string;
};

function parseAuthError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error) && error.response?.data?.message != null) {
    return new Error(parseApiMessage(error.response.data.message, fallback));
  }
  return error instanceof Error ? error : new Error(fallback);
}

export async function startPasswordSetup(
  token: string,
): Promise<PasswordSetupStartResponse> {
  try {
    const response = await axios.post<PasswordSetupStartResponse>(
      `${getApiBaseUrl()}/auth/password-setup/start`,
      { token },
      { headers: { "Content-Type": "application/json" } },
    );
    return response.data;
  } catch (error) {
    throw parseAuthError(error, "Invalid or expired setup link.");
  }
}

export async function completePasswordSetup(
  token: string,
  password: string,
): Promise<VerifyOtpResponse> {
  try {
    const response = await axios.post<VerifyOtpResponse>(
      `${getApiBaseUrl()}/auth/password-setup/complete`,
      { token, password },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      },
    );
    return response.data;
  } catch (error) {
    throw parseAuthError(error, "Could not set password.");
  }
}
