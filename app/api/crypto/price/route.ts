import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ids =
    new URL(req.url).searchParams.get("ids") || "bitcoin,ethereum,solana";
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
    { next: { revalidate: 30 } }
  );
  if (!res.ok) {
    return NextResponse.json({ error: "upstream failed" }, { status: 502 });
  }
  const data = await res.json();
  return NextResponse.json({
    source: "coingecko",
    timestamp: new Date().toISOString(),
    data,
  });
}
