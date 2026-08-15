import { NextRequest, NextResponse } from "next/server";
import { protect, routeConfig } from "@/lib/x402";

export const dynamic = "force-dynamic";

const config = routeConfig(
  "$0.008",
  "Solana wallet portfolio (SOL + SPL token holdings)",
  { address: "5oNDLrU6qw9Q3KJu2zEqufZ3gqU1n4JUoWVvoMGvmiDa" },
  {
    properties: {
      address: { type: "string", description: "Solana wallet address" },
    },
    required: ["address"],
  },
  {
    address: "5oNDLrU6qw9Q3KJu2zEqufZ3gqU1n4JUoWVvoMGvmiDa",
    total_value_usd: 0,
    tokens: [],
  }
);

async function handler(req: NextRequest) {
  const address = new URL(req.url).searchParams.get("address");
  if (!address) {
    return NextResponse.json(
      { error: "missing required 'address' parameter" },
      { status: 400 }
    );
  }

  const res = await fetch(
    `https://pro-api.solscan.io/v2.0/account/portfolio?address=${encodeURIComponent(address)}`,
    {
      headers: {
        token: process.env.SOLSCAN_API_KEY || "",
      },
      next: { revalidate: 30 },
    }
  );

  if (!res.ok) {
    const rawBody = await res.text().catch(() => "");
    console.log(
      JSON.stringify({
        event: "SOLSCAN_DEBUG",
        status: res.status,
        keyPresent: !!process.env.SOLSCAN_API_KEY,
        keyPrefix: (process.env.SOLSCAN_API_KEY || "").slice(0, 12),
        body: rawBody.slice(0, 500),
      })
    );
    return NextResponse.json(
      {
        error: "upstream failed",
        status: res.status,
        upstream_body: rawBody.slice(0, 300),
      },
      { status: 502 }
    );
  }

  const json = await res.json();
  const data = json.data || {};

  const tokens = (data.tokens || []).map((t: any) => ({
    token_address: t.token_address,
    symbol: t.token_symbol || null,
    name: t.token_name || null,
    balance: t.balance,
    value_usd: t.value ?? null,
  }));

  return NextResponse.json({
    address,
    timestamp: new Date().toISOString(),
    total_value_usd: data.total_value ?? null,
    sol_balance: data.sol_balance ?? null,
    tokens,
  });
}

export const GET = protect("/api/solana/wallet", config, handler);
