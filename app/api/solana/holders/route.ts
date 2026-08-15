import { NextRequest, NextResponse } from "next/server";
import { protect, routeConfig } from "@/lib/x402";

export const dynamic = "force-dynamic";

const config = routeConfig(
  "$0.01",
  "Token holder list for a Solana token (SPL mint)",
  {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    limit: 20,
  },
  {
    properties: {
      address: { type: "string", description: "SPL token mint address" },
      limit: {
        type: "string",
        description: "Number of holders to return (1-40)",
      },
    },
    required: ["address"],
  },
  { address: "...", total_holders: 0, holders: [] }
);

async function handler(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const address = sp.get("address");
  const limit = Math.min(Number(sp.get("limit") || 20) || 20, 40);

  if (!address) {
    return NextResponse.json(
      { error: "missing required 'address' parameter" },
      { status: 400 }
    );
  }

  const res = await fetch(
    `https://pro-api.solscan.io/v2.0/token/holders?address=${encodeURIComponent(address)}&page=1&page_size=${limit}`,
    {
      headers: {
        token: process.env.SOLSCAN_API_KEY || "",
      },
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "upstream failed", status: res.status },
      { status: 502 }
    );
  }

  const json = await res.json();
  const data = json.data || {};

  const holders = (data.items || []).map((h: any) => ({
    address: h.address,
    amount: h.amount,
    decimals: h.decimals,
    owner: h.owner ?? null,
    rank: h.rank ?? null,
  }));

  return NextResponse.json({
    address,
    timestamp: new Date().toISOString(),
    total_holders: data.total ?? null,
    holders,
  });
}

export const GET = protect("/api/solana/holders", config, handler);
