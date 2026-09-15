export const BUSINESS_MEMBER_ROLES = ["Manager", "Staff", "Scanner"] as const;

export type BusinessMemberRole = (typeof BUSINESS_MEMBER_ROLES)[number];

export const CAMPAIGN_ACTION_PERMISSIONS = [
  "campaigns_create",
  "campaigns_update",
  "campaigns_edit",
  "campaigns_delete",
] as const;

export const CAMPAIGN_WORKSPACE_PERMISSIONS = [
  "campaigns_guests",
  "campaigns_orders",
] as const;

export type CampaignActionPermission =
  (typeof CAMPAIGN_ACTION_PERMISSIONS)[number];

export const META_CAMPAIGN_ACTION_PERMISSIONS = [
  "meta_campaigns_create",
  "meta_campaigns_delete",
] as const;

export type MetaCampaignActionPermission =
  (typeof META_CAMPAIGN_ACTION_PERMISSIONS)[number];

export const GOOGLE_CAMPAIGN_ACTION_PERMISSIONS = [
  "google_campaigns_create",
  "google_campaigns_delete",
] as const;

export type GoogleCampaignActionPermission =
  (typeof GOOGLE_CAMPAIGN_ACTION_PERMISSIONS)[number];

export const AUTOMATION_ACTION_PERMISSIONS = [
  "automations_create",
  "automations_edit",
  "automations_delete",
] as const;

export type AutomationActionPermission =
  (typeof AUTOMATION_ACTION_PERMISSIONS)[number];

export const BUSINESS_MEMBER_PERMISSIONS = [
  "campaigns",
  "campaigns_view",
  ...CAMPAIGN_ACTION_PERMISSIONS,
  ...CAMPAIGN_WORKSPACE_PERMISSIONS,
  "meta_ads",
  "meta_campaigns",
  "meta_campaigns_view",
  ...META_CAMPAIGN_ACTION_PERMISSIONS,
  "google_campaigns_view",
  ...GOOGLE_CAMPAIGN_ACTION_PERMISSIONS,
  "automations",
  ...AUTOMATION_ACTION_PERMISSIONS,
  "funnels_edit",
  "orders",
  "activity",
  "history",
  "chats",
  "scanning",
  "members",
  "settings",
] as const;

export type BusinessMemberPermission =
  (typeof BUSINESS_MEMBER_PERMISSIONS)[number];

export const FULL_ACCESS_PERMISSION = "full_access" as const;

export type ListedMemberPermission =
  | BusinessMemberPermission
  | typeof FULL_ACCESS_PERMISSION;

export type BusinessMemberStatus = "owner" | "active" | "pending";

export type BusinessMemberListItem = {
  id: number | null;
  userId: number;
  name: string;
  email: string;
  role: string;
  status: BusinessMemberStatus;
  permissions: ListedMemberPermission[];
  joinedAt?: string;
  invitedAt?: string;
  expiresAt?: string;
};

export type BusinessMembersResponse = {
  members: BusinessMemberListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    activeCount: number;
    pendingCount: number;
    fullAccessCount: number;
    roleCount: number;
  };
};
