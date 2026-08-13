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
      "/api/crypto/top": {
        get: {
          operationId: "getCryptoTop",
          summary: "Top coins by market cap, plus gainers/losers",
          tags: ["Crypto"],
          parameters: [
            {
              name: "limit",
              in: "query",
              required: true,
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 50,
                default: 20,
                example: 20,
              },
              description: "Number of coins to return (max 50)",
            },
          ],
          responses: {
            "200": {
              description: "Top coins, gainers, and losers",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      timestamp: { type: "string", format: "date-time" },
                      top_by_market_cap: { type: "array", items: { type: "object", additionalProperties: true } },
                      top_gainers: { type: "array", items: { type: "object", additionalProperties: true } },
                      top_losers: { type: "array", items: { type: "object", additionalProperties: true } },
                    },
                  },
                },
              },
            },
            "402": { description: "Payment Required" },
          },
          "x-payment-info": {
            price: { mode: "fixed", currency: "USD", amount: "0.006000" },
            protocols: [{ x402: {} }],
          },
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
              schema: { type: "string", default: "bitcoin", example: "bitcoin" },
              description: "CoinGecko coin id",
            },
            {
              name: "days",
              in: "query",
              required: true,
              schema: {
                type: "string",
                enum: ["1", "7", "14", "30", "90", "180", "365", "max"],
                default: "7",
                example: "7",
              },
              description: "Lookback window in days",
            },
          ],
          responses: {
            "200": {
              description: "OHLC candle data",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      days: { type: "string" },
                      timestamp: { type: "string", format: "date-time" },
                      candles: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            time: { type: "number" },
                            open: { type: "number" },
                            high: { type: "number" },
                            low: { type: "number" },
                            close: { type: "number" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "402": { description: "Payment Required" },
          },
          "x-payment-info": {
            price: { mode: "fixed", currency: "USD", amount: "0.015000" },
            protocols: [{ x402: {} }],
          },
        },
      },
      "/api/stock/quote": {
        get: {
          operationId: "getStockQuote",
          summary: "Single stock quote",
          tags: ["Stock"],
          parameters: [
            {
              name: "symbol",
              in: "query",
              required: true,
              schema: { type: "string", default: "AAPL", example: "AAPL" },
              description: "Ticker symbol",
            },
          ],
          responses: {
            "200": {
              description: "Stock quote",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      symbol: { type: "string" },
                      price: { type: "number" },
                      previousClose: { type: "number" },
                      currency: { type: "string" },
                      exchange: { type: "string" },
                      timestamp: { type: "string", format: "date-time" },
                      note: { type: "string" },
                    },
                  },
                },
              },
            },
            "402": { description: "Payment Required" },
            "404": { description: "Symbol not found" },
          },
          "x-payment-info": {
            price: { mode: "fixed", currency: "USD", amount: "0.003000" },
            protocols: [{ x402: {} }],
          },
        },
      },
      "/api/stock/batch": {
        get: {
          operationId: "getStockBatch",
          summary: "Batch stock quotes",
          tags: ["Stock"],
          parameters: [
            {
              name: "symbols",
              in: "query",
              required: true,
              schema: {
                type: "string",
                default: "AAPL,MSFT,GOOGL,TSLA,NVDA",
                example: "AAPL,TSLA,NVDA",
              },
              description: "Comma-separated ticker symbols (max 10)",
            },
          ],
          responses: {
            "200": {
              description: "Batch stock quotes",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      timestamp: { type: "string", format: "date-time" },
                      count: { type: "integer" },
                      data: { type: "array", items: { type: "object", additionalProperties: true } },
                    },
                  },
                },
              },
            },
            "402": { description: "Payment Required" },
          },
          "x-payment-info": {
            price: { mode: "fixed", currency: "USD", amount: "0.012000" },
            protocols: [{ x402: {} }],
          },
        },
      },
      "/api/news": {
        get: {
          operationId: "getNews",
          summary: "Crypto & market news",
          tags: ["News"],
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string", default: "cryptocurrency", example: "cryptocurrency" },
              description: "News category/query (e.g. cryptocurrency, blockchain)",
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 20, default: 10 },
              description: "Number of articles to return (max 20)",
            },
          ],
          responses: {
            "200": {
              description: "News articles",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      query: { type: "string" },
                      timestamp: { type: "string", format: "date-time" },
                      count: { type: "integer" },
                      articles: { type: "array", items: { type: "object", additionalProperties: true } },
                    },
                  },
                },
              },
            },
            "402": { description: "Payment Required" },
          },
          "x-payment-info": {
            price: { mode: "fixed", currency: "USD", amount: "0.020000" },
            protocols: [{ x402: {} }],
          },
        },
      },
    },
  });
}
