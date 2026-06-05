"use client";

import {
  Activity,
  ChevronsLeft,
  ChevronsRight,
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
import { isRestaurantSidebarChromeMinimal } from "@/app/lib/restaurant-dashboard-pathname";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useLayoutEffect, useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  activeMatch: "exact" | "prefix";
};

export default function AdminPanelSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarChromeMinimal = isRestaurantSidebarChromeMinimal(pathname);

  useLayoutEffect(() => {
    if (sidebarChromeMinimal) setCollapsed(true);
  }, [sidebarChromeMinimal]);

  const restaurantIdParam = params?.restaurantId;
  const restaurantId =
    typeof restaurantIdParam === "string" && /^\d+$/.test(restaurantIdParam)
      ? restaurantIdParam
      : null;

  const restaurantHomeHref = restaurantId
    ? `/restaurant/${restaurantId}/dashboard`
    : "/dashboard";

  const nav = useMemo<NavItem[]>(
    () => [
      {
        href: restaurantHomeHref,
        label: "Home",
        icon: Home,
        activeMatch: "exact",
      },
      {
        href: restaurantId
          ? `${restaurantHomeHref}/orders`
          : "/dashboard/orders",
        label: "Orders",
        icon: ShoppingBag,
        activeMatch: "prefix",
      },
      {
        href: "/dashboard/activity",
        label: "Activity",
        icon: Activity,
        activeMatch: "prefix",
      },
      {
        href: "/dashboard/website-builder",
        label: "Website builder",
        icon: LayoutTemplate,
        activeMatch: "prefix",
      },
      {
        href: "/dashboard/scanning",
        label: "Scanning",
        icon: ScanLine,
        activeMatch: "prefix",
      },
      {
        href: `${restaurantHomeHref}/campaigns`,
        label: "Campaigns",
        icon: Megaphone,
        activeMatch: "prefix",
      },
      {
        href: "/dashboard/ad-library",
        label: "Ad library",
        icon: Library,
        activeMatch: "prefix",
      },
      {
        href: "/dashboard/members",
        label: "Members",
        icon: Users,
        activeMatch: "prefix",
      },
      {
        href: "/dashboard/program",
        label: "Program",
        icon: Gift,
        activeMatch: "prefix",
      },
      {
        href: "/dashboard/chats",
        label: "Chats",
        icon: MessageSquare,
        activeMatch: "prefix",
      },
    ],
    [restaurantHomeHref, restaurantId],
  );

  return (
    <aside
      className={`relative flex min-h-0 shrink-0 flex-col border-r border-zinc-200 bg-gradient-to-b from-white via-zinc-50/40 to-white shadow-[6px_0_32px_-8px_rgba(0,0,0,0.06)] transition-[width] duration-300 ease-out ${
        collapsed ? "w-12 overflow-visible" : "w-50"
      }`}
      aria-label="Admin navigation"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent"
        aria-hidden
      />

      {!sidebarChromeMinimal ? (
        <div
          className={`flex shrink-0 border-b border-zinc-100/80 py-2.5 ${
            collapsed ? "justify-center px-0" : "justify-end px-2"
          }`}
        >
          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight
                className="h-[18px] w-[18px]"
                aria-hidden
                strokeWidth={2.25}
              />
            ) : (
              <ChevronsLeft
                className="h-[18px] w-[18px]"
                aria-hidden
                strokeWidth={2.25}
              />
            )}
          </button>
        </div>
      ) : null}

      <nav
        className={`flex min-h-0 flex-1 flex-col gap-0.5 pb-4 ${
          collapsed
            ? sidebarChromeMinimal
              ? "items-center overflow-visible px-1 pt-3"
              : "items-center overflow-visible px-1 pt-2"
            : "overflow-y-auto px-3 pt-3"
        }`}
      >
        {nav.map(({ href, label, icon: Icon, activeMatch }) => {
          const active =
            activeMatch === "exact"
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);

          if (collapsed) {
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-black/20 ${
                  active
                    ? "bg-black text-white shadow-sm shadow-black/25 ring-1 ring-white/15"
                    : "text-zinc-600 hover:bg-black hover:text-white hover:shadow-sm hover:shadow-black/20 active:bg-black active:text-white"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden strokeWidth={2} />
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-[calc(100%+0.5rem)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 rounded-xl py-2.5 pl-3 pr-3 text-sm font-medium transition-all duration-200 outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-black/20 ${
                active
                  ? "bg-black text-white shadow-sm shadow-black/25 ring-1 ring-white/15"
                  : "text-zinc-600 hover:bg-black hover:text-white hover:shadow-sm hover:shadow-black/20 active:bg-black active:text-white"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-white/15 text-white ring-1 ring-white/20"
                    : "bg-transparent text-zinc-500 group-hover:bg-white/15 group-hover:text-white group-active:text-white"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden strokeWidth={2} />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
