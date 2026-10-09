import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="m-0 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
          404
        </p>
        <h1 className="m-0 mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-500">
          This page does not exist or is no longer available.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-zinc-800"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
