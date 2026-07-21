import { isAdminUser } from "@/app/lib/is-admin-user";
import { isSuperAdminUser } from "@/app/lib/is-super-admin-user";

export function isAdminOrSuperAdminUser(): boolean {
  return isAdminUser() || isSuperAdminUser();
}
