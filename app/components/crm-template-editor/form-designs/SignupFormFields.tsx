"use client";

import type { ReactNode } from "react";
import { FormFieldRow } from "@/app/components/crm-template-editor/form-designs/FormFieldRow";
import { FormPresetExtra } from "@/app/components/crm-template-editor/form-designs/FormPresetExtra";
import {
  getFormDesignStyle,
  getNonSplitShellClass,
} from "@/app/components/crm-template-editor/form-designs/registry";
import {
  blendFormDesignWithLanding,
  isLandingDesignDark,
} from "@/app/components/crm-template-editor/landing-blended-form-styles";
import { FORM_FIELD_OPTIONS } from "@/app/components/crm-template-editor/template-data";
import type { FormDesign } from "@/app/components/crm-template-editor/form-designs/types";
import type { FormFieldId } from "@/app/components/crm-template-editor/template-types";

export function SignupFormFields({
  fieldIds,
  design,
  interactive = false,
  omitInteractiveForm = false,
  blendWithLandingDesign,
}: {
  fieldIds: FormFieldId[];
  design: FormDesign;
  interactive?: boolean;
  omitInteractiveForm?: boolean;
  blendWithLandingDesign?: string;
}) {
  const labels = Object.fromEntries(
    FORM_FIELD_OPTIONS.map((o) => [o.id, o.label]),
  ) as Record<FormFieldId, string>;

  const useLandingBlend = Boolean(blendWithLandingDesign);
  const landingIsDark = isLandingDesignDark(blendWithLandingDesign);
  const style = useLandingBlend
    ? blendFormDesignWithLanding(design, blendWithLandingDesign)
    : getFormDesignStyle(design);
  const blendedInputText = landingIsDark
    ? "text-white placeholder:text-white/45 focus-visible:ring-white/25"
    : undefined;

  const fields = fieldIds.map((id) => (
    <FormFieldRow
      key={id}
      label={labels[id]}
      labelClassName={style.labelClass}
      fieldClassName={style.fieldClass}
      rowClassName={style.rowClass}
      interactive={interactive}
      required={interactive}
      inputTextClassName={blendedInputText}
      fieldId={id}
      inputName={id}
      inputType={id === "email" ? "email" : "text"}
      autoComplete={
        id === "email"
          ? "email"
          : id === "phone"
            ? "tel"
            : id === "firstName"
              ? "given-name"
              : "family-name"
      }
    />
  ));

  const inner = (
    <>
      <FormPresetExtra design={design} />
      <div className={style.fieldsContainerClass}>{fields}</div>
    </>
  );

  const wrapForm = (node: ReactNode) =>
    interactive && !omitInteractiveForm ? (
      <form
        noValidate
        className="contents"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {node}
      </form>
    ) : (
      node
    );

  const shell = useLandingBlend ? style.shellClass : getNonSplitShellClass(design);
  return wrapForm(<div className={shell}>{inner}</div>);
}
