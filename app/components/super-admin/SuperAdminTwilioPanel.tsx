"use client";

import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { Skeleton } from "@/app/components/skeleton";
import { AdminTwilioBuyNumberModal } from "@/app/components/super-admin/AdminTwilioBuyNumberModal";
import { formatAbsoluteDate } from "@/app/components/super-admin/super-admin-list-helpers";
import styles from "@/app/components/super-admin/SuperAdminTwilioPanel.module.css";
import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { adminQueryKeys } from "@/app/services/admin/admin-query-keys";
import { setAdminTwilioWebhook } from "@/app/services/admin/admin-twilio";
import { getAdminTwilioDashboard } from "@/app/services/admin/get-admin-twilio-dashboard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CircleDot,
  ImageIcon,
  Loader2,
  MessageSquare,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  User,
  Webhook,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function TwilioMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden role="img">
      <circle cx="12" cy="12" r="12" fill="#F22F46" />
      <circle cx="8.2" cy="8.2" r="2.15" fill="#fff" />
      <circle cx="15.8" cy="8.2" r="2.15" fill="#fff" />
      <circle cx="8.2" cy="15.8" r="2.15" fill="#fff" />
      <circle cx="15.8" cy="15.8" r="2.15" fill="#fff" />
    </svg>
  );
}

function formatCredits(
  amount: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (amount == null) return "—";
  const code = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
}

function TwilioOverviewSkeleton() {
  return (
    <div className={styles.overviewGrid} aria-busy="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <article key={index} className={styles.overviewCard}>
          <Skeleton className="size-9 rounded-xl" />
          <Skeleton className="mt-3 h-3 w-24" />
          <Skeleton className="mt-2 h-7 w-32" />
          <Skeleton className="mt-2 h-3 w-40" />
        </article>
      ))}
    </div>
  );
}

function TwilioNumbersTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <table className={styles.table} aria-busy="true" aria-label="Loading numbers">
      <thead>
        <tr>
          {Array.from({ length: 6 }).map((_, index) => (
            <th key={index}>
              <Skeleton className="h-3 w-16" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, index) => (
          <tr key={index}>
            <td>
              <Skeleton className="h-4 w-28" />
            </td>
            <td>
              <Skeleton className="h-4 w-20" />
            </td>
            <td>
              <Skeleton className="h-6 w-16 rounded-full" />
            </td>
            <td>
              <Skeleton className="h-4 w-24" />
            </td>
            <td>
              <Skeleton className="h-4 w-16" />
            </td>
            <td>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SuperAdminTwilioPanel() {
  const queryClient = useQueryClient();
  const [buyOpen, setBuyOpen] = useState(false);
  const [buySession, setBuySession] = useState(0);
  const [webhookPhone, setWebhookPhone] = useState<string | null>(null);
  const [webhookOverrides, setWebhookOverrides] = useState<
    Record<string, string>
  >({});

  const dashboardQuery = useQuery({
    queryKey: adminQueryKeys.twilioDashboard(),
    queryFn: getAdminTwilioDashboard,
    enabled: hasAuthSession(),
    staleTime: 30_000,
  });

  const data = dashboardQuery.data;
  const loading = dashboardQuery.isLoading || dashboardQuery.isFetching;
  const errorMessage = dashboardQuery.error
    ? getApiErrorMessage(dashboardQuery.error, "Could not load Twilio.")
    : null;
  const configured = Boolean(data?.configured);
  const defaultWebhookUrl = data?.defaultWebhookUrl?.trim() || "";

  const serverWebhookUrls = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of data?.numbers ?? []) {
      map[row.phoneNumber] =
        row.webhookUrl?.trim() || defaultWebhookUrl || "";
    }
    return map;
  }, [data?.numbers, defaultWebhookUrl]);

  const webhookMutation = useMutation({
    mutationFn: (input: { phoneNumber: string; smsUrl: string }) =>
      setAdminTwilioWebhook(input),
    onMutate: (input) => setWebhookPhone(input.phoneNumber),
    onSuccess: async (result) => {
      toast.success(`Webhook saved on ${result.phoneNumber}.`);
      setWebhookOverrides((current) => {
        const next = { ...current };
        delete next[result.phoneNumber];
        return next;
      });
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.twilioDashboard(),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not configure webhook."));
    },
    onSettled: () => setWebhookPhone(null),
  });

  return (
    <section
      className={styles.twilioShell}
      aria-label="Twilio platform overview"
    >
      <div className={styles.inner}>
        <header className={styles.hero}>
          <div className={styles.heroRow}>
            <div>
              <div className={styles.brandRow}>
                <TwilioMark className="h-9 w-9 shrink-0" />
                <h1 className={styles.title}>Twilio · Dealioo</h1>
              </div>
              <p className={styles.subtitle}>
                Account overview, numbers, webhook setup, and buy a new number.
              </p>
            </div>
            <div className={styles.heroActions}>
              <span
                className={`${styles.statusPill} ${
                  configured ? styles.statusLive : styles.statusOff
                }`}
              >
                <CircleDot className="size-3" strokeWidth={2.5} aria-hidden />
                {configured ? "Connected" : "Not configured"}
              </span>
              <button
                type="button"
                className={styles.refreshBtn}
                disabled={loading}
                onClick={() => void dashboardQuery.refetch()}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Refresh
              </button>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          {errorMessage ? (
            <div className="mb-4">
              <AsyncErrorRetry
                layout="inline"
                title="Something went wrong"
                message={errorMessage}
                onRetry={() => void dashboardQuery.refetch()}
              />
            </div>
          ) : null}

          {data?.error ? (
            <div className="mb-4">
              <AsyncErrorRetry
                layout="inline"
                title="Twilio warning"
                message={data.error}
                onRetry={() => void dashboardQuery.refetch()}
              />
            </div>
          ) : null}

          {loading && !data ? (
            <TwilioOverviewSkeleton />
          ) : (
            <div className={styles.overviewGrid}>
              <article className={styles.overviewCard}>
                <div className={styles.overviewIcon} aria-hidden>
                  <User className="size-4" />
                </div>
                <p className={styles.creditsLabel}>Account owner</p>
                <p className={styles.overviewValue}>
                  {data?.accountOwnerName || "—"}
                </p>
                <p className={styles.creditsHint}>
                  Friendly name on the Twilio account
                </p>
              </article>

              <article className={styles.overviewCard}>
                <div className={styles.overviewIcon} aria-hidden>
                  <TwilioMark className="h-4 w-4" />
                </div>
                <p className={styles.creditsLabel}>Credits left</p>
                <p className={styles.creditsValue}>
                  {formatCredits(
                    data?.balance?.amount,
                    data?.balance?.currency,
                  )}
                </p>
                <p className={styles.creditsHint}>
                  Current balance on this Twilio account
                </p>
              </article>

              <article className={styles.overviewCard}>
                <div className={styles.overviewIcon} aria-hidden>
                  <Phone className="size-4" />
                </div>
                <p className={styles.creditsLabel}>Phone numbers</p>
                <p className={styles.creditsValue}>
                  {data?.counts.phoneNumbers ?? 0}
                </p>
                <p className={styles.creditsHint}>
                  {data?.counts.assigned ?? 0} assigned ·{" "}
                  {data?.counts.unassigned ?? 0} unassigned
                </p>
              </article>
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionHeadText}>
                <h2 className={styles.sectionTitle}>Numbers on this account</h2>
              </div>
              <button
                type="button"
                className={styles.addNumberBtn}
                disabled={!configured}
                onClick={() => {
                  setBuySession((n) => n + 1);
                  setBuyOpen(true);
                }}
                aria-label="Buy a new number"
                title="Buy a new number"
              >
                <Plus className="size-5" strokeWidth={2.5} aria-hidden />
              </button>
            </div>
            <div className={styles.card}>
              <div className={styles.tableWrap}>
                {loading && !data ? (
                  <TwilioNumbersTableSkeleton />
                ) : !data?.numbers.length ? (
                  <p className={styles.empty}>
                    No phone numbers on this Twilio account yet.
                  </p>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Phone number</th>
                        <th>Label</th>
                        <th>Status</th>
                        <th>Capabilities</th>
                        <th>Address req.</th>
                        <th>Webhook URL</th>
                        <th>Webhook</th>
                        <th>Business</th>
                        <th>Created</th>
                        <th>Connected</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.numbers.map((row) => {
                        const saving =
                          webhookPhone === row.phoneNumber &&
                          webhookMutation.isPending;
                        const draftUrl =
                          webhookOverrides[row.phoneNumber] ??
                          serverWebhookUrls[row.phoneNumber] ??
                          "";
                        const canSave = Boolean(draftUrl.trim());
                        return (
                          <tr key={row.phoneNumber}>
                            <td>
                              <div className={styles.userCell}>
                                <span className={styles.avatar} aria-hidden>
                                  <Phone className="size-3.5" />
                                </span>
                                <div className={styles.cellMain}>
                                  {row.phoneNumber}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={styles.cellMeta}>
                                {row.label || "—"}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`${styles.badge} ${
                                  (row.status || "").toLowerCase() ===
                                    "in-use" ||
                                  (row.status || "").toLowerCase() === "active"
                                    ? styles.badgeReady
                                    : styles.badgeMuted
                                }`}
                              >
                                {row.status || "—"}
                              </span>
                            </td>
                            <td>
                              <div
                                className={styles.capRow}
                                title="Voice · SMS · MMS · Fax"
                              >
                                <span
                                  className={
                                    row.capabilities.voice
                                      ? styles.capOn
                                      : styles.capOff
                                  }
                                  aria-label={
                                    row.capabilities.voice
                                      ? "Voice yes"
                                      : "Voice no"
                                  }
                                >
                                  <Phone className="size-3.5" />
                                </span>
                                <span
                                  className={
                                    row.capabilities.sms
                                      ? styles.capOn
                                      : styles.capOff
                                  }
                                  aria-label={
                                    row.capabilities.sms ? "SMS yes" : "SMS no"
                                  }
                                >
                                  <MessageSquare className="size-3.5" />
                                </span>
                                <span
                                  className={
                                    row.capabilities.mms
                                      ? styles.capOn
                                      : styles.capOff
                                  }
                                  aria-label={
                                    row.capabilities.mms ? "MMS yes" : "MMS no"
                                  }
                                >
                                  <ImageIcon className="size-3.5" />
                                </span>
                                <span
                                  className={
                                    row.capabilities.fax
                                      ? styles.capOn
                                      : styles.capOff
                                  }
                                  aria-label={
                                    row.capabilities.fax ? "Fax yes" : "Fax no"
                                  }
                                >
                                  <Printer className="size-3.5" />
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={styles.cellMeta}>
                                {row.addressRequirement || "None"}
                              </span>
                            </td>
                            <td className={styles.webhookUrlCell}>
                              <input
                                className={styles.webhookInput}
                                type="url"
                                value={draftUrl}
                                disabled={saving || webhookMutation.isPending}
                                placeholder="https://…"
                                aria-label={`Webhook URL for ${row.phoneNumber}`}
                                onChange={(event) =>
                                  setWebhookOverrides((current) => ({
                                    ...current,
                                    [row.phoneNumber]: event.target.value,
                                  }))
                                }
                              />
                            </td>
                            <td>
                              <span
                                className={`${styles.badge} ${
                                  row.webhookConfigured
                                    ? styles.badgeReady
                                    : styles.badgeMuted
                                }`}
                              >
                                <CircleDot className="size-3" aria-hidden />
                                {row.webhookConfigured
                                  ? "Configured"
                                  : "Missing"}
                              </span>
                            </td>
                            <td>
                              {row.businessName ? (
                                <span className={styles.cellMain}>
                                  {row.businessName}
                                </span>
                              ) : (
                                <span
                                  className={`${styles.badge} ${styles.badgeMuted}`}
                                >
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td>
                              <span className={styles.cellMeta}>
                                {row.dateCreated
                                  ? formatAbsoluteDate(row.dateCreated)
                                  : "—"}
                              </span>
                            </td>
                            <td>
                              <span className={styles.cellMeta}>
                                {row.connectedAt
                                  ? formatAbsoluteDate(row.connectedAt)
                                  : "—"}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={styles.webhookBtn}
                                disabled={
                                  !configured ||
                                  !canSave ||
                                  saving ||
                                  webhookMutation.isPending
                                }
                                onClick={() => {
                                  const smsUrl = draftUrl.trim();
                                  if (!/^https:\/\//i.test(smsUrl)) {
                                    toast.error(
                                      "Webhook URL must start with https://",
                                    );
                                    return;
                                  }
                                  try {
                                    const parsed = new URL(smsUrl);
                                    const host = parsed.hostname.toLowerCase();
                                    if (
                                      host === "localhost" ||
                                      host === "127.0.0.1" ||
                                      host.endsWith(".local")
                                    ) {
                                      toast.error(
                                        "Webhook URL cannot point to a local host.",
                                      );
                                      return;
                                    }
                                  } catch {
                                    toast.error("Webhook URL is not valid.");
                                    return;
                                  }
                                  webhookMutation.mutate({
                                    phoneNumber: row.phoneNumber,
                                    smsUrl,
                                  });
                                }}
                              >
                                {saving ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Webhook className="size-3.5" />
                                )}
                                {saving
                                  ? "Saving…"
                                  : row.webhookConfigured
                                    ? "Save webhook"
                                    : "Configure webhook"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdminTwilioBuyNumberModal
        key={buySession}
        open={buyOpen}
        configured={configured}
        onClose={() => setBuyOpen(false)}
        onPurchased={async () => {
          await queryClient.invalidateQueries({
            queryKey: adminQueryKeys.twilioDashboard(),
          });
        }}
      />
    </section>
  );
}
