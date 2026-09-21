import axios from "axios";
import { getApiBaseUrl } from "@/app/lib/api";
import { normalizeAuthEmail } from "@/app/lib/auth-password";
import { throwAuthApiError } from "@/app/lib/auth-api-error";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";

export type LoginResponse = {
  message: string;
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
        email: normalizeAuthEmail(email),
        password,
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Login Error:", error);
    throwAuthApiError(error, "Could not sign in.");
  }
}

export default login;
