"use client";

import { BusinessSettingsPanel } from "@/app/components/business/BusinessSettingsPanel";
import {
  defaultBusinessSettingsSection,
  isBusinessSettingsSection,
  orgSettingsHref,
  type BusinessSettingsSection,
} from "@/app/lib/business-settings-routes";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OrgSettingsSectionPage() {
  const router = useRouter();
  const params = useParams();
  const sectionParam = params?.section;

  const section: BusinessSettingsSection = isBusinessSettingsSection(
    typeof sectionParam === "string" ? sectionParam : null,
  )
    ? sectionParam
    : defaultBusinessSettingsSection(null);

  useEffect(() => {
    if (
      typeof sectionParam === "string" &&
      isBusinessSettingsSection(sectionParam)
    ) {
      return;
    }
    router.replace(orgSettingsHref(section));
  }, [router, section, sectionParam]);

  return <BusinessSettingsPanel section={section} />;
}
