"use client";

import DealiooLogo from "@/app/components/brand/DealiooLogo";
import UserAccountAvatar from "@/app/components/UserAccountAvatar";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { logoutSession } from "@/app/services/auth/logout";
import { clearSetupUser, getSetupUser } from "@/app/lib/setup-user";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const LANDING_LOGO_SRC = "/black-logo.png";
const LANDING_LOGO_WIDTH = 562;
const LANDING_LOGO_HEIGHT = 144;

export default function Navbar() {
  const router = useRouter();
  const { clearPassword } = useCredentialContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [user, setUser] = useState<VerifyOtpUser | null>(null);
  const menuRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getSetupUser());
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = menuRootRef.current;
      if (el && !el.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
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

  return (
    <header
      className={`brand-landing-nav transition-all duration-300 ${
        navScrolled ? "landing-nav-scrolled" : ""
      } ${menuOpen ? "landing-nav-menu-open" : ""}`}
    >
      <div className="brand-landing-section brand-landing-nav-inner">
        <Link href="/dashboard" className="landing-nav-logo shrink-0 py-0.5">
          <DealiooLogo
            src={LANDING_LOGO_SRC}
            width={LANDING_LOGO_WIDTH}
            height={LANDING_LOGO_HEIGHT}
            variant="dark"
            className="h-9 w-auto sm:h-[2.625rem] md:h-11"
            priority
          />
        </Link>

        <div ref={menuRootRef} className="org-nav-account ml-auto">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="org-nav-account-trigger"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Account menu"
          >
            <span className="org-nav-account-trigger-ring">
              <span className="org-nav-account-trigger-avatar">
                <UserAccountAvatar user={user} className="size-full" />
              </span>
            </span>
          </button>

          {menuOpen ? (
            <div className="org-nav-account-menu" role="menu" aria-label="Account actions">
              <div className="org-nav-account-menu-accent" aria-hidden />

              <div className="org-nav-account-menu-body">
                <Link
                  href="/dashboard/profile"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="org-nav-account-menu-item"
                >
                  <span className="org-nav-account-menu-item-icon" aria-hidden>
                    <UserRound className="size-4" strokeWidth={2} />
                  </span>
                  Profile
                </Link>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleLogout()}
                  className="org-nav-account-menu-item org-nav-account-menu-item--logout"
                >
                  <span className="org-nav-account-menu-item-icon" aria-hidden>
                    <LogOut className="size-4" strokeWidth={2} />
                  </span>
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
