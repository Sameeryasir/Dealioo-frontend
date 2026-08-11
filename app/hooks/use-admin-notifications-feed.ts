"use client";

/**
 * Super Admin notification feed.
 * What: infinite All / Unread lists with Load more (append), not page replace.
 * Why: a notification drawer should feel like an activity stream.
 * Related: GET /admin/notifications, PATCH read + read-all.
 */

import { hasAuthSession } from "@/app/lib/auth-session";
import { subscribeAdminNotifications } from "@/app/lib/pusher-client";
import { adminNotificationQueryKeys } from "@/app/services/admin/admin-notification-query-keys";
import {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  type AdminNotificationItem,
  type AdminNotificationStatus,
  type AdminNotificationsResponse,
} from "@/app/services/admin/get-admin-notifications";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useEffect } from "react";

export const ADMIN_NOTIFICATION_PAGE_SIZE = 10;

type NotificationInfiniteData = InfiniteData<
  AdminNotificationsResponse,
  number
>;

function flattenItems(
  data: NotificationInfiniteData | undefined,
): AdminNotificationItem[] {
  if (!data) return [];
  const seen = new Set<string>();
  const items: AdminNotificationItem[] = [];
  for (const page of data.pages) {
    for (const item of page.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }
  return items;
}

function latestUnreadCount(
  data: NotificationInfiniteData | undefined,
): number {
  if (!data?.pages.length) return 0;
  return Number(data.pages[data.pages.length - 1]?.unreadCount) || 0;
}

function setUnreadOnPages(
  data: NotificationInfiniteData,
  unreadCount: number,
): NotificationInfiniteData {
  return {
    ...data,
    pages: data.pages.map((page) => ({ ...page, unreadCount })),
  };
}

function prependCreated(
  old: NotificationInfiniteData | undefined,
  item: AdminNotificationItem,
): NotificationInfiniteData {
  if (!old || old.pages.length === 0) {
    return {
      pageParams: [1],
      pages: [
        {
          items: [item],
          unreadCount: item.isRead ? 0 : 1,
          meta: {
            page: 1,
            limit: ADMIN_NOTIFICATION_PAGE_SIZE,
            total: 1,
            totalPages: 1,
          },
        },
      ],
    };
  }
  if (old.pages.some((page) => page.items.some((row) => row.id === item.id))) {
    return old;
  }
  const first = old.pages[0];
  return {
    ...old,
    pages: [
      {
        ...first,
        items: [item, ...first.items],
        unreadCount: first.unreadCount + (item.isRead ? 0 : 1),
        meta: {
          ...first.meta,
          total: first.meta.total + 1,
        },
      },
      ...old.pages.slice(1),
    ],
  };
}

export function useAdminNotificationsFeed(tab: AdminNotificationStatus) {
  const queryClient = useQueryClient();
  const signedIn = hasAuthSession();

  const readQuery = useInfiniteQuery({
    queryKey: adminNotificationQueryKeys.list("read"),
    queryFn: ({ pageParam }) =>
      getAdminNotifications({
        page: pageParam,
        limit: ADMIN_NOTIFICATION_PAGE_SIZE,
        status: "read",
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    enabled: signedIn,
  });

  const unreadQuery = useInfiniteQuery({
    queryKey: adminNotificationQueryKeys.list("unread"),
    queryFn: ({ pageParam }) =>
      getAdminNotifications({
        page: pageParam,
        limit: ADMIN_NOTIFICATION_PAGE_SIZE,
        status: "unread",
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    enabled: signedIn,
  });

  const activeQuery = tab === "unread" ? unreadQuery : readQuery;
  const items = flattenItems(activeQuery.data);
  const unreadCount = Math.max(
    latestUnreadCount(readQuery.data),
    latestUnreadCount(unreadQuery.data),
  );

  // --- Live inserts ---
  // Why: new platform alerts should appear at the top without refetching every page.
  useEffect(() => {
    return subscribeAdminNotifications((item) => {
      // New alerts start unread, so they belong on the Unread tab only.
      if (!item.isRead) {
        queryClient.setQueryData(
          adminNotificationQueryKeys.list("unread"),
          (old: NotificationInfiniteData | undefined) =>
            prependCreated(old, item),
        );
      } else {
        queryClient.setQueryData(
          adminNotificationQueryKeys.list("read"),
          (old: NotificationInfiniteData | undefined) =>
            prependCreated(old, item),
        );
      }
    });
  }, [queryClient]);

  const markOneMutation = useMutation({
    mutationFn: async (item: AdminNotificationItem) => {
      const result = await markAdminNotificationRead(item.id);
      return { ...result, item: { ...item, isRead: true } };
    },
    onSuccess: (result) => {
      const unread = result.unreadCount;
      queryClient.setQueryData(
        adminNotificationQueryKeys.list("read"),
        (old: NotificationInfiniteData | undefined) => {
          const next = prependCreated(old, result.item);
          return setUnreadOnPages(next, unread);
        },
      );
      queryClient.setQueryData(
        adminNotificationQueryKeys.list("unread"),
        (old: NotificationInfiniteData | undefined) => {
          if (!old) return old;
          return setUnreadOnPages(
            {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.filter((row) => row.id !== result.id),
              })),
            },
            unread,
          );
        },
      );
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllAdminNotificationsRead,
    onSuccess: () => {
      // Business rule: mark-all updates every unread row in the DB, not just loaded pages.
      void queryClient.invalidateQueries({
        queryKey: adminNotificationQueryKeys.list("read"),
      });
      queryClient.setQueryData(
        adminNotificationQueryKeys.list("unread"),
        (old: NotificationInfiniteData | undefined) => {
          if (!old) return old;
          return {
            pageParams: [1],
            pages: [
              {
                items: [],
                unreadCount: 0,
                meta: {
                  page: 1,
                  limit: ADMIN_NOTIFICATION_PAGE_SIZE,
                  total: 0,
                  totalPages: 0,
                },
              },
            ],
          };
        },
      );
    },
  });

  return {
    items,
    unreadCount,
    isLoading: activeQuery.isLoading && items.length === 0,
    isFetchingNextPage: activeQuery.isFetchingNextPage,
    hasNextPage: Boolean(activeQuery.hasNextPage),
    loadMore: () => {
      if (!activeQuery.hasNextPage || activeQuery.isFetchingNextPage) return;
      void activeQuery.fetchNextPage();
    },
    markOneRead: (item: AdminNotificationItem) =>
      markOneMutation.mutateAsync(item),
    markAllRead: () => markAllMutation.mutateAsync(),
    markingAllRead: markAllMutation.isPending,
    markingReadId: markOneMutation.isPending
      ? (markOneMutation.variables ?? null)
      : null,
    refresh: () =>
      queryClient.invalidateQueries({
        queryKey: adminNotificationQueryKeys.all,
      }),
  };
}
