import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { createCdpFacilitatorClient } from "@coinbase/cdp-sdk/x402";

const facilitator = createCdpFacilitatorClient();
const server = new x402ResourceServer(facilitator)
  .register("eip155:8453", new ExactEvmScheme());

async function handler(req: NextRequest) {
  const ids = new URL(req.url).searchParams.get("ids") || "bitcoin,ethereum,solana";
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
    { next: { revalidate: 30 } }
  );
  if (!res.ok) return NextResponse.json({ error: "upstream failed" }, { status: 502 });
  const data = await res.json();
  return NextResponse.json({ source: "coingecko", timestamp: new Date().toISOString(), data });
}

export const GET = withX402(
  handler,
  {
    accepts: [{
      scheme: "exact",
      price: "$0.002",
      network: "eip155:8453",
      payTo: process.env.EVM_ADDRESS!,
    }],
    description: "Crypto price data",
    mimeType: "application/json",
  },
  server
);
