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

export function withAutomaticHttps(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || /^https:\/\//i.test(trimmed)) return trimmed || value;
  if (/^http:\/\//i.test(trimmed)) {
    return `https://${trimmed.slice("http://".length)}`;
  }
  const domain =
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:[/?#][^\s]*)?$/i;
  if (domain.test(trimmed)) return `https://${trimmed}`;
  return value;
}

export function optionalHttpsWebsiteUrlMessage(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isValidOptionalHttpsWebsiteUrl(trimmed)) return null;
  return "Enter a full website URL starting with https:// (e.g. https://example.com).";
}
