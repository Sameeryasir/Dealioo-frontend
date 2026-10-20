import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";

export type AdminRoleOption = {
  name: string;
};

export async function getAdminRoles(): Promise<AdminRoleOption[]> {
  try {
    const { data } = await authAxios.get<{ items?: AdminRoleOption[] }>(
      "/admin/roles",
    );
    return Array.isArray(data?.items)
      ? data.items.filter((role) => typeof role?.name === "string")
      : [];
  } catch (error) {
    throw new Error(parseApiMessage(error, "Could not load roles."));
  }
}
