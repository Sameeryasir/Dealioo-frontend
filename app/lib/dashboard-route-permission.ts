import type { BusinessMemberPermission } from "@/app/services/member/types";

export type DashboardRouteNeed =
  | { kind: "allow" }
  | { kind: "owner" }
  | {
      kind: "permission";
      permission: BusinessMemberPermission | "google_ads";
    };

export function dashboardRouteNeed(
  pathname: string,
  businessId: number,
): DashboardRouteNeed {
  const base = `/business/${businessId}/dashboard`;
  if (pathname === base || pathname === `${base}/`) {
    return { kind: "allow" };
  }
  if (!pathname.startsWith(`${base}/`)) {
    return { kind: "allow" };
  }

  const rest = pathname.slice(base.length + 1);
  const parts = rest.split("/").filter(Boolean);
  const segment = parts[0] ?? "";

  if (segment === "orders") {
    return { kind: "permission", permission: "orders" };
  }
  if (segment === "activity") {
    return { kind: "permission", permission: "activity" };
  }
  if (segment === "scanning") {
    return { kind: "permission", permission: "scanning" };
  }
  if (segment === "chats") {
    return { kind: "permission", permission: "chats" };
  }
  if (segment === "program") {
    return { kind: "permission", permission: "campaigns" };
  }
  if (segment === "meta" || segment === "ads-tracking") {
    return { kind: "permission", permission: "meta_ads" };
  }
  if (segment === "google-ads") {
    return { kind: "permission", permission: "google_ads" };
  }
  if (segment === "automations") {
    return { kind: "permission", permission: "automations" };
  }
  if (segment === "members") {
    return { kind: "permission", permission: "members" };
  }
  if (segment === "settings") {
    return { kind: "permission", permission: "settings" };
  }
  if (segment === "history") {
    return { kind: "permission", permission: "history" };
  }
  if (segment === "performance") {
    return { kind: "owner" };
  }
  if (segment === "website-builder") {
    return { kind: "permission", permission: "settings" };
  }
  if (segment === "ad-library") {
    return { kind: "permission", permission: "meta_ads" };
  }
  if (segment === "campaigns") {
    const tab = parts[2];
    if (tab === "guests") {
      return { kind: "permission", permission: "campaigns_guests" };
    }
    if (tab === "orders") {
      return { kind: "permission", permission: "campaigns_orders" };
    }
    if (tab === "funnel" || tab === "experience") {
      return { kind: "permission", permission: "funnels_edit" };
    }
    if (tab === "automations") {
      return { kind: "permission", permission: "automations" };
    }
    return { kind: "permission", permission: "campaigns" };
  }

  return { kind: "owner" };
}
