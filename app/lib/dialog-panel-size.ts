import { isValidElement, type ReactElement, type ReactNode } from "react";

export type DialogPanelSize = "sm" | "md" | "lg";
export type DialogPanelSizeProp = DialogPanelSize | "auto";

export const DIALOG_PANEL_ALERT_SIZE: Record<
  DialogPanelSize,
  "sm" | "default" | "lg"
> = {
  sm: "sm",
  md: "default",
  lg: "lg",
};

export const DIALOG_PANEL_MAX_WIDTH_CLASS: Record<DialogPanelSize, string> = {
  sm: "sm:max-w-lg",
  md: "sm:max-w-xl",
  lg: "sm:max-w-[48rem]",
};

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
