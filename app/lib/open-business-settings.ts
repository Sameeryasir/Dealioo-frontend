import {
  businessSettingsHref,
  defaultBusinessSettingsSection,
  orgSettingsHref,
  type BusinessSettingsSection,
} from "@/app/lib/business-settings-routes";

export type { BusinessSettingsSection };

export function getBusinessSettingsPath(
  businessId: string | number | null | undefined,
  section?: BusinessSettingsSection,
): string {
  const resolvedSection =
    section ?? defaultBusinessSettingsSection(businessId ?? null);

  if (businessId != null && String(businessId).trim() !== "") {
    return businessSettingsHref(businessId, resolvedSection);
  }

  return orgSettingsHref(resolvedSection);
}

export function openBusinessSettings(
  section: BusinessSettingsSection = "general",
  businessId?: string | number | null,
): void {
  if (typeof window === "undefined") return;
  const path = getBusinessSettingsPath(businessId, section);
  window.location.assign(path);
}
