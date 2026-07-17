import type { QueryClient } from "@tanstack/react-query";
import { businessQueryKeys } from "@/app/services/business/business-query-keys";
import {
  MY_RESTAURANTS_PAGE_SIZE,
  type AdminRestaurant,
  type PaginatedMyRestaurantsResponse,
} from "@/app/services/business/get-my-business";

/** Show a newly created business on /dashboard without waiting for a refetch. */
export function prependBusinessToMyListCache(
  queryClient: QueryClient,
  business: AdminRestaurant,
): void {
  if (business.id == null || business.id < 1) {
    return;
  }

  const listKey = businessQueryKeys.myList(1, "", MY_RESTAURANTS_PAGE_SIZE);
  queryClient.setQueryData<PaginatedMyRestaurantsResponse>(
    listKey,
    (current) => {
      if (!current) {
        return {
          data: [business],
          meta: {
            page: 1,
            limit: MY_RESTAURANTS_PAGE_SIZE,
            total: 1,
            totalPages: 1,
          },
        };
      }

      const withoutDuplicate = current.data.filter(
        (row) => row.id !== business.id,
      );
      const alreadyFirst =
        current.data[0]?.id === business.id &&
        current.data.length === withoutDuplicate.length + 1;

      if (alreadyFirst) {
        return current;
      }

      const wasNew = !current.data.some((row) => row.id === business.id);
      const nextTotal = wasNew ? current.meta.total + 1 : current.meta.total;
      const limit = current.meta.limit || MY_RESTAURANTS_PAGE_SIZE;

      return {
        data: [business, ...withoutDuplicate].slice(0, limit),
        meta: {
          ...current.meta,
          page: 1,
          total: nextTotal,
          totalPages: nextTotal === 0 ? 0 : Math.ceil(nextTotal / limit),
        },
      };
    },
  );

  if (business.id != null) {
    queryClient.setQueryData(
      businessQueryKeys.detail(business.id),
      business,
    );
  }
}
