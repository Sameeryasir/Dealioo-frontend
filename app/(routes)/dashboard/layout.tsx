"use client";

import Navbar from "@/app/components/Navbar";
import { OnboardingCompleteGuard } from "@/app/components/OnboardingCompleteGuard";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const skipOnboardingGuard =
    pathname?.startsWith("/dashboard/upgrade-plan") === true;

  const shell = (
    <div className="landing-page org-dashboard-page landing-page-shell flex min-h-dvh min-h-0 w-full flex-col">
      <Navbar />
      <div className="landing-page-content flex min-h-0 min-w-0 flex-1 flex-col">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );

  if (skipOnboardingGuard) {
    return shell;
  }

  return <OnboardingCompleteGuard>{shell}</OnboardingCompleteGuard>;
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
