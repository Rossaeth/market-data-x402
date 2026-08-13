import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

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
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=300" } }
  );
}
