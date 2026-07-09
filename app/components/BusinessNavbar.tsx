"use client";

import UserAccountAvatar from "@/app/components/UserAccountAvatar";
import { getSetupUser } from "@/app/lib/setup-user";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

function firstName(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0] ?? fullName;
  if (!part) return "Account";
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

export default function BusinessNavbar() {
  const router = useRouter();
  const params = useParams();
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
      <div className="rd-topbar-inner flex h-[var(--rd-header-h)] items-center justify-between gap-3 px-4 sm:gap-4 sm:px-5">
        <form
          className="flex min-w-0 max-w-[34rem] flex-1 items-center gap-2 rounded-full border border-[#e8edf5] bg-[#f4f7fb] px-3.5 transition focus-within:border-[#1877f2]/35 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(24,119,242,0.1)]"
          role="search"
          onSubmit={handleSearch}
        >
          <Search
            className="size-[1.05rem] shrink-0 text-slate-400"
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything…"
            className="w-full min-w-0 border-0 bg-transparent py-2.5 text-sm font-medium text-[#07111f] outline-none placeholder:text-slate-400"
            aria-label="Search dashboard"
          />
        </form>

        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          {/* Notifications — soft filled chip */}
          <Link
            href={notificationsHref}
            className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f4f7fb] text-[#07111f] outline-none transition hover:bg-[#e8f1ff] hover:text-[#1877f2] focus-visible:ring-2 focus-visible:ring-[#1877f2]/25"
            aria-label="Notifications"
          >
            <Bell className="size-[1.125rem]" aria-hidden strokeWidth={2} />
            {/* Soft presence dot — activity cue without fake unread count */}
            <span
              className="absolute top-2 right-2 size-1.5 rounded-full bg-[#1877f2] ring-2 ring-[#f4f7fb]"
              aria-hidden
            />
          </Link>

          {/* Profile — avatar ring + stacked name/role (not a flat pill).
              Account actions stay in the sidebar Settings / Logout footer. */}
          <div
            className="group flex max-w-[14rem] items-center gap-2.5 rounded-2xl border border-[#e8edf5] bg-gradient-to-b from-white to-[#f8faff] py-1.5 pr-2.5 pl-1.5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
            aria-label={`Signed in as ${displayName}`}
          >
            <span className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1877f2] to-[#e1306c] p-[2px] shadow-[0_4px_10px_rgba(24,119,242,0.22)]">
              <span className="inline-flex size-full items-center justify-center overflow-hidden rounded-full bg-white text-[0.72rem] font-extrabold text-[#0f5ed7]">
                <UserAccountAvatar user={user} />
              </span>
            </span>

            <span className="hidden min-w-0 truncate pr-1 text-[0.8125rem] font-extrabold tracking-tight text-black sm:inline">
              {shortName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
