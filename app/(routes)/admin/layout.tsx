"use client";

import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { SuperAdminGuard } from "@/app/components/SuperAdminGuard";
import { SuperAdminShell } from "@/app/components/SuperAdminShell";
import type { ReactNode } from "react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <SuperAdminGuard>
        <SuperAdminShell>{children}</SuperAdminShell>
      </SuperAdminGuard>
    </ProtectedRoute>
  );
}
