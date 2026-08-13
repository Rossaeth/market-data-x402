import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { withX402 } = await import("@x402/next");
  const { x402ResourceServer } = await import("@x402/core/server");
  const { ExactEvmScheme } = await import("@x402/evm/exact/server");
  const { createCdpFacilitatorClient } = await import("@coinbase/cdp-sdk/x402");

  const facilitator = createCdpFacilitatorClient();
  const server = new x402ResourceServer(facilitator).register("eip155:8453", new ExactEvmScheme());
  const payTo = process.env.EVM_ADDRESS || "0xd850034a1cce920691a4880dea0fc064bccd4d45";

  const handler = async (request: NextRequest) => {
    const limit = Math.min(Number(new URL(request.url).searchParams.get("limit") || 20), 50);
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return NextResponse.json({ error: "upstream failed" }, { status: 502 });
    const data = await res.json();
    const simplified = data.map((c: any) => ({
      id: c.id, symbol: c.symbol, name: c.name, price: c.current_price,
      market_cap: c.market_cap, volume_24h: c.total_volume,
      change_24h: c.price_change_percentage_24h, rank: c.market_cap_rank,
    }));
    const sorted = [...simplified].sort((a, b) => (b.change_24h || 0) - (a.change_24h || 0));
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      top_by_market_cap: simplified,
      top_gainers: sorted.slice(0, 5),
      top_losers: sorted.slice(-5).reverse(),
    });
  };

  const paid = withX402(handler as any, {
    accepts: [{ scheme: "exact", price: "$0.006", network: "eip155:8453", payTo }],
    description: "Top coins + gainers/losers",
    mimeType: "application/json",
  }, server);

  return paid(req);
}
