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
      contact: { name: "Rossadi", email: "rossadi.ardian@gmail.com" },
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
              schema: { type: "string", example: "bitcoin,ethereum,solana" },
              description: "Comma-separated CoinGecko ids",
            },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
            "402": { description: "Payment Required (x402)" },
          },
          "x-payment-info": {
            price: { mode: "fixed", currency: "USD", amount: "0.002000" },
            protocols: [
              {
                name: "x402",
                version: 2,
                scheme: "exact",
                network: "eip155:8453",
                payTo: "0xd850034a1cce920691a4880dea0fc064bccd4d45",
                asset: "USDC",
              },
            ],
          },
        },
      },
      "/.well-known/x402": {
        get: {
          operationId: "getX402Discovery",
          summary: "x402 resource list",
          tags: ["Discovery"],
          security: [],
          responses: {
            "200": {
              description: "Resource list",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
          },
        },
      },
    },
  });
}
