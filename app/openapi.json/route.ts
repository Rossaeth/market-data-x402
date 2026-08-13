import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = "https://market-data-x402-5wh8-ivory.vercel.app";

  return NextResponse.json({
    openapi: "3.1.0",
    info: {
      title: "Market Data x402 API",
      version: "1.0.0",
      description: "Pay-per-request crypto prices via x402 USDC on Base Mainnet.",
      "x-guidance":
        "Call GET /api/crypto/price?ids=bitcoin,ethereum without payment to receive HTTP 402. Pay USDC on Base (eip155:8453), then retry the same URL with the payment proof. Example ids: bitcoin, ethereum, solana.",
      contact: {
        name: "Rossadi",
        email: "rossadi.ardian@gmail.com",
      },
    },
    servers: [{ url: base }],
    paths: {
      "/api/crypto/price": {
        get: {
          operationId: "getCryptoPrice",
          summary: "Crypto prices by coin ids",
          tags: ["Crypto"],
          parameters: [
            {
              name: "ids",
              in: "query",
              required: true,
              schema: {
                type: "string",
                minLength: 1,
                example: "bitcoin,ethereum,solana",
              },
              description: "Comma-separated CoinGecko coin ids",
            },
          ],
          responses: {
            "200": {
              description: "Price data",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      source: { type: "string" },
                      timestamp: { type: "string", format: "date-time" },
                      data: { type: "object", additionalProperties: true },
                    },
                  },
                },
              },
            },
            "402": { description: "Payment Required" },
          },
          "x-payment-info": {
            price: {
              mode: "fixed",
              currency: "USD",
              amount: "0.002000",
            },
            protocols: [{ x402: {} }],
          },
        },
      },
    },
  });
}
