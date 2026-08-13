import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { withX402 } = await import("@x402/next");
  const { x402ResourceServer } = await import("@x402/core/server");
  const { ExactEvmScheme } = await import("@x402/evm/exact/server");
  const { createCdpFacilitatorClient } = await import("@coinbase/cdp-sdk/x402");
  const { declareDiscoveryExtension } = await import("@x402/extensions/bazaar");

  const facilitator = createCdpFacilitatorClient();
  const server = new x402ResourceServer(facilitator).register(
    "eip155:8453",
    new ExactEvmScheme()
  );
  const payTo = (process.env.EVM_ADDRESS ||
    "0xd850034a1cce920691a4880dea0fc064bccd4d45") as `0x${string}`;

  async function handler(request: NextRequest) {
    const sp = new URL(request.url).searchParams;
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

  const paid = withX402(
    handler as any,
    {
      accepts: [
        { scheme: "exact", price: "$0.015", network: "eip155:8453", payTo },
      ],
      description: "OHLC candle data",
      mimeType: "application/json",
      extensions: {
        ...declareDiscoveryExtension({
          input: { id: "bitcoin", days: "7" },
          inputSchema: {
            properties: {
              id: { type: "string", description: "CoinGecko coin id" },
              days: {
                type: "string",
                enum: ["1", "7", "14", "30", "90", "180", "365", "max"],
                description: "Lookback days",
              },
            },
            required: ["id", "days"],
          },
          output: {
            example: {
              id: "bitcoin",
              days: "7",
              candles: [{ time: 0, open: 1, high: 2, low: 0.5, close: 1.5 }],
            },
          },
        }),
      },
    },
    server
  );

  return paid(req);
}
