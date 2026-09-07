export function FunnelUnavailableNotice() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="m-0 text-lg font-semibold text-zinc-900">
        This offer is not available
      </p>
      <p className="m-0 max-w-sm text-sm leading-relaxed text-zinc-600">
        The campaign funnel has not been published yet, or the link is no longer
        active. Ask the business for an updated link.
      </p>
    </div>
  );
}
