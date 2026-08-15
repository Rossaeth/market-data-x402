import { NextRequest, NextResponse } from "next/server";
import { x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { registerExactSvmScheme } from "@x402/svm/exact/server";
import { createCdpFacilitatorClient } from "@coinbase/cdp-sdk/x402";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import { withX402 } from "@x402/next";

export const payTo = (process.env.EVM_ADDRESS ||
  "0xd850034a1cce920691a4880dea0fc064bccd4d45") as `0x${string}`;

export const solPayTo =
  process.env.SOL_ADDRESS || "BvE4YGLKxWUPN1efMRgvWf47wnDLBwt7KFZS1VY2HCvt";

const SOLANA_MAINNET = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" as const;

let _server: ReturnType<typeof buildServer> | null = null;

function buildServer() {
  const facilitator = createCdpFacilitatorClient();
  return registerExactSvmScheme(
    new x402ResourceServer(facilitator).register(
      "eip155:8453",
      new ExactEvmScheme()
    ),
    { networks: [SOLANA_MAINNET] }
  );
}

// Lazily constructed on first actual request. Next.js evaluates route
// modules at build time ("Collecting page data") to analyze static/dynamic
// behavior — if the CDP facilitator client were built at module load time,
// that build-time evaluation would crash with "Missing required CDP
// credentials" since build-time env vars aren't guaranteed to be present.
function getServer() {
  if (!_server) _server = buildServer();
  return _server;
}

export function routeConfig(
  price: string,
  description: string,
  input: Record<string, unknown>,
  inputSchema: { properties: Record<string, unknown>; required?: string[] },
  outputExample: unknown
) {
  return {
    accepts: [
      {
        scheme: "exact" as const,
        price,
        network: "eip155:8453" as const,
        payTo,
      },
      {
        scheme: "exact" as const,
        price,
        network: SOLANA_MAINNET,
        payTo: solPayTo,
      },
    ],
    description,
    mimeType: "application/json",
    extensions: {
      ...declareDiscoveryExtension({
        input,
        inputSchema,
        output: { example: outputExample },
      }),
    },
  };
}

/**
 * Wraps a route handler with x402 payment protection AND structured revenue
 * logging. Unlike the old middleware-based `paymentProxy`, `withX402` only
 * settles payment after the handler returns a successful response
 * (status < 400) — so a failed upstream call (CoinGecko/Yahoo/CoinStats
 * down) no longer charges the buyer for nothing.
 *
 * Every completed request emits one structured JSON log line prefixed
 * "REVENUE_EVENT", visible in Vercel's Runtime Logs / Log Drains. Filter
 * logs by that string to see per-endpoint call volume and revenue.
 */
export function protect(
  path: string,
  config: ReturnType<typeof routeConfig>,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  let wrapped: ((req: NextRequest) => Promise<NextResponse>) | null = null;

  return async (req: NextRequest) => {
    if (!wrapped) {
      wrapped = withX402(handler, config, getServer());
    }

    const startedAt = Date.now();
    let res: NextResponse;

    try {
      res = await wrapped(req);
    } catch (err) {
      console.log(
        JSON.stringify({
          event: "REVENUE_EVENT",
          path,
          price: config.accepts[0]?.price,
          paid: false,
          status: 500,
          durationMs: Date.now() - startedAt,
          error: err instanceof Error ? err.message : "unknown error",
          timestamp: new Date().toISOString(),
        })
      );
      throw err;
    }

    // A charge only happened if the handler succeeded (withX402 settles
    // only on status < 400) AND the request actually included a payment
    // attempt (i.e. it wasn't the initial unpaid 402 challenge response).
    const wasChallenge = res.status === 402;
    const paid = res.status < 400 && !wasChallenge;

    console.log(
      JSON.stringify({
        event: "REVENUE_EVENT",
        path,
        price: config.accepts[0]?.price,
        paid,
        status: res.status,
        durationMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      })
    );

    return res;
  };
}
