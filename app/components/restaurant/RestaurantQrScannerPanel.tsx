"use client";

import { ScanLine, Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { ScannerCreateGuestPanel } from "@/app/components/restaurant/ScannerCreateGuestPanel";
import { ScannerScanCodePanel } from "@/app/components/restaurant/ScannerScanCodePanel";
import { ScannerSearchGuestPanel } from "@/app/components/restaurant/ScannerSearchGuestPanel";

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

export function RestaurantQrScannerPanel({
  restaurantId,
}: {
  restaurantId: number;
}) {
  const [activeTab, setActiveTab] = useState<ScannerTabId>("scan");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Scan & Redeem
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Scan a pass, search for a guest, or create a new guest profile.
        </p>
      </header>

      <nav
        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
        aria-label="Scanner actions"
      >
        <div
          className="flex gap-1 overflow-x-auto border-b border-zinc-100 p-2"
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
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400/50 sm:px-4 ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>

        <div className="p-4" role="tabpanel">
          {activeTab === "scan" ? (
            <ScannerScanCodePanel restaurantId={restaurantId} />
          ) : null}

          {activeTab === "search" ? (
            <ScannerSearchGuestPanel restaurantId={restaurantId} />
          ) : null}

          {activeTab === "create" ? (
            <ScannerCreateGuestPanel restaurantId={restaurantId} />
          ) : null}
        </div>
      </nav>
    </div>
  );
}
