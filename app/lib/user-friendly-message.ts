const MAX_TOAST_CHARS = 160;

const TECHNICAL_PATTERNS: Array<{ test: RegExp; message: string }> = [
  {
    test: /failed to fetch|networkerror|load failed|econnrefused|enotfound|etimedout|network request failed/i,
    message:
      "We couldn't reach the server. Check your internet connection and try again.",
  },
  {
    test: /session expired|jwt expired|invalid token|unauthorized|401\b|no session/i,
    message: "Your session expired. Please sign in again.",
  },
  {
    test: /\b403\b|forbidden|access denied|insufficient permission/i,
    message: "You don't have permission to do that.",
  },
  {
    test: /internal server error|\b500\b|ECONNRESET|prisma|sqlstate|typeorm/i,
    message: "Something went wrong on our side. Please try again in a moment.",
  },
  {
    test: /too many requests|\b429\b|rate limit/i,
    message: "Too many attempts. Please wait a moment and try again.",
  },
  {
    test: /unique constraint|duplicate key|duplicate entry/i,
    message: "That already exists. Try a different value.",
  },
  {
    test: /validation failed|bad request|\b400\b|should not be empty/i,
    message: "Some details look incomplete. Please check and try again.",
  },
];

function looksTechnical(raw: string): boolean {
  if (raw.length > 280) return true;
  if (/^\s*[{[]/.test(raw)) return true;
  if (/\bat\s+\S+\s*\(/.test(raw)) return true;
  if (/Exception:|Error:\s*Error/i.test(raw)) return true;
  if (/nestjs|axioserror|aggregateerror/i.test(raw)) return true;
  return false;
}

function firstReadableSentence(raw: string): string {
  const cleaned = raw
    .replace(/\s+/g, " ")
    .replace(/^error:\s*/i, "")
    .trim();
  const sentence = cleaned.split(/(?<=[.!?])\s+/)[0]?.trim() || cleaned;
  if (sentence.length <= MAX_TOAST_CHARS) return sentence;
  return `${sentence.slice(0, MAX_TOAST_CHARS - 1).trimEnd()}…`;
}

export function toUserFriendlyMessage(
  input: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  let raw = "";
  if (typeof input === "string") {
    raw = input.trim();
  } else if (input instanceof Error) {
    raw = input.message.trim();
  } else if (input != null) {
    raw = String(input).trim();
  }

  if (!raw) return fallback;

  for (const rule of TECHNICAL_PATTERNS) {
    if (rule.test.test(raw)) return rule.message;
  }

  if (looksTechnical(raw)) return fallback;

  return firstReadableSentence(raw);
}
