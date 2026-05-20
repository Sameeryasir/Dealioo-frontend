import Link from "next/link";

export function InvalidRouteMessage({
  message = "Invalid link.",
  backHref = "/dashboard",
  backLabel = "Back to dashboard",
}: {
  message?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-10 text-center text-sm text-zinc-700">
      <p>{message}</p>
      <Link
        href={backHref}
        className="mt-4 inline-block font-medium text-zinc-900 underline underline-offset-2"
      >
        {backLabel}
      </Link>
    </div>
  );
}
