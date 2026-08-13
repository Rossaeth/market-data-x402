import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const base = host ? `${proto}://${host}` : "https://market-data-x402-5wh8-ivory.vercel.app";

  return NextResponse.json(
    {
      version: 1,
      resources: [
        `${base}/api/crypto/price`,
        `${base}/api/crypto/top`,
        `${base}/api/crypto/ohlc`,
        `${base}/api/stock/quote`,
        `${base}/api/stock/batch`,
        `${base}/api/news`,
      ],
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60",
      },
    }
  );
}
