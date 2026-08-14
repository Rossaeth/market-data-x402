import { NextRequest, NextResponse } from "next/server";
import { protect, routeConfig } from "@/lib/x402";

export const dynamic = "force-dynamic";

const config = routeConfig(
  "$0.003",
  "Single stock quote",
  { symbol: "AAPL" },
  {
    properties: {
      symbol: { type: "string", description: "Ticker" },
    },
    required: ["symbol"],
  },
  { symbol: "AAPL", price: 190 }
);

async function handler(req: NextRequest) {
  const symbol = (
    new URL(req.url).searchParams.get("symbol") || "AAPL"
  ).toUpperCase();

  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
    {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "upstream failed" }, { status: 502 });
  }

  const json = await res.json();
  const meta = json.chart?.result?.[0]?.meta;

  if (!meta) {
    return NextResponse.json({ error: "symbol not found" }, { status: 404 });
  }

  return NextResponse.json({
    symbol: meta.symbol,
    price: meta.regularMarketPrice,
    previousClose: meta.previousClose,
    currency: meta.currency,
    exchange: meta.exchangeName,
    timestamp: new Date().toISOString(),
    note: "Delayed data",
  });
}

export const GET = protect("/api/stock/quote", config, handler);
