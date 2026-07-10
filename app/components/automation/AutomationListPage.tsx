"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ChevronRight,
  CircleDot,
  Clock,
  CreditCard,
  ExternalLink,
  GitBranch,
  MoreHorizontal,
  PauseCircle,
  Trash2,
  Pencil,
  Plus,
  SearchX,
  Send,
  Tag,
  UserPlus,
  Workflow,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { triggerIconClass } from "@/app/lib/badge-variants";
import { panelRowMotion, panelStagger, standardEase } from "@/app/lib/motion";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { PanelEmptyState } from "@/app/components/shared/PanelEmptyState";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useAnchoredMenu } from "@/app/hooks/use-anchored-menu";
import { toastApiError } from "@/app/lib/toast-api-error";
import { StatusPill } from "@/app/components/StatusPill";
import { useAutomationRouteContext } from "@/app/hooks/use-automation-route-context";
import { ensureAutomationListSubscriptions } from "@/app/lib/pusher-client";
import { isPusherConfigured } from "@/app/lib/pusher-execution";
import SearchBar from "@/app/components/SearchBar";
import { Skeleton } from "@/app/components/skeleton";
import { AutomationFilterDropdown } from "@/app/components/automation/AutomationFilterDropdown";
import { CreateAutomationModal } from "@/app/components/automation/CreateAutomationModal";
import { DeleteAutomationDialog } from "@/app/components/automation/DeleteAutomationDialog";
import { automationStatusBadgeClass } from "@/app/lib/badge-variants";
import { primaryButtonMdClass, reportTableShellClass } from "@/app/lib/panel-styles";
import type {
  AutomationFilter,
  AutomationListItem,
  AutomationStatus,
} from "@/app/components/automation/types";
import {
  createAutomation,
  deleteAutomation,
  getAutomationById,
  mapAutomationToListItem,
} from "@/app/services/automation/automation-api";
import { automationQueryKeys } from "@/app/services/automation/automation-query-keys";
import { syncAutomationQueryCache } from "@/app/services/automation/automation-query-cache";
import { useAutomationsQuery } from "@/app/hooks/use-automations-query";
import { getAutomationTemplateById } from "@/app/components/automation/automation-templates";
import {
  buildCreateAutomationBody,
  validateAutomationCreateContext,
} from "@/app/services/automation/automation-create-context";
import { applyAutomationTemplate } from "@/app/services/automation/apply-automation-template";

function truncateDescription(description: string, maxLength = 40): string {
  const text = description.trim();
  if (!text) return "N/A";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

function triggerIcon(trigger: string): LucideIcon {
  const t = trigger.toLowerCase();
  if (t.includes("signup")) return UserPlus;
  if (t.includes("payment")) return CreditCard;
  if (t.includes("funnel")) return GitBranch;
  if (t.includes("tag")) return Tag;
  return Zap;
}

function statusIcon(status: AutomationStatus): LucideIcon {
  switch (status) {
    case "active":
      return CircleDot;
    case "published":
      return Send;
    case "paused":
      return PauseCircle;
    case "draft":
    default:
      return Pencil;
  }
}

const ICON_STROKE = 2.5;

function IconBadge({
  icon: Icon,
  className,
  iconClassName = "size-3.5",
}: {
  icon: LucideIcon;
  className: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${className}`}
    >
      <Icon className={iconClassName} aria-hidden strokeWidth={ICON_STROKE} />
    </span>
  );
}

const FILTERS: { id: AutomationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "published", label: "Published" },
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
];

export function AutomationListPage({
  businessId: businessIdProp,
  campaignId: campaignIdProp,
  funnelId: funnelIdProp,
  onOpenBuilder,
  embedded = false,
}: {
  businessId?: number;
  campaignId?: number;
  funnelId?: number | null;
  onOpenBuilder?: (automationId: string) => void;
  embedded?: boolean;
} = {}) {
  const route = useAutomationRouteContext();
  const businessId = route.businessId ?? businessIdProp;
  const campaignId = route.campaignId ?? campaignIdProp;
  const funnelId = funnelIdProp ?? route.funnelId;

  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AutomationFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AutomationListItem | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const {
    data: items,
    isLoading: loading,
    error: loadError,
    refetch: loadAutomations,
  } = useAutomationsQuery(businessId);

  const automationNumericIds = useMemo(
    () =>
      (items ?? [])
        .map((row) => row.numericId)
        .filter((id): id is number => id != null && id >= 1),
    [items],
  );

  const handleListPusherTerminal = useCallback(() => {
    if (businessId == null) return;
    void queryClient.invalidateQueries({
      queryKey: automationQueryKeys.list(businessId),
    });
  }, [queryClient, businessId]);

  useEffect(() => {
    if (!isPusherConfigured() || loading || automationNumericIds.length === 0) {
      return;
    }
    ensureAutomationListSubscriptions(
      automationNumericIds,
      handleListPusherTerminal,
    );
  }, [automationNumericIds, handleListPusherTerminal, loading]);

  const createContextInput = useMemo(
    () => ({ businessId, campaignId }),
    [businessId, campaignId],
  );

  const createBlockedMessage = useMemo(() => {
    const result = validateAutomationCreateContext(createContextInput);
    return result.ok ? null : result.message;
  }, [createContextInput]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter((row) => {
      if (filter !== "all" && row.status !== filter) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.trigger.toLowerCase().includes(q)
      );
    });
  }, [items, query, filter]);

  const builderHref = (row: AutomationListItem) => {
    const base = `/business/${businessId}/dashboard/automations/${
      row.numericId != null ? String(row.numericId) : row.id
    }`;
    if (funnelId != null && funnelId >= 1) {
      return `${base}?funnelId=${encodeURIComponent(String(funnelId))}`;
    }
    return base;
  };

  if (businessId == null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-sm text-zinc-700">
        <p>Invalid link, business id not found in the URL.</p>
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? "campaign-immersive-tab-panel min-h-0 flex-1 overflow-y-auto bg-white [scrollbar-gutter:stable]"
          : "min-h-0 flex-1 overflow-y-auto bg-zinc-50 [scrollbar-gutter:stable]"
      }
    >
      <div
        className={
          embedded
            ? "w-full max-w-none px-0 py-0"
            : "mx-auto w-full max-w-[min(100%,77.62rem)] px-4 py-8 sm:px-8 lg:px-10"
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20 sm:size-10"
                aria-hidden
              >
                <Workflow className="size-4 sm:size-5" strokeWidth={ICON_STROKE} />
              </span>
              Automation
            </h1>
            <p className="mt-1 max-w-xl text-sm text-zinc-600">
              Create workflows that automatically engage customers.
            </p>
            {createBlockedMessage ? (
              <p className="mt-2 max-w-xl text-sm text-amber-800">{createBlockedMessage}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              const context = validateAutomationCreateContext(createContextInput);
              if (!context.ok) {
                toast.error(context.message);
                return;
              }
              setModalOpen(true);
            }}
            className={`inline-flex shrink-0 justify-center transition hover:scale-[1.02] active:scale-[0.98] ${primaryButtonMdClass}`}
          >
            <Plus className="size-4" aria-hidden />
            Create Automation
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search automations…"
            className="w-full sm:max-w-md"
          />
          <AutomationFilterDropdown
            value={filter}
            options={FILTERS}
            onChange={setFilter}
            className="w-full sm:w-44"
          />
        </div>

        {loadError ? (
          <AsyncErrorRetry
            message={loadError}
            onRetry={() => loadAutomations()}
          />
        ) : loading ? (
          <AutomationListSkeleton />
        ) : null}

        {!loading && !loadError ? (
        <motion.div
          className={`mt-6 hidden overflow-hidden ${reportTableShellClass} lg:block`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: standardEase }}
        >
          <div
            className={`${TABLE_GRID} border-b border-zinc-200 bg-zinc-50/90 px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-zinc-500`}
          >
            <TableColumnHeader
              icon={Workflow}
              label="Automation name"
              iconClassName="text-violet-600"
            />
            <TableColumnHeader
              icon={Zap}
              label="Trigger"
              iconClassName="text-amber-600"
            />
            <TableColumnHeader
              icon={Activity}
              label="Status"
              iconClassName="text-emerald-600"
            />
            <TableColumnHeader
              icon={Clock}
              label="Last updated"
              iconClassName="text-orange-600"
            />
            <span aria-hidden />
          </div>
          <motion.div
            variants={panelStagger}
            initial="hidden"
            animate="show"
          >
            {filtered.map((row) => (
              <motion.div key={row.id} variants={panelRowMotion}>
                <AutomationTableRow
                  row={row}
                  href={builderHref(row)}
                  onOpenBuilder={onOpenBuilder}
                  onDelete={() => setDeleteTarget(row)}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
        ) : null}

        {!loading && !loadError ? (
        <motion.div
          className="mt-6 grid gap-4 lg:hidden"
          variants={panelStagger}
          initial="hidden"
          animate="show"
        >
          {filtered.map((row) => (
            <motion.div key={row.id} variants={panelRowMotion}>
              <AutomationCard
                row={row}
                href={builderHref(row)}
                onOpenBuilder={onOpenBuilder}
                onDelete={() => setDeleteTarget(row)}
              />
            </motion.div>
          ))}
        </motion.div>
        ) : null}

        {!loading && !loadError && filtered.length === 0 ? (
          <PanelEmptyState
            className="mt-8 px-4 py-14"
            icon={SearchX}
            title="No automations match your search"
            description="Try a different keyword or filter to find your workflows."
          />
        ) : null}
      </div>

      <CreateAutomationModal
        open={modalOpen}
        isSubmitting={creating}
        onClose={() => {
          if (!creating) setModalOpen(false);
        }}
        onCreate={async ({ name, description, trigger, purpose, templateId }) => {
          const context = validateAutomationCreateContext(createContextInput);
          if (!context.ok) {
            toast.error(context.message);
            return;
          }
          const template = templateId
            ? getAutomationTemplateById(templateId)
            : undefined;
          if (templateId && !template) {
            toast.error("Could not find that automation template.");
            return;
          }
          setCreating(true);
          try {
            const created = await createAutomation(
              buildCreateAutomationBody({
                name,
                description,
                trigger,
                purpose,
                ids: context.ids,
              }),
            );
            if (template) {
              await applyAutomationTemplate(created.id, template);
              const withNodes = await getAutomationById(created.id);
              syncAutomationQueryCache(queryClient, withNodes);
            } else {
              syncAutomationQueryCache(queryClient, created);
            }
            const next = mapAutomationToListItem(created);
            if (businessId != null) {
              queryClient.setQueryData<AutomationListItem[]>(
                automationQueryKeys.list(businessId),
                (prev) => [next, ...(prev ?? [])],
              );
            }
            setModalOpen(false);
            toast.success(
              template
                ? `"${template.name}" template applied.`
                : "Automation created.",
            );
            const builderId = String(created.id);
            onOpenBuilder?.(builderId);
          } catch (err) {
            toastApiError(err, "Could not create automation.");
          } finally {
            setCreating(false);
          }
        }}
      />

      <DeleteAutomationDialog
        open={deleteTarget != null}
        automationName={deleteTarget?.name ?? ""}
        isDeleting={deleting}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={async () => {
          const id = deleteTarget?.numericId;
          if (id == null || id < 1) {
            toast.error("Could not delete this automation.");
            return;
          }
          setDeleting(true);
          try {
            await deleteAutomation(id);
            if (businessId != null) {
              queryClient.setQueryData<AutomationListItem[]>(
                automationQueryKeys.list(businessId),
                (prev) => (prev ?? []).filter((row) => row.numericId !== id),
              );
            }
            setDeleteTarget(null);
            toast.success("Automation deleted.");
          } catch (err) {
            toastApiError(err, "Could not delete automation.");
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}

const TABLE_GRID =
  "grid grid-cols-[minmax(0,1.4fr)_0.7fr_0.6fr_0.8fr_2.5rem] gap-4";

function AutomationListSkeleton() {
  return (
    <div className="mt-6" aria-busy="true" aria-label="Loading automations">
      <div className={`hidden overflow-hidden ${reportTableShellClass} lg:block`}>
        <div
          className={`${TABLE_GRID} border-b border-zinc-200 bg-zinc-50/90 px-5 py-3.5`}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} funnel className="h-3 w-16" />
          ))}
          <Skeleton funnel className="h-3 w-3" />
        </div>
        {Array.from({ length: 5 }).map((_, row) => (
          <div
            key={row}
            className={`${TABLE_GRID} items-center border-b border-zinc-100 px-5 py-4 last:border-0`}
          >
            <div className="min-w-0 space-y-2">
              <Skeleton funnel className="h-4 w-4/5" />
              <Skeleton funnel className="h-3 w-1/2" />
            </div>
            <Skeleton funnel className="h-4 w-14" />
            <Skeleton funnel className="h-6 w-16 rounded-full" />
            <Skeleton funnel className="h-4 w-16" />
            <Skeleton funnel className="size-4 rounded-full" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <article
            key={i}
            className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm ring-1 ring-zinc-950/[0.03]"
            aria-hidden
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton funnel className="h-5 w-3/4" />
                <Skeleton funnel className="h-3 w-1/3" />
              </div>
              <Skeleton funnel className="h-6 w-14 shrink-0 rounded-full" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Skeleton funnel className="h-8 w-full" />
              <Skeleton funnel className="h-8 w-full" />
            </div>
            <Skeleton funnel className="mt-4 h-3 w-24" />
          </article>
        ))}
      </div>
    </div>
  );
}

const ROW_MENU_WIDTH = 176;
const ROW_MENU_ITEM_HEIGHT = 44;

function AutomationRowMenu({
  href,
  onOpenBuilder,
  onDelete,
}: {
  href: string;
  onOpenBuilder?: () => void;
  onDelete?: () => void;
}) {
  const menuHeight = onDelete ? ROW_MENU_ITEM_HEIGHT * 2 : ROW_MENU_ITEM_HEIGHT;
  const {
    open,
    setOpen,
    toggle,
    mounted,
    anchorRef,
    menuRef,
    menuPosition,
    menuStyle,
  } = useAnchoredMenu({
    placement: "flip",
    align: "right",
    width: ROW_MENU_WIDTH,
    estimatedHeight: menuHeight,
  });

  const menu =
    mounted && open && menuPosition ? (
      <div
        ref={menuRef}
        role="menu"
        aria-label="Automation actions"
        style={menuStyle}
        className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white py-1 shadow-lg ring-1 ring-zinc-950/[0.04]"
      >
        <Link
          href={href}
          role="menuitem"
          onClick={() => {
            setOpen(false);
            onOpenBuilder?.();
          }}
          className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
        >
          <ExternalLink
            className="size-4 shrink-0 text-violet-600"
            aria-hidden
            strokeWidth={ICON_STROKE}
          />
          Open builder
        </Link>
        {onDelete ? (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2
              className="size-4 shrink-0"
              aria-hidden
              strokeWidth={ICON_STROKE}
            />
            Delete
          </button>
        ) : null}
      </div>
    ) : null;

  return (
    <div ref={anchorRef} className="relative flex justify-end">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-zinc-600 outline-none transition hover:bg-violet-50 hover:text-violet-700 focus-visible:ring-2 focus-visible:ring-violet-500/20"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Automation actions"
      >
        <MoreHorizontal className="size-4" aria-hidden strokeWidth={ICON_STROKE} />
      </button>
      {mounted ? createPortal(menu, document.body) : null}
    </div>
  );
}

function AutomationTableRow({
  row,
  href,
  onOpenBuilder,
  onDelete,
}: {
  row: AutomationListItem;
  href: string;
  onOpenBuilder?: (id: string) => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={`${TABLE_GRID} items-center border-b border-zinc-100 px-5 py-4 text-sm transition last:border-0 hover:bg-zinc-50/80`}
    >
      <Link href={href} onClick={() => onOpenBuilder?.(row.id)} className="contents">
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-900">{row.name}</p>
          <p className="mt-0.5 text-xs text-zinc-500" title={row.description}>
            {truncateDescription(row.description)}
          </p>
        </div>
        <span className="text-zinc-700">{row.trigger}</span>
        <span>
          <StatusPill className={automationStatusBadgeClass(row.status)}>
            {row.status}
          </StatusPill>
        </span>
        <span className="text-zinc-500">{row.lastUpdated}</span>
      </Link>
      <AutomationRowMenu
        href={href}
        onOpenBuilder={() => onOpenBuilder?.(row.id)}
        onDelete={onDelete}
      />
    </div>
  );
}

function AutomationCard({
  row,
  href,
  onOpenBuilder,
  onDelete,
}: {
  row: AutomationListItem;
  href: string;
  onOpenBuilder?: (id: string) => void;
  onDelete?: () => void;
}) {
  const TriggerIcon = triggerIcon(row.trigger);
  const StatusIcon = statusIcon(row.status);

  return (
    <article className="relative rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm ring-1 ring-zinc-950/[0.03] transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <IconBadge
            icon={Workflow}
            className="border-0 bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-sm ring-0"
          />
          <div className="min-w-0">
            <Link
              href={href}
              onClick={() => onOpenBuilder?.(row.id)}
              className="font-semibold text-zinc-900 hover:underline"
            >
              {row.name}
            </Link>
            <p
              className="mt-1 line-clamp-2 text-xs text-zinc-500"
              title={row.description}
            >
              {truncateDescription(row.description)}
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-800">
              <TriggerIcon
                className={`size-3.5 ${triggerIconClass(row.trigger)}`}
                aria-hidden
                strokeWidth={ICON_STROKE}
              />
              {row.trigger}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <StatusPill
            className={`inline-flex items-center gap-1 ${automationStatusBadgeClass(row.status)}`}
          >
            <StatusIcon
              className="size-3 shrink-0"
              aria-hidden
              strokeWidth={ICON_STROKE}
            />
            {row.status}
          </StatusPill>
          <AutomationRowMenu
            href={href}
            onOpenBuilder={() => onOpenBuilder?.(row.id)}
            onDelete={onDelete}
          />
        </div>
      </div>
      <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        <Clock className="size-3.5 text-orange-600" aria-hidden strokeWidth={ICON_STROKE} />
        Updated {row.lastUpdated}
      </p>
      <Link
        href={href}
        onClick={() => onOpenBuilder?.(row.id)}
        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-violet-700"
      >
        Open builder
        <ChevronRight className="size-3.5" aria-hidden strokeWidth={ICON_STROKE} />
      </Link>
    </article>
  );
}