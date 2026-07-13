"use client";

import UserAccountAvatar from "@/app/components/UserAccountAvatar";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { logoutSession } from "@/app/services/auth/logout";
import { clearSetupUser, getSetupUser } from "@/app/lib/setup-user";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import { ArrowLeft, LogOut, PanelLeft, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSidebarExpand } from "@/app/contexts/sidebar-expand-context";

const ORG_DASHBOARD_HREF = "/dashboard";
const PROFILE_HREF = "/dashboard/profile";

export default function BusinessNavbar() {
  const router = useRouter();
  const { clearPassword } = useCredentialContext();
  const { expanded: sidebarExpanded, toggle: toggleSidebar } = useSidebarExpand();
  const [user, setUser] = useState<VerifyOtpUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getSetupUser());
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const root = menuRootRef.current;
      if (root && !root.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = useCallback(async () => {
    await logoutSession();
    clearSetupUser();
    clearPassword();
    setMenuOpen(false);
    router.push("/auth/login");
  }, [clearPassword, router]);

  const displayName = user?.name?.trim() || "Account";

  return (
    <header className="rd-topbar" aria-label="Dashboard tools">
      <div className="rd-topbar-inner relative flex h-[var(--rd-header-h)] items-center justify-between gap-2.5 sm:gap-3">
        <div className="rd-topbar-leading relative z-[2] flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={toggleSidebar}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[#e8edf5] bg-white text-[#07111f] shadow-[0_4px_12px_rgba(15,23,42,0.04)] outline-none transition hover:border-[#1877f2]/30 hover:bg-[#e8f2ff] hover:text-[#1877f2] focus-visible:ring-2 focus-visible:ring-[#1877f2]/25"
            aria-expanded={sidebarExpanded}
            aria-controls="rd-sidebar-nav"
            aria-label={sidebarExpanded ? "Close menu" : "Open menu"}
          >
            <PanelLeft className="size-4" strokeWidth={2.25} aria-hidden />
          </button>

          <Link
            href={ORG_DASHBOARD_HREF}
            className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-[#e8edf5] bg-white px-2.5 py-1.5 text-[0.78rem] font-semibold text-[#07111f] shadow-[0_4px_12px_rgba(15,23,42,0.04)] outline-none transition hover:border-[#1877f2]/30 hover:bg-[#e8f2ff] hover:text-[#1877f2] focus-visible:ring-2 focus-visible:ring-[#1877f2]/25 sm:px-3 sm:text-[0.8125rem]"
            aria-label="Switch business — back to all businesses"
          >
            <ArrowLeft className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
            <span className="truncate">Switch business</span>
          </Link>
        </div>

        <div
          id="automation-builder-topbar-center-host"
          className="automation-builder-topbar-center-host"
        />

        <div className="rd-topbar-trailing relative z-[2] flex shrink-0 items-center gap-2 sm:gap-2.5">
          <div
            id="automation-builder-topbar-actions-host"
            className="automation-builder-topbar-actions-host flex items-center"
          />

          <div ref={menuRootRef} className="rd-topbar-account-menu">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
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

            {menuOpen ? (
              <div
                className="rd-topbar-account-dropdown"
                role="menu"
                aria-label="Account actions"
              >
                <div className="rd-topbar-account-dropdown-accent" aria-hidden />

                <div className="rd-topbar-account-dropdown-body">
                  <Link
                    href={PROFILE_HREF}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="rd-topbar-account-dropdown-item"
                  >
                    <span className="rd-topbar-account-dropdown-item-icon" aria-hidden>
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
                    <span className="rd-topbar-account-dropdown-item-icon" aria-hidden>
                      <LogOut className="size-4" strokeWidth={2} />
                    </span>
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
