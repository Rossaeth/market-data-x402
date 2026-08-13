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
    const ids =
      new URL(request.url).searchParams.get("ids") || "bitcoin,ethereum,solana";
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

  const paid = withX402(
    handler as any,
    {
      accepts: [
        { scheme: "exact", price: "$0.002", network: "eip155:8453", payTo },
      ],
      description: "Crypto prices by coin ids",
      mimeType: "application/json",
      extensions: {
        ...declareDiscoveryExtension({
          input: { ids: "bitcoin,ethereum,solana" },
          inputSchema: {
            properties: {
              ids: {
                type: "string",
                description: "Comma-separated CoinGecko coin ids",
              },
            },
            required: ["ids"],
          },
          output: {
            example: {
              source: "coingecko",
              timestamp: "2026-08-13T00:00:00.000Z",
              data: { bitcoin: { usd: 65000, usd_24h_change: 1.2 } },
            },
          },
        }),
      },
    },
    server
  );

  return paid(req);
}
