"use client";

import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { Skeleton } from "@/app/components/skeleton";
import {
  CreateAccountConfirmModal,
  type ExistingUserConflictState,
} from "@/app/components/super-admin/CreateAccountConfirmModal";
import {
  formatAbsoluteDate,
  formatRelative,
  humanizeLabel,
  SA_TABLE_PAGE_SIZE,
} from "@/app/components/super-admin/super-admin-list-helpers";
import styles from "@/app/components/SuperAdminDashboard.module.css";
import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { adminQueryKeys } from "@/app/services/admin/admin-query-keys";
import {
  ExistingUserConflictError,
  startAdminCustomerOnboarding,
  type CreateAccountFromMeetingInput,
} from "@/app/services/admin/customer-onboarding";
import {
  getAdminMeetingRequests,
  type AdminMeetingRequest,
} from "@/app/services/admin/get-admin-meeting-requests";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  CircleDot,
  ClipboardList,
  Clock3,
  Filter,
  Hash,
  MoreVertical,
  Rocket,
  Search,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type AccountTab = "all" | "ready" | "created";

const TAB_OPTIONS: Array<{ id: AccountTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "ready", label: "Ready to create" },
  { id: "created", label: "Account created" },
];

function isWonDeal(meeting: AdminMeetingRequest): boolean {
  return (
    meeting.attendance === "ATTENDED" && meeting.salesOutcome === "DEAL_WON"
  );
}

function accountState(meeting: AdminMeetingRequest): "ready" | "created" {
  return meeting.businessId ? "created" : "ready";
}

function matchesSearch(meeting: AdminMeetingRequest, search: string): boolean {
  if (!search) return true;
  const haystack = [
    meeting.firstName,
    meeting.lastName,
    meeting.email,
    meeting.businessName,
    meeting.businessCategory,
    meeting.phone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(search.toLowerCase());
}

function OnboardingTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <table className={styles.usersDirTable} aria-busy="true">
      <thead>
        <tr>
          <th style={{ width: "3rem" }}>
            <Skeleton className="h-3 w-4" />
          </th>
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
              <Skeleton className="h-4 w-5" />
            </td>
            <td>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-1.5 h-3 w-36" />
            </td>
            <td>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1.5 h-3 w-20" />
            </td>
            <td>
              <Skeleton className="h-4 w-24" />
            </td>
            <td>
              <Skeleton className="h-6 w-28 rounded-full" />
            </td>
            <td>
              <Skeleton className="h-4 w-20" />
            </td>
            <td>
              <Skeleton className="h-8 w-28 rounded-lg" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SuperAdminCustomerOnboardingPanel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<AccountTab>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [createAccountMeeting, setCreateAccountMeeting] =
    useState<AdminMeetingRequest | null>(null);
  const [existingUserConflict, setExistingUserConflict] =
    useState<ExistingUserConflictState | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(query.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onOverlayOpen = () => setFilterOpen(false);
    window.addEventListener("dealio:sa-overlay-open", onOverlayOpen);
    return () => {
      window.removeEventListener("dealio:sa-overlay-open", onOverlayOpen);
    };
  }, []);

  useEffect(() => {
    if (!filterOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest?.(`.${styles.usersDirFilterMenu}`)) return;
      if (target?.closest?.(`.${styles.usersDirFilterBtn}`)) return;
      setFilterOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [filterOpen]);

  const meetingsQuery = useQuery({
    queryKey: adminQueryKeys.meetings("all", 1, "", 200, "newest"),
    queryFn: () =>
      getAdminMeetingRequests({
        scope: "all",
        page: 1,
        limit: 200,
        sort: "newest",
      }),
    enabled: hasAuthSession(),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });

  const wonDeals = useMemo(() => {
    const items = meetingsQuery.data?.items ?? [];
    return items
      .filter(isWonDeal)
      .filter((meeting) => matchesSearch(meeting, debouncedSearch));
  }, [meetingsQuery.data?.items, debouncedSearch]);

  const counts = useMemo(() => {
    let ready = 0;
    let created = 0;
    for (const meeting of wonDeals) {
      if (accountState(meeting) === "created") created += 1;
      else ready += 1;
    }
    return { all: wonDeals.length, ready, created };
  }, [wonDeals]);

  const filteredItems = useMemo(() => {
    if (tab === "all") return wonDeals;
    return wonDeals.filter((meeting) => accountState(meeting) === tab);
  }, [wonDeals, tab]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / SA_TABLE_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice(
    (safePage - 1) * SA_TABLE_PAGE_SIZE,
    safePage * SA_TABLE_PAGE_SIZE,
  );
  const showingStart = total === 0 ? 0 : (safePage - 1) * SA_TABLE_PAGE_SIZE + 1;

  const loading = meetingsQuery.isLoading || meetingsQuery.isFetching;
  const errorMessage = meetingsQuery.error
    ? getApiErrorMessage(
        meetingsQuery.error,
        "Could not load customer onboarding.",
      )
    : null;

  const startMutation = useMutation({
    mutationFn: ({
      meetingId,
      input,
    }: {
      meetingId: number;
      input: CreateAccountFromMeetingInput;
    }) => startAdminCustomerOnboarding(meetingId, input),
    onSuccess: async (onboarding) => {
      setExistingUserConflict(null);
      setCreateAccountMeeting(null);

      if (onboarding.passwordSetupEmailSent) {
        const setupUrl = onboarding.setPasswordUrl;
        toast.success("Account created. Password setup email sent.", {
          duration: 12_000,
          description: (
            <div className="mt-1 flex w-full min-w-0 flex-col gap-2.5">
              <p className="break-words leading-snug">
                We emailed {onboarding.customerEmail} a link to set their
                password (same flow as Forgot password).
              </p>
              {setupUrl ? (
                <button
                  type="button"
                  className="self-start rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                  onClick={() => {
                    void navigator.clipboard.writeText(setupUrl);
                    toast.success("Setup link copied.");
                  }}
                >
                  Copy setup link
                </button>
              ) : null}
            </div>
          ),
        });
      } else if (onboarding.createdNewUser) {
        toast.success("Account created.", {
          description:
            "Could not send the password email automatically. Ask the customer to use Login → Forgot password, or resend from support.",
        });
      } else {
        toast.success("Linked existing user and finished business setup.");
      }

      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.meetingsRoot(),
      });
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.customerOnboardingsRoot(),
      });
      await meetingsQuery.refetch();
      if (onboarding.businessId) {
        router.push(`/business/${onboarding.businessId}/dashboard`);
        return;
      }
      toast.error(
        "User was saved but no business was linked. Refresh and retry create.",
      );
    },
    onError: (error) => {
      if (error instanceof ExistingUserConflictError) {
        setExistingUserConflict({
          message: error.message,
          existingUser: error.existingUser,
          businesses: error.businesses,
        });
        toast.message("This email already belongs to a user.", {
          description: "Choose whether to link them or change the email.",
        });
        return;
      }

      const message = getApiErrorMessage(
        error,
        "Could not create customer account.",
      );
      toast.error(message);
      if (/already created|refresh and try again/i.test(message)) {
        setCreateAccountMeeting(null);
        setExistingUserConflict(null);
        void meetingsQuery.refetch();
      }
    },
  });

  const openCreateAccount = (meeting: AdminMeetingRequest) => {
    if (accountState(meeting) === "created") {
      toast.error("An account was already created for this meeting.");
      return;
    }
    setExistingUserConflict(null);
    setCreateAccountMeeting(meeting);
  };

  const tabCounts: Record<AccountTab, number> = {
    all: counts.all,
    ready: counts.ready,
    created: counts.created,
  };

  return (
    <section
      className={`${styles.page} ${styles.usersDir} ${styles.usersDirBlackActions}`}
      aria-label="Customer Onboarding"
    >
      <div className={styles.inner}>
        <div className={styles.usersDirHero}>
          <div className={styles.heroCopy}>
            <h1 className={styles.title}>Customer Onboarding</h1>
            <p className={styles.subtitle}>
              Create customer accounts from won deals. Meetings stay for
              attendance and outcomes; account creation happens here.
            </p>
          </div>
          <div className={styles.usersDirHeroActions}>
            <label className={styles.usersDirSearch}>
              <Search className={styles.usersDirSearchIcon} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search customer, business, or email..."
                className={styles.usersDirSearchInput}
                aria-label="Search customer onboarding"
              />
            </label>
            <div className="relative">
              <button
                type="button"
                className={styles.usersDirFilterBtn}
                aria-expanded={filterOpen}
                aria-haspopup="menu"
                onClick={() => setFilterOpen((open) => !open)}
              >
                <Filter className="size-4" strokeWidth={2.25} aria-hidden />
                Filter
                {tab !== "all" ? (
                  <span className="ml-1 text-[0.72rem] font-semibold text-slate-500">
                    · {TAB_OPTIONS.find((option) => option.id === tab)?.label}
                  </span>
                ) : null}
              </button>
              {filterOpen ? (
                <div className={styles.usersDirFilterMenu} role="menu">
                  {TAB_OPTIONS.map((option) => {
                    const count = tabCounts[option.id];
                    const selected = tab === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={selected}
                        className={`${styles.usersDirFilterMenuItem} ${
                          selected ? styles.usersDirFilterMenuItemSelected : ""
                        }`}
                        onClick={() => {
                          setTab(option.id);
                          setPage(1);
                          setFilterOpen(false);
                        }}
                      >
                        <span>
                          {option.label}{" "}
                          <span className={styles.usersDirFilterMenuCount}>
                            ({count})
                          </span>
                        </span>
                        {selected ? (
                          <span className={styles.usersDirFilterMenuApplied}>
                            Applied
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <Link
              href="/admin/meeting-requests"
              className={styles.usersDirAddBtn}
            >
              Meeting requests
            </Link>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-4">
            <AsyncErrorRetry
              layout="inline"
              title="Something went wrong"
              message={errorMessage}
              onRetry={() => void meetingsQuery.refetch()}
            />
          </div>
        ) : null}

        <div className={styles.usersDirToolbar}>
          <p className={styles.usersDirFooterMeta}>
            Showing{" "}
            {TAB_OPTIONS.find((option) => option.id === tab)?.label ?? "All"}
          </p>
        </div>

        <div className={styles.usersDirTableCard}>
          <div className={styles.usersDirTableWrap}>
            {loading && wonDeals.length === 0 ? (
              <OnboardingTableSkeleton />
            ) : pageItems.length === 0 ? (
              <div className={styles.empty}>
                <ClipboardList className="mx-auto mb-2 size-6 text-slate-400" />
                <p>No won deals in this view.</p>
                <p className="mt-1 text-[0.8rem] text-slate-500">
                  Mark a meeting as Attended + Deal Won first, then come back
                  here to create the account.
                </p>
                <Link
                  href="/admin/meeting-requests"
                  className={`${styles.meetingTableLink} mt-3 inline-flex`}
                >
                  Go to Meeting requests
                </Link>
              </div>
            ) : (
              <table className={styles.usersDirTable}>
                <thead>
                  <tr>
                    <th style={{ width: "3rem" }}>
                      <span className={styles.meetingsThWithIcon}>
                        <Hash
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <span className="sr-only">Row number</span>
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <UserRound
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Customer
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <Building2
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Business
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <CalendarDays
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Meeting
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <CircleDot
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Account
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <Clock3
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Updated
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <MoreVertical
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((meeting, index) => {
                    const rowNumber = showingStart + index;
                    const created = accountState(meeting) === "created";
                    const fullName =
                      `${meeting.firstName} ${meeting.lastName}`.trim() ||
                      meeting.email;
                    return (
                      <tr key={meeting.id}>
                        <td>
                          <span className={styles.usersDirDateMain}>
                            {rowNumber}.
                          </span>
                        </td>
                        <td>
                          <div className={styles.bizName}>{fullName}</div>
                          <div className={styles.bizMeta}>{meeting.email}</div>
                        </td>
                        <td>
                          <div className={styles.bizName}>
                            {meeting.businessName || "—"}
                          </div>
                          <div className={styles.bizMeta}>
                            {humanizeLabel(meeting.businessCategory) || "—"}
                          </div>
                        </td>
                        <td>
                          <span className={styles.usersDirDateMain}>
                            {[meeting.scheduledDate, meeting.scheduledTime]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.usersDirStatusPill} ${
                              created ? "" : styles.usersDirStatusPillInactive
                            }`}
                          >
                            <span
                              className={styles.usersDirStatusDot}
                              aria-hidden
                            />
                            {created ? "Account created" : "Ready to create"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.createdStack}>
                            <span>{formatRelative(meeting.createdAt)}</span>
                            <span className={styles.createdSub}>
                              {formatAbsoluteDate(meeting.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className={styles.userMenuCell}>
                          {created ? (
                            <button
                              type="button"
                              className={styles.meetingSecondaryAction}
                              disabled={!meeting.businessId}
                              onClick={() => {
                                if (!meeting.businessId) return;
                                router.push(
                                  `/business/${meeting.businessId}/dashboard`,
                                );
                              }}
                            >
                              <Building2
                                className="size-3.5"
                                strokeWidth={2.25}
                                aria-hidden
                              />
                              Open business
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={styles.meetingPrimaryAction}
                              disabled={startMutation.isPending}
                              onClick={() => openCreateAccount(meeting)}
                            >
                              <Rocket
                                className="size-3.5"
                                strokeWidth={2.25}
                                aria-hidden
                              />
                              Create account
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <OffsetPagination
            page={safePage}
            totalPages={totalPages}
            total={total}
            limit={SA_TABLE_PAGE_SIZE}
            loading={loading}
            onPageChange={setPage}
            itemLabel="deals"
          />
        </div>
      </div>

      {createAccountMeeting &&
      accountState(createAccountMeeting) === "ready" ? (
        <CreateAccountConfirmModal
          meeting={createAccountMeeting}
          busy={startMutation.isPending}
          existingUserConflict={existingUserConflict}
          onClearExistingUserConflict={() => setExistingUserConflict(null)}
          onClose={() => {
            if (startMutation.isPending) return;
            setCreateAccountMeeting(null);
            setExistingUserConflict(null);
          }}
          onConfirm={(input) => {
            if (accountState(createAccountMeeting) === "created") {
              toast.error("An account was already created for this meeting.");
              setCreateAccountMeeting(null);
              setExistingUserConflict(null);
              return;
            }
            startMutation.mutate({
              meetingId: createAccountMeeting.id,
              input,
            });
          }}
        />
      ) : null}
    </section>
  );
}
