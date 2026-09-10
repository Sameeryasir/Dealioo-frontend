export const businessMemberQueryKeys = {
  all: ["business-members"] as const,
  lists: (businessId: number) =>
    [...businessMemberQueryKeys.all, businessId] as const,
  list: (
    businessId: number,
    options?: { page?: number; limit?: number; search?: string },
  ) =>
    [
      ...businessMemberQueryKeys.lists(businessId),
      options?.page ?? 1,
      options?.limit ?? 8,
      options?.search?.trim() ?? "",
    ] as const,
  me: (businessId: number) =>
    [...businessMemberQueryKeys.all, "me", businessId] as const,
};
