import type { FormDesign } from "@/app/components/crm-template-editor/form-designs/types";
import { getFormDesignStyle } from "@/app/components/crm-template-editor/form-designs/registry";

export function FormPresetExtra({ design }: { design: FormDesign }) {
  const extra = getFormDesignStyle(design).extra;

  if (extra === "wizard") {
    return (
      <div className="mb-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200">
          <div className="h-full w-1/2 rounded-full bg-zinc-900" />
        </div>
        <span className="shrink-0 text-[0.6rem] font-bold uppercase tracking-wide text-zinc-500">
          Step 1 of 2
        </span>
      </div>
    );
  }

  if (extra === "social") {
    return (
      <div className="mb-4 flex flex-wrap items-center gap-2 text-amber-700">
        <span className="text-sm" aria-hidden>
          ★★★★★
        </span>
        <span className="text-xs font-semibold text-zinc-800">
          Loved by 500+ guests this month
        </span>
      </div>
    );
  }

  if (extra === "coupon") {
    return (
      <div className="mb-4 inline-flex rounded-full border border-dashed border-zinc-500 bg-zinc-50 px-3 py-1.5 text-xs font-bold tracking-wide text-zinc-900">
        SPRING20
      </div>
    );
  }

  return null;
}
