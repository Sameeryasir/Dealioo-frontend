"use client";

import { useEffect, useRef } from "react";
import {
  isPusherConfigured,
  type SidebarSectionUpdatedPusherPayload,
} from "@/app/lib/pusher-sidebar";
import { subscribeBusinessSidebar } from "@/app/lib/pusher-client";

export function useBusinessSidebarPusher(
  businessId: number,
  onUpdate: (payload: SidebarSectionUpdatedPusherPayload) => void,
): void {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!isPusherConfigured() || businessId < 1) {
      return;
    }

    return subscribeBusinessSidebar(businessId, (payload) => {
      if (payload.businessId !== businessId) return;
      try {
        onUpdateRef.current(payload);
      } catch {
      }
    });
  }, [businessId]);
}
