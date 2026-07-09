"use client";

import { useCredentialContext } from "@/app/contexts/credential-context";
import { logoutSession } from "@/app/services/auth/logout";
import { clearSetupUser, getSetupUser } from "@/app/lib/setup-user";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import UserAccountAvatar from "@/app/components/UserAccountAvatar";
import BusinessSettingsDialog from "@/app/components/BusinessSettingsDialog";
import { ArrowBigLeft, Bell, LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function BusinessNavbar() {
  const router = useRouter();
  const params = useParams();
  const { clearPassword } = useCredentialContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<"account" | "integrations">(
    "account",
  );
  const [user, setUser] = useState<VerifyOtpUser | null>(null);
  const menuRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getSetupUser());
    });
  }, []);

  const restaurantIdParam = params?.restaurantId;
  const restaurantId =
    typeof restaurantIdParam === "string" && /^\d+$/.test(restaurantIdParam)
      ? restaurantIdParam
      : null;
  const notificationsHref = restaurantId
    ? `/restaurant/${restaurantId}/dashboard/activity`
    : "/dashboard/activity";

  const iconButtonClass =
    "flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#0c152f] text-white outline-none ring-offset-2 ring-offset-[#0c152f] transition-all hover:border-white/35 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-[#0c152f] active:scale-[0.98]";

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
    setSettingsSection("integrations");
    setSettingsOpen(true);
  }, []);

  return (
    <>
    <nav
      className="sticky top-0 z-40 w-full shrink-0 border-b border-white/10 bg-[#0c152f] px-4 py-3 sm:px-6"
      aria-label="Business dashboard"
    >
      <div className="flex w-full items-center justify-between gap-3 bg-[#0c152f] sm:gap-4">
        <Link
          href="/dashboard"
          aria-label="Back to dashboard"
          className="-ml-4 inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-white outline-none ring-offset-2 ring-offset-[#0c152f] transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-[#0c152f] sm:-ml-6"
        >
          <ArrowBigLeft className="size-5 shrink-0 text-white" aria-hidden strokeWidth={2} />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={notificationsHref}
            className={iconButtonClass}
            aria-label="Notifications"
          >
            <Bell
              className="size-[1.125rem] text-white"
              aria-hidden
              strokeWidth={2}
            />
          </Link>

          <button
            type="button"
            onClick={openSettingsDialog}
            className={iconButtonClass}
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

          <div ref={menuRootRef} className="relative bg-[#0c152f]">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={`flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#0c152f] text-xs font-semibold uppercase tracking-tight text-white outline-none ring-offset-2 ring-offset-[#0c152f] transition-all hover:border-white/35 focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-[#0c152f] active:scale-[0.98] ${
                menuOpen ? "ring-2 ring-white/50 ring-offset-2 ring-offset-[#0c152f]" : ""
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
                className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-zinc-200/80 bg-white py-1 shadow-xl shadow-zinc-900/10 ring-1 ring-zinc-900/[0.04]"
              >
                <Link
                  href="/dashboard/profile"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-black"
                >
                  <UserRound
                    className="size-4 shrink-0 text-zinc-500"
                    aria-hidden
                    strokeWidth={2}
                  />
                  Profile
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-black"
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

    <BusinessSettingsDialog
      open={settingsOpen}
      onOpenChange={setSettingsOpen}
      onSignOut={handleLogout}
      initialSection={settingsSection}
    />
    </>
  );
}
