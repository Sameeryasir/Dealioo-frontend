/**
 * Change summary:
 * - What: Read role label via shared role resolver (user + JWT fallback).
 * - Why: Invited Manager/Staff labels were blank when localStorage user failed validation.
 * - Related: is-invited-team-user.ts
 */

import { getStoredUserRoleName } from "@/app/lib/is-invited-team-user";

export function getUserRoleLabel(): string | null {
  return getStoredUserRoleName();
}
