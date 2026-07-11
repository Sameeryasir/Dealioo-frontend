"use client";

import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { useChatSidebarUnread } from "@/app/hooks/use-chat-sidebar-unread";
import { isScannerUser } from "@/app/lib/is-scanner-user";
import {
  businessSettingsHref,
  defaultBusinessSettingsSection,
  orgSettingsHref,
} from "@/app/lib/business-settings-routes";
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
import { useSidebarExpand } from "@/app/contexts/sidebar-expand-context";

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
  const { expanded, toggle: toggleExpanded } = useSidebarExpand();

  const businessIdParam = params?.businessId;
  const businessId =
    typeof businessIdParam === "string" && /^\d+$/.test(businessIdParam)
      ? businessIdParam
      : null;

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleLogout = useCallback(async () => {
    await logoutSession();
    clearSetupUser();
    clearPassword();
    router.push("/auth/login");
  }, [clearPassword, router]);

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

  const settingsBasePath = businessId
    ? `/business/${businessId}/dashboard/settings`
    : "/dashboard/settings";

  const settingsHref = businessId
    ? businessSettingsHref(
        businessId,
        defaultBusinessSettingsSection(businessId),
      )
    : orgSettingsHref(defaultBusinessSettingsSection(null));

  const settingsActive =
    pathname === settingsBasePath ||
    pathname.startsWith(`${settingsBasePath}/`);

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
                className="h-7 w-auto"
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

          <Link
            href={settingsHref}
            className={`rd-sidebar-item group ${
              settingsActive ? "rd-sidebar-item--active" : ""
            }`}
            aria-current={settingsActive ? "page" : undefined}
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
          </Link>

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
    </>
  );
}
