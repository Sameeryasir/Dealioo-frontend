"use client";

type PlaceholderStepProps = {
  title: string;
  description: string;
  onBack: () => void;
  onPrevious: () => void;
};

export function PlaceholderBuilderStep({
  title,
  description,
  onBack,
  onPrevious,
}: PlaceholderStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-[#07111f]">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="rounded-2xl border border-dashed border-[#dbeafe] bg-gradient-to-b from-[#f8fbff] to-white px-5 py-10 text-center">
        <p className="text-sm font-bold text-[#07111f]">Coming next</p>
        <p className="mt-2 text-sm text-slate-500">
          This step will be implemented in the next builder phase.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#e8edf5] pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-[#e8edf5] px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-[#f4f8ff] hover:text-[#1877f2]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onPrevious}
          className="rounded-xl bg-[#1877f2] px-5 py-2.5 text-sm font-bold text-white shadow-[0_6px_18px_rgba(24,119,242,0.3)] transition hover:bg-[#166fe5]"
        >
          Back
        </button>
      </div>
    </div>
  );
}
