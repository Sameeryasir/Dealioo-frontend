import axios from "axios";
import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";

export type RegisterPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
};

export type RegisterResponse = {
  message: string;
};

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  try {
    const response = await axios.post<RegisterResponse>(
      `${getApiBaseUrl()}/auth/register`,
      {
        ...payload,
        role: payload.role ?? "Admin",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Register Error:", error);

    if (axios.isAxiosError(error) && error.response?.data?.message != null) {
      throw new Error(
        parseApiMessage(error.response.data.message, "Could not create account."),
      );
    }

    throw error;
  }
}

export default registerUser;
