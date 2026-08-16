import { NextRequest, NextResponse } from "next/server";
import { protect, routeConfig } from "@/lib/x402";

export const dynamic = "force-dynamic";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

const config = routeConfig(
  "$0.006",
  "Recent transaction history for a Solana wallet",
  {
    address: "5oNDLrU6qw9Q3KJu2zEqufZ3gqU1n4JUoWVvoMGvmiDa",
    limit: "10",
  },
  {
    properties: {
      address: { type: "string", description: "Solana wallet address" },
      limit: {
        type: "string",
        description: "Number of transactions to return (1-40)",
      },
    },
    required: ["address"],
  },
  { address: "...", transactions: [] }
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
  const sp = new URL(req.url).searchParams;
  const address = sp.get("address");
  const limit = Math.min(Number(sp.get("limit") || 10) || 10, 40);

  if (!address) {
    return NextResponse.json(
      { error: "missing required 'address' parameter" },
      { status: 400 }
    );
  }

  try {
    const signatures = await rpc("getSignaturesForAddress", [
      address,
      { limit },
    ]);

    const transactions = (signatures || []).map((s: any) => ({
      signature: s.signature,
      slot: s.slot,
      block_time: s.blockTime
        ? new Date(s.blockTime * 1000).toISOString()
        : null,
      status: s.err ? "failed" : "success",
      confirmation_status: s.confirmationStatus ?? null,
      memo: s.memo ?? null,
      explorer_url: `https://solscan.io/tx/${s.signature}`,
    }));

    return NextResponse.json({
      address,
      timestamp: new Date().toISOString(),
      count: transactions.length,
      transactions,
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

export const GET = protect("/api/solana/transactions", config, handler);
