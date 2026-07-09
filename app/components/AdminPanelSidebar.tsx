"use client";

import DealiooLogo from "@/app/components/brand/DealiooLogo";
import RestaurantSettingsDialog from "@/app/components/RestaurantSettingsDialog";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { useChatSidebarUnread } from "@/app/hooks/use-chat-sidebar-unread";
import { isScannerUser } from "@/app/lib/is-scanner-user";
import { clearSetupUser } from "@/app/lib/setup-user";
import { logoutSession } from "@/app/services/auth/logout";
import {
  Activity,
  Gift,
  Home,
  LayoutTemplate,
  Library,
  LogOut,
  Megaphone,
  MessageSquare,
  ScanLine,
  Settings,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const SIDEBAR_EXPANDED_KEY = "dealioo-rd-sidebar-expanded";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  activeMatch: "exact" | "prefix";
};

export default function AdminPanelSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { clearPassword } = useCredentialContext();
  const scannerUser = isScannerUser();
  const [expanded, setExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_EXPANDED_KEY);
      if (saved === "1") setExpanded(true);
      if (saved === "0") setExpanded(false);
    } catch {
      // ignore storage errors
    }
    setHydrated(true);
  }, []);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_EXPANDED_KEY, next ? "1" : "0");
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const handleLogout = useCallback(async () => {
    await logoutSession();
    clearSetupUser();
    clearPassword();
    setSettingsOpen(false);
    router.push("/auth/login");
  }, [clearPassword, router]);

  const businessIdParam = params?.businessId;
  const businessId =
    typeof businessIdParam === "string" && /^\d+$/.test(businessIdParam)
      ? businessIdParam
      : null;

  const restaurantHomeHref = businessId
    ? `/business/${businessId}/dashboard`
    : "/dashboard";

  const chatsHref = businessId
    ? `${restaurantHomeHref}/chats`
    : "/dashboard/chats";

  const hasUnreadChats = useChatSidebarUnread(
    businessId != null ? Number(businessId) : null,
    businessId != null ? chatsHref : null,
  );

  const navItems = useMemo<NavItem[]>(
    () => [
      {
        href: restaurantHomeHref,
        label: "Home",
        icon: Home,
        activeMatch: "exact",
      },
      {
        href: businessId
          ? `${restaurantHomeHref}/orders`
          : "/dashboard/orders",
        label: "Orders",
        icon: ShoppingBag,
        activeMatch: "prefix",
      },
      {
        href: businessId
          ? `${restaurantHomeHref}/activity`
          : "/dashboard/activity",
        label: "Activity",
        icon: Activity,
        activeMatch: "prefix",
      },
      {
        href: businessId
          ? `${restaurantHomeHref}/scanning`
          : "/dashboard/scanning",
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
        href: businessId
          ? `${restaurantHomeHref}/members`
          : "/dashboard/members",
        label: "Members",
        icon: Users,
        activeMatch: "prefix",
      },
      {
        href: businessId
          ? `${restaurantHomeHref}/program`
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
      {
        href: businessId
          ? `${restaurantHomeHref}/ad-library`
          : "/dashboard/ad-library",
        label: "Ad library",
        icon: Library,
        activeMatch: "prefix",
      },
      {
        href: businessId
          ? `${restaurantHomeHref}/website-builder`
          : "/dashboard/website-builder",
        label: "Website builder",
        icon: LayoutTemplate,
        activeMatch: "prefix",
      },
    ],
    [restaurantHomeHref, businessId, chatsHref],
  );

  return (
    <>
      <aside
        className={`rd-sidebar ${expanded ? "rd-sidebar--expanded" : "rd-sidebar--collapsed"} ${
          hydrated ? "rd-sidebar--ready" : ""
        }`}
        aria-label="Admin navigation"
        data-expanded={expanded ? "true" : "false"}
      >
        <div className="rd-sidebar-glow" aria-hidden />

        <div className="rd-sidebar-brand">
          <button
            type="button"
            className="rd-sidebar-logo"
            onClick={toggleExpanded}
            aria-expanded={expanded}
            aria-controls="rd-sidebar-nav"
            aria-label={expanded ? "Collapse menu" : "Expand menu"}
          >
            {expanded ? (
              <DealiooLogo
                variant="dark"
                transparent
                className="h-8 w-auto sm:h-9"
                priority
              />
            ) : (
              <span className="rd-sidebar-logo-mark">
                <Image
                  src="/favicon.png"
                  alt=""
                  width={32}
                  height={32}
                  className="rd-sidebar-favicon"
                  priority
                />
              </span>
            )}
          </button>
        </div>

        <nav id="rd-sidebar-nav" className="rd-sidebar-nav">
          {navItems.map(({ href, label, icon: Icon, activeMatch }) => {
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
                  className="rd-sidebar-item rd-sidebar-item--disabled"
                >
                  <Icon className="rd-sidebar-item-icon" aria-hidden strokeWidth={2} />
                  {expanded ? (
                    <span className="rd-sidebar-item-label">{label}</span>
                  ) : null}
                </span>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                aria-label={
                  label === "Chats" && hasUnreadChats
                    ? `${label} (new message)`
                    : label
                }
                aria-current={active ? "page" : undefined}
                className={`rd-sidebar-item group ${
                  active ? "rd-sidebar-item--active" : ""
                }`}
              >
                <Icon className="rd-sidebar-item-icon" aria-hidden strokeWidth={2} />
                {expanded ? (
                  <span className="rd-sidebar-item-label">{label}</span>
                ) : null}
                {label === "Chats" && hasUnreadChats ? (
                  <span className="rd-sidebar-unread" aria-hidden />
                ) : null}
                {!expanded ? (
                  <span role="tooltip" className="rd-sidebar-tooltip">
                    {label}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Settings + Logout stay at the bottom of the rail. */}
        <div className="relative z-[2] mt-auto flex shrink-0 flex-col gap-0.5 border-t border-white/10 px-[0.7rem] pb-4 pt-3">
          {expanded ? (
            <p className="mb-1 px-2.5 text-[0.625rem] font-bold uppercase tracking-[0.14em] text-white/40">
              Account
            </p>
          ) : null}

          <button
            type="button"
            className="rd-sidebar-item w-full border-0 bg-transparent font-inherit"
            onClick={() => setSettingsOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
            aria-label="Settings"
            title="Settings"
          >
            <Settings className="rd-sidebar-item-icon" aria-hidden strokeWidth={2} />
            {expanded ? (
              <span className="rd-sidebar-item-label">Settings</span>
            ) : null}
            {!expanded ? (
              <span role="tooltip" className="rd-sidebar-tooltip">
                Settings
              </span>
            ) : null}
          </button>

          <button
            type="button"
            className="rd-sidebar-item w-full border-0 bg-transparent font-inherit text-red-300 hover:bg-red-400/15 hover:text-red-200"
            onClick={() => void handleLogout()}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="rd-sidebar-item-icon" aria-hidden strokeWidth={2} />
            {expanded ? (
              <span className="rd-sidebar-item-label">Logout</span>
            ) : null}
            {!expanded ? (
              <span role="tooltip" className="rd-sidebar-tooltip">
                Logout
              </span>
            ) : null}
          </button>
        </div>
      </aside>

      <RestaurantSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSignOut={handleLogout}
      />
    </>
  );
}
