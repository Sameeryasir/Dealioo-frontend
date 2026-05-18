import axios from "axios";
import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";

export type SetupPasswordResponse = {
  message: string;
};

export async function setupPassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string,
): Promise<SetupPasswordResponse> {
  if (!accessToken.trim()) {
    throw new Error("Missing access token. Sign in again.");
  }

  try {
    const response = await axios.put<SetupPasswordResponse>(
      `${getApiBaseUrl()}/auth/setup-password`,
      { currentPassword, newPassword },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Setup password error:", error);
    if (axios.isAxiosError(error) && error.response?.data?.message != null) {
      throw new Error(
        parseApiMessage(error.response.data.message, "Could not update password."),
      );
    }
    throw error;
  }
}
