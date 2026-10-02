import { isValidElement, type ReactElement, type ReactNode } from "react";

/**
 * Shared confirm/alert dialog widths.
 * Why: one fixed max-width made short deletes look empty and long copy look cramped.
 * MCP Context 7: size from content (or an explicit override), not one CSS for every modal.
 */

export type DialogPanelSize = "sm" | "md" | "lg";
export type DialogPanelSizeProp = DialogPanelSize | "auto";

/** Maps app sizes onto AlertDialogContent `size` (avoids fighting max-width classes). */
export const DIALOG_PANEL_ALERT_SIZE: Record<
  DialogPanelSize,
  "sm" | "default" | "lg"
> = {
  sm: "sm",
  md: "default",
  lg: "lg",
};

export const DIALOG_PANEL_MAX_WIDTH_CLASS: Record<DialogPanelSize, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-[42rem]",
};

// --- Plain text from ReactNode (for auto width) ---
export function reactNodeToPlainText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(reactNodeToPlainText).join(" ");
  }
  if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    return reactNodeToPlainText(el.props.children);
  }
  return "";
}

/**
 * Pick panel width from content length.
 * Short → sm, typical confirms → md, multi-sentence warnings → lg.
 */
export function resolveDialogPanelSize(
  size: DialogPanelSizeProp,
  contentText: string,
): DialogPanelSize {
  if (size !== "auto") return size;

  const len = contentText.replace(/\s+/g, " ").trim().length;
  if (len >= 260) return "lg";
  if (len <= 120) return "sm";
  return "md";
}

export function dialogPanelWidthClass(
  size: DialogPanelSizeProp,
  contentText: string,
): string {
  const resolved = resolveDialogPanelSize(size, contentText);
  return DIALOG_PANEL_MAX_WIDTH_CLASS[resolved];
}
