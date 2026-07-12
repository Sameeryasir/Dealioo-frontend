const URL_PATTERN = /https?:\/\/\S+/gi;

const CTA_LINE_PATTERN =
  /^(complete payment|view qr code|view your pass|open link|tap the link below)\b/i;

export function stripEmailSignoffForChat(text: string): string {
  return text.replace(/\n*Best regards,\s*\nDealioo Team\s*$/i, "").trim();
}

/** Hides payment/pass links from owner-facing guest chat previews. */
export function stripAutomationLinksForChat(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const cleaned: string[] = [];

  for (const rawLine of lines) {
    const withoutUrls = rawLine.replace(URL_PATTERN, "").trimEnd();
    const trimmed = withoutUrls.trim();

    if (!trimmed) {
      if (cleaned.length > 0 && cleaned[cleaned.length - 1] !== "") {
        cleaned.push("");
      }
      continue;
    }

    if (CTA_LINE_PATTERN.test(trimmed)) {
      continue;
    }

    cleaned.push(withoutUrls);
  }

  return cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function sanitizeChatMessageBody(body: string): string {
  const normalized = stripAutomationLinksForChat(
    stripEmailSignoffForChat(body),
  );
  return normalized || body.trim() || "Message sent";
}

export function sanitizeChatMessagePreview(preview: string): string {
  return sanitizeChatMessageBody(preview);
}
