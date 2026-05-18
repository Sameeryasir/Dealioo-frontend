import { INITIAL_TEMPLATE_PAGES } from "@/app/components/crm-template-editor/template-data";
import type { TemplatePagesState } from "@/app/components/crm-template-editor/template-types";

export function cloneTemplatePages(): TemplatePagesState {
  return JSON.parse(JSON.stringify(INITIAL_TEMPLATE_PAGES)) as TemplatePagesState;
}
