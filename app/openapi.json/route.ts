import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const base = host
    ? `${proto}://${host}`
    : "https://market-data-x402-5wh8-ivory.vercel.app";

  const payTo = "0xd850034a1cce920691a4880dea0fc064bccd4d45";

  const payment = (amount: string) => ({
    price: { mode: "fixed", currency: "USD", amount },
    protocols: [
      {
        name: "x402",
        version: 2,
        scheme: "exact",
        network: "eip155:8453",
        payTo,
        asset: "USDC",
      },
    ],
  });

  const body = (properties: Record<string, unknown>, required: string[]) => ({
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties,
          required,
          additionalProperties: false,
        },
      },
    },
  });

  const ok = {
    description: "Success",
    content: {
      "application/json": {
        schema: { type: "object", additionalProperties: true },
      },
    },
  };

  const r402 = {
    description: "Payment Required (x402)",
    content: {
      "application/json": {
        schema: { type: "object", additionalProperties: true },
      },
    },
  };

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Market Data x402 API",
      version: "1.0.0",
      description:
        "Pay-per-request crypto & stock market data via x402 USDC on Base Mainnet. No API keys.",
      "x-guidance":
        "All market endpoints are paid via x402 on Base (eip155:8453). Unauthenticated calls return HTTP 402. After USDC payment, retry to receive JSON. Example: GET /api/crypto/price?ids=bitcoin",
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
              schema: { type: "string", example: "bitcoin,ethereum" },
              description: "Comma-separated CoinGecko ids",
            },
          ],
          requestBody: body(
            {
              ids: {
                type: "string",
                description: "Comma-separated CoinGecko ids",
                example: "bitcoin,ethereum,solana",
              },
            },
            ["ids"]
          ),
          responses: { "200": ok, "402": r402 },
          "x-payment-info": payment("0.002000"),
        },
      },
      "/api/crypto/top": {
        get: {
          operationId: "getCryptoTop",
          summary: "Top coins + gainers/losers",
          tags: ["Crypto"],
          parameters: [
            {
              name: "limit",
              in: "query",
              required: true,
              schema: { type: "integer", minimum: 1, maximum: 50, example: 20 },
            },
          ],
          requestBody: body(
            {
              limit: {
                type: "integer",
                minimum: 1,
                maximum: 50,
                example: 20,
                description: "Number of coins",
              },
            },
            ["limit"]
          ),
          responses: { "200": ok, "402": r402 },
          "x-payment-info": payment("0.006000"),
        },
      },
      "/api/crypto/ohlc": {
        get: {
          operationId: "getCryptoOhlc",
          summary: "OHLC candle data",
          tags: ["Crypto"],
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string", example: "bitcoin" },
            },
            {
              name: "days",
              in: "query",
              required: true,
              schema: {
                type: "string",
                enum: ["1", "7", "14", "30", "90", "180", "365", "max"],
                example: "7",
              },
            },
          ],
          requestBody: body(
            {
              id: { type: "string", example: "bitcoin" },
              days: {
                type: "string",
                enum: ["1", "7", "14", "30", "90", "180", "365", "max"],
                example: "7",
              },
            },
            ["id", "days"]
          ),
          responses: { "200": ok, "402": r402 },
          "x-payment-info": payment("0.015000"),
        },
      },
      "/api/stock/quote": {
        get: {
          operationId: "getStockQuote",
          summary: "Single stock quote",
          tags: ["Stocks"],
          parameters: [
            {
              name: "symbol",
              in: "query",
              required: true,
              schema: { type: "string", example: "AAPL" },
            },
          ],
          requestBody: body(
            {
              symbol: {
                type: "string",
                example: "AAPL",
                description: "Ticker symbol",
              },
            },
            ["symbol"]
          ),
          responses: { "200": ok, "402": r402 },
          "x-payment-info": payment("0.003000"),
        },
      },
      "/api/stock/batch": {
        get: {
          operationId: "getStockBatch",
          summary: "Batch stock quotes",
          tags: ["Stocks"],
          parameters: [
            {
              name: "symbols",
              in: "query",
              required: true,
              schema: { type: "string", example: "AAPL,TSLA,NVDA" },
            },
          ],
          requestBody: body(
            {
              symbols: {
                type: "string",
                example: "AAPL,TSLA,NVDA",
                description: "Comma-separated tickers (max 10)",
              },
            },
            ["symbols"]
          ),
          responses: { "200": ok, "402": r402 },
          "x-payment-info": payment("0.012000"),
        },
      },
      "/api/news": {
        get: {
          operationId: "getMarketNews",
          summary: "Crypto & market news",
          tags: ["News"],
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string", example: "cryptocurrency" },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 20, example: 10 },
            },
          ],
          requestBody: body(
            {
              q: { type: "string", example: "cryptocurrency" },
              limit: { type: "integer", minimum: 1, maximum: 20, example: 10 },
            },
            ["q"]
          ),
          responses: { "200": ok, "402": r402 },
          "x-payment-info": payment("0.020000"),
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
                  schema: {
                    type: "object",
                    properties: {
                      version: { type: "integer" },
                      resources: {
                        type: "array",
                        items: { type: "string", format: "uri" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return NextResponse.json(spec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=30",
      "Content-Type": "application/json",
    },
  });
}
