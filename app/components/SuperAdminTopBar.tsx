"use client";

import dynamic from "next/dynamic";
import UserAccountAvatar from "@/app/components/UserAccountAvatar";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { useSidebarExpand } from "@/app/contexts/sidebar-expand-context";
import { clearSetupUser, getSetupUser } from "@/app/lib/setup-user";
import { logoutSession } from "@/app/services/auth/logout";
import { LogOut, PanelLeft, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const SuperAdminNotifications = dynamic(
  () =>
    import("@/app/components/SuperAdminNotifications").then(
      (mod) => mod.SuperAdminNotifications,
    ),
  { ssr: false },
);

const PROFILE_HREF = "/dashboard/profile";

export default function SuperAdminTopBar() {
  const router = useRouter();
  const { clearPassword } = useCredentialContext();
  const { expanded: sidebarExpanded, toggle: toggleSidebar } =
    useSidebarExpand();
  const user = getSetupUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRootRef = useRef<HTMLDivElement>(null);

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
  }, [clearPassword, router, setMenuOpen]);

  const displayName = user?.name?.trim() || "Super Admin";

  return (
    <header className="rd-topbar" aria-label="Super Admin tools">
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
        </div>

        <div className="rd-topbar-trailing relative z-[2] flex shrink-0 items-center gap-2 sm:gap-2.5">
          <SuperAdminNotifications />

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
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
