"use client";

import { useId } from "react";
import { ChevronDown } from "lucide-react";
import {
  colorInputValue,
  normalizeHexColor,
} from "@/app/components/crm-template-editor/landing-content-colors";
import {
  editorColorPickerBadgeClass,
  editorColorPickerHexInputClass,
  editorColorPickerResetClass,
  editorColorPickerShellClass,
  editorColorPickerSwatchClass,
} from "@/app/components/crm-template-editor/editor-sidebar-theme";

export function ContentTextColorPicker({
  value,
  onChange,
  fallbackHex = "#18181B",
}: {
  value: string;
  onChange: (color: string) => void;
  fallbackHex?: string;
}) {
  const inputId = useId();
  const pickerValue = colorInputValue(value, fallbackHex);
  const hasCustom = Boolean(normalizeHexColor(value));
  const displayHex = hasCustom ? value : pickerValue;

  return (
    <div
      className={editorColorPickerShellClass}
      role="group"
      aria-label="Text color"
    >
      <span className={editorColorPickerBadgeClass}>Color</span>

      <label
        htmlFor={`${inputId}-picker`}
        className={editorColorPickerSwatchClass}
        style={{ backgroundColor: pickerValue }}
        title="Pick a color"
      >
        <input
          id={`${inputId}-picker`}
          type="color"
          value={pickerValue}
          onChange={(e) => onChange(normalizeHexColor(e.target.value))}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          aria-label="Pick text color"
        />
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent"
          aria-hidden
        />
      </label>

      <input
        type="text"
        value={displayHex}
        onChange={(e) => onChange(normalizeHexColor(e.target.value))}
        onFocus={(e) => {
          if (!hasCustom) e.currentTarget.select();
        }}
        placeholder={fallbackHex}
        className={[
          editorColorPickerHexInputClass,
          "font-semibold uppercase tracking-wide text-slate-700",
        ].join(" ")}
        spellCheck={false}
        maxLength={7}
      />

      <label
        htmlFor={`${inputId}-picker`}
        className="flex size-5 shrink-0 cursor-pointer items-center justify-center text-slate-400"
        aria-hidden
      >
        <ChevronDown className="size-3.5" strokeWidth={2.25} />
      </label>

      {hasCustom ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className={editorColorPickerResetClass}
        >
          Reset
        </button>
      ) : null}
    </div>
  );
}
