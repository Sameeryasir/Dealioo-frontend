import { parseApiMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authAxios } from "@/app/lib/auth-axios";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import { parseAuthUser } from "@/app/services/user/parse-auth-user";

export async function getMyProfile(): Promise<VerifyOtpUser> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  const response = await authAxios.get<unknown>("/user/me");
  const user = parseAuthUser(response.data);
  if (!user) {
    throw new Error("Invalid profile data from server.");
  }
  return user;
}

export async function updateMyProfile(payload: {
  name: string;
  email: string;
  phone: string;
}): Promise<VerifyOtpUser> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  const response = await authAxios.patch<unknown>("/user/me", {
    name: payload.name.trim(),
    email: payload.email.trim(),
    phone: payload.phone.trim(),
  });

  const user = parseAuthUser(response.data);
  if (!user) {
    throw new Error("Invalid profile data from server.");
  }
  return user;
}

export function getProfileUpdateErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: unknown } } })
      .response;
    if (response?.data?.message != null) {
      return parseApiMessage(response.data.message, "Could not update profile.");
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Could not update profile.";
}
