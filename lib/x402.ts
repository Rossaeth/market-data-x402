import { NextRequest, NextResponse } from "next/server";
import { x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { createCdpFacilitatorClient } from "@coinbase/cdp-sdk/x402";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import { withX402 } from "@x402/next";

export const payTo = (process.env.EVM_ADDRESS ||
  "0xd850034a1cce920691a4880dea0fc064bccd4d45") as `0x${string}`;

const facilitator = createCdpFacilitatorClient();

export const server = new x402ResourceServer(facilitator).register(
  "eip155:8453",
  new ExactEvmScheme()
);

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
  const wrapped = withX402(handler, config, server);

  return async (req: NextRequest) => {
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
