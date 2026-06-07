import axios from "axios";
import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";

export type VerifyOtpUserRole = {
  id: number;
  name: string;
};

export type VerifyOtpUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: VerifyOtpUserRole;
  twoFactorEnabled?: boolean;
  isTwoFactorVerified?: boolean;
};

export type VerifyOtpResponse = {
  message: string;
  token: string;
  refreshToken: string;
  user: VerifyOtpUser;
};

export async function verifyOtp(
  email: string,
  otp: number,
): Promise<VerifyOtpResponse> {
  if (
    !Number.isFinite(otp) ||
    !Number.isInteger(otp) ||
    otp < 0 ||
    otp > 999_999
  ) {
    throw new Error("Invalid OTP");
  }

  try {
    const response = await axios.post<VerifyOtpResponse>(
      `${getApiBaseUrl()}/auth/verify-otp`,
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
    console.error("Verify OTP Error:", error);

    if (axios.isAxiosError(error) && error.response?.data?.message != null) {
      throw new Error(
        parseApiMessage(error.response.data.message, "Could not verify OTP."),
      );
    }

    throw error;
  }
}

export default verifyOtp;
