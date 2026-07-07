export const chatQueryKeys = {
  all: ["chat"] as const,
  customersRoot: (restaurantId: number) =>
    [...chatQueryKeys.all, "customers", restaurantId] as const,
  customers: (restaurantId: number, page: number) =>
    [...chatQueryKeys.customersRoot(restaurantId), page] as const,
  conversationsRoot: (restaurantId: number) =>
    [...chatQueryKeys.all, "conversation", restaurantId] as const,
  conversation: (restaurantId: number, customerId: number) =>
    [...chatQueryKeys.conversationsRoot(restaurantId), customerId] as const,
};
