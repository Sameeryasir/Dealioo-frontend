"use client";

import { ComingSoonRoutePage } from "@/app/components/ComingSoonRoutePage";
import { isAdminOrSuperAdminUser } from "@/app/lib/is-admin-or-super-admin-user";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardHistoryPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const canAccess = isAdminOrSuperAdminUser();
    setAllowed(canAccess);
    if (!canAccess) {
      router.replace("/dashboard");
    }
  }, [router]);

  if (allowed !== true) {
    return null;
  }

  return (
    <ComingSoonRoutePage
      title="History"
      description="View business, campaign, funnel, and automation history."
    />
  );
}
