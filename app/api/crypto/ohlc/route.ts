import { NextRequest, NextResponse } from "next/server";
import { protect, routeConfig } from "@/lib/x402";

export const dynamic = "force-dynamic";

const config = routeConfig(
  "$0.015",
  "OHLC candle data",
  { id: "bitcoin", days: "7" },
  {
    properties: {
      id: { type: "string" },
      days: {
        type: "string",
        enum: ["1", "7", "14", "30", "90", "180", "365", "max"],
      },
    },
    required: ["id", "days"],
  },
  { id: "bitcoin", candles: [] }
);

async function handler(req: NextRequest) {
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

export const GET = protect("/api/crypto/ohlc", config, handler);
