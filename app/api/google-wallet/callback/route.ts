import { NextRequest, NextResponse } from "next/server";

const DEFAULT_NEST_CALLBACK =
  "http://localhost:4001/api/google-wallet/callback";

function resolveNestCallbackUrl(): string {
  const nestOnly = process.env.GOOGLE_WALLET_NEST_CALLBACK_URL?.trim();
  if (nestOnly) {
    return nestOnly;
  }
  const apiBase = (
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4001/api"
  ).replace(/\/$/, "");
  return `${apiBase}/google-wallet/callback`;
}

export async function POST(request: NextRequest) {
  const nestCallbackUrl = resolveNestCallbackUrl() || DEFAULT_NEST_CALLBACK;

  const rawBody = await request.text();
  const userAgent = request.headers.get("user-agent") ?? "(none)";
  const contentType = request.headers.get("content-type") ?? "(none)";

  console.log(
    `[Google Wallet webhook] HIT /api/google-wallet/callback ua=${userAgent} contentType=${contentType} bodyBytes=${rawBody.length}`,
  );
  console.log(
    `[Google Wallet webhook] Forwarding to Nest: ${nestCallbackUrl}`,
  );
  if (rawBody.length > 0 && rawBody.length < 4000) {
    console.log(`[Google Wallet webhook] bodyPreview=${rawBody.slice(0, 800)}`);
  }

  try {
    const upstream = await fetch(nestCallbackUrl, {
      method: "POST",
      headers: {
        "Content-Type":
          contentType.includes("json") ||
          !contentType ||
          contentType === "(none)"
            ? "application/json"
            : contentType,
        "User-Agent": userAgent,
      },
      body: rawBody || undefined,
    });

    const responseText = await upstream.text();
    console.log(
      `[Google Wallet webhook] Nest response status=${upstream.status} body=${responseText.slice(0, 500)}`,
    );

    return new NextResponse(responseText || JSON.stringify({ success: true }), {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Google Wallet webhook] Nest forward failed: ${message}`);
    return NextResponse.json(
      { success: false, error: "callback_forward_failed" },
      { status: 200 },
    );
  }
}
