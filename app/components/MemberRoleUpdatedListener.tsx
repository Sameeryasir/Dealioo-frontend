"use client";

import { useAuth } from "@/app/contexts/auth-context";
import { subscribeMemberRoleUpdated } from "@/app/lib/pusher-client";
import { writeMemberRoleUpdatedNotification } from "@/app/lib/member-role-updated-notification-storage";
import { isPusherConfigured } from "@/app/lib/pusher-member-role-updated";
import { getSetupUser } from "@/app/lib/setup-user";
import { businessMemberQueryKeys } from "@/app/services/member/member-query-keys";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

export function MemberRoleUpdatedListener() {
  const { isAuthenticated, isAuthReady } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated || !isPusherConfigured()) {
      return;
    }

    const userId = getSetupUser()?.id;
    if (userId == null || userId < 1) {
      return;
    }

    return subscribeMemberRoleUpdated(userId, (payload) => {
      if (Number(payload.userId) !== Number(userId)) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: businessMemberQueryKeys.me(payload.businessId),
      });
      void queryClient.invalidateQueries({
        queryKey: businessMemberQueryKeys.lists(payload.businessId),
      });

      toast.dismiss();

      writeMemberRoleUpdatedNotification(userId, payload);
    });
  }, [isAuthReady, isAuthenticated, queryClient]);

  return null;
}
