import axios from "axios";
import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";

export type SendOtpResponse = string;

export async function sendOtp(email: string): Promise<SendOtpResponse> {
  try {
    const response = await axios.post<SendOtpResponse>(
      `${getApiBaseUrl()}/auth/send-otp`,
      {
        email,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Send OTP Error:", error);

    if (axios.isAxiosError(error) && error.response?.data?.message != null) {
      throw new Error(
        parseApiMessage(error.response.data.message, "Could not send OTP."),
      );
    }

    throw error;
  }
}

export default sendOtp;
