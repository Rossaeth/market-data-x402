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

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Market Data x402 API",
      version: "1.0.0",
      description:
        "Pay-per-request crypto & stock market data via x402 (USDC on Base Mainnet). No API keys.",
      "x-guidance":
        "All market data endpoints require x402 payment in USDC on Base (eip155:8453). Call without payment to receive HTTP 402 with payment requirements. After paying, retry with the payment proof header to receive JSON data. Example: GET /api/crypto/price?ids=bitcoin,ethereum",
      contact: { name: "Rossadi" },
    },
    servers: [{ url: base }],
    paths: {
      "/api/crypto/price": {
        get: {
          operationId: "cryptoPrice",
          summary: "Crypto prices by coin ids",
          description: "Current USD prices, 24h change, and market cap from CoinGecko.",
          tags: ["Crypto"],
          parameters: [
            {
              name: "ids",
              in: "query",
              required: false,
              schema: { type: "string", default: "bitcoin,ethereum,solana" },
              description: "Comma-separated CoinGecko coin ids",
              example: "bitcoin,ethereum,solana",
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
            "402": { description: "Payment Required (x402)" },
          },
          "x-payment-info": payment("0.002000"),
        },
      },
      "/api/crypto/top": {
        get: {
          operationId: "cryptoTop",
          summary: "Top coins + gainers/losers",
          description: "Top coins by market cap with 24h top gainers and losers.",
          tags: ["Crypto"],
          parameters: [
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", default: 20, minimum: 1, maximum: 50 },
              description: "Number of coins (max 50)",
            },
          ],
          responses: {
            "200": { description: "Top market data with gainers/losers" },
            "402": { description: "Payment Required (x402)" },
          },
          "x-payment-info": payment("0.006000"),
        },
      },
      "/api/crypto/ohlc": {
        get: {
          operationId: "cryptoOhlc",
          summary: "OHLC candle data",
          description: "Open/High/Low/Close candles for a coin.",
          tags: ["Crypto"],
          parameters: [
            {
              name: "id",
              in: "query",
              required: false,
              schema: { type: "string", default: "bitcoin" },
              description: "CoinGecko coin id",
              example: "bitcoin",
            },
            {
              name: "days",
              in: "query",
              required: false,
              schema: {
                type: "string",
                default: "1",
                enum: ["1", "7", "14", "30", "90", "180", "365", "max"],
              },
              description: "Lookback window in days",
            },
          ],
          responses: {
            "200": { description: "OHLC candles array" },
            "402": { description: "Payment Required (x402)" },
          },
          "x-payment-info": payment("0.015000"),
        },
      },
      "/api/stock/quote": {
        get: {
          operationId: "stockQuote",
          summary: "Single stock quote",
          description: "Delayed stock quote (Yahoo Finance).",
          tags: ["Stocks"],
          parameters: [
            {
              name: "symbol",
              in: "query",
              required: false,
              schema: { type: "string", default: "AAPL" },
              description: "Ticker symbol",
              example: "AAPL",
            },
          ],
          responses: {
            "200": { description: "Stock quote" },
            "402": { description: "Payment Required (x402)" },
          },
          "x-payment-info": payment("0.003000"),
        },
      },
      "/api/stock/batch": {
        get: {
          operationId: "stockBatch",
          summary: "Multiple stock quotes",
          description: "Batch stock quotes, max 10 symbols.",
          tags: ["Stocks"],
          parameters: [
            {
              name: "symbols",
              in: "query",
              required: false,
              schema: { type: "string", default: "AAPL,MSFT,GOOGL,TSLA,NVDA" },
              description: "Comma-separated tickers (max 10)",
              example: "AAPL,TSLA,NVDA",
            },
          ],
          responses: {
            "200": { description: "Batch quotes" },
            "402": { description: "Payment Required (x402)" },
          },
          "x-payment-info": payment("0.012000"),
        },
      },
      "/api/news": {
        get: {
          operationId: "marketNews",
          summary: "Crypto & market news",
          description: "Latest news articles related to crypto/markets.",
          tags: ["News"],
          parameters: [
            {
              name: "q",
              in: "query",
              required: false,
              schema: { type: "string", default: "cryptocurrency" },
              description: "Search query / category",
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", default: 10, minimum: 1, maximum: 20 },
              description: "Number of articles",
            },
          ],
          responses: {
            "200": { description: "News articles" },
            "402": { description: "Payment Required (x402)" },
          },
          "x-payment-info": payment("0.020000"),
        },
      },
      "/.well-known/x402": {
        get: {
          operationId: "x402Discovery",
          summary: "x402 resource list",
          description: "Compatibility discovery document listing paid resources.",
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
      "Cache-Control": "public, max-age=60",
      "Content-Type": "application/json",
    },
  });
}
