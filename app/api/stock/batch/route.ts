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
  const payTo =
    process.env.EVM_ADDRESS || "0xd850034a1cce920691a4880dea0fc064bccd4d45";

  const handler = async (request: NextRequest) => {
    const symbols = (
      new URL(request.url).searchParams.get("symbols") ||
      "AAPL,MSFT,GOOGL,TSLA,NVDA"
    )
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .slice(0, 10);

    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
            {
              headers: { "User-Agent": "Mozilla/5.0" },
              next: { revalidate: 60 },
            }
          );
          if (!res.ok) return { symbol, error: "fetch failed" };
          const json = await res.json();
          const meta = json.chart?.result?.[0]?.meta;
          if (!meta) return { symbol, error: "not found" };
          return {
            symbol: meta.symbol,
            price: meta.regularMarketPrice,
            previousClose: meta.previousClose,
            change: meta.regularMarketPrice - meta.previousClose,
            changePercent:
              ((meta.regularMarketPrice - meta.previousClose) /
                meta.previousClose) *
              100,
            currency: meta.currency,
          };
        } catch {
          return { symbol, error: "failed" };
        }
      })
    );

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      count: results.length,
      data: results,
    });
  };

  const paid = withX402(
    handler as any,
    {
      accepts: [
        {
          scheme: "exact",
          price: "$0.012",
          network: "eip155:8453",
          payTo,
        },
      ],
      description: "Multiple stock quotes",
      mimeType: "application/json",
      extensions: {
        ...declareDiscoveryExtension({
          input: { symbols: "AAPL,TSLA,NVDA" },
          inputSchema: {
            properties: {
              symbols: {
                type: "string",
                description: "Comma-separated tickers (max 10)",
              },
            },
            required: ["symbols"],
          },
          output: {
            example: {
              timestamp: "2026-08-13T00:00:00.000Z",
              count: 3,
              data: [{ symbol: "AAPL", price: 190 }],
            },
          },
        }),
      },
    },
    server
  );

  return paid(req);
}
