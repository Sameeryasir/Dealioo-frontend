import type { LandingContentSectionId } from "@/app/components/crm-template-editor/landing-sections";
import type { FormFieldId } from "@/app/components/crm-template-editor/template-types";

export type EditorContentFocus =
  | "heading"
  | "subheading"
  | "body"
  | "button"
  | "global"
  | "navBack"
  | "navNext"
  | null;

export type EditorSelection =
  | { kind: "page" }
  | { kind: "landing-section"; sectionId: LandingContentSectionId }
  | { kind: "signup-field"; fieldId: FormFieldId }
  | { kind: "media" };

export function landingSectionToContentFocus(
  sectionId: LandingContentSectionId,
): EditorContentFocus {
  if (sectionId === "cta") return "button";
  if (sectionId === "heading") return "heading";
  if (sectionId === "subheading") return "subheading";
  if (sectionId === "body") return "body";
  if (
    sectionId === "eyebrow" ||
    sectionId === "divider" ||
    sectionId === "trust"
  ) {
    return "global";
  }
  return "global";
}

export function contentFocusToLandingSection(
  focus: EditorContentFocus,
): LandingContentSectionId | null {
  if (focus === "heading") return "heading";
  if (focus === "subheading") return "subheading";
  if (focus === "body") return "body";
  if (focus === "button") return "cta";
  return null;
}
