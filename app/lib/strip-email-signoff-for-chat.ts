export function stripEmailSignoffForChat(text: string): string {
  return text.replace(/\n*Best regards,\s*\nDealioo Team\s*$/i, "").trim();
}

export function sanitizeChatMessageBody(body: string): string {
  return stripEmailSignoffForChat(body) || body.trim() || "Message sent";
}

export function sanitizeChatMessagePreview(preview: string): string {
  return stripEmailSignoffForChat(preview) || preview.trim();
}
