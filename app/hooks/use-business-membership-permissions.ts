"use client";

import { useQuery } from "@tanstack/react-query";
import { isPositiveInt } from "@/app/lib/numbers";
import {
  getMyBusinessMembershipAccess,
} from "@/app/services/member/business-members";
import { businessMemberQueryKeys } from "@/app/services/member/member-query-keys";
import type { BusinessMemberPermission } from "@/app/services/member/types";
import { BUSINESS_MEMBER_PERMISSIONS } from "@/app/services/member/types";

const FULL_PERMISSIONS: BusinessMemberPermission[] = [
  ...BUSINESS_MEMBER_PERMISSIONS,
];

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
    can: (permission: BusinessMemberPermission) =>
      isOwnerLike || permissionSet.has(permission),
  };
}
