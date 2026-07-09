export const businessQueryKeys = {
  all: ["business"] as const,
  myLists: () => [...businessQueryKeys.all, "my-list"] as const,
  myList: (page = 1, search = "") =>
    [...businessQueryKeys.myLists(), page, search] as const,
  details: () => [...businessQueryKeys.all, "detail"] as const,
  detail: (businessId: number) =>
    [...businessQueryKeys.details(), businessId] as const,
};
