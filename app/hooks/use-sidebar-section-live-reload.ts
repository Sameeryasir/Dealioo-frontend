"use client";

import { useBusinessSidebarPusher } from "@/app/hooks/use-business-sidebar-pusher";
import type { SidebarUnreadSection } from "@/app/lib/sidebar-section-unread-storage";
import { markSidebarSectionRead } from "@/app/services/sidebar-unread/mark-sidebar-section-read";
import { useEffect, useRef } from "react";

export function useSidebarSectionLiveReload(
  businessId: number,
  section: SidebarUnreadSection,
  onReload: () => void,
): void {
  const liveReloadTimerRef = useRef<number | null>(null);
  const followUpTimerRef = useRef<number | null>(null);
  const onReloadRef = useRef(onReload);
  onReloadRef.current = onReload;

  useBusinessSidebarPusher(businessId, (payload) => {
    if (payload.businessId !== businessId) return;
    if (payload.section !== section) return;

    if (liveReloadTimerRef.current != null) {
      window.clearTimeout(liveReloadTimerRef.current);
    }
    if (followUpTimerRef.current != null) {
      window.clearTimeout(followUpTimerRef.current);
    }

    const runReload = () => {
      onReloadRef.current();
      void markSidebarSectionRead(businessId, section).catch(() => {});
    };

    liveReloadTimerRef.current = window.setTimeout(() => {
      liveReloadTimerRef.current = null;
      runReload();
      followUpTimerRef.current = window.setTimeout(() => {
        followUpTimerRef.current = null;
        onReloadRef.current();
      }, section === "activity" ? 450 : 250);
    }, section === "activity" ? 120 : 150);
  });

  useEffect(() => {
    return () => {
      if (liveReloadTimerRef.current != null) {
        window.clearTimeout(liveReloadTimerRef.current);
      }
      if (followUpTimerRef.current != null) {
        window.clearTimeout(followUpTimerRef.current);
      }
    };
  }, []);
}
