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

  const HIDDEN_DISPLAY_SCOPES = new Set(["email"]);

  const ordered = [
    ...(params.requestedScopes ?? []),
    ...(params.requiredScopes ?? []),
    ...(params.grantedScopes ?? []),
    ...(params.missingRequiredScopes ?? []),
  ]
    .map((scope) => scope.trim())
    .filter((scope) => Boolean(scope) && !HIDDEN_DISPLAY_SCOPES.has(scope));

  return [...new Set(ordered)];
}
