"use client";

import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";

type Props = {
  layout?: "grid" | "list";
};

export default function AddBusinessCard({ layout = "grid" }: Props) {
  if (layout === "list") {
    return (
      <Link
        href="/business/register"
        className="org-add-card org-add-card--list group outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
      >
        <span className="org-add-card-icon" aria-hidden>
          <Plus className="size-6" strokeWidth={2.25} />
        </span>
        <span className="org-add-card-copy">
          <span className="org-add-card-title">Add a business</span>
          <span className="org-add-card-subtitle">
            Register a new business or location on Dealioo.
          </span>
        </span>
        <Sparkles className="org-add-card-spark size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      </Link>
    );
  }

  return (
    <Link
      href="/business/register"
      className="org-add-card org-add-card--grid group outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
    >
      <span className="org-add-card-icon org-add-card-icon--large" aria-hidden>
        <Plus className="size-7" strokeWidth={2.25} />
      </span>
      <span className="org-add-card-title">Add a business</span>
      <span className="org-add-card-subtitle">
        Set up a new business or location and start running deals, funnels, and
        customer campaigns.
      </span>
      <span className="org-add-card-chip">Create new</span>
    </Link>
  );
}
