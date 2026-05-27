export const restaurantQueryKeys = {
  all: ["restaurant"] as const,
  myLists: () => [...restaurantQueryKeys.all, "my-list"] as const,
  myList: () => [...restaurantQueryKeys.myLists()] as const,
  details: () => [...restaurantQueryKeys.all, "detail"] as const,
  detail: (restaurantId: number) =>
    [...restaurantQueryKeys.details(), restaurantId] as const,
};
