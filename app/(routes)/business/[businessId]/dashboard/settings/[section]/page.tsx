"use client";

import { BusinessSettingsPanel } from "@/app/components/business/BusinessSettingsPanel";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import {
  defaultBusinessSettingsSection,
  isBusinessSettingsSection,
  type BusinessSettingsSection,
} from "@/app/lib/business-settings-routes";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BusinessSettingsSectionPage() {
  const router = useRouter();
  const params = useParams();
  const businessIdParam = params?.businessId;
  const sectionParam = params?.section;

  const businessId =
    typeof businessIdParam === "string" && /^\d+$/.test(businessIdParam)
      ? Number(businessIdParam)
      : null;

  const { isOwnerLike, isFetched, can } = useBusinessMembershipPermissions(businessId);

  const section: BusinessSettingsSection =
    typeof sectionParam === "string" &&
    isBusinessSettingsSection(sectionParam)
      ? sectionParam
      : defaultBusinessSettingsSection(businessId);

  const displaySection: BusinessSettingsSection =
    businessId != null && section === "account" ? "general" : section;

  const canAccessSettings = isOwnerLike || can("settings");

  useEffect(() => {
    if (businessId == null || !isFetched) return;

    if (!canAccessSettings) {
      router.replace(`/business/${businessId}/dashboard`);
      return;
    }

    if (sectionParam === "account") {
      router.replace(`/business/${businessId}/dashboard/settings/general`);
      return;
    }

    if (
      typeof sectionParam === "string" &&
      isBusinessSettingsSection(sectionParam)
    ) {
      return;
    }
    router.replace(`/business/${businessId}/dashboard/settings/${section}`);
  }, [businessId, canAccessSettings, isFetched, router, section, sectionParam]);

  if (businessId == null) return null;
  if (!isFetched || !canAccessSettings) return null;

  return (
    <BusinessSettingsPanel section={displaySection} businessId={businessId} />
  );
}
