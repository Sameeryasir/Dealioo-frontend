export function parseGrantedScopes(scopes: string[] | null | undefined): Set<string> {
  return new Set((scopes ?? []).map((scope) => scope.trim()).filter(Boolean));
}

export function formatFacebookScopeLabel(scopeId: string): string {
  return scopeId
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildFacebookScopeDisplayList(params: {
  requestedScopes?: string[];
  grantedScopes?: string[];
  requiredScopes?: string[];
  missingRequiredScopes?: string[];
}): string[] {
  const ordered = [
    ...(params.requestedScopes ?? []),
    ...(params.requiredScopes ?? []),
    ...(params.grantedScopes ?? []),
    ...(params.missingRequiredScopes ?? []),
  ]
    .map((scope) => scope.trim())
    .filter(Boolean);

  return [...new Set(ordered)];
}
