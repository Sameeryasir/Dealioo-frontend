import { getSetupUser } from "@/app/lib/setup-user";

export function getUserRoleLabel(): string | null {
  const roleName = getSetupUser()?.role?.name?.trim();
  return roleName || null;
}
