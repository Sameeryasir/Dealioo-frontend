"use client";

import { ChevronRight, MoreHorizontal, Plus } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import SearchBar from "@/app/components/SearchBar";
import { CreateAutomationModal } from "@/app/components/automation/CreateAutomationModal";
import {
  automationItem,
  automationStagger,
  statusBadgeClass,
} from "@/app/components/automation/automation-ui";
import { MOCK_AUTOMATIONS } from "@/app/components/automation/mock-data";
import type {
  AutomationFilter,
  AutomationListItem,
  AutomationStatus,
} from "@/app/components/automation/types";

const FILTERS: { id: AutomationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "published", label: "Published" },
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function AutomationListPage({
  restaurantId,
  onOpenBuilder,
}: {
  restaurantId: number;
  onOpenBuilder?: (automationId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AutomationFilter>("all");
  const [items, setItems] = useState<AutomationListItem[]>(MOCK_AUTOMATIONS);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((row) => {
      if (filter !== "all" && row.status !== filter) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.trigger.toLowerCase().includes(q) ||
        row.restaurant.toLowerCase().includes(q)
      );
    });
  }, [items, query, filter]);

  const builderHref = (id: string) =>
    `/restaurant/${restaurantId}/dashboard/automations/${id}`;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50">
      <div className="mx-auto w-full max-w-[min(100%,77.62rem)] px-4 py-8 sm:px-8 lg:px-10">
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Automation
            </h1>
            <p className="mt-1 max-w-xl text-sm text-zinc-600">
              Create workflows that automatically engage customers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.02] hover:bg-zinc-800 active:scale-[0.98]"
          >
            <Plus className="size-4" aria-hidden />
            Create Automation
          </button>
        </motion.div>

        <motion.div
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search automations…"
            className="w-full sm:max-w-md"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as AutomationFilter)}
            className="h-11 w-full cursor-pointer rounded-xl border border-zinc-200/90 bg-white px-3 text-sm font-medium text-zinc-800 shadow-sm outline-none sm:w-44 focus-visible:ring-2 focus-visible:ring-zinc-900/10"
          >
            {FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </motion.div>

        <motion.div
          className="mt-6 hidden overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-950/[0.04] lg:block"
          variants={automationStagger}
          initial="hidden"
          animate="show"
        >
          <div className="grid grid-cols-[minmax(0,1.4fr)_0.7fr_0.6fr_0.9fr_0.8fr_0.7fr_2.5rem] gap-4 border-b border-zinc-200 bg-zinc-50/90 px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-zinc-500">
            <span>Automation name</span>
            <span>Trigger</span>
            <span>Status</span>
            <span>Restaurant</span>
            <span>Last updated</span>
            <span>Customers</span>
            <span aria-hidden />
          </div>
          {filtered.map((row) => (
            <AutomationTableRow
              key={row.id}
              row={row}
              href={builderHref(row.id)}
              onOpenBuilder={onOpenBuilder}
            />
          ))}
        </motion.div>

        <motion.div
          className="mt-6 grid gap-4 lg:hidden"
          variants={automationStagger}
          initial="hidden"
          animate="show"
        >
          {filtered.map((row) => (
            <AutomationCard
              key={row.id}
              row={row}
              href={builderHref(row.id)}
              onOpenBuilder={onOpenBuilder}
            />
          ))}
        </motion.div>

        {filtered.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-zinc-200/90 bg-white px-4 py-12 text-center text-sm text-zinc-500 shadow-sm">
            No automations match your search.
          </p>
        ) : null}
      </div>

      <CreateAutomationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={({ name, description, trigger }) => {
          const id = slugify(name) || `automation-${Date.now()}`;
          const next: AutomationListItem = {
            id,
            name,
            description,
            trigger,
            status: "draft" as AutomationStatus,
            restaurant: "Feastalytics Demo",
            lastUpdated: "Just now",
            customersEntered: 0,
          };
          setItems((prev) => [next, ...prev]);
          setModalOpen(false);
          onOpenBuilder?.(id);
        }}
      />
    </div>
  );
}

function AutomationTableRow({
  row,
  href,
  onOpenBuilder,
}: {
  row: AutomationListItem;
  href: string;
  onOpenBuilder?: (id: string) => void;
}) {
  return (
    <motion.div variants={automationItem}>
      <Link
        href={href}
        onClick={() => onOpenBuilder?.(row.id)}
        className="grid grid-cols-[minmax(0,1.4fr)_0.7fr_0.6fr_0.9fr_0.8fr_0.7fr_2.5rem] items-center gap-4 border-b border-zinc-100 px-5 py-4 text-sm transition last:border-0 hover:bg-zinc-50/80"
      >
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-900">{row.name}</p>
          <p className="mt-0.5 truncate text-xs text-zinc-500">{row.description}</p>
        </div>
        <span className="text-zinc-700">{row.trigger}</span>
        <span>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadgeClass(row.status)}`}
          >
            {row.status}
          </span>
        </span>
        <span className="truncate text-zinc-600">{row.restaurant}</span>
        <span className="text-zinc-500">{row.lastUpdated}</span>
        <span className="font-semibold tabular-nums text-zinc-900">
          {row.customersEntered}
        </span>
        <MoreHorizontal className="size-4 text-zinc-400" aria-hidden />
      </Link>
    </motion.div>
  );
}

function AutomationCard({
  row,
  href,
  onOpenBuilder,
}: {
  row: AutomationListItem;
  href: string;
  onOpenBuilder?: (id: string) => void;
}) {
  return (
    <motion.div variants={automationItem} whileHover={{ scale: 1.01 }}>
      <Link
        href={href}
        onClick={() => onOpenBuilder?.(row.id)}
        className="block rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm ring-1 ring-zinc-950/[0.03] transition hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-zinc-900">{row.name}</h3>
            <p className="mt-1 text-xs text-zinc-500">Trigger: {row.trigger}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadgeClass(row.status)}`}
          >
            {row.status}
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-zinc-500">Customers</dt>
            <dd className="mt-0.5 font-semibold text-zinc-900">
              {row.customersEntered}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Updated</dt>
            <dd className="mt-0.5 font-medium text-zinc-700">{row.lastUpdated}</dd>
          </div>
        </dl>
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-zinc-900">
          Open builder
          <ChevronRight className="size-3.5" aria-hidden />
        </span>
      </Link>
    </motion.div>
  );
}