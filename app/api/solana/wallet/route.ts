import { NextRequest, NextResponse } from "next/server";
import { protect, routeConfig } from "@/lib/x402";

export const dynamic = "force-dynamic";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

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
    sol_balance: 0,
    tokens: [],
  }
);

async function rpc(method: string, params: unknown[]) {
  const res = await fetch(SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    next: { revalidate: 15 },
  });
  if (!res.ok) {
    throw new Error(`rpc ${method} failed: ${res.status}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(`rpc ${method} error: ${json.error.message}`);
  }
  return json.result;
}

async function handler(req: NextRequest) {
  const address = new URL(req.url).searchParams.get("address");
  if (!address) {
    return NextResponse.json(
      { error: "missing required 'address' parameter" },
      { status: 400 }
    );
  }

  try {
    const [balanceResult, tokenAccountsResult] = await Promise.all([
      rpc("getBalance", [address]),
      rpc("getTokenAccountsByOwner", [
        address,
        { programId: TOKEN_PROGRAM_ID },
        { encoding: "jsonParsed" },
      ]),
    ]);

    const lamports = balanceResult?.value ?? 0;

    const tokens = (tokenAccountsResult?.value || [])
      .map((acc: any) => {
        const info = acc.account?.data?.parsed?.info;
        const amount = info?.tokenAmount;
        return {
          token_account: acc.pubkey,
          mint: info?.mint,
          balance: amount?.uiAmount ?? null,
          raw_amount: amount?.amount ?? null,
          decimals: amount?.decimals ?? null,
        };
      })
      .filter((t: any) => t.balance && t.balance > 0);

    return NextResponse.json({
      address,
      timestamp: new Date().toISOString(),
      sol_balance_lamports: lamports,
      sol_balance: lamports / 1e9,
      tokens,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "upstream failed",
        message: err instanceof Error ? err.message : "unknown error",
      },
      { status: 502 }
    );
  }
}

export const GET = protect("/api/solana/wallet", config, handler);
