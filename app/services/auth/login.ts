import axios from "axios";
import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";
import type { VerifyOtpResponse, VerifyOtpUser } from "@/app/services/auth/verify-otp";

export type LoginResponse = {
  message: string;
  token: string;
  refreshToken: string;
  user: VerifyOtpUser;
};

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  try {
    const response = await axios.post<LoginResponse>(
      `${getApiBaseUrl()}/auth/login`,
      {
        email,
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
    console.error("Login Error:", error);

    if (axios.isAxiosError(error) && error.response?.data?.message != null) {
      throw new Error(
        parseApiMessage(error.response.data.message, "Could not sign in."),
      );
    }

    throw error;
  }
}

export default login;
