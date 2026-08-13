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
    const sp = new URL(request.url).searchParams;
    const query = sp.get("q") || "cryptocurrency";
    const limit = Math.min(Number(sp.get("limit") || 10), 20);
    const res = await fetch(
      `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=${encodeURIComponent(query)}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return NextResponse.json({ error: "upstream failed" }, { status: 502 });
    const json = await res.json();
    const articles = (json.Data || []).slice(0, limit).map((a: any) => ({
      title: a.title,
      url: a.url,
      source: a.source,
      published: a.published_on
        ? new Date(a.published_on * 1000).toISOString()
        : null,
      body: a.body ? a.body.slice(0, 300) + "..." : null,
      categories: a.categories,
    }));
    return NextResponse.json({
      query,
      timestamp: new Date().toISOString(),
      count: articles.length,
      articles,
    });
  };

  const paid = withX402(
    handler as any,
    {
      accepts: [
        {
          scheme: "exact",
          price: "$0.02",
          network: "eip155:8453",
          payTo,
        },
      ],
      description: "Latest crypto & market news",
      mimeType: "application/json",
      extensions: {
        ...declareDiscoveryExtension({
          input: { q: "cryptocurrency", limit: 10 },
          inputSchema: {
            properties: {
              q: {
                type: "string",
                description: "Search query or category",
              },
              limit: {
                type: "integer",
                minimum: 1,
                maximum: 20,
                description: "Number of articles",
              },
            },
            required: ["q"],
          },
          output: {
            example: {
              query: "cryptocurrency",
              timestamp: "2026-08-13T00:00:00.000Z",
              count: 1,
              articles: [{ title: "Example", url: "https://example.com" }],
            },
          },
        }),
      },
    },
    server
  );

  return paid(req);
}
