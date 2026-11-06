import { isAuthRefreshUrl } from "@/app/lib/auth-refresh-url";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

assert(
  isAuthRefreshUrl("https://api.example.com/api/auth/refresh"),
  "should match /auth/refresh",
);
assert(
  isAuthRefreshUrl("https://api.example.com/api/auth/refresh?x=1"),
  "should match /auth/refresh with query",
);
assert(
  !isAuthRefreshUrl("https://api.example.com/api/user/me"),
  "should not match /user/me",
);
assert(
  !isAuthRefreshUrl("https://api.example.com/api/auth/logout"),
  "should not match /auth/logout",
);

console.log("auth-refresh-url.spec.ts passed");
