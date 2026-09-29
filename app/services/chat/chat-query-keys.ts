export const chatQueryKeys = {
  all: ["chat"] as const,
  customersRoot: (businessId: number) =>
    [...chatQueryKeys.all, "customers", businessId] as const,
  customers: (businessId: number, page: number) =>
    [...chatQueryKeys.customersRoot(businessId), page] as const,
  conversationsRoot: (businessId: number) =>
    [...chatQueryKeys.all, "conversation", businessId] as const,
  conversation: (businessId: number, customerId: number) =>
    [...chatQueryKeys.conversationsRoot(businessId), customerId] as const,
};
