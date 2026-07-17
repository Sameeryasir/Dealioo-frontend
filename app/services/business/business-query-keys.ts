export const businessQueryKeys = {
  all: ["business"] as const,
  myLists: () => [...businessQueryKeys.all, "my-list"] as const,
  // Include limit so profile (limit 1) and dashboard (limit 8) do not share cache rows.
  myList: (page = 1, search = "", limit = 8) =>
    [...businessQueryKeys.myLists(), page, search, limit] as const,
  details: () => [...businessQueryKeys.all, "detail"] as const,
  detail: (businessId: number) =>
    [...businessQueryKeys.details(), businessId] as const,
};
