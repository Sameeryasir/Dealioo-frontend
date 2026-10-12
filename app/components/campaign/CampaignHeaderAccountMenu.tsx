"use client";

import UserAccountAvatar from "@/app/components/UserAccountAvatar";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { useAnchoredMenu } from "@/app/hooks/use-anchored-menu";
import { clearSetupUser, getSetupUser } from "@/app/lib/setup-user";
import { logoutSession } from "@/app/services/auth/logout";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const PROFILE_HREF = "/dashboard/profile";

export function CampaignHeaderAccountMenu() {
  const router = useRouter();
  const { clearPassword } = useCredentialContext();
  const [user, setUser] = useState<VerifyOtpUser | null>(null);
  const {
    open,
    setOpen,
    toggle,
    mounted,
    anchorRef,
    menuRef,
    menuPosition,
    menuStyle,
  } = useAnchoredMenu({
    placement: "below",
    align: "right",
    width: 180,
    estimatedHeight: 112,
  });

  useEffect(() => {
    setUser(getSetupUser());
  }, []);

  const displayName = user?.name?.trim() || "Account";

  const handleLogout = useCallback(async () => {
    await logoutSession();
    clearSetupUser();
    clearPassword();
    setOpen(false);
    router.push("/auth/login");
  }, [clearPassword, router, setOpen]);

  return (
    <div ref={anchorRef} className="rd-topbar-account-menu">
      <button
        type="button"
        onClick={toggle}
        className="rd-topbar-account-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${displayName}`}
      >
        <span className="rd-topbar-account-trigger-ring">
          <span className="rd-topbar-account-trigger-avatar">
            <UserAccountAvatar user={user} className="size-full" />
          </span>
        </span>
      </button>

      {mounted && open && menuPosition
        ? createPortal(
            <div
              ref={menuRef}
              className="rd-topbar-account-dropdown"
              role="menu"
              aria-label="Account actions"
              style={menuStyle ? { ...menuStyle, zIndex: 120 } : undefined}
            >
              <div className="rd-topbar-account-dropdown-accent" aria-hidden />
              <div className="rd-topbar-account-dropdown-body">
                <Link
                  href={PROFILE_HREF}
                  role="menuitem"
                  onClick={() => setOpen(false)}
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
}
