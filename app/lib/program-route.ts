const PROGRAM_PATH = /^\/business\/\d+\/dashboard\/program(?:\/|$)/;

export function isProgramPath(pathname: string | null | undefined): boolean {
  return PROGRAM_PATH.test(pathname ?? "");
}
