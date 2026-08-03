const AUTOMATION_BUILDER_PATH =
  /^\/business\/\d+\/dashboard\/automations\/[^/]+(?:\/|$)/;

export function isAutomationBuilderPath(
  pathname: string | null | undefined,
): boolean {
  return AUTOMATION_BUILDER_PATH.test(pathname ?? "");
}
