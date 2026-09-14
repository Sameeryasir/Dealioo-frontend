import { isAdminOrSuperAdminUser } from "@/app/lib/is-admin-or-super-admin-user";

export function canViewBusinessMembers(options: {
  membershipAccess?: "owner" | "member" | "super_admin" | null;
  membershipLoaded?: boolean;
}): boolean {
  if (isAdminOrSuperAdminUser()) {
    return true;
  }
  if (!options.membershipLoaded) {
    return false;
  }
  const access = options.membershipAccess;
  return (
    access === "owner" || access === "member" || access === "super_admin"
  );
}
