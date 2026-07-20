export function isValidOptionalHttpsWebsiteUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (!/^https:\/\//i.test(trimmed)) return false;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;

    const host = parsed.hostname.trim().toLowerCase();
    if (!host) return false;
    if (host === "localhost") return true;
    if (!host.includes(".")) return false;

    return true;
  } catch {
    return false;
  }
}

export function optionalHttpsWebsiteUrlMessage(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isValidOptionalHttpsWebsiteUrl(trimmed)) return null;
  return "Enter a full website URL starting with https:// (e.g. https://example.com).";
}
