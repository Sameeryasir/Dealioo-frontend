import type { TemplatePageId } from "@/app/components/crm-template-editor/template-types";

export type LandingImageChatIntent = "generate" | "remove" | null;

export function resolveLandingImageChatIntent(
  pageId: TemplatePageId,
  instruction: string,
): LandingImageChatIntent {
  if (pageId !== "landing") return null;

  const text = instruction.toLowerCase().trim();
  if (!text) return null;

  const mentionsImage =
    /\b(image|photo|picture|pic|hero image|hero photo|media|artwork|illustration)\b/.test(
      text,
    );

  if (!mentionsImage) return null;

  if (
    /\b(remove|delete|clear|unset|get rid of|take off|no more)\b/.test(text)
  ) {
    return "remove";
  }

  if (
    /\b(generate|create|make|draw|design|new|replace|change|swap|update|set|add|upload|use)\b/.test(
      text,
    ) ||
    /\b(hero image|landing image)\b/.test(text)
  ) {
    return "generate";
  }

  return "generate";
}
