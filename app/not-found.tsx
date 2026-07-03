import { ComingSoonPanel } from "@/app/components/ComingSoonPanel";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-zinc-50">
      <ComingSoonPanel
        title="Page coming soon"
        description="This page is not ready yet. Choose another section from the menu."
        backHref="/dashboard"
        backLabel="Back to dashboard"
      />
    </div>
  );
}
