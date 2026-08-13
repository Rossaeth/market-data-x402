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
    price: {
      mode: "fixed",
      currency: "USD",
      amount,
    },
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

  const paid402 = {
    "402": {
      description: "Payment Required — x402 challenge",
      content: {
        "application/json": {
          schema: {
            type: "object",
            additionalProperties: true,
          },
        },
      },
    },
  };

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Market Data x402 API",
      version: "1.0.0",
      description:
        "Pay-per-request crypto and stock market data. Settled in USDC on Base Mainnet via x402. No API keys required.",
      "x-guidance":
        "All data endpoints are x402-paid on Base (eip155:8453). Call without payment to receive HTTP 402. After paying USDC, retry with payment proof to receive JSON. Start with GET /api/crypto/price?ids=bitcoin",
      contact: { name: "Rossadi" },
    },
    servers: [{ url: base }],
    paths: {
      "/api/crypto/price": {
        get: {
          operationId: "getCryptoPrice",
          summary: "Crypto prices by coin ids",
          description:
            "Current USD price, 24h change, and market cap for one or more CoinGecko ids.",
          tags: ["Crypto"],
          parameters: [
            {
              name: "ids",
              in: "query",
              required: true,
              description: "Comma-separated CoinGecko coin ids",
              schema: {
                type: "string",
                minLength: 1,
                example: "bitcoin,ethereum,solana",
              },
            },
          ],
          responses: {
            "200": {
              description: "Price payload",
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
            ...paid402,
          },
          "x-payment-info": payment("0.002000"),
        },
      },
      "/api/crypto/top": {
        get: {
          operationId: "getCryptoTop",
          summary: "Top coins + gainers/losers",
          description:
            "Top coins by market cap plus 24h top gainers and losers.",
          tags: ["Crypto"],
          parameters: [
            {
              name: "limit",
              in: "query",
              required: true,
              description: "How many coins to return (1-50)",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 50,
                default: 20,
                example: 20,
              },
            },
          ],
          responses: {
            "200": {
              description: "Top market list with gainers/losers",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
            ...paid402,
          },
          "x-payment-info": payment("0.006000"),
        },
      },
      "/api/crypto/ohlc": {
        get: {
          operationId: "getCryptoOhlc",
          summary: "OHLC candle data",
          description: "Open/High/Low/Close candles for charting a coin.",
          tags: ["Crypto"],
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              description: "CoinGecko coin id",
              schema: {
                type: "string",
                minLength: 1,
                example: "bitcoin",
              },
            },
            {
              name: "days",
              in: "query",
              required: true,
              description: "Lookback window in days",
              schema: {
                type: "string",
                enum: ["1", "7", "14", "30", "90", "180", "365", "max"],
                default: "7",
                example: "7",
              },
            },
          ],
          responses: {
            "200": {
              description: "OHLC candles",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
            ...paid402,
          },
          "x-payment-info": payment("0.015000"),
        },
      },
      "/api/stock/quote": {
        get: {
          operationId: "getStockQuote",
          summary: "Single stock quote",
          description: "Delayed equity quote by ticker symbol.",
          tags: ["Stocks"],
          parameters: [
            {
              name: "symbol",
              in: "query",
              required: true,
              description: "Stock ticker symbol",
              schema: {
                type: "string",
                minLength: 1,
                example: "AAPL",
              },
            },
          ],
          responses: {
            "200": {
              description: "Quote object",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
            ...paid402,
          },
          "x-payment-info": payment("0.003000"),
        },
      },
      "/api/stock/batch": {
        get: {
          operationId: "getStockBatch",
          summary: "Batch stock quotes",
          description: "Multiple stock quotes in one call (max 10 symbols).",
          tags: ["Stocks"],
          parameters: [
            {
              name: "symbols",
              in: "query",
              required: true,
              description: "Comma-separated ticker symbols (max 10)",
              schema: {
                type: "string",
                minLength: 1,
                example: "AAPL,TSLA,NVDA",
              },
            },
          ],
          responses: {
            "200": {
              description: "Batch quote results",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
            ...paid402,
          },
          "x-payment-info": payment("0.012000"),
        },
      },
      "/api/news": {
        get: {
          operationId: "getMarketNews",
          summary: "Crypto & market news",
          description: "Latest news articles for a query/category.",
          tags: ["News"],
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              description: "Search query or category",
              schema: {
                type: "string",
                minLength: 1,
                example: "cryptocurrency",
              },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              description: "Number of articles (1-20)",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 20,
                default: 10,
                example: 10,
              },
            },
          ],
          responses: {
            "200": {
              description: "News list",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
            ...paid402,
          },
          "x-payment-info": payment("0.020000"),
        },
      },
      "/.well-known/x402": {
        get: {
          operationId: "getX402Discovery",
          summary: "x402 resource discovery list",
          description: "Compatibility list of paid resource URLs.",
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
