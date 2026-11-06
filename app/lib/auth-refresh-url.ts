export function isAuthRefreshUrl(url: string): boolean {
  return /\/auth\/refresh(?:\?|$)/.test(url);
}
