"use client";

import { GuestPassUnavailableCard } from "@/app/components/pass/GuestPassUnavailableCard";

export default function LegacyGuestPassPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-md">
        <GuestPassUnavailableCard reason="loadFailed" />
      </div>
    </main>
  );
}
