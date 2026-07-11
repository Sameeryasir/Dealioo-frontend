export const BUSINESS_MEMBER_ROLES = ["Manager", "Staff"] as const;

export type BusinessMemberRole = (typeof BUSINESS_MEMBER_ROLES)[number];

export const BUSINESS_MEMBER_PERMISSIONS = [
  "campaigns",
  "orders",
  "activity",
  "chats",
  "scanning",
  "members",
  "settings",
] as const;

export type BusinessMemberPermission =
  (typeof BUSINESS_MEMBER_PERMISSIONS)[number];

export type BusinessMemberStatus = "owner" | "active" | "pending";

export type BusinessMemberListItem = {
  id: number | null;
  userId: number;
  name: string;
  email: string;
  role: string;
  status: BusinessMemberStatus;
  permissions: BusinessMemberPermission[];
  invitedAt?: string;
  expiresAt?: string;
};

export type BusinessMembersResponse = {
  members: BusinessMemberListItem[];
};
