import axios from "axios";
import { getApiBaseUrl } from "@/app/lib/api";
import { normalizeAuthEmail } from "@/app/lib/auth-password";
import { throwAuthApiError } from "@/app/lib/auth-api-error";

export type RegisterPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
};

export type RegisterResponse = {
  message: string;
  isNewCustomer: boolean;
};

export async function registerUser(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  try {
    const response = await axios.post<RegisterResponse>(
      `${getApiBaseUrl()}/auth/register`,
      {
        ...payload,
        email: normalizeAuthEmail(payload.email),
        role: payload.role ?? "Admin",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = response.data;
    return {
      message: data.message,
      isNewCustomer: data.isNewCustomer === true,
    };
  } catch (error) {
    console.error("Register Error:", error);
    throwAuthApiError(error, "Could not create account.");
  }
}

export default registerUser;
