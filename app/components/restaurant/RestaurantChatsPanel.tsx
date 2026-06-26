"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Smartphone,
  Sparkles,
  UserRound,
  Workflow,
  Zap,
} from "lucide-react";
import {
  customerLabel,
  formatExecutionStepType,
  formatScheduledCountdown,
} from "@/app/components/automation/execution-status-ui";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { MetricStatCardAccent } from "@/app/components/shared/MetricStatCard";
import { PanelEmptyState } from "@/app/components/shared/PanelEmptyState";
import { formatDateTimeShort } from "@/app/lib/datetime";
import { formatMessageSentDescription } from "@/app/lib/activity-message-preview";
import { executionStatusBadgeClass } from "@/app/lib/badge-variants";
import { panelCardClass } from "@/app/lib/panel-styles";
import {
  getRestaurantActiveFlowCustomers,
  RESTAURANT_CHAT_PAGE_SIZE,
  type ActiveFlowCustomer,
} from "@/app/services/chat/get-restaurant-active-flow-customers";
import {
  getRestaurantConversation,
  type ConversationDetail,
  type ConversationMessage,
} from "@/app/services/chat/get-restaurant-conversation";
import type { AutomationExecutionStatus } from "@/app/services/automation/types";

const ICON_STROKE = 2.25;

function flowCustomerLabel(row: ActiveFlowCustomer): string {
  return customerLabel(row.customerId, {
    email: row.customerEmail ?? undefined,
    name: row.customerName ?? undefined,
  });
}

function guestInitials(row: ActiveFlowCustomer): string {
  const name = row.customerName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const email = row.customerEmail?.trim();
  if (email) return email.slice(0, 2).toUpperCase();
  return "G";
}

function matchesSearch(row: ActiveFlowCustomer, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    row.customerName,
    row.customerEmail,
    row.automationName,
    flowCustomerLabel(row),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
}

function statusAccentClass(status: AutomationExecutionStatus): string {
  switch (status) {
    case "running":
      return "from-blue-500 to-sky-600 shadow-blue-500/25";
    case "waiting":
      return "from-amber-500 to-orange-500 shadow-amber-500/25";
    case "paused":
      return "from-zinc-500 to-zinc-700 shadow-zinc-500/20";
    case "queued":
      return "from-violet-500 to-indigo-600 shadow-violet-500/25";
    default:
      return "from-zinc-400 to-zinc-600 shadow-zinc-400/20";
  }
}

function statusPulseClass(status: AutomationExecutionStatus): string {
  if (status === "running" || status === "waiting" || status === "queued") {
    return "animate-pulse";
  }
  return "";
}

function messagePreview(message: ConversationMessage): string {
  if (message.kind === "email" || message.kind === "sms") {
    return formatMessageSentDescription(message.body);
  }
  return message.body;
}

function messageKindLabel(kind: ConversationMessage["kind"]): string {
  switch (kind) {
    case "email":
      return "Email sent";
    case "sms":
      return "Text sent";
    case "whatsapp":
      return "WhatsApp sent";
    case "error":
      return "Error";
    default:
      return "Automation update";
  }
}

function ConversationMessageBubble({ message }: { message: ConversationMessage }) {
  const isOutbound = message.direction === "outbound";
  const preview = messagePreview(message);

  if (!isOutbound) {
    return (
      <div className="flex justify-center px-2">
        <div
          className={`max-w-[92%] rounded-2xl px-4 py-2.5 text-center text-xs leading-relaxed shadow-sm ${
            message.kind === "error"
              ? "bg-red-50 text-red-800 ring-1 ring-red-200"
              : "bg-white text-zinc-600 ring-1 ring-zinc-200/80"
          }`}
        >
          <p>{preview}</p>
          <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            {formatDateTimeShort(message.sentAt)}
          </p>
        </div>
      </div>
    );
  }

  const Icon =
    message.kind === "email"
      ? Mail
      : message.kind === "whatsapp"
        ? MessageSquare
        : Smartphone;

  return (
    <div className="flex justify-end px-2">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-sky-600 to-blue-700 px-4 py-3 text-left text-white shadow-lg shadow-sky-600/20 ring-1 ring-white/10">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-100">
          <Icon className="size-3.5" aria-hidden />
          {messageKindLabel(message.kind)}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{preview}</p>
        <p className="mt-2 text-[10px] font-medium text-sky-100/90">
          {formatDateTimeShort(message.sentAt)}
        </p>
      </div>
    </div>
  );
}

function ActiveFlowListItem({
  row,
  selected,
  onSelect,
}: {
  row: ActiveFlowCustomer;
  selected: boolean;
  onSelect: () => void;
}) {
  const label = flowCustomerLabel(row);
  const countdown = formatScheduledCountdown(row.scheduledAt);
  const initials = guestInitials(row);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group w-full rounded-2xl border p-3 text-left transition-all duration-200 ${
        selected
          ? "border-sky-300/80 bg-gradient-to-br from-sky-50 via-white to-blue-50/80 shadow-md shadow-sky-500/10 ring-1 ring-sky-200/60"
          : "border-transparent bg-white/80 hover:border-zinc-200 hover:bg-white hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-md ${statusAccentClass(row.status)}`}
        >
          {initials}
          <span
            className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-400 ${statusPulseClass(row.status)}`}
            aria-hidden
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {label}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {row.automationName}
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${executionStatusBadgeClass(row.status)}`}
            >
              {row.status}
            </span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 truncate text-xs text-zinc-500">
            <Clock3 className="size-3 shrink-0 text-zinc-400" aria-hidden />
            <span>
              {formatExecutionStepType(row.stepType)}
              {countdown ? ` · ${countdown}` : ""}
            </span>
          </p>
        </div>
      </div>
    </button>
  );
}

function ConversationPreviewGhost() {
  return (
    <div className="pointer-events-none mx-auto flex max-w-lg flex-col gap-4 opacity-40">
      <div className="flex justify-center">
        <div className="rounded-2xl bg-white px-4 py-2 text-xs text-zinc-500 shadow-sm ring-1 ring-zinc-200">
          Trigger fired — starting workflow
        </div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-gradient-to-br from-sky-600 to-blue-700 px-4 py-3 text-sm text-white shadow-lg">
          Your prepaid offer is ready — visit us with your pass.
        </div>
      </div>
      <div className="flex justify-center">
        <div className="rounded-2xl bg-white px-4 py-2 text-xs text-zinc-500 shadow-sm ring-1 ring-zinc-200">
          Delay scheduled (1 day)
        </div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-gradient-to-br from-sky-600 to-blue-700 px-4 py-3 text-sm text-white shadow-lg">
          Your offer is ready — visit us anytime.
        </div>
      </div>
    </div>
  );
}

function SelectGuestEmptyState() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden p-8 text-center">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(14,165,233,0.08),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(161 161 170 / 0.18) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-xl">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30 ring-4 ring-sky-100">
          <MessageSquare className="size-8" aria-hidden strokeWidth={ICON_STROKE} />
        </span>
        <p className="mt-5 text-lg font-bold tracking-tight text-zinc-900">
          Select a guest to open their thread
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
          Every email, text, and automation step appears here in order — like a
          real conversation timeline.
        </p>
        <div className="mt-8">
          <ConversationPreviewGhost />
        </div>
      </div>
    </div>
  );
}

function NoActiveFlowsEmptyState() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-sky-200/80 bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/50 p-6 text-center">
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-sky-200/30 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-6 size-28 rounded-full bg-indigo-200/30 blur-2xl"
        aria-hidden
      />
      <span className="relative mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25">
        <Sparkles className="size-7" aria-hidden strokeWidth={ICON_STROKE} />
      </span>
      <p className="relative mt-4 text-sm font-bold text-zinc-900">
        No active flows right now
      </p>
      <p className="relative mx-auto mt-1 max-w-[220px] text-xs leading-relaxed text-zinc-500">
        When a guest enters an automation, they will show up here instantly.
      </p>
      <div className="relative mt-5 space-y-2 text-left">
        {[
          "Guest pays or signs up",
          "Automation starts running",
          "Thread appears in Chats",
        ].map((step, index) => (
          <div
            key={step}
            className="flex items-center gap-3 rounded-xl bg-white/80 px-3 py-2 ring-1 ring-zinc-200/70"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
              {index + 1}
            </span>
            <span className="text-xs font-medium text-zinc-700">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConversationPanel({
  restaurantId,
  row,
}: {
  restaurantId: number;
  row: ActiveFlowCustomer;
}) {
  const [conversation, setConversation] = useState<ConversationDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadConversation() {
      setLoading(true);
      setError(null);

      try {
        const detail = await getRestaurantConversation(
          restaurantId,
          row.executionId,
        );
        if (!cancelled) {
          setConversation(detail);
        }
      } catch (err) {
        if (!cancelled) {
          setConversation(null);
          setError(
            err instanceof Error
              ? err.message
              : "Could not load this conversation.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadConversation();

    return () => {
      cancelled = true;
    };
  }, [restaurantId, row.executionId]);

  const label = flowCustomerLabel(row);
  const countdown = formatScheduledCountdown(row.scheduledAt);
  const messages = conversation?.messages ?? [];
  const outboundCount = messages.filter((m) => m.direction === "outbound").length;

  return (
    <div className="flex h-full min-h-[520px] flex-col">
      <div className="relative overflow-hidden border-b border-zinc-200/90 bg-gradient-to-r from-white via-sky-50/40 to-white px-6 py-5 sm:px-8">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-sky-100/40 to-transparent"
          aria-hidden
        />
        <div className="relative flex items-start gap-4">
          <span
            className={`flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-lg ${statusAccentClass(row.status)}`}
          >
            {guestInitials(row)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold tracking-tight text-zinc-900">
                {label}
              </h2>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${executionStatusBadgeClass(row.status)}`}
              >
                {row.status}
              </span>
            </div>
            {row.customerEmail ? (
              <p className="mt-0.5 truncate text-sm text-zinc-500">
                {row.customerEmail}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200/80">
                <Workflow className="size-3.5 text-violet-600" aria-hidden />
                {row.automationName}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200/80">
                <Zap className="size-3.5 text-amber-500" aria-hidden />
                {formatExecutionStepType(row.stepType)}
              </span>
              {countdown ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200/80">
                  <Clock3 className="size-3.5" aria-hidden />
                  {countdown}
                </span>
              ) : null}
              {!loading && outboundCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-200/80">
                  <Mail className="size-3.5" aria-hidden />
                  {outboundCount} message{outboundCount === 1 ? "" : "s"} sent
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div
        className="relative flex-1 overflow-y-auto px-4 py-6 sm:px-8"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(228 228 231 / 0.45) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-50/30 via-transparent to-white/80"
          aria-hidden
        />
        {loading ? (
          <div className="relative flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 className="size-6 animate-spin text-sky-600" aria-hidden />
            <p className="mt-3 text-sm font-medium text-zinc-600">
              Loading conversation…
            </p>
          </div>
        ) : error ? (
          <PanelEmptyState
            icon={MessageSquare}
            title="Could not load conversation"
            description={error}
            className="relative border-0 bg-transparent shadow-none"
            iconClassName="bg-red-100 text-red-600"
          />
        ) : messages.length === 0 ? (
          <div className="relative flex flex-col items-center py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-md ring-1 ring-zinc-200/80">
              <MessageSquare className="size-7" aria-hidden strokeWidth={ICON_STROKE} />
            </span>
            <p className="mt-4 text-sm font-bold text-zinc-900">Flow just started</p>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              Emails, texts, and automation updates will stack here as the guest
              moves through the workflow.
            </p>
          </div>
        ) : (
          <div className="relative mx-auto flex max-w-2xl flex-col gap-4">
            {messages.map((message) => (
              <ConversationMessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function RestaurantChatsPanel({
  restaurantId,
}: {
  restaurantId: number;
}) {
  const [rows, setRows] = useState<ActiveFlowCustomer[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedExecutionId, setSelectedExecutionId] = useState<number | null>(
    null,
  );

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getRestaurantActiveFlowCustomers(restaurantId, {
        page,
        limit: RESTAURANT_CHAT_PAGE_SIZE,
      });
      setRows(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (err) {
      setRows([]);
      setTotalPages(0);
      setTotal(0);
      setError(
        err instanceof Error
          ? err.message
          : "Could not load active automation customers.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, restaurantId]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesSearch(row, search)),
    [rows, search],
  );

  const selectedRow = useMemo(() => {
    if (selectedExecutionId == null) return filteredRows[0] ?? null;
    return (
      filteredRows.find((row) => row.executionId === selectedExecutionId) ??
      filteredRows[0] ??
      null
    );
  }, [filteredRows, selectedExecutionId]);

  useEffect(() => {
    if (selectedRow && selectedExecutionId !== selectedRow.executionId) {
      setSelectedExecutionId(selectedRow.executionId);
    }
  }, [selectedExecutionId, selectedRow]);

  const stats = useMemo(
    () => ({
      active: total,
      running: rows.filter((r) => r.status === "running").length,
      waiting: rows.filter((r) => r.status === "waiting").length,
      paused: rows.filter((r) => r.status === "paused").length,
    }),
    [rows, total],
  );

  return (
    <div className="w-full px-4 py-8 sm:px-8 lg:px-10">
      <header className="mx-auto mb-6 w-full max-w-[min(100%,77.62rem)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Restaurant #{restaurantId}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25">
                <MessageSquare className="size-6" aria-hidden strokeWidth={ICON_STROKE} />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                  Chats
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-zinc-600">
                  Live guest threads from active automations — emails, texts, and
                  every step in one place.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadRows()}
            disabled={loading}
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 self-start rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50 lg:self-auto"
          >
            <RefreshCw
              className={`size-4 ${loading ? "animate-spin" : ""}`}
              aria-hidden
            />
            Refresh
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricStatCardAccent
            label="Active guests"
            value={loading ? "—" : stats.active}
            icon={UserRound}
            tone="blue"
            highlight={stats.active > 0}
          />
          <MetricStatCardAccent
            label="Running"
            value={loading ? "—" : stats.running}
            icon={Zap}
            tone="violet"
          />
          <MetricStatCardAccent
            label="Waiting"
            value={loading ? "—" : stats.waiting}
            icon={Clock3}
            tone="zinc"
          />
          <MetricStatCardAccent
            label="Paused"
            value={loading ? "—" : stats.paused}
            icon={Workflow}
            tone="emerald"
          />
        </div>
      </header>

      <div
        className={`mx-auto grid w-full max-w-[min(100%,77.62rem)] overflow-hidden lg:grid-cols-[minmax(280px,340px)_1fr] ${panelCardClass}`}
      >
        <aside className="flex min-h-[520px] flex-col border-b border-zinc-200/90 bg-gradient-to-b from-zinc-50/90 via-white to-zinc-50/50 lg:border-b-0 lg:border-r">
          <div className="border-b border-zinc-200/80 px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-zinc-900">Active threads</p>
                <p className="text-xs text-zinc-500">Guests in a live automation</p>
              </div>
              {!loading && !error ? (
                <span className="inline-flex min-w-[1.75rem] items-center justify-center rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-bold tabular-nums text-white">
                  {filteredRows.length}
                </span>
              ) : null}
            </div>
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search guests or flows"
                className="w-full rounded-xl border border-zinc-200/90 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </label>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-4 pt-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                <Loader2 className="size-6 animate-spin text-sky-600" aria-hidden />
                <p className="mt-3 text-sm font-medium">Loading threads…</p>
              </div>
            ) : error ? (
              <PanelEmptyState
                icon={MessageSquare}
                title="Could not load guests"
                description={error}
                className="border-0 bg-transparent py-10 shadow-none"
                iconClassName="bg-red-100 text-red-600"
              />
            ) : filteredRows.length === 0 ? (
              rows.length === 0 ? (
                <NoActiveFlowsEmptyState />
              ) : (
                <PanelEmptyState
                  icon={Search}
                  title="No matches"
                  description="Try a different search term."
                  className="border-0 bg-transparent py-10 shadow-none"
                  iconClassName="bg-zinc-100 text-zinc-600"
                />
              )
            ) : (
              filteredRows.map((row) => (
                <ActiveFlowListItem
                  key={row.executionId}
                  row={row}
                  selected={selectedRow?.executionId === row.executionId}
                  onSelect={() => setSelectedExecutionId(row.executionId)}
                />
              ))
            )}
          </div>

          {!loading && !error && totalPages > 1 ? (
            <div className="border-t border-zinc-200/80 px-4 py-4">
              <OffsetPagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={RESTAURANT_CHAT_PAGE_SIZE}
                loading={loading}
                onPageChange={setPage}
                itemLabel="guests"
              />
            </div>
          ) : null}
        </aside>

        <section className="flex min-h-[520px] flex-col bg-white">
          {selectedRow ? (
            <ConversationPanel restaurantId={restaurantId} row={selectedRow} />
          ) : (
            <SelectGuestEmptyState />
          )}
        </section>
      </div>
    </div>
  );
}
