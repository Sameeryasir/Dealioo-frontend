export const businessMemberQueryKeys = {
  all: ["business-members"] as const,
  list: (businessId: number) =>
    [...businessMemberQueryKeys.all, businessId] as const,
  me: (businessId: number) =>
    [...businessMemberQueryKeys.all, "me", businessId] as const,
};
