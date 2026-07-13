"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeCheck,
  CirclePause,
  Clock,
  ExternalLink,
  FilePenLine,
  MoreHorizontal,
  Trash2,
  Plus,
  SearchX,
  Workflow,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { standardEase } from "@/app/lib/motion";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { PanelEmptyState } from "@/app/components/shared/PanelEmptyState";
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
import type {
  AutomationFilter,
  AutomationListItem,
  AutomationStatus,
} from "@/app/components/automation/types";
import {
  createAutomation,
  deleteAutomation,
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

const ICON_STROKE = 2.5;

const FILTERS: { id: AutomationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "published", label: "Published" },
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
];

const thClass = "funnel-automations-th whitespace-nowrap text-left align-middle";
const tdClass = "funnel-automations-td text-left align-middle text-zinc-700";

function AutomationsColumnHead({
  icon: Icon,
  longLabel,
  shortLabel,
  iconClassName,
}: {
  icon: LucideIcon;
  longLabel: string;
  shortLabel: string;
  iconClassName: string;
}) {
  return (
    <span className="funnel-automations-col-head inline-flex items-center gap-1.5">
      <Icon
        className={`size-3.5 shrink-0 ${iconClassName}`}
        aria-hidden
        strokeWidth={ICON_STROKE}
      />
      <span className="funnel-automations-col-head__long text-[0.65rem] font-bold uppercase tracking-[0.08em] text-zinc-800">
        {longLabel}
      </span>
      <span className="funnel-automations-col-head__short text-[0.62rem] font-bold uppercase tracking-[0.06em] text-zinc-800">
        {shortLabel}
      </span>
    </span>
  );
}

function AutomationsEmbeddedHeader({
  total,
  onCreate,
}: {
  total: number;
  onCreate: () => void;
}) {
  return (
    <div className="funnel-automations-hero-shell">
      <div className="funnel-automations-hero-shell__glow" aria-hidden />
      <div className="funnel-automations-header">
        <div className="funnel-automations-header__lead">
          <span className="funnel-automations-header__icon" aria-hidden>
            <Workflow className="size-5" strokeWidth={ICON_STROKE} />
          </span>
          <div className="funnel-automations-header__copy">
            <h2 className="funnel-automations-header__title">Automations</h2>
            <p className="funnel-automations-header__subtitle">
              Workflows for this campaign
            </p>
          </div>
        </div>
        <div className="funnel-automations-header__actions">
          <span className="funnel-automations-header__total">{total} total</span>
          <CreateAutomationButton onClick={onCreate} />
        </div>
      </div>
    </div>
  );
}

function AutomationsToolbarHint({ count }: { count: number }) {
  if (count === 0) return null;

  const message =
    count === 1
      ? "Your workflow is ready — open it to configure steps and messages."
      : `${count} automations in this campaign`;

  return <p className="funnel-automations-toolbar-hint">{message}</p>;
}

function automationStatusIcon(status: AutomationStatus) {
  switch (status) {
    case "active":
      return BadgeCheck;
    case "published":
      return Activity;
    case "paused":
      return CirclePause;
    case "draft":
    default:
      return FilePenLine;
  }
}

function AutomationStatusBadge({ status }: { status: AutomationStatus }) {
  const Icon = automationStatusIcon(status);
  return (
    <StatusPill
      className={`funnel-automations-status-pill funnel-automations-status-pill--${status} ${automationStatusBadgeClass(status)}`}
    >
      <Icon className="size-3 shrink-0" aria-hidden strokeWidth={ICON_STROKE} />
      <span className="capitalize">{status}</span>
    </StatusPill>
  );
}

function CreateAutomationButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`funnel-automations-create-btn inline-flex shrink-0 items-center justify-center gap-1.5 transition hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      <Plus className="size-4" aria-hidden />
      <span>Create Automation</span>
    </button>
  );
}

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
  onOpenBuilder?: (automationId: string, bootstrapping?: boolean) => void;
  embedded?: boolean;
} = {}) {
  const route = useAutomationRouteContext();
  const router = useRouter();
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
      if (campaignId != null && row.campaignId !== campaignId) return false;
      if (filter !== "all" && row.status !== filter) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.trigger.toLowerCase().includes(q)
      );
    });
  }, [items, query, filter, campaignId]);

  const builderHref = (row: AutomationListItem) => {
    const base = `/business/${businessId}/dashboard/automations/${
      row.numericId != null ? String(row.numericId) : row.id
    }`;
    if (funnelId != null && funnelId >= 1) {
      return `${base}?funnelId=${encodeURIComponent(String(funnelId))}`;
    }
    return base;
  };

  const openCreateModal = useCallback(() => {
    const context = validateAutomationCreateContext(createContextInput);
    if (!context.ok) {
      toast.error(context.message);
      return;
    }
    setModalOpen(true);
  }, [createContextInput]);

  const openBuilderAfterCreate = useCallback(
    (automationId: string, bootstrapping = false) => {
      if (onOpenBuilder) {
        onOpenBuilder(automationId, bootstrapping);
        return;
      }

      if (businessId == null) {
        return;
      }

      const params = new URLSearchParams();
      if (funnelId != null && funnelId >= 1) {
        params.set("funnelId", String(funnelId));
      }
      if (bootstrapping) {
        params.set("bootstrapping", "1");
      }

      const query = params.toString();
      router.push(
        `/business/${businessId}/dashboard/automations/${automationId}${
          query ? `?${query}` : ""
        }`,
      );
    },
    [businessId, funnelId, onOpenBuilder, router],
  );

  const modals = (
    <>
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

          setModalOpen(false);
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

            const next = mapAutomationToListItem(created);
            if (businessId != null) {
              queryClient.setQueryData<AutomationListItem[]>(
                automationQueryKeys.list(businessId),
                (prev) => [next, ...(prev ?? [])],
              );
            }

            syncAutomationQueryCache(queryClient, created);
            openBuilderAfterCreate(String(created.id), Boolean(template));

            if (template) {
              void applyAutomationTemplate(created.id, template)
                .then((withGraph) => {
                  syncAutomationQueryCache(queryClient, withGraph);
                  toast.success(`"${template.name}" is ready.`);
                })
                .catch((err) => {
                  toastApiError(err, "Could not apply the template steps.");
                });
            } else {
              toast.success("Automation created.");
            }
          } catch (err) {
            toastApiError(err, "Could not create automation.");
            setModalOpen(true);
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
    </>
  );

  const listBody = (
    <div className="funnel-automations-content">
      {embedded ? (
        <AutomationsEmbeddedHeader
          total={filtered.length}
          onCreate={openCreateModal}
        />
      ) : (
        <div className="funnel-automations-hero flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
              <p className="mt-2 max-w-xl text-sm text-amber-800">
                {createBlockedMessage}
              </p>
            ) : null}
          </div>
          <CreateAutomationButton onClick={openCreateModal} />
        </div>
      )}

      {embedded && createBlockedMessage ? (
        <p className="m-0 text-[0.78rem] font-medium text-amber-800">
          {createBlockedMessage}
        </p>
      ) : null}

      <div className="funnel-automations-toolbar-card">
        <div className="funnel-automations-toolbar">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search automations…"
            className="funnel-automations-toolbar__search w-full sm:max-w-md"
          />
          <AutomationFilterDropdown
            value={filter}
            options={FILTERS}
            onChange={setFilter}
            className="funnel-automations-toolbar__filter w-full sm:w-44"
          />
          {!embedded ? (
            <CreateAutomationButton
              onClick={openCreateModal}
              className="funnel-automations-toolbar__create w-full sm:w-auto"
            />
          ) : null}
        </div>
        {embedded ? <AutomationsToolbarHint count={filtered.length} /> : null}
      </div>

      {loadError ? (
        <AsyncErrorRetry
          message={loadError}
          onRetry={() => loadAutomations()}
        />
      ) : loading ? (
        <AutomationListSkeleton />
      ) : null}

      {!loading && !loadError && filtered.length > 0 ? (
        <motion.div
          key="automations-table"
          className="funnel-automations-table-stage"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, ease: standardEase }}
        >
          <AutomationsTableSection
            rows={filtered}
            builderHref={builderHref}
            onOpenBuilder={onOpenBuilder}
            onDelete={(row) => setDeleteTarget(row)}
          />
        </motion.div>
      ) : null}

      {!loading && !loadError && filtered.length === 0 ? (
        <PanelEmptyState
          className="funnel-automations-empty px-4 py-14"
          icon={SearchX}
          title={
            campaignId != null
              ? "No automations for this campaign"
              : "No automations match your search"
          }
          description={
            campaignId != null
              ? "Default automations are created when you add a campaign. Create one here if you need more."
              : "Try a different keyword or filter to find your workflows."
          }
        />
      ) : null}
    </div>
  );

  if (businessId == null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-sm text-zinc-700">
        <p>Invalid link, business id not found in the URL.</p>
      </div>
    );
  }

  if (embedded) {
    return (
      <>
        <div className="campaign-immersive-automations funnel-automations-root">
          <div className="funnel-automations-panel">
            <div className="funnel-automations-body">{listBody}</div>
          </div>
        </div>
        {modals}
      </>
    );
  }

  return (
    <>
      <div className="funnel-automations-root min-h-0 flex-1 overflow-y-auto bg-zinc-50 [scrollbar-gutter:stable]">
        <div className="funnel-automations-standalone mx-auto w-full max-w-[min(100%,77.62rem)] px-4 py-8 sm:px-8 lg:px-10">
          {listBody}
        </div>
      </div>
      {modals}
    </>
  );
}

function AutomationsTableSection({
  rows,
  builderHref,
  onOpenBuilder,
  onDelete,
}: {
  rows: AutomationListItem[];
  builderHref: (row: AutomationListItem) => string;
  onOpenBuilder?: (automationId: string, bootstrapping?: boolean) => void;
  onDelete: (row: AutomationListItem) => void;
}) {
  return (
    <div className="funnel-automations-surface">
      <div className="funnel-automations-surface-accent" aria-hidden />
      <p className="funnel-automations-scroll-hint">
        Swipe sideways to see all columns
      </p>

      <div className="funnel-automations-table-wrap">
        <table className="funnel-automations-table">
          <colgroup>
            <col className="funnel-automations-col funnel-automations-col--name" />
            <col className="funnel-automations-col funnel-automations-col--trigger" />
            <col className="funnel-automations-col funnel-automations-col--status" />
            <col className="funnel-automations-col funnel-automations-col--updated" />
            <col className="funnel-automations-col funnel-automations-col--actions" />
          </colgroup>
          <thead>
            <tr className="funnel-automations-table-head">
              <th className={`${thClass} funnel-automations-th--name`}>
                <AutomationsColumnHead
                  icon={Workflow}
                  longLabel="Automation name"
                  shortLabel="Name"
                  iconClassName="funnel-automations-col-icon funnel-automations-col-icon--primary"
                />
              </th>
              <th className={`${thClass} funnel-automations-th--trigger`}>
                <AutomationsColumnHead
                  icon={Zap}
                  longLabel="Trigger"
                  shortLabel="Trigger"
                  iconClassName="funnel-automations-col-icon funnel-automations-col-icon--trigger"
                />
              </th>
              <th className={`${thClass} funnel-automations-th--status`}>
                <AutomationsColumnHead
                  icon={Activity}
                  longLabel="Status"
                  shortLabel="Status"
                  iconClassName="funnel-automations-col-icon funnel-automations-col-icon--status"
                />
              </th>
              <th className={`${thClass} funnel-automations-th--updated`}>
                <AutomationsColumnHead
                  icon={Clock}
                  longLabel="Last updated"
                  shortLabel="Updated"
                  iconClassName="funnel-automations-col-icon funnel-automations-col-icon--muted"
                />
              </th>
              <th className={`${thClass} funnel-automations-th--actions`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const href = builderHref(row);
              return (
                <tr
                  key={row.id}
                  className="funnel-automations-table-row border-b border-[#e8edf5] bg-white last:border-0"
                >
                  <td className={`${tdClass} funnel-automations-td--name`}>
                    <Link
                      href={href}
                      onClick={() => onOpenBuilder?.(row.id)}
                      className="funnel-automations-name-link block min-w-0"
                    >
                      <span className="funnel-automations-name-row">
                        <span className="funnel-automations-name-icon" aria-hidden>
                          <Workflow className="size-3.5" strokeWidth={ICON_STROKE} />
                        </span>
                        <span className="min-w-0">
                          <p className="truncate font-semibold text-[#07111f]">{row.name}</p>
                          <p
                            className="funnel-automations-desc mt-0.5 truncate text-xs text-[#64748b]"
                            title={row.description}
                          >
                            {truncateDescription(row.description)}
                          </p>
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className={`${tdClass} funnel-automations-td--trigger whitespace-nowrap`}>
                    <Link
                      href={href}
                      onClick={() => onOpenBuilder?.(row.id)}
                      className="funnel-automations-trigger-pill"
                    >
                      <Zap className="size-3 shrink-0" aria-hidden strokeWidth={ICON_STROKE} />
                      {row.trigger}
                    </Link>
                  </td>
                  <td className={`${tdClass} funnel-automations-td--status whitespace-nowrap`}>
                    <Link href={href} onClick={() => onOpenBuilder?.(row.id)}>
                      <AutomationStatusBadge status={row.status} />
                    </Link>
                  </td>
                  <td className={`${tdClass} funnel-automations-td--updated whitespace-nowrap text-zinc-500`}>
                    <Link href={href} onClick={() => onOpenBuilder?.(row.id)}>
                      {row.lastUpdated}
                    </Link>
                  </td>
                  <td className={`${tdClass} funnel-automations-td--actions`}>
                    <AutomationRowMenu
                      href={href}
                      onOpenBuilder={() => onOpenBuilder?.(row.id)}
                      onDelete={() => onDelete(row)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AutomationListSkeleton() {
  return (
    <div
      className="funnel-automations-skeleton"
      aria-busy="true"
      aria-label="Loading automations"
    >
      <div className="funnel-automations-surface overflow-hidden">
        <div className="funnel-automations-table-head funnel-automations-skeleton-head px-5 py-3.5">
          <div className="flex gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} funnel className="h-3 w-16" />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, row) => (
          <div
            key={row}
            className="flex items-center gap-4 border-b border-zinc-100 px-5 py-4 last:border-0"
          >
            <div className="min-w-0 flex-1 space-y-2">
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
            className="size-4 shrink-0 text-[#1877f2]"
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
        className="funnel-automations-row-menu-btn flex size-8 cursor-pointer items-center justify-center rounded-lg text-[#64748b] outline-none transition focus-visible:ring-2 focus-visible:ring-[#1877f2]/25"
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