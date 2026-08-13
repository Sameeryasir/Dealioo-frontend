"use client";

import { useQuery } from "@tanstack/react-query";
import { isPositiveInt } from "@/app/lib/numbers";
import {
  hasAnyCampaignPermission,
  hasAnyGoogleCampaignPermission,
  hasAnyMetaCampaignPermission,
} from "@/app/lib/member-permissions";
import {
  getMyBusinessMembershipAccess,
} from "@/app/services/member/business-members";
import { businessMemberQueryKeys } from "@/app/services/member/member-query-keys";
import type { BusinessMemberPermission } from "@/app/services/member/types";
import {
  BUSINESS_MEMBER_PERMISSIONS,
  CAMPAIGN_ACTION_PERMISSIONS,
  GOOGLE_CAMPAIGN_ACTION_PERMISSIONS,
  META_CAMPAIGN_ACTION_PERMISSIONS,
} from "@/app/services/member/types";

const FULL_PERMISSIONS: BusinessMemberPermission[] = [
  ...BUSINESS_MEMBER_PERMISSIONS,
];

const CAMPAIGN_ACTION_SET = new Set<string>(CAMPAIGN_ACTION_PERMISSIONS);
const META_ACTION_SET = new Set<string>(META_CAMPAIGN_ACTION_PERMISSIONS);
const GOOGLE_ACTION_SET = new Set<string>(GOOGLE_CAMPAIGN_ACTION_PERMISSIONS);

export function useBusinessMembershipPermissions(businessId: number | null) {
  const enabled = isPositiveInt(businessId);

  const query = useQuery({
    queryKey: businessMemberQueryKeys.me(businessId ?? 0),
    queryFn: () => getMyBusinessMembershipAccess(businessId as number),
    enabled,
    staleTime: 30_000,
  });

  const access = query.data?.access ?? "member";
  const isOwnerLike = access === "owner" || access === "super_admin";
  const permissionList = isOwnerLike
    ? FULL_PERMISSIONS
    : (query.data?.permissions ?? []);
  const permissionSet = new Set(permissionList);

  return {
    ...query,
    access,
    isOwnerLike,
    permissionList,
    can: (permission: BusinessMemberPermission | "google_ads") => {
      if (isOwnerLike) {
        return true;
      }

      if (permission === "campaigns") {
        return hasAnyCampaignPermission(permissionList);
      }

      if (permission === "meta_ads" || permission === "meta_campaigns") {
        return hasAnyMetaCampaignPermission(permissionList);
      }

      if (permission === "google_ads") {
        return hasAnyGoogleCampaignPermission(permissionList);
      }

      if (CAMPAIGN_ACTION_SET.has(permission)) {
        return (
          permissionSet.has(permission) || permissionSet.has("campaigns")
        );
      }

      if (META_ACTION_SET.has(permission)) {
        if (permissionSet.has(permission)) {
          return true;
        }
        if (permissionSet.has("meta_campaigns")) {
          return true;
        }
        if (
          permission === "meta_campaigns_view" &&
          permissionSet.has("meta_ads")
        ) {
          return true;
        }
        return false;
      }

      if (GOOGLE_ACTION_SET.has(permission)) {
        return (
          permissionSet.has(permission) || permissionSet.has("campaigns")
        );
      }

      return permissionSet.has(permission as BusinessMemberPermission);
    },
  };
}
