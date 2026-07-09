export const businessQueryKeys = {
  all: ["restaurant"] as const,
  myLists: () => [...businessQueryKeys.all, "my-list"] as const,
  myList: (page = 1, search = "") =>
    [...businessQueryKeys.myLists(), page, search] as const,
  details: () => [...businessQueryKeys.all, "detail"] as const,
  detail: (restaurantId: number) =>
    [...businessQueryKeys.details(), restaurantId] as const,
};
