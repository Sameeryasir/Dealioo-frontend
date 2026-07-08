import axios from "axios";
import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";
import type { VerifyOtpResponse } from "@/app/services/auth/verify-otp";

export async function resetPassword(
  email: string,
  otp: number,
  password: string,
): Promise<VerifyOtpResponse> {
  try {
    const response = await axios.post<VerifyOtpResponse>(
      `${getApiBaseUrl()}/auth/reset-password`,
      {
        email,
        otp,
        password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Reset password error:", error);

    if (axios.isAxiosError(error) && error.response?.data?.message != null) {
      throw new Error(
        parseApiMessage(
          error.response.data.message,
          "Could not reset password.",
        ),
      );
    }

    throw error;
  }
}
