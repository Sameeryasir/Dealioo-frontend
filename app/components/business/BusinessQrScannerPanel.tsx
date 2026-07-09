"use client";

import { ScanLine, Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { ScannerCreateGuestPanel } from "@/app/components/business/ScannerCreateGuestPanel";
import { ScannerScanCodePanel } from "@/app/components/business/ScannerScanCodePanel";
import { ScannerSearchGuestPanel } from "@/app/components/business/ScannerSearchGuestPanel";

type ScannerTabId = "scan" | "search" | "create";

const SCANNER_TABS: Array<{
  id: ScannerTabId;
  label: string;
  icon: typeof ScanLine;
}> = [
  { id: "scan", label: "Scan Code", icon: ScanLine },
  { id: "search", label: "Search Guest", icon: Search },
  { id: "create", label: "Create New Guest", icon: UserPlus },
];

export function BusinessQrScannerPanel({
  restaurantId,
}: {
  restaurantId: number;
}) {
  const [activeTab, setActiveTab] = useState<ScannerTabId>("scan");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-start gap-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-md shadow-zinc-900/20 ring-1 ring-zinc-900/10">
          <ScanLine className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 pt-0.5">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Scan & Redeem
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500">
            Scan a pass, search for a guest, or create a new guest profile.
          </p>
        </div>
      </header>

      <nav
        className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-md shadow-zinc-200/50 ring-1 ring-zinc-950/[0.04]"
        aria-label="Scanner actions"
      >
        <div
          className="flex gap-1 overflow-x-auto border-b border-zinc-100 bg-zinc-50/70 p-2"
          role="tablist"
        >
          {SCANNER_TABS.map(({ id, label, icon: Icon }) => {
            const active = id === activeTab;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(id)}
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400/50 sm:px-4 ${
                  active
                    ? "bg-zinc-900 text-white shadow-sm shadow-zinc-900/25"
                    : "text-zinc-600 hover:bg-white/80 hover:text-zinc-900 hover:shadow-sm"
                }`}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>

        <div className="bg-gradient-to-b from-zinc-50/30 to-white p-4 sm:p-5" role="tabpanel">
          {activeTab === "scan" ? (
            <ScannerScanCodePanel
              restaurantId={restaurantId}
              onCreateGuest={() => setActiveTab("create")}
            />
          ) : null}

          {activeTab === "search" ? (
            <ScannerSearchGuestPanel
              restaurantId={restaurantId}
              onCreateGuest={() => setActiveTab("create")}
            />
          ) : null}

          {activeTab === "create" ? (
            <ScannerCreateGuestPanel restaurantId={restaurantId} />
          ) : null}
        </div>
      </nav>
    </div>
  );
}
