"use client";

import { useAuth } from "@/app/contexts/auth-context";
import { subscribeMemberAccessRemoved } from "@/app/lib/pusher-client";
import { isPusherConfigured } from "@/app/lib/pusher-member-access-removed";
import { getSetupUser } from "@/app/lib/setup-user";
import { businessQueryKeys } from "@/app/services/business/business-query-keys";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function MemberAccessRemovedListener() {
  const { isAuthenticated, isAuthReady } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated || !isPusherConfigured()) {
      return;
    }

    const userId = getSetupUser()?.id;
    if (userId == null || userId < 1) {
      return;
    }

    return subscribeMemberAccessRemoved(userId, (payload) => {
      void queryClient.invalidateQueries({
        queryKey: businessQueryKeys.myLists(),
      });
      void queryClient.removeQueries({
        queryKey: businessQueryKeys.detail(payload.businessId),
      });

      const title =
        payload.kind === "invite"
          ? "Invitation cancelled"
          : "Access removed";
      const description =
        payload.kind === "invite"
          ? `Your invitation to ${payload.businessName} was cancelled.`
          : `You no longer have access to ${payload.businessName}.`;

      toast.message(title, {
        description,
        duration: 10_000,
      });

      const businessPath = `/business/${payload.businessId}`;
      if (pathname === businessPath || pathname?.startsWith(`${businessPath}/`)) {
        router.replace("/dashboard");
      }
    });
  }, [isAuthReady, isAuthenticated, pathname, queryClient, router]);

  return null;
}
