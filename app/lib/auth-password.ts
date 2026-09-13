export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULE_MESSAGE =
  "Password must be at least 8 characters and include an uppercase letter and a number.";

export function passwordStrengthScore(password: string): number {
  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export function isStrongEnoughPassword(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}
