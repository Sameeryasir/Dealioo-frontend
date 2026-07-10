import { getSetupUser } from "@/app/lib/setup-user";

export function isSuperAdminUser(): boolean {
  const roleName = getSetupUser()?.role?.name;
  if (!roleName) return false;
  return roleName.trim().toLowerCase() === "super admin";
}
