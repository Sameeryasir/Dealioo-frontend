"use client";

/**
 * What changed: show the user profile avatar (account menu) on the campaign
 * immersive header, matching the business dashboard top bar.
 * Why: campaign immersive mode replaces BusinessNavbar, so the profile control
 * was missing until now.
 * Related: BusinessNavbar.tsx account menu; UserAccountAvatar.tsx
 * MCP Context 7: reuse the same account menu pattern as the business top bar.
 */

import { ArrowLeft, LogOut, PanelLeft, UserRound } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import UserAccountAvatar from "@/app/components/UserAccountAvatar";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { useSidebarExpand } from "@/app/contexts/sidebar-expand-context";
import type { Funnel } from "@/app/services/funnel/get-campaigns-by-business";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import {
  CAMPAIGN_DASHBOARD_TABS,
  campaignDashboardHref,
  campaignDashboardTabFromPathname,
  type CampaignDashboardTabId,
} from "@/app/lib/campaign-dashboard-tab";
import { hasAnyAutomationPermission } from "@/app/lib/member-permissions";
import { clearSetupUser, getSetupUser } from "@/app/lib/setup-user";
import { logoutSession } from "@/app/services/auth/logout";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";

const BusinessNotifications = dynamic(
  () => import("@/app/components/BusinessNotifications"),
  { ssr: false },
);

const PROFILE_HREF = "/dashboard/profile";

function parsePrice(raw: number | string | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const n = Number.parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function formatPrice(amount: number): string {
  if (Number.isInteger(amount)) return `$${amount}`;
  return `$${amount.toFixed(2)}`;
}

export type CampaignHeaderProps = {
  businessId: number;
  campaignId?: number;
  offer?: string;
  price?: number | string;
  campaign?: Funnel | null;
  embedded?: boolean;
};

export default function CampaignHeader({
  businessId,
  campaignId,
  offer,
  price,
  campaign,
  embedded = false,
}: CampaignHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { clearPassword } = useCredentialContext();
  const { can, permissionList, isOwnerLike } =
    useBusinessMembershipPermissions(businessId);
  const campaignsHref = `/business/${businessId}/dashboard/campaigns`;
  const offerLine = offer?.trim() ?? "";
  const priceText = useMemo(() => {
    const n = parsePrice(price);
    return n != null ? formatPrice(n) : null;
  }, [price]);

  const offerPriceLine = useMemo(() => {
    const parts = [offerLine, priceText].filter(Boolean);
    if (parts.length === 0) return null;
    return parts.join(".");
  }, [offerLine, priceText]);

  const campaignTitle =
    campaign?.campaignName?.trim() || offerPriceLine || "Campaign";

  const activeTabId =
    campaignId != null
      ? campaignDashboardTabFromPathname(pathname, businessId, campaignId)
      : "overview";

  const navRef = useRef<HTMLElement>(null);
  const tabButtonRefs = useRef<Partial<Record<string, HTMLAnchorElement>>>({});
  const menuRootRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const { expanded: sidebarExpanded, toggle: toggleSidebar } =
    useSidebarExpand();
  // --- User profile avatar (same as business top bar) ---
  const [user, setUser] = useState<VerifyOtpUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | undefined>();

  useEffect(() => {
    setUser(getSetupUser());
    setMenuMounted(true);
  }, []);

  const updateMenuPosition = useCallback(() => {
    const trigger = menuTriggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
      zIndex: 120,
    });
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    updateMenuPosition();

    const onPointerDown = (event: PointerEvent) => {
      const root = menuRootRef.current;
      const trigger = menuTriggerRef.current;
      const target = event.target as Node;
      if (root?.contains(target) || trigger?.contains(target)) return;
      setMenuOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    const onReposition = () => updateMenuPosition();

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [menuOpen, updateMenuPosition]);

  const handleLogout = useCallback(async () => {
    await logoutSession();
    clearSetupUser();
    clearPassword();
    setMenuOpen(false);
    router.push("/auth/login");
  }, [clearPassword, router]);

  const displayName = user?.name?.trim() || "Account";

  useEffect(() => {
    const activeButton = tabButtonRefs.current[activeTabId];
    if (!activeButton || !navRef.current) return;
    activeButton.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  }, [activeTabId]);

  const immersiveChrome = embedded;

  const visibleTabs = CAMPAIGN_DASHBOARD_TABS.filter(({ id }) => {
    if (isOwnerLike || id === "overview") return true;
    const tabAccess: Record<CampaignDashboardTabId, boolean> = {
      overview: true,
      guests: can("campaigns_guests"),
      orders: can("campaigns_orders"),
      funnel: can("funnels_edit"),
      automations: hasAnyAutomationPermission(permissionList),
    };
    return tabAccess[id];
  });

  const tabButtons = visibleTabs.map(({ id, label }) => {
    const active = id === activeTabId;
    const immersiveTabActive =
      "border-b-2 border-[#1877f2] text-slate-900";
    const immersiveTabIdle =
      "border-b-2 border-transparent text-slate-500 hover:text-slate-800";
    const lightTabActive = "bg-[#1877f2] text-white shadow-sm";
    const lightTabIdle =
      "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800";
    const href =
      campaignId != null
        ? campaignDashboardHref(businessId, campaignId, id)
        : campaignsHref;

    return (
      <Link
        key={id}
        href={href}
        ref={(node) => {
          if (node) tabButtonRefs.current[id] = node;
          else delete tabButtonRefs.current[id];
        }}
        role="tab"
        aria-selected={active}
        className={`relative z-[1] flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap font-semibold no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/40 ${
          immersiveChrome
            ? `rounded-none px-2 py-1.5 text-[0.7rem] sm:px-2.5 sm:py-2 sm:text-[0.75rem] md:px-3 md:text-[0.78rem] ${
                active ? immersiveTabActive : immersiveTabIdle
              }`
            : `gap-1.5 rounded-md px-2.5 py-1 text-[0.72rem] sm:px-3 sm:py-1.5 sm:text-[0.75rem] ${
                active ? lightTabActive : `ring-1 ring-slate-200 ${lightTabIdle}`
              }`
        }`}
      >
        {label}
      </Link>
    );
  });

  // Same user profile avatar menu as BusinessNavbar (campaign immersive hides that top bar)
  const accountMenu = (
    <div className="rd-topbar-account-menu">
      <button
        ref={menuTriggerRef}
        type="button"
        onClick={() => {
          setMenuOpen((open) => {
            const next = !open;
            if (next) {
              // Position before paint so the portal opens under the avatar
              requestAnimationFrame(updateMenuPosition);
            }
            return next;
          });
        }}
        className="rd-topbar-account-trigger"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={`Account menu for ${displayName}`}
      >
        <span className="rd-topbar-account-trigger-ring">
          <span className="rd-topbar-account-trigger-avatar">
            <UserAccountAvatar user={user} className="size-full" />
          </span>
        </span>
      </button>

      {menuMounted && menuOpen
        ? createPortal(
            <div
              ref={menuRootRef}
              className="rd-topbar-account-dropdown"
              role="menu"
              aria-label="Account actions"
              style={menuStyle}
            >
              <div className="rd-topbar-account-dropdown-accent" aria-hidden />

              <div className="rd-topbar-account-dropdown-body">
                <Link
                  href={PROFILE_HREF}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="rd-topbar-account-dropdown-item"
                >
                  <span
                    className="rd-topbar-account-dropdown-item-icon"
                    aria-hidden
                  >
                    <UserRound className="size-4" strokeWidth={2} />
                  </span>
                  Profile
                </Link>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleLogout()}
                  className="rd-topbar-account-dropdown-item rd-topbar-account-dropdown-item--logout"
                >
                  <span
                    className="rd-topbar-account-dropdown-item-icon"
                    aria-hidden
                  >
                    <LogOut className="size-4" strokeWidth={2} />
                  </span>
                  Logout
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );

  return (
    <header
      className={
        embedded
          ? "campaign-immersive-patti__header shrink-0"
          : "shrink-0 border-b border-zinc-200 bg-white"
      }
    >
      {immersiveChrome ? (
        <div className="campaign-immersive-patti__inner">
          <div className="campaign-immersive-patti__side campaign-immersive-patti__side--start gap-2">
            {activeTabId === "automations" ? null : (
              <button
                type="button"
                onClick={toggleSidebar}
                className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1877f2]/30"
                aria-expanded={sidebarExpanded}
                aria-controls="rd-sidebar-nav"
                aria-label={sidebarExpanded ? "Close menu" : "Open menu"}
              >
                <PanelLeft className="size-3.5" aria-hidden strokeWidth={2.25} />
              </button>
            )}
            <Link
              href={campaignsHref}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1877f2]/30"
              aria-label="Back to campaigns"
            >
              <ArrowLeft className="size-3.5" aria-hidden strokeWidth={2.25} />
            </Link>
            <div className="campaign-immersive-patti__side-title min-w-0 flex-1 md:max-w-[14rem] md:flex-none">
              <p
                className="m-0 truncate text-[0.78rem] font-extrabold tracking-tight text-[#07111f] md:text-[0.8rem] xl:text-[0.88rem]"
                title={campaignTitle}
              >
                {campaignTitle}
              </p>
              {offerPriceLine ? (
                <p className="m-0 truncate text-[0.62rem] font-medium text-slate-500 md:text-[0.65rem]">
                  {offerPriceLine}
                </p>
              ) : null}
            </div>
          </div>

          <div className="campaign-immersive-patti__nav-wrap">
            <nav
              ref={navRef}
              className="campaign-immersive-patti__nav"
              aria-label="Campaign sections"
            >
              <div className="campaign-immersive-patti__nav-track">
                {tabButtons}
              </div>
            </nav>
            <p className="campaign-immersive-patti__nav-hint">
              Swipe sideways for all sections
            </p>
          </div>

          <div className="campaign-immersive-patti__side campaign-immersive-patti__side--end shrink-0 gap-1.5">
            <BusinessNotifications />
            {accountMenu}
          </div>
        </div>
      ) : (
        <>
          <div
            className={`flex w-full flex-nowrap items-center justify-between gap-2 sm:gap-3 ${
              embedded ? "px-2.5 py-2 sm:px-3" : "px-4 py-3 sm:px-5 sm:py-4"
            }`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
              <Link
                href={campaignsHref}
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#e8edf5] bg-[#f8fafc] text-[#07111f] outline-none transition hover:border-[#1877f2]/35 hover:bg-[#e8f2ff] hover:text-[#1877f2] focus-visible:ring-2 focus-visible:ring-[#1877f2]/30"
                aria-label="Back to campaigns"
              >
                <ArrowLeft className="size-4" aria-hidden strokeWidth={2.25} />
              </Link>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-left text-[0.95rem] font-extrabold tracking-tight text-[#07111f] sm:text-[1.05rem]">
                  {campaignTitle}
                </p>
                {offerPriceLine && campaign?.campaignName?.trim() ? (
                  <p className="truncate text-left text-[0.72rem] font-medium text-slate-500 sm:text-[0.78rem]">
                    {offerPriceLine}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <BusinessNotifications />
              {accountMenu}
            </div>
          </div>

          <nav
            className={
              embedded
                ? "border-b border-[#e8edf5] bg-[#f8fafc]/50"
                : "border-t border-zinc-100"
            }
            aria-label="Campaign sections"
          >
            <div
              className={`flex w-full gap-1 overflow-x-auto py-1.5 [scrollbar-width:none] sm:gap-1.5 [&::-webkit-scrollbar]:hidden ${
                embedded ? "px-2.5 sm:px-3" : "px-4 sm:px-5"
              }`}
            >
              {tabButtons}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
