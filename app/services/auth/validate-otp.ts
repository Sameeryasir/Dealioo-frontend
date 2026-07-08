import axios from "axios";
import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";

export type ValidateOtpResponse = {
  message: string;
};

export async function validateOtp(
  email: string,
  otp: number,
): Promise<ValidateOtpResponse> {
  if (
    !Number.isFinite(otp) ||
    !Number.isInteger(otp) ||
    otp < 0 ||
    otp > 999_999
  ) {
    throw new Error("Invalid OTP");
  }

  try {
    const response = await axios.post<ValidateOtpResponse>(
      `${getApiBaseUrl()}/auth/validate-otp`,
      {
        email,
        otp,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Validate OTP error:", error);

    if (axios.isAxiosError(error) && error.response?.data?.message != null) {
      throw new Error(
        parseApiMessage(
          error.response.data.message,
          "Could not verify code.",
        ),
      );
    }

    throw error;
  }
}
