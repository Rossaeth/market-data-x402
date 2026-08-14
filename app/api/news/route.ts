import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const query = sp.get("q") || "cryptocurrency";
  const limit = Math.min(Number(sp.get("limit") || 10) || 10, 20);

  const res = await fetch(
    `https://openapiv1.coinstats.app/news?page=1&limit=${limit}`,
    {
      headers: {
        "X-API-KEY": process.env.COINSTATS_API_KEY || "",
      },
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "upstream failed", status: res.status },
      { status: 502 }
    );
  }

  const json = await res.json();
  const items = json.result || json.data || json.Data || json.news || [];

  // Optional client-side filter by query term since CoinStats /news
  // doesn't support a text search param the way CryptoCompare did.
  const q = query.toLowerCase();
  const filtered = query && query !== "cryptocurrency"
    ? items.filter((a: any) =>
        String(a.title || a.name || "").toLowerCase().includes(q)
      )
    : items;

  const articles = filtered.slice(0, limit).map((a: any) => ({
    title: a.title || a.name || null,
    url: a.link || a.url || null,
    source: a.source || a.sourceName || null,
    published:
      a.feedDate || a.publishedAt || a.date
        ? new Date(a.feedDate || a.publishedAt || a.date).toISOString()
        : null,
    body: a.description || a.body
      ? String(a.description || a.body).slice(0, 300) + "..."
      : null,
    categories: a.tags || a.categories || null,
  }));

  return NextResponse.json({
    query,
    timestamp: new Date().toISOString(),
    count: articles.length,
    articles,
  });
}
