"use client";

import { useCredentialContext } from "@/app/contexts/credential-context";
import { logoutSession } from "@/app/services/auth/logout";
import { clearSetupUser, getSetupUser } from "@/app/lib/setup-user";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import UserAccountAvatar from "@/app/components/UserAccountAvatar";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const { clearPassword } = useCredentialContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<VerifyOtpUser | null>(null);
  const menuRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getSetupUser());
    });
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
    <nav
      className="sticky top-0 z-40 flex w-full items-center justify-end border-b border-white/10 brand-nav px-4 py-3 sm:px-6"
      aria-label="Main"
    >
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
          <UserAccountAvatar user={user} />
        </button>

        {menuOpen ? (
          <div
            role="menu"
            aria-label="Account actions"
            className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-zinc-200/80 bg-white py-1 shadow-xl shadow-zinc-900/10 ring-1 ring-zinc-900/[0.04]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-black"
            >
              <LogOut className="size-4 shrink-0 text-zinc-500" aria-hidden strokeWidth={2} />
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
