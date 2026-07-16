import axios from "axios";
import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";
import { hasAuthSession } from "@/app/lib/auth-session";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import type { BusinessMemberPermission } from "@/app/services/member/types";

function readApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data != null) {
    const data = error.response.data as { message?: unknown };
    if (data.message != null) {
      return parseApiMessage(data.message, fallback);
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export type ValidateInvitationResponse = {
  valid: boolean;
  accountExists: boolean;
  businessName: string;
  email: string;
  role: string;
};

export async function createBusinessInvitation(input: {
  businessId: number;
  email: string;
  role: string;
  permissions: BusinessMemberPermission[];
}): Promise<{ message: string; invitationId: number }> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  try {
    const response = await authAxios.post<unknown>(
      `/businesses/${input.businessId}/invitations`,
      {
        email: input.email,
        role: input.role,
        permissions: input.permissions,
      },
    );
    const data = (response.data ?? {}) as Record<string, unknown>;
    const invitationIdRaw = data.invitationId ?? data.inviteId;
    return {
      message:
        typeof data.message === "string"
          ? data.message
          : "Invitation sent successfully.",
      invitationId:
        typeof invitationIdRaw === "number" && Number.isFinite(invitationIdRaw)
          ? invitationIdRaw
          : 0,
    };
  } catch (error) {
    throw new Error(
      readApiErrorMessage(error, "Could not send the invitation."),
    );
  }
}

export async function validateBusinessInvitation(
  token: string,
): Promise<ValidateInvitationResponse> {
  try {
    const response = await axios.get<unknown>(
      `${getApiBaseUrl()}/invitations/validate`,
      {
        params: { token },
        headers: { Accept: "application/json" },
      },
    );
    const data = (response.data ?? {}) as Record<string, unknown>;
    return {
      valid: Boolean(data.valid),
      accountExists: Boolean(data.accountExists),
      businessName:
        typeof data.businessName === "string" ? data.businessName : "",
      email: typeof data.email === "string" ? data.email : "",
      role: typeof data.role === "string" ? data.role : "",
    };
  } catch (error) {
    throw new Error(
      readApiErrorMessage(error, "This invitation link is invalid or expired."),
    );
  }
}

export type RegisterWithInvitationResponse = {
  message: string;
  token: string;
  refreshToken: string;
  user: VerifyOtpUser;
};

export type AcceptInvitationResponse = {
  message: string;
  businessId: number;
  token: string;
  refreshToken: string;
  user: VerifyOtpUser;
};

export async function acceptBusinessInvitation(
  token: string,
): Promise<AcceptInvitationResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  try {
    const response = await authAxios.post<AcceptInvitationResponse>(
      "/auth/accept-invitation",
      { token },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      readApiErrorMessage(error, "Could not accept the invitation."),
    );
  }
}

export async function registerWithInvitation(input: {
  token: string;
  name: string;
  password: string;
  phone?: string;
}): Promise<RegisterWithInvitationResponse> {
  try {
    const response = await axios.post<RegisterWithInvitationResponse>(
      `${getApiBaseUrl()}/auth/register-with-invitation`,
      {
        token: input.token,
        name: input.name,
        password: input.password,
        ...(input.phone?.trim() ? { phone: input.phone.trim() } : {}),
      },
      {
        headers: { "Content-Type": "application/json", Accept: "application/json" },
      },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      readApiErrorMessage(error, "Could not create your account from this invitation."),
    );
  }
}
