import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbols = (
    new URL(req.url).searchParams.get("symbols") ||
    "AAPL,MSFT,GOOGL,TSLA,NVDA"
  )
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 10);

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
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
}
