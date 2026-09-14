"use client";

import { hasAuthSession } from "@/app/lib/auth-session";
import { getSetupUser } from "@/app/lib/setup-user";
import {
  readSectionUnreadCount,
  writeSectionUnreadCount,
  type SidebarUnreadSection,
} from "@/app/lib/sidebar-section-unread-storage";
import { getBusinessSidebarUnread } from "@/app/services/sidebar-unread/get-business-sidebar-unread";
import { markSidebarSectionRead } from "@/app/services/sidebar-unread/mark-sidebar-section-read";
import { useBusinessSidebarPusher } from "@/app/hooks/use-business-sidebar-pusher";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_MS = 15_000;
const SECTIONS: SidebarUnreadSection[] = ["orders", "activity", "history"];

function resolveUserId(): number | null {
  const id = getSetupUser()?.id;
  return typeof id === "number" && id > 0 ? id : null;
}

function isOnSectionRoute(
  pathname: string,
  pathPrefix: string | null,
): boolean {
  if (!pathPrefix) return false;
  return pathname === pathPrefix || pathname.startsWith(`${pathPrefix}/`);
}

export type SidebarSectionPaths = {
  orders: string | null;
  activity: string | null;
  history: string | null;
};

export type SidebarSectionEnabled = {
  orders: boolean;
  activity: boolean;
  history: boolean;
};

export type SidebarSectionUnreadCounts = {
  orders: number;
  activity: number;
  history: number;
};

export function useBusinessSidebarSectionUnread(
  businessId: number | null,
  paths: SidebarSectionPaths,
  enabled: SidebarSectionEnabled,
): SidebarSectionUnreadCounts {
  const pathname = usePathname();
  const [userId, setUserId] = useState<number | null>(() => resolveUserId());
  const [counts, setCounts] = useState<SidebarSectionUnreadCounts>({
    orders: 0,
    activity: 0,
    history: 0,
  });

  const pathnameRef = useRef(pathname);
  const pathsRef = useRef(paths);
  const enabledRef = useRef(enabled);
  const businessIdRef = useRef(businessId);
  const userIdRef = useRef(userId);
  pathnameRef.current = pathname;
  pathsRef.current = paths;
  enabledRef.current = enabled;
  businessIdRef.current = businessId;
  userIdRef.current = userId;

  useEffect(() => {
    setUserId(resolveUserId());
  }, []);

  const persist = useCallback(
    (
      id: number,
      business: number,
      section: SidebarUnreadSection,
      count: number,
    ) => {
      const safe = Math.max(0, Math.floor(count));
      writeSectionUnreadCount(id, business, section, safe);
      setCounts((prev) =>
        prev[section] === safe ? prev : { ...prev, [section]: safe },
      );
    },
    [],
  );

  const markReadIfViewing = useCallback(
    async (id: number, business: number, section: SidebarUnreadSection) => {
      persist(id, business, section, 0);
      try {
        await markSidebarSectionRead(business, section);
        writeSectionUnreadCount(id, business, section, 0);
      } catch {
      }
    },
    [persist],
  );

  const refreshFromServer = useCallback(
    async (id: number, business: number) => {
      if (!hasAuthSession()) return;

      const pathMap = pathsRef.current;
      const enabledMap = enabledRef.current;
      const path = pathnameRef.current;

      for (const section of SECTIONS) {
        if (!enabledMap[section]) {
          persist(id, business, section, 0);
          continue;
        }
        if (isOnSectionRoute(path, pathMap[section])) {
          await markReadIfViewing(id, business, section);
        }
      }

      const stillNeedServer = SECTIONS.some(
        (section) =>
          enabledMap[section] &&
          !isOnSectionRoute(path, pathMap[section]),
      );
      if (!stillNeedServer) return;

      try {
        const result = await getBusinessSidebarUnread(business);
        for (const section of SECTIONS) {
          if (!enabledMap[section]) {
            persist(id, business, section, 0);
            continue;
          }
          if (isOnSectionRoute(pathnameRef.current, pathsRef.current[section])) {
            continue;
          }
          persist(id, business, section, result[section]?.unreadCount ?? 0);
        }
      } catch {
      }
    },
    [markReadIfViewing, persist],
  );

  const refreshTimerRef = useRef<number | null>(null);
  const scheduleRefreshFromServer = useCallback(
    (id: number, business: number) => {
      if (refreshTimerRef.current != null) {
        window.clearTimeout(refreshTimerRef.current);
      }
      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        void refreshFromServer(id, business);
      }, 250);
    },
    [refreshFromServer],
  );

  const onOrdersPage = isOnSectionRoute(pathname, paths.orders);
  const onActivityPage = isOnSectionRoute(pathname, paths.activity);
  const onHistoryPage = isOnSectionRoute(pathname, paths.history);

  useEffect(() => {
    if (businessId == null || businessId < 1 || userId == null) {
      setCounts({ orders: 0, activity: 0, history: 0 });
      return;
    }

    if (!hasAuthSession()) return;

    setCounts({
      orders:
        enabled.orders && !onOrdersPage
          ? readSectionUnreadCount(userId, businessId, "orders")
          : 0,
      activity:
        enabled.activity && !onActivityPage
          ? readSectionUnreadCount(userId, businessId, "activity")
          : 0,
      history:
        enabled.history && !onHistoryPage
          ? readSectionUnreadCount(userId, businessId, "history")
          : 0,
    });

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      void refreshFromServer(userId, businessId);
    };

    run();
    const timer = window.setInterval(run, POLL_MS);
    const onFocus = () => run();
    const onVisibility = () => {
      if (document.visibilityState === "visible") run();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      if (refreshTimerRef.current != null) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [
    businessId,
    enabled.activity,
    enabled.history,
    enabled.orders,
    onActivityPage,
    onHistoryPage,
    onOrdersPage,
    refreshFromServer,
    userId,
  ]);

  useBusinessSidebarPusher(businessId ?? 0, (payload) => {
    const business = businessIdRef.current;
    const user = userIdRef.current;
    if (business == null || business < 1 || user == null) return;
    if (payload.businessId !== business) return;
    if (!enabledRef.current[payload.section]) return;

    // Acting user already knows — never bump their badge.
    if (payload.actorUserId != null && payload.actorUserId === user) {
      return;
    }

    if (
      isOnSectionRoute(
        pathnameRef.current,
        pathsRef.current[payload.section],
      )
    ) {
      void markReadIfViewing(user, business, payload.section);
      return;
    }

    // Trust the server count (no optimistic +1) so actor-exclusion stays exact.
    scheduleRefreshFromServer(user, business);
  });

  return {
    orders: enabled.orders && !onOrdersPage ? counts.orders : 0,
    activity: enabled.activity && !onActivityPage ? counts.activity : 0,
    history: enabled.history && !onHistoryPage ? counts.history : 0,
  };
}

export function useSidebarSectionUnread(
  businessId: number | null,
  section: SidebarUnreadSection,
  pathPrefix: string | null,
  enabled = true,
): boolean {
  const counts = useBusinessSidebarSectionUnread(
    businessId,
    {
      orders: section === "orders" ? pathPrefix : null,
      activity: section === "activity" ? pathPrefix : null,
      history: section === "history" ? pathPrefix : null,
    },
    {
      orders: section === "orders" && enabled,
      activity: section === "activity" && enabled,
      history: section === "history" && enabled,
    },
  );
  return counts[section] > 0;
}
