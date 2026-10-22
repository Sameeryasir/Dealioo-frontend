export type EditorPreviewDevice = "mobile" | "tablet" | "desktop";

export const EDITOR_PREVIEW_DEVICE_WIDTH: Record<EditorPreviewDevice, number> = {
  mobile: 420,
  tablet: 768,
  desktop: 1024,
};

export const EDITOR_ZOOM_MIN = 0.35;
export const EDITOR_ZOOM_MAX = 1.5;
export const EDITOR_ZOOM_STEP = 0.1;

export function clampEditorZoom(value: number): number {
  return Math.min(
    EDITOR_ZOOM_MAX,
    Math.max(EDITOR_ZOOM_MIN, Math.round(value * 100) / 100),
  );
}

export type InspectorFocusTab = "content" | "style" | "advanced";

export const INSPECTOR_TAB_SECTIONS: Record<
  InspectorFocusTab,
  ReadonlyArray<
    | "templates"
    | "sections"
    | "content"
    | "media"
    | "form"
    | "checkout-templates"
    | "style"
  >
> = {
  content: ["content", "form"],
  style: ["templates", "media", "style", "checkout-templates"],
  advanced: ["sections"],
};
