import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";
import type { PlatformAdminUser } from "@/app/services/admin/get-platform-overview";

export type UpdateAdminUserInput = {
  name?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
};

export async function updateAdminUser(
  userId: number,
  input: UpdateAdminUserInput,
): Promise<PlatformAdminUser> {
  try {
    const { data } = await authAxios.patch<PlatformAdminUser>(
      `/admin/users/${userId}`,
      input,
    );
    return {
      id: Number(data?.id) || userId,
      name: String(data?.name ?? ""),
      email: String(data?.email ?? ""),
      phone: data?.phone ?? null,
      avatar: data?.avatar ?? null,
      roleName: data?.roleName ?? null,
      isActive: Boolean(data?.isActive),
      emailVerified: Boolean(data?.emailVerified),
      provider: String(data?.provider ?? "LOCAL"),
      createdAt: String(data?.createdAt ?? ""),
      lastLoginAt: data?.lastLoginAt ?? null,
      planName: data?.planName ?? null,
      planSlug: data?.planSlug ?? null,
      businesses: Array.isArray(data?.businesses) ? data.businesses : [],
    };
  } catch (error) {
    throw new Error(parseApiMessage(error, "Could not update user."));
  }
}
