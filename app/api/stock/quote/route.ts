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
    const symbol = (new URL(request.url).searchParams.get("symbol") || "AAPL").toUpperCase();
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 60 } }
    );
    if (!res.ok) return NextResponse.json({ error: "upstream failed" }, { status: 502 });
    const json = await res.json();
    const meta = json.chart?.result?.[0]?.meta;
    if (!meta) return NextResponse.json({ error: "symbol not found" }, { status: 404 });
    return NextResponse.json({
      symbol: meta.symbol,
      price: meta.regularMarketPrice,
      previousClose: meta.previousClose,
      currency: meta.currency,
      exchange: meta.exchangeName,
      timestamp: new Date().toISOString(),
      note: "Delayed data",
    });
  };

  const paid = withX402(handler as any, {
    accepts: [{ scheme: "exact", price: "$0.003", network: "eip155:8453", payTo }],
    description: "Single stock quote",
    mimeType: "application/json",
  }, server);

  return paid(req);
}
