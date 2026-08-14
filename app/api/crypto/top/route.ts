import { NextRequest, NextResponse } from "next/server";
import { protect, routeConfig } from "@/lib/x402";

export const dynamic = "force-dynamic";

const config = routeConfig(
  "$0.006",
  "Top coins + gainers/losers",
  { limit: 20 },
  {
    properties: {
      limit: { type: "string", description: "Number of coins to return (1-50)" },
    },
    required: ["limit"],
  },
  { top_by_market_cap: [], top_gainers: [], top_losers: [] }
);

async function handler(req: NextRequest) {
  const limit = Math.min(
    Number(new URL(req.url).searchParams.get("limit") || 20) || 20,
    50
  );

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "upstream failed" }, { status: 502 });
  }

  const data = await res.json();
  const simplified = (Array.isArray(data) ? data : []).map((c: any) => ({
    id: c.id,
    symbol: c.symbol,
    name: c.name,
    price: c.current_price,
    market_cap: c.market_cap,
    volume_24h: c.total_volume,
    change_24h: c.price_change_percentage_24h,
    rank: c.market_cap_rank,
  }));

  const sorted = [...simplified].sort(
    (a, b) => (b.change_24h || 0) - (a.change_24h || 0)
  );

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    top_by_market_cap: simplified,
    top_gainers: sorted.slice(0, 5),
    top_losers: sorted.slice(-5).reverse(),
  });
}

export const GET = protect("/api/crypto/top", config, handler);
