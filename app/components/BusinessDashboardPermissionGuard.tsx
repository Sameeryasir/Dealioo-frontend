"use client";

import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import { dashboardRouteNeed } from "@/app/lib/dashboard-route-permission";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function BusinessDashboardPermissionGuard({
  children,
}: {
  children: ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const businessId = parseRoutePositiveInt(params.businessId) ?? null;
  const { can, isFetched, isOwnerLike } =
    useBusinessMembershipPermissions(businessId);

  const need =
    businessId != null
      ? dashboardRouteNeed(pathname, businessId)
      : { kind: "allow" as const };

  const viewingOwnAccess =
    need.kind === "permission" &&
    need.permission === "members" &&
    searchParams.get("openSelfDetails") === "1";

  let allowed = true;
  if (need.kind === "permission") {
    allowed = isOwnerLike || can(need.permission) || viewingOwnAccess;
  } else if (need.kind === "owner") {
    allowed = isOwnerLike;
  }

  useEffect(() => {
    if (!isFetched || businessId == null) return;
    if (allowed) return;
    router.replace(`/business/${businessId}/dashboard`);
  }, [allowed, businessId, isFetched, router]);

  if (!isFetched) {
    return null;
  }

  if (!allowed) {
    return null;
  }

  return children;
}
