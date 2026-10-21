"use client";

import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { useSidebarExpand } from "@/app/contexts/sidebar-expand-context";
import { clearSetupUser } from "@/app/lib/setup-user";
import { logoutSession } from "@/app/services/auth/logout";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Phone,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  activeMatch: "exact" | "prefix";
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
    activeMatch: "exact",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    activeMatch: "prefix",
  },
  {
    href: "/admin/businesses",
    label: "Businesses",
    icon: Building2,
    activeMatch: "prefix",
  },
  {
    href: "/admin/plans",
    label: "Plans",
    icon: CreditCard,
    activeMatch: "prefix",
  },
  {
    href: "/admin/subscriptions",
    label: "Subscriptions",
    icon: Wallet,
    activeMatch: "prefix",
  },
  {
    href: "/admin/twilio",
    label: "Twilio",
    icon: Phone,
    activeMatch: "prefix",
  },
  {
    href: "/admin/meeting-requests",
    label: "Meeting requests",
    icon: CalendarDays,
    activeMatch: "prefix",
  },
  {
    href: "/admin/customer-onboarding",
    label: "Customer Onboarding",
    icon: ClipboardList,
    activeMatch: "prefix",
  },
];

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { clearPassword } = useCredentialContext();
  const { expanded, toggle: toggleExpanded, closeMobile, setExpanded } =
    useSidebarExpand();
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const handleLogout = useCallback(async () => {
    await logoutSession();
    clearSetupUser();
    clearPassword();
    router.push("/auth/login");
  }, [clearPassword, router]);

  return (
    <>
      <button
        type="button"
        className={`rd-sidebar-backdrop ${expanded ? "rd-sidebar-backdrop--visible" : ""}`}
        aria-label="Close menu"
        tabIndex={expanded ? 0 : -1}
        onClick={() => setExpanded(false)}
      />
      <aside
        className={`rd-sidebar ${expanded ? "rd-sidebar--expanded" : "rd-sidebar--collapsed"} ${
          hydrated ? "rd-sidebar--ready" : ""
        }`}
        aria-label="Super Admin navigation"
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
          {NAV_ITEMS.map(({ href, label, icon: Icon, activeMatch }) => {
            const active =
              activeMatch === "exact"
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                onClick={closeMobile}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`rd-sidebar-item group ${
                  active ? "rd-sidebar-item--active" : ""
                }`}
              >
                <Icon
                  className="rd-sidebar-item-icon"
                  aria-hidden
                  strokeWidth={2}
                />
                {expanded ? (
                  <span className="rd-sidebar-item-label">{label}</span>
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

        <div className="relative z-[2] mt-auto flex shrink-0 flex-col gap-0.5 border-t border-white/10 px-[0.7rem] pb-4 pt-3">
          {expanded ? (
            <p className="mb-1 px-2.5 text-[0.625rem] font-bold uppercase tracking-[0.14em] text-white/40">
              Account
            </p>
          ) : null}

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
