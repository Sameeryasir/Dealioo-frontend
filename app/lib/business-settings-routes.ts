export type BusinessSettingsSection =
  | "account"
  | "general"
  | "members"
  | "integrations"
  | "usage"
  | "scanning";

export const BUSINESS_SETTINGS_SECTIONS: BusinessSettingsSection[] = [
  "general",
  "members",
  "integrations",
  "usage",
  "scanning",
  "account",
];

export function isBusinessSettingsSection(
  value: string | null | undefined,
): value is BusinessSettingsSection {
  return (
    typeof value === "string" &&
    BUSINESS_SETTINGS_SECTIONS.includes(value as BusinessSettingsSection)
  );
}

export function businessSettingsBasePath(businessId: string | number): string {
  return `/business/${businessId}/dashboard/settings`;
}

export function businessSettingsHref(
  businessId: string | number,
  section: BusinessSettingsSection = "general",
): string {
  return `${businessSettingsBasePath(businessId)}/${section}`;
}

export function orgSettingsBasePath(): string {
  return "/dashboard/settings";
}

export function orgSettingsHref(
  section: BusinessSettingsSection = "account",
): string {
  return `${orgSettingsBasePath()}/${section}`;
}

export function defaultBusinessSettingsSection(
  businessId: string | number | null | undefined,
): BusinessSettingsSection {
  return businessId ? "general" : "account";
}
