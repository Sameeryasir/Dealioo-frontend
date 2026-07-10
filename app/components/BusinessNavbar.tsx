"use client";

import UserAccountAvatar from "@/app/components/UserAccountAvatar";
import { getSetupUser } from "@/app/lib/setup-user";
import { getUserRoleLabel } from "@/app/lib/user-role-label";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import { Bell, PanelLeft, Search } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useSidebarExpand } from "@/app/contexts/sidebar-expand-context";

function firstName(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0] ?? fullName;
  if (!part) return "Account";
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

export default function BusinessNavbar() {
  const router = useRouter();
  const params = useParams();
  const { expanded: sidebarExpanded, toggle: toggleSidebar } = useSidebarExpand();
  const [user, setUser] = useState<VerifyOtpUser | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getSetupUser());
    });
  }, []);

  const businessIdParam = params?.businessId;
  const businessId =
    typeof businessIdParam === "string" && /^\d+$/.test(businessIdParam)
      ? businessIdParam
      : null;
  const notificationsHref = businessId
    ? `/business/${businessId}/dashboard/activity`
    : "/dashboard/activity";
  const baseHref = businessId
    ? `/business/${businessId}/dashboard`
    : "/dashboard";
  const displayName = user?.name?.trim() || "Account";
  const shortName = firstName(displayName);
  const roleLabel = user?.role?.name?.trim() || getUserRoleLabel();

  // Soft search: jump to the closest matching tool page.
  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;

    const routes: Array<{ keys: string[]; href: string }> = [
      { keys: ["campaign", "offer", "ad"], href: `${baseHref}/campaigns` },
      { keys: ["member", "customer", "guest"], href: `${baseHref}/members` },
      { keys: ["scan", "qr", "check"], href: `${baseHref}/scanning` },
      { keys: ["order"], href: `${baseHref}/orders` },
      { keys: ["chat", "inbox", "message"], href: `${baseHref}/chats` },
      { keys: ["program", "loyalty", "reward"], href: `${baseHref}/program` },
      { keys: ["activity", "notif"], href: notificationsHref },
      { keys: ["menu", "library"], href: `${baseHref}/ad-library` },
      { keys: ["website", "builder"], href: `${baseHref}/website-builder` },
    ];

    const match = routes.find((route) =>
      route.keys.some((key) => q.includes(key) || key.includes(q)),
    );
    router.push(match?.href ?? `${baseHref}/activity`);
  };

  return (
    <header className="rd-topbar" aria-label="Dashboard tools">
      <div className="rd-topbar-inner flex h-[var(--rd-header-h)] items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
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

          <form
            className="flex min-w-0 max-w-[34rem] flex-1 items-center gap-2 rounded-full border border-[#e8edf5] bg-[#f4f7fb] px-3 transition focus-within:border-[#1877f2]/35 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(24,119,242,0.1)]"
            role="search"
            onSubmit={handleSearch}
          >
          <Search
            className="size-4 shrink-0 text-slate-400"
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything…"
            className="w-full min-w-0 border-0 bg-transparent py-2 text-sm font-medium text-[#07111f] outline-none placeholder:text-slate-400"
            aria-label="Search dashboard"
          />
        </form>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <Link
            href={notificationsHref}
            className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f4f7fb] text-[#07111f] outline-none transition hover:bg-[#e8f1ff] hover:text-[#1877f2] focus-visible:ring-2 focus-visible:ring-[#1877f2]/25"
            aria-label="Notifications"
          >
            <Bell className="size-4" aria-hidden strokeWidth={2} />
            <span
              className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[#1877f2] ring-2 ring-[#f4f7fb]"
              aria-hidden
            />
          </Link>

          <div
            className="group flex max-w-[14rem] items-center gap-2 rounded-2xl border border-[#e8edf5] bg-gradient-to-b from-white to-[#f8faff] py-1 pr-2 pl-1 shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
            aria-label={`Signed in as ${displayName}`}
          >
            <span className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1877f2] to-[#e1306c] p-[2px] shadow-[0_4px_10px_rgba(24,119,242,0.22)]">
              <span className="inline-flex size-full items-center justify-center overflow-hidden rounded-full bg-white text-[0.68rem] font-extrabold text-[#0f5ed7]">
                <UserAccountAvatar user={user} />
              </span>
            </span>

            <span className="hidden min-w-0 flex-col truncate pr-0.5 sm:flex">
              <span className="truncate text-[0.78rem] font-extrabold tracking-tight text-black">
                {shortName}
              </span>
              {roleLabel ? (
                <span className="truncate text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  {roleLabel}
                </span>
              ) : null}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
