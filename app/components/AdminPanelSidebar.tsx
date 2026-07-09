"use client";

import {
  Activity,
  Gift,
  Home,
  LayoutTemplate,
  Library,
  Megaphone,
  MessageSquare,
  ScanLine,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { isScannerUser } from "@/app/lib/is-scanner-user";
import { useChatSidebarUnread } from "@/app/hooks/use-chat-sidebar-unread";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useMemo } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  activeMatch: "exact" | "prefix";
};

export default function AdminPanelSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const scannerUser = isScannerUser();

  const businessIdParam = params?.businessId;
  const businessId =
    typeof businessIdParam === "string" && /^\d+$/.test(businessIdParam)
      ? businessIdParam
      : null;

  const businessHomeHref = businessId
    ? `/business/${businessId}/dashboard`
    : "/dashboard";

  const chatsHref = businessId
    ? `${businessHomeHref}/chats`
    : "/dashboard/chats";

  const hasUnreadChats = useChatSidebarUnread(
    businessId != null ? Number(businessId) : null,
    businessId != null ? chatsHref : null,
  );

  const nav = useMemo<NavItem[]>(
    () => [
      {
        href: businessHomeHref,
        label: "Home",
        icon: Home,
        activeMatch: "exact",
      },
      {
        href: businessId
          ? `${businessHomeHref}/orders`
          : "/dashboard/orders",
        label: "Orders",
        icon: ShoppingBag,
        activeMatch: "prefix",
      },
      {
        href: businessId
          ? `${businessHomeHref}/activity`
          : "/dashboard/activity",
        label: "Activity",
        icon: Activity,
        activeMatch: "prefix",
      },
      {
        href: businessId
          ? `${businessHomeHref}/website-builder`
          : "/dashboard/website-builder",
        label: "Website builder",
        icon: LayoutTemplate,
        activeMatch: "prefix",
      },
      {
        href: businessId
          ? `${businessHomeHref}/scanning`
          : "/dashboard/scanning",
        label: "Scanning",
        icon: ScanLine,
        activeMatch: "prefix",
      },
      {
        href: `${businessHomeHref}/campaigns`,
        label: "Campaigns",
        icon: Megaphone,
        activeMatch: "prefix",
      },
      {
        href: businessId
          ? `${businessHomeHref}/ad-library`
          : "/dashboard/ad-library",
        label: "Ad library",
        icon: Library,
        activeMatch: "prefix",
      },
      {
        href: businessId
          ? `${businessHomeHref}/members`
          : "/dashboard/members",
        label: "Members",
        icon: Users,
        activeMatch: "prefix",
      },
      {
        href: businessId
          ? `${businessHomeHref}/program`
          : "/dashboard/program",
        label: "Program",
        icon: Gift,
        activeMatch: "prefix",
      },
      {
        href: chatsHref,
        label: "Chats",
        icon: MessageSquare,
        activeMatch: "prefix",
      },
    ],
    [businessHomeHref, businessId, chatsHref],
  );

  return (
    <aside
      className="relative flex min-h-0 w-12 shrink-0 flex-col overflow-visible border-r border-brand-border bg-gradient-to-b from-white via-brand-soft/40 to-white shadow-[6px_0_32px_-8px_rgba(0,0,0,0.06)]"
      aria-label="Admin navigation"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent"
        aria-hidden
      />

      <nav className="flex min-h-0 flex-1 flex-col items-center gap-0.5 overflow-visible px-1 pb-4 pt-3">
        {nav.map(({ href, label, icon: Icon, activeMatch }) => {
          const active =
            activeMatch === "exact"
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
          const disabled = scannerUser && label !== "Scanning";

          if (disabled) {
            return (
              <span
                key={href}
                aria-disabled="true"
                aria-label={`${label} (disabled)`}
                className="flex h-10 w-10 shrink-0 cursor-not-allowed items-center justify-center rounded-xl text-zinc-300"
              >
                <Icon className="h-4 w-4" aria-hidden strokeWidth={2} />
              </span>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              aria-label={label === "Chats" && hasUnreadChats ? `${label} (new message)` : label}
              aria-current={active ? "page" : undefined}
              className={`group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-black/20 ${
                active
                  ? "bg-black text-white shadow-sm shadow-black/25 ring-1 ring-white/15"
                  : "text-zinc-600 hover:bg-black hover:text-white hover:shadow-sm hover:shadow-black/20 active:bg-black active:text-white"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden strokeWidth={2} />
              {label === "Chats" && hasUnreadChats ? (
                <span
                  className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white"
                  aria-hidden
                />
              ) : null}
              <span
                role="tooltip"
                className="pointer-events-none absolute left-[calc(100%+0.5rem)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
