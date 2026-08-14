export function isAiRevertChatIntent(instruction: string): boolean {
  const text = instruction.toLowerCase().trim();
  if (!text) return false;

  return (
    /\b(undo|revert|rollback)\b/.test(text) ||
    /\b(go|put|set|change|switch)\s+back\b/.test(text) ||
    /\b(back to|restore)\s+(the\s+)?(original|previous|prior|last)\b/.test(
      text,
    ) ||
    /\b(original|previous|prior)\s+(one|version|colour|color|image|value|change)\b/.test(
      text,
    ) ||
    /\brestore\s+(it|that|this)\b/.test(text)
  );
}
