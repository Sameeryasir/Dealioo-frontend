"use client";

import styles from "@/app/components/SuperAdminDashboard.module.css";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import { canViewBusinessHistory } from "@/app/lib/can-view-business-history";
import { useChatSidebarUnread } from "@/app/hooks/use-chat-sidebar-unread";
import { useBusinessSidebarSectionUnread } from "@/app/hooks/use-sidebar-section-unread";
import {
  clearMemberRoleUpdatedNotification,
  MEMBER_ROLE_UPDATED_NOTIFY_EVENT,
  readMemberRoleUpdatedNotification,
  writeMemberRoleUpdatedNotification,
  type MemberRoleUpdatedNotification,
} from "@/app/lib/member-role-updated-notification-storage";
import { subscribeMemberRoleUpdated } from "@/app/lib/pusher-client";
import { isPusherConfigured } from "@/app/lib/pusher-member-role-updated";
import {
  playNotificationChime,
  unlockNotificationChime,
} from "@/app/lib/play-notification-chime";
import { getSetupUser } from "@/app/lib/setup-user";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bell,
  ChevronRight,
  History,
  MessageSquare,
  ShoppingBag,
  UserCog,
  X,
  type LucideIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type NotifyRow = {
  id: "orders" | "activity" | "history" | "chats" | "access";
  title: string;
  body: string;
  href: string;
  countLabel: string | null;
  Icon: LucideIcon;
  iconClass: string;
  latestAtMs: number;
};

export default function BusinessNotifications() {
  const router = useRouter();
  const params = useParams();
  const [open, setOpen] = useState(false);
  const prevBadgeTotalRef = useRef<number | null>(null);
  const chimeReadyRef = useRef(false);
  const [accessNotify, setAccessNotify] =
    useState<MemberRoleUpdatedNotification | null>(null);

  const businessIdParam = params?.businessId;
  const businessId =
    typeof businessIdParam === "string" && /^\d+$/.test(businessIdParam)
      ? businessIdParam
      : null;
  const businessIdNumber =
    businessId != null ? Number.parseInt(businessId, 10) : null;

  useEffect(() => {
    chimeReadyRef.current = false;
    prevBadgeTotalRef.current = null;
    if (businessId == null) return;
    const timer = window.setTimeout(() => {
      chimeReadyRef.current = true;
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [businessId]);

  useEffect(() => {
    if (businessIdNumber == null || businessIdNumber < 1) {
      setAccessNotify(null);
      return;
    }

    const sync = () => {
      const userId = getSetupUser()?.id;
      if (userId == null || userId < 1) {
        setAccessNotify(null);
        return;
      }
      setAccessNotify(
        readMemberRoleUpdatedNotification(userId, businessIdNumber),
      );
    };

    sync();

    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ businessId?: number }>).detail;
      if (
        detail?.businessId != null &&
        Number(detail.businessId) !== businessIdNumber
      ) {
        return;
      }
      sync();
    };

    window.addEventListener(MEMBER_ROLE_UPDATED_NOTIFY_EVENT, onChanged);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(MEMBER_ROLE_UPDATED_NOTIFY_EVENT, onChanged);
      window.removeEventListener("storage", sync);
    };
  }, [businessIdNumber]);

  useEffect(() => {
    if (businessIdNumber == null || businessIdNumber < 1) {
      return;
    }
    if (!isPusherConfigured()) {
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
      if (Number(payload.businessId) !== businessIdNumber) {
        return;
      }

      toast.dismiss();
      writeMemberRoleUpdatedNotification(userId, payload);
      setAccessNotify({
        businessId: payload.businessId,
        businessName: payload.businessName,
        previousRole: payload.previousRole,
        role: payload.role,
        updatedAt: payload.updatedAt,
      });
      playNotificationChime();
    });
  }, [businessIdNumber]);

  const { can, access, isFetched: membershipFetched } =
    useBusinessMembershipPermissions(businessIdNumber);
  const canHistory = canViewBusinessHistory({
    membershipAccess: access,
    membershipLoaded: membershipFetched,
  });
  const canOrders = can("orders");
  const canActivity = can("activity");
  const canChats = can("chats");

  const homeHref = businessId
    ? `/business/${businessId}/dashboard`
    : "/dashboard";
  const ordersHref = `${homeHref}/orders`;
  const activityHref = `${homeHref}/activity`;
  const historyHref = `${homeHref}/history`;
  const chatsHref = `${homeHref}/chats`;

  const sectionUnread = useBusinessSidebarSectionUnread(
    businessIdNumber,
    {
      orders: businessId != null && canOrders ? ordersHref : null,
      activity: businessId != null && canActivity ? activityHref : null,
      history: businessId != null && canHistory ? historyHref : null,
    },
    {
      orders: Boolean(businessId) && canOrders,
      activity: Boolean(businessId) && canActivity,
      history: Boolean(businessId) && canHistory,
    },
  );

  const chatUnread = useChatSidebarUnread(
    businessId != null && canChats ? businessIdNumber : null,
    businessId != null && canChats ? chatsHref : null,
  );
  const hasUnreadChats = chatUnread.hasUnread;

  const rows = useMemo((): NotifyRow[] => {
    if (businessId == null) return [];

    const next: NotifyRow[] = [];

    if (accessNotify) {
      const roleChanged =
        accessNotify.previousRole.trim().toLowerCase() !==
        accessNotify.role.trim().toLowerCase();
      next.push({
        id: "access",
        title: "Access updated",
        body: roleChanged
          ? `Your role was changed to ${accessNotify.role}.`
          : "Your permissions for this business were updated.",
        href: homeHref,
        countLabel: null,
        Icon: UserCog,
        iconClass: styles.notifyIconRose,
        latestAtMs: Date.parse(accessNotify.updatedAt) || Date.now(),
      });
    }

    if (canOrders && sectionUnread.counts.orders > 0) {
      const n = sectionUnread.counts.orders;
      next.push({
        id: "orders",
        title: "Orders",
        body:
          n === 1
            ? "You have 1 new order update."
            : `You have ${n} new order updates.`,
        href: ordersHref,
        countLabel: n > 99 ? "99+" : String(n),
        Icon: ShoppingBag,
        iconClass: styles.notifyIconBlue,
        latestAtMs: Date.parse(sectionUnread.latestAt.orders ?? "") || 0,
      });
    }

    if (canActivity && sectionUnread.counts.activity > 0) {
      const n = sectionUnread.counts.activity;
      next.push({
        id: "activity",
        title: "Activity",
        body:
          n === 1
            ? "You have 1 new activity event."
            : `You have ${n} new activity events.`,
        href: activityHref,
        countLabel: n > 99 ? "99+" : String(n),
        Icon: Activity,
        iconClass: styles.notifyIconTeal,
        latestAtMs: Date.parse(sectionUnread.latestAt.activity ?? "") || 0,
      });
    }

    if (canHistory && sectionUnread.counts.history > 0) {
      const n = sectionUnread.counts.history;
      next.push({
        id: "history",
        title: "History",
        body:
          n === 1
            ? "You have 1 new history entry."
            : `You have ${n} new history entries.`,
        href: historyHref,
        countLabel: n > 99 ? "99+" : String(n),
        Icon: History,
        iconClass: styles.notifyIconOrange,
        latestAtMs: Date.parse(sectionUnread.latestAt.history ?? "") || 0,
      });
    }

    if (canChats && hasUnreadChats) {
      next.push({
        id: "chats",
        title: "Chats",
        body: "You have new chat messages.",
        href: chatsHref,
        countLabel: null,
        Icon: MessageSquare,
        iconClass: styles.notifyIconGreen,
        latestAtMs: Date.parse(chatUnread.latestAt ?? "") || 0,
      });
    }

    next.sort((a, b) => b.latestAtMs - a.latestAtMs);
    return next;
  }, [
    accessNotify,
    activityHref,
    businessId,
    canActivity,
    canChats,
    canHistory,
    canOrders,
    chatUnread.latestAt,
    chatsHref,
    hasUnreadChats,
    historyHref,
    homeHref,
    ordersHref,
    sectionUnread.counts.activity,
    sectionUnread.counts.history,
    sectionUnread.counts.orders,
    sectionUnread.latestAt.activity,
    sectionUnread.latestAt.history,
    sectionUnread.latestAt.orders,
  ]);

  const badgeTotal =
    (accessNotify ? 1 : 0) +
    (canOrders ? sectionUnread.counts.orders : 0) +
    (canActivity ? sectionUnread.counts.activity : 0) +
    (canHistory ? sectionUnread.counts.history : 0) +
    (canChats && hasUnreadChats ? 1 : 0);

  useEffect(() => {
    if (businessId == null) {
      prevBadgeTotalRef.current = null;
      return;
    }
    const prev = prevBadgeTotalRef.current;
    prevBadgeTotalRef.current = badgeTotal;
    if (!chimeReadyRef.current) return;
    if (prev == null) return;
    if (badgeTotal > prev) {
      playNotificationChime();
    }
  }, [badgeTotal, businessId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const openSection = (row: NotifyRow) => {
    if (row.id === "access" && businessIdNumber != null) {
      const userId = getSetupUser()?.id;
      if (userId != null && userId > 0) {
        clearMemberRoleUpdatedNotification(userId, businessIdNumber);
      }
      setAccessNotify(null);
    }
    setOpen(false);
    router.push(row.href);
  };

  if (businessId == null) return null;

  return (
    <>
      <div className={`${styles.bellWrap} ${styles.bellWrapNavbar}`}>
        <button
          type="button"
          className={styles.navBellBtn}
          aria-label={
            badgeTotal > 0
              ? `Notifications (${badgeTotal} unread)`
              : "Notifications"
          }
          aria-expanded={open}
          onClick={() => {
            unlockNotificationChime();
            setOpen(true);
          }}
        >
          <Bell className="size-4" strokeWidth={2.25} aria-hidden />
        </button>
        {badgeTotal > 0 ? (
          <span className={styles.bellBadge}>
            {badgeTotal > 99 ? "99" : badgeTotal}
          </span>
        ) : null}
      </div>

      <AnimatePresence>
        {open ? (
          <motion.button
            type="button"
            key="biz-notify-backdrop"
            className={styles.drawerBackdrop}
            aria-label="Close notifications"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setOpen(false)}
          />
        ) : null}

        {open ? (
          <motion.aside
            key="biz-notify-panel"
            className={styles.drawerPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "tween",
              duration: 0.38,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className={styles.drawerHead}>
              <div className={styles.drawerBrand}>
                <span className={styles.drawerBellMark} aria-hidden>
                  <Bell className="size-4" strokeWidth={2.25} />
                </span>
                <div className={styles.drawerHeadCopy}>
                  <h2 className={styles.drawerTitle}>Notifications</h2>
                  <p className={styles.drawerSub}>
                    New updates for this business
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.drawerClose}
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className={styles.drawerList}>
              {rows.length === 0 ? (
                <p className={styles.drawerEmpty}>You&apos;re all caught up.</p>
              ) : (
                <section className={styles.notifyGroup}>
                  <h3 className={styles.notifyGroupLabel}>Unread</h3>
                  {rows.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      className={`${styles.notifyItem} w-full cursor-pointer text-left transition hover:border-[#c7d7f5] hover:bg-[#f8fbff]`}
                      onClick={() => openSection(row)}
                    >
                      <div className={`${styles.notifyIcon} ${row.iconClass}`}>
                        <row.Icon
                          className="size-4"
                          strokeWidth={2.1}
                          aria-hidden
                        />
                      </div>
                      <div className={styles.notifyCopy}>
                        <h3 className={styles.notifyTitle}>{row.title}</h3>
                        <p className={styles.notifyBody}>{row.body}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 self-center">
                        {row.countLabel ? (
                          <span className={styles.drawerTabCount}>
                            {row.countLabel}
                          </span>
                        ) : (
                          <span
                            className={styles.notifyUnreadDot}
                            aria-hidden
                          />
                        )}
                        <ChevronRight
                          className="size-4 text-[#94a3b8]"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                      </div>
                    </button>
                  ))}
                </section>
              )}
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
