export function formatMessageSentDescription(description: string): string {
  const normalized = description.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "Text sent";
  }

  const withoutUrls = normalized.replace(/https?:\/\/\S+/gi, "").trim();
  const beforeHi = withoutUrls.split(/\s+Hi\s+/i)[0]?.trim();
  if (beforeHi) {
    return beforeHi;
  }

  const sentenceEnd = withoutUrls.search(/[.!?](?:\s|$)/);
  if (sentenceEnd > 0) {
    return withoutUrls.slice(0, sentenceEnd + 1).trim();
  }

  return withoutUrls;
}
