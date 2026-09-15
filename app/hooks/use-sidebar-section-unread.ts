"use client";

import { hasAuthSession } from "@/app/lib/auth-session";
import { playNotificationChime } from "@/app/lib/play-notification-chime";
import { getSetupUser } from "@/app/lib/setup-user";
import {
  readSectionUnreadCount,
  writeSectionUnreadCount,
  type SidebarUnreadSection,
} from "@/app/lib/sidebar-section-unread-storage";
import { getBusinessSidebarUnread } from "@/app/services/sidebar-unread/get-business-sidebar-unread";
import { markSidebarSectionRead } from "@/app/services/sidebar-unread/mark-sidebar-section-read";
import { useBusinessSidebarPusher } from "@/app/hooks/use-business-sidebar-pusher";
import { subscribePusherReconnect } from "@/app/lib/pusher-client";
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

export type SidebarSectionLatestAts = {
  orders: string | null;
  activity: string | null;
  history: string | null;
};

export type SidebarSectionLatestDescriptions = {
  orders: string | null;
  activity: string | null;
  history: string | null;
};

export type BusinessSidebarSectionUnreadState = {
  counts: SidebarSectionUnreadCounts;
  latestAt: SidebarSectionLatestAts;
  latestDescriptions: SidebarSectionLatestDescriptions;
  latestGuestJoined: {
    customerId: number;
    guestName: string;
    guestEmail: string | null;
    campaignName: string | null;
    occurredAt: string;
  } | null;
  latestAccessUpdated: {
    businessName: string;
    previousRole: string;
    role: string;
    grantedPermissions: string[];
    removedPermissions: string[];
    updatedAt: string;
  } | null;
  markAllSectionsRead: () => Promise<void>;
};

const EMPTY_LATEST: SidebarSectionLatestAts = {
  orders: null,
  activity: null,
  history: null,
};

const EMPTY_DESCRIPTIONS: SidebarSectionLatestDescriptions = {
  orders: null,
  activity: null,
  history: null,
};

export function useBusinessSidebarSectionUnread(
  businessId: number | null,
  paths: SidebarSectionPaths,
  enabled: SidebarSectionEnabled,
): BusinessSidebarSectionUnreadState {
  const pathname = usePathname();
  const [userId, setUserId] = useState<number | null>(() => resolveUserId());
  const [counts, setCounts] = useState<SidebarSectionUnreadCounts>({
    orders: 0,
    activity: 0,
    history: 0,
  });
  const [latestAt, setLatestAt] =
    useState<SidebarSectionLatestAts>(EMPTY_LATEST);
  const [latestDescriptions, setLatestDescriptions] =
    useState<SidebarSectionLatestDescriptions>(EMPTY_DESCRIPTIONS);
  const [latestGuestJoined, setLatestGuestJoined] = useState<{
    customerId: number;
    guestName: string;
    guestEmail: string | null;
    campaignName: string | null;
    occurredAt: string;
  } | null>(null);
  const [latestAccessUpdated, setLatestAccessUpdated] = useState<{
    businessName: string;
    previousRole: string;
    role: string;
    grantedPermissions: string[];
    removedPermissions: string[];
    updatedAt: string;
  } | null>(null);

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
      sectionLatestAt: string | null = null,
      sectionLatestDescription: string | null = null,
    ) => {
      const safe = Math.max(0, Math.floor(count));
      writeSectionUnreadCount(id, business, section, safe);
      setCounts((prev) =>
        prev[section] === safe ? prev : { ...prev, [section]: safe },
      );
      setLatestAt((prev) => {
        const next = safe > 0 ? sectionLatestAt : null;
        return prev[section] === next ? prev : { ...prev, [section]: next };
      });
      setLatestDescriptions((prev) => {
        const next =
          safe > 0 && sectionLatestDescription
            ? sectionLatestDescription
            : null;
        return prev[section] === next ? prev : { ...prev, [section]: next };
      });
    },
    [],
  );

  const markReadIfViewing = useCallback(
    async (id: number, business: number, section: SidebarUnreadSection) => {
      persist(id, business, section, 0, null, null);
      try {
        await markSidebarSectionRead(business, section);
        writeSectionUnreadCount(id, business, section, 0);
      } catch {
      }
    },
    [persist],
  );

  const markAllSectionsRead = useCallback(async () => {
    const business = businessIdRef.current;
    const user = userIdRef.current;
    if (business == null || business < 1 || user == null) return;

    const enabledMap = enabledRef.current;
    const toClear = SECTIONS.filter((section) => enabledMap[section]);
    for (const section of toClear) {
      persist(user, business, section, 0, null, null);
    }
    setLatestGuestJoined(null);
    setLatestAccessUpdated(null);

    await Promise.all(
      toClear.map((section) =>
        markSidebarSectionRead(business, section).catch(() => null),
      ),
    );
  }, [persist]);

  const refreshFromServer = useCallback(
    async (id: number, business: number) => {
      if (!hasAuthSession()) return;

      const pathMap = pathsRef.current;
      const enabledMap = enabledRef.current;
      const path = pathnameRef.current;

      for (const section of SECTIONS) {
        if (!enabledMap[section]) {
          continue;
        }
        if (isOnSectionRoute(path, pathMap[section])) {
          await markReadIfViewing(id, business, section);
        }
      }

      try {
        const result = await getBusinessSidebarUnread(business);
        for (const section of SECTIONS) {
          if (!enabledMap[section]) {
            continue;
          }
          if (isOnSectionRoute(pathnameRef.current, pathsRef.current[section])) {
            continue;
          }
          const row = result[section];
          persist(
            id,
            business,
            section,
            row?.unreadCount ?? 0,
            row?.latestAt ?? null,
            row?.latestDescription ?? null,
          );
        }
        setLatestGuestJoined(result.latestGuestJoined);
        setLatestAccessUpdated(result.latestAccessUpdated);
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
      setLatestAt(EMPTY_LATEST);
      setLatestDescriptions(EMPTY_DESCRIPTIONS);
      setLatestGuestJoined(null);
      setLatestAccessUpdated(null);
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
    const unsubReconnect = subscribePusherReconnect(() => run());

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubReconnect();
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

    if (
      payload.actorUserId != null &&
      Number(payload.actorUserId) === Number(user)
    ) {
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

    setLatestAt((prev) => {
      const prevMs = prev[payload.section]
        ? Date.parse(prev[payload.section] as string)
        : 0;
      const nextMs = Date.parse(payload.occurredAt);
      if (Number.isFinite(nextMs) && nextMs >= prevMs) {
        return { ...prev, [payload.section]: payload.occurredAt };
      }
      return prev;
    });
    if (payload.section === "history" && payload.description) {
      setLatestDescriptions((prev) => ({
        ...prev,
        history: payload.description,
      }));
    }
    setCounts((prev) => {
      const next = prev[payload.section] + 1;
      writeSectionUnreadCount(user, business, payload.section, next);
      return { ...prev, [payload.section]: next };
    });
    playNotificationChime();
    scheduleRefreshFromServer(user, business);
  });

  return {
    counts: {
      orders: enabled.orders && !onOrdersPage ? counts.orders : 0,
      activity: enabled.activity && !onActivityPage ? counts.activity : 0,
      history: enabled.history && !onHistoryPage ? counts.history : 0,
    },
    latestAt: {
      orders: enabled.orders && !onOrdersPage ? latestAt.orders : null,
      activity: enabled.activity && !onActivityPage ? latestAt.activity : null,
      history: enabled.history && !onHistoryPage ? latestAt.history : null,
    },
    latestDescriptions: {
      orders: enabled.orders && !onOrdersPage ? latestDescriptions.orders : null,
      activity:
        enabled.activity && !onActivityPage
          ? latestDescriptions.activity
          : null,
      history:
        enabled.history && !onHistoryPage
          ? latestDescriptions.history
          : null,
    },
    latestGuestJoined,
    latestAccessUpdated,
    markAllSectionsRead,
  };
}

export function useSidebarSectionUnread(
  businessId: number | null,
  section: SidebarUnreadSection,
  pathPrefix: string | null,
  enabled = true,
): boolean {
  const state = useBusinessSidebarSectionUnread(
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
  return state.counts[section] > 0;
}
