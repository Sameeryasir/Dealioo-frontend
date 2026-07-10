"use client";

import DealiooLogo from "@/app/components/brand/DealiooLogo";
import UserAccountAvatar from "@/app/components/UserAccountAvatar";
import { useCredentialContext } from "@/app/contexts/credential-context";
import { logoutSession } from "@/app/services/auth/logout";
import { clearSetupUser, getSetupUser } from "@/app/lib/setup-user";
import { getUserRoleLabel } from "@/app/lib/user-role-label";
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

  const roleLabel = user?.role?.name?.trim() || getUserRoleLabel();

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

        <div ref={menuRootRef} className="relative ml-auto">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={`flex size-10 shrink-0 items-center justify-center rounded-full border border-[#b4c5dc] bg-white text-xs font-semibold uppercase tracking-tight text-brand-navy outline-none transition-all hover:border-brand-primary/35 hover:bg-brand-soft focus-visible:ring-2 focus-visible:ring-brand-primary/25 active:scale-[0.98] ${
              menuOpen ? "ring-2 ring-brand-primary/30" : ""
            }`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Account menu"
          >
            <UserAccountAvatar user={user} />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              aria-label="Account actions"
              className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-[#e8edf5] bg-white py-1 shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
            >
              {user?.name || roleLabel ? (
                <div className="border-b border-[#e8edf5] px-3 py-2.5">
                  {user?.name ? (
                    <p className="truncate text-sm font-semibold text-brand-navy">
                      {user.name}
                    </p>
                  ) : null}
                  {roleLabel ? (
                    <p className="mt-0.5 truncate text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-brand-muted">
                      {roleLabel}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <Link
                href="/dashboard/profile"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-brand-body transition-colors hover:bg-brand-soft hover:text-brand-navy"
              >
                <UserRound className="size-4 shrink-0 text-brand-muted" aria-hidden strokeWidth={2} />
                Profile
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-brand-body transition-colors hover:bg-brand-soft hover:text-brand-navy"
              >
                <LogOut className="size-4 shrink-0 text-brand-muted" aria-hidden strokeWidth={2} />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
