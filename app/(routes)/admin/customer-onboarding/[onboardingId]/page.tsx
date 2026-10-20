"use client";

import { SuperAdminCustomerOnboardingDetailPanel } from "@/app/components/super-admin/SuperAdminCustomerOnboardingDetailPanel";
import { useParams } from "next/navigation";

export default function AdminCustomerOnboardingDetailPage() {
  const params = useParams();
  const raw = params?.onboardingId;
  const onboardingId =
    typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : 0;

  return (
    <SuperAdminCustomerOnboardingDetailPanel onboardingId={onboardingId} />
  );
}
