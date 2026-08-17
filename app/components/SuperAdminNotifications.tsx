"use client";

import styles from "@/app/components/SuperAdminDashboard.module.css";
import {
  FacebookLogo,
  GoogleAdsLogo,
  StripeLogo,
} from "@/app/components/landing/LandingIntegrationLogos";
import { useAdminNotificationsFeed } from "@/app/hooks/use-admin-notifications-feed";
import type { AdminNotificationItem } from "@/app/services/admin/get-admin-notifications";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Check,
  Mail,
  Megaphone,
  Phone,
  Store,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type NotifyIconKind = "lucide" | "brand";

type NotifyIconSpec = {
  kind: NotifyIconKind;
  Lucide?: LucideIcon;
  brand?: ReactNode;
};

function notificationIcon(type: string, eventKey?: string): NotifyIconSpec {
  if (
    eventKey === "stripe_connected" ||
    eventKey === "stripe_failed" ||
    eventKey === "subscription_purchased"
  ) {
    return {
      kind: "brand",
      brand: <StripeLogo className="size-4" />,
    };
  }
  if (eventKey === "meta_connected" || eventKey === "meta_failed") {
    return {
      kind: "brand",
      brand: <FacebookLogo className="size-4" />,
    };
  }
  if (eventKey === "google_connected" || eventKey === "google_failed") {
    return {
      kind: "brand",
      brand: <GoogleAdsLogo className="size-4" />,
    };
  }
  if (eventKey === "twilio_connected" || eventKey === "twilio_failed") {
    return { kind: "lucide", Lucide: Phone };
  }
  if (eventKey === "meeting_requested") {
    return { kind: "lucide", Lucide: CalendarDays };
  }
  if (type === "payment" || type === "subscription") {
    return { kind: "lucide", Lucide: Mail };
  }
  if (type === "user") return { kind: "lucide", Lucide: User };
  if (type === "system") return { kind: "lucide", Lucide: AlertTriangle };
  if (type === "campaign") return { kind: "lucide", Lucide: Megaphone };
  return { kind: "lucide", Lucide: Store };
}

function notificationIconClass(type: string, eventKey?: string): string {
  if (
    eventKey === "stripe_connected" ||
    eventKey === "stripe_failed" ||
    eventKey === "subscription_purchased" ||
    eventKey === "meta_connected" ||
    eventKey === "meta_failed" ||
    eventKey === "google_connected" ||
    eventKey === "google_failed"
  ) {
    return eventKey.endsWith("_failed")
      ? styles.notifyIconBrandFail
      : styles.notifyIconBrand;
  }
  if (eventKey?.endsWith("_failed")) return styles.notifyIconRose;
  if (eventKey === "twilio_connected") return styles.notifyIconOrange;
  if (eventKey === "meeting_requested") return styles.notifyIconBlue;
  if (type === "payment" || type === "subscription") return styles.notifyIconRose;
  if (type === "user") return styles.notifyIconBlue;
  if (type === "system") return styles.notifyIconOrange;
  if (type === "campaign") return styles.notifyIconTeal;
  return styles.notifyIconGreen;
}

function formatNotifyTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function notificationDayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Earlier";
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (startToday.getTime() - startThat.getTime()) / 86_400_000,
  );
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function groupNotificationsByDay(items: AdminNotificationItem[]) {
  const groups: Array<{ label: string; items: AdminNotificationItem[] }> = [];
  for (const item of items) {
    const label = notificationDayLabel(item.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}

export function SuperAdminNotifications({
  variant = "toolbar",
}: {
  variant?: "toolbar" | "navbar";
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const feed = useAdminNotificationsFeed(tab === "unread" ? "unread" : "read", {
    historyEnabled: open,
  });
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadOlderRef = useRef(feed.loadMore);
  loadOlderRef.current = feed.loadMore;
  const groups = useMemo(
    () => groupNotificationsByDay(feed.items),
    [feed.items],
  );
  const isNavbar = variant === "navbar";

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const root = listRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (!feed.hasNextPage || feed.isFetchingNextPage) return;
        loadOlderRef.current();
      },
      { root, rootMargin: "0px 0px 80px 0px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, tab, feed.hasNextPage, feed.isFetchingNextPage, feed.items.length]);

  return (
    <>
      <div className={`${styles.bellWrap}${isNavbar ? ` ${styles.bellWrapNavbar}` : ""}`}>
        <button
          type="button"
          className={isNavbar ? styles.navBellBtn : styles.iconBtn}
          aria-label="Notifications"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Bell className="size-4" />
        </button>
        {feed.unreadCount > 0 ? (
          <span className={styles.bellBadge}>
            {Math.min(feed.unreadCount, 99)}
          </span>
        ) : null}
      </div>

      <AnimatePresence>
        {open ? (
          <motion.button
            type="button"
            key="sa-notify-backdrop"
            className={styles.drawerBackdrop}
            aria-label="Close notifications"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(false)}
          />
        ) : null}
        {open ? (
          <motion.aside
            key="sa-notify-panel"
            className={styles.drawerPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.drawerHead}>
              <div className={styles.drawerBrand}>
                <span className={styles.drawerBellMark} aria-hidden>
                  <Bell className="size-4" strokeWidth={2.25} />
                </span>
                <div className={styles.drawerHeadCopy}>
                  <h2 className={styles.drawerTitle}>Notifications</h2>
                  <p className={styles.drawerSub}>
                    Stay updated with what&apos;s happening on your platform
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

            <div className={styles.drawerToolbar}>
              <div className={styles.drawerTabs} role="tablist" aria-label="Filter">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "all"}
                  className={`${styles.drawerTab} ${
                    tab === "all" ? styles.drawerTabActive : ""
                  }`}
                  onClick={() => setTab("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "unread"}
                  className={`${styles.drawerTab} ${
                    tab === "unread" ? styles.drawerTabActive : ""
                  }`}
                  onClick={() => setTab("unread")}
                >
                  Unread
                  {feed.unreadCount > 0 ? (
                    <span className={styles.drawerTabCount}>
                      {feed.unreadCount}
                    </span>
                  ) : null}
                </button>
              </div>
              <button
                type="button"
                className={styles.drawerMarkAll}
                onClick={() => void feed.markAllRead()}
                disabled={feed.markingAllRead || feed.unreadCount <= 0}
              >
                <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                {feed.markingAllRead ? "Marking…" : "Mark all as read"}
              </button>
            </div>

            <div ref={listRef} className={styles.drawerList}>
              {feed.isLoading ? (
                <p className={styles.drawerEmpty}>Loading notifications…</p>
              ) : null}
              {!feed.isLoading && feed.items.length === 0 ? (
                <p className={styles.drawerEmpty}>
                  {tab === "unread"
                    ? "No unread notifications."
                    : "No read notifications."}
                </p>
              ) : null}
              {groups.map((group) => (
                <section key={group.label} className={styles.notifyGroup}>
                  <h3 className={styles.notifyGroupLabel}>{group.label}</h3>
                  {group.items.map((item) => {
                    const icon = notificationIcon(item.type, item.eventKey);
                    const unread = !item.isRead;
                    return (
                      <article key={item.id} className={styles.notifyItem}>
                        <div
                          className={`${styles.notifyIcon} ${notificationIconClass(item.type, item.eventKey)}`}
                        >
                          {icon.kind === "brand" ? (
                            icon.brand
                          ) : icon.Lucide ? (
                            <icon.Lucide
                              className="size-4"
                              strokeWidth={2.1}
                              aria-hidden
                            />
                          ) : null}
                        </div>
                        <div className={styles.notifyCopy}>
                          <h3 className={styles.notifyTitle}>{item.title}</h3>
                          <p className={styles.notifyBody}>{item.body}</p>
                        </div>
                        <div className={styles.notifyMeta}>
                          <time className={styles.notifyTime}>
                            {formatNotifyTime(item.createdAt)}
                          </time>
                          <span
                            className={
                              unread
                                ? styles.notifyUnreadDot
                                : styles.notifyReadDot
                            }
                            aria-hidden
                          />
                        </div>
                      </article>
                    );
                  })}
                </section>
              ))}
              <div ref={sentinelRef} className={styles.drawerTopSentinel}>
                {feed.isFetchingNextPage ? (
                  <p className={styles.drawerEmpty}>Loading previous…</p>
                ) : null}
              </div>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
