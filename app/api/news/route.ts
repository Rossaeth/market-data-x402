import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const query = sp.get("q") || "cryptocurrency";
  const limit = Math.min(Number(sp.get("limit") || 10) || 10, 20);

  const res = await fetch(
    `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=${encodeURIComponent(query)}`,
    { next: { revalidate: 300 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "upstream failed" }, { status: 502 });
  }

  const json = await res.json();
  const articles = (json.Data || []).slice(0, limit).map((a: any) => ({
    title: a.title,
    url: a.url,
    source: a.source,
    published: a.published_on
      ? new Date(a.published_on * 1000).toISOString()
      : null,
    body: a.body ? String(a.body).slice(0, 300) + "..." : null,
    categories: a.categories,
  }));

  return NextResponse.json({
    query,
    timestamp: new Date().toISOString(),
    count: articles.length,
    articles,
  });
}
