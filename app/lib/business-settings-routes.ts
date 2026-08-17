export type BusinessSettingsSection =
  | "account"
  | "billing"
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
  "billing",
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

export type BusinessSettingsFocus =
  | "info"
  | "logo"
  | "contact"
  | "address"
  | "branch"
  | "twilio"
  | "stripe"
  | "meta";

export function businessSettingsHref(
  businessId: string | number,
  section: BusinessSettingsSection = "general",
  options?: { focus?: BusinessSettingsFocus | string },
): string {
  const path = `${businessSettingsBasePath(businessId)}/${section}`;
  const focus = options?.focus?.trim();
  if (!focus) return path;
  return `${path}?focus=${encodeURIComponent(focus)}`;
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
