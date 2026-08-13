import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Payment enforcement for this route is handled centrally by middleware.ts
// (paymentProxy matches /api/crypto/ohlc). Do not wrap this handler with its
// own x402 logic — doing so double-checks payment after the middleware has
// already verified/consumed it and can incorrectly reject paid requests.
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const id = sp.get("id") || "bitcoin";
  const days = sp.get("days") || "7";

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/ohlc?vs_currency=usd&days=${encodeURIComponent(days)}`,
    { next: { revalidate: 120 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "upstream failed" }, { status: 502 });
  }

  const data = await res.json();
  const candles = (Array.isArray(data) ? data : []).map((c: number[]) => ({
    time: c[0],
    open: c[1],
    high: c[2],
    low: c[3],
    close: c[4],
  }));

  return NextResponse.json({
    id,
    days,
    timestamp: new Date().toISOString(),
    candles,
  });
}
