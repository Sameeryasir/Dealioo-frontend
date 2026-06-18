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
        <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
        <p className="mt-1 text-sm text-zinc-600">{description}</p>
      </div>

      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-10 text-center">
        <p className="text-sm font-medium text-zinc-700">Coming next</p>
        <p className="mt-2 text-sm text-zinc-500">
          This step will be implemented in the next builder phase.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onPrevious}
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Back
        </button>
      </div>
    </div>
  );
}
