import { isAdminOrSuperAdminUser } from "@/app/lib/is-admin-or-super-admin-user";

export function canViewBusinessHistory(options: {
  canHistory: boolean;
  membershipLoaded?: boolean;
}): boolean {
  if (isAdminOrSuperAdminUser()) {
    return true;
  }
  if (!options.membershipLoaded) {
    return false;
  }
  return options.canHistory;
}
