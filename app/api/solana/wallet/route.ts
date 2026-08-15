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

  const [detailRes, tokensRes] = await Promise.all([
    fetch(
      `https://pro-api.solscan.io/v2.0/account/detail?address=${encodeURIComponent(address)}`,
      {
        headers: { token: process.env.SOLSCAN_API_KEY || "" },
        next: { revalidate: 30 },
      }
    ),
    fetch(
      `https://pro-api.solscan.io/v2.0/account/token-accounts?address=${encodeURIComponent(address)}&type=token&page=1&page_size=40&hide_zero=true`,
      {
        headers: { token: process.env.SOLSCAN_API_KEY || "" },
        next: { revalidate: 30 },
      }
    ),
  ]);

  if (!detailRes.ok || !tokensRes.ok) {
    const failed = !detailRes.ok ? detailRes : tokensRes;
    const rawBody = await failed.text().catch(() => "");
    console.log(
      JSON.stringify({
        event: "SOLSCAN_DEBUG",
        status: failed.status,
        keyPresent: !!process.env.SOLSCAN_API_KEY,
        body: rawBody.slice(0, 500),
      })
    );
    return NextResponse.json(
      {
        error: "upstream failed",
        status: failed.status,
        upstream_body: rawBody.slice(0, 300),
      },
      { status: 502 }
    );
  }

  const detailJson = await detailRes.json();
  const tokensJson = await tokensRes.json();
  const detail = detailJson.data || {};
  const tokenList = tokensJson.data || [];

  const tokens = tokenList.map((t: any) => ({
    token_address: t.token_address,
    token_account: t.token_account,
    balance: t.amount,
    decimals: t.token_decimals,
    owner: t.owner ?? null,
  }));

  return NextResponse.json({
    address,
    timestamp: new Date().toISOString(),
    sol_balance_lamports: detail.lamports ?? null,
    sol_balance: typeof detail.lamports === "number" ? detail.lamports / 1e9 : null,
    tokens,
  });
}

export const GET = protect("/api/solana/wallet", config, handler);
