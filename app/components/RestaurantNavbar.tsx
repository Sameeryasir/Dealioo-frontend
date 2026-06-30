"use client";

import { useCredentialContext } from "@/app/contexts/credential-context";
import { logoutSession } from "@/app/services/auth/logout";
import { clearSetupUser, getSetupUser } from "@/app/lib/setup-user";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import RestaurantSettingsDialog from "@/app/components/RestaurantSettingsDialog";
import { ArrowBigLeft, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function initialsFromUser(user: VerifyOtpUser | null): string {
  if (!user?.name?.trim()) return "?";
  const parts = user.name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const a = parts[0][0];
  const b = parts[parts.length - 1][0];
  return `${a}${b}`.toUpperCase();
}

export default function RestaurantNavbar() {
  const router = useRouter();
  const { clearPassword } = useCredentialContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [user, setUser] = useState<VerifyOtpUser | null>(null);
  const menuRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getSetupUser());
    });
  }, []);

  const initials = useMemo(() => initialsFromUser(user), [user]);

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
    setSettingsOpen(false);
    router.push("/auth/login");
  }, [clearPassword, router]);

  const openSettingsDialog = useCallback(() => {
    setMenuOpen(false);
    setSettingsOpen(true);
  }, []);

  return (
    <>
    <nav
      className="sticky top-0 z-40 w-full shrink-0 border-b border-white/10 brand-nav px-4 py-3 sm:px-6"
      aria-label="Restaurant dashboard"
    >
      <div className="flex w-full items-center justify-between gap-3 brand-nav sm:gap-4">
        <Link
          href="/dashboard"
          aria-label="Back to dashboard"
          className="-ml-4 inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-white outline-none ring-offset-2 ring-offset-brand-navy transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-brand-navy sm:-ml-6"
        >
          <ArrowBigLeft className="size-5 shrink-0 text-white" aria-hidden strokeWidth={2} />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={openSettingsDialog}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 brand-nav text-white outline-none ring-offset-2 ring-offset-brand-navy transition-all hover:border-white/35 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-brand-navy active:scale-[0.98]"
            aria-label="Settings"
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
          >
            <Settings
              className="size-[1.125rem] text-white"
              aria-hidden
              strokeWidth={2}
            />
          </button>

          <div ref={menuRootRef} className="relative brand-nav">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={`flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 brand-nav text-xs font-semibold uppercase tracking-tight text-white outline-none ring-offset-2 ring-offset-brand-navy transition-all hover:border-white/35 focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-brand-navy active:scale-[0.98] ${
                menuOpen ? "ring-2 ring-white/50 ring-offset-2 ring-offset-brand-navy" : ""
              }`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
            >
              {initials}
            </button>

            {menuOpen ? (
              <div
                role="menu"
                aria-label="Account actions"
                className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-brand-border bg-white py-1 shadow-xl shadow-black/10"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-brand-body transition-colors hover:bg-brand-soft hover:text-brand-navy"
                >
                  <LogOut
                    className="size-4 shrink-0 text-zinc-500"
                    aria-hidden
                    strokeWidth={2}
                  />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>

    <RestaurantSettingsDialog
      open={settingsOpen}
      onOpenChange={setSettingsOpen}
      onSignOut={handleLogout}
    />
    </>
  );
}
