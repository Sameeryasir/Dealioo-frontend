"use client";

import { BusinessSettingsPanel } from "@/app/components/business/BusinessSettingsPanel";
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

  const section: BusinessSettingsSection = isBusinessSettingsSection(
    typeof sectionParam === "string" ? sectionParam : null,
  )
    ? sectionParam
    : defaultBusinessSettingsSection(businessId);

  useEffect(() => {
    if (businessId == null) return;
    if (
      typeof sectionParam === "string" &&
      isBusinessSettingsSection(sectionParam)
    ) {
      return;
    }
    router.replace(`/business/${businessId}/dashboard/settings/${section}`);
  }, [businessId, router, section, sectionParam]);

  if (businessId == null) return null;

  return <BusinessSettingsPanel section={section} businessId={businessId} />;
}
