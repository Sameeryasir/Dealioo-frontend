const MEMBERS_PATH = /^\/business\/\d+\/dashboard\/members(?:\/|$)/;

export function isMembersPath(pathname: string | null | undefined): boolean {
  return MEMBERS_PATH.test(pathname ?? "");
}
