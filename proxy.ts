import { paymentProxy } from "@x402/next";
import { x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { createCdpFacilitatorClient } from "@coinbase/cdp-sdk/x402";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";

const payTo = (process.env.EVM_ADDRESS ||
  "0xd850034a1cce920691a4880dea0fc064bccd4d45") as `0x${string}`;

const facilitator = createCdpFacilitatorClient();
const server = new x402ResourceServer(facilitator).register(
  "eip155:8453",
  new ExactEvmScheme()
);

function route(
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

export const proxy = paymentProxy(
  {
    "/api/crypto/price": route(
      "$0.002",
      "Crypto prices by coin ids",
      { ids: "bitcoin,ethereum" },
      {
        properties: {
          ids: { type: "string", description: "Comma-separated CoinGecko ids" },
        },
        required: ["ids"],
      },
      { source: "coingecko", data: { bitcoin: { usd: 65000 } } }
    ),
    "/api/crypto/top": route(
      "$0.006",
      "Top coins + gainers/losers",
      { limit: 20 },
      {
        properties: {
          limit: { type: "integer", minimum: 1, maximum: 50 },
        },
        required: ["limit"],
      },
      { top_by_market_cap: [], top_gainers: [], top_losers: [] }
    ),
    "/api/crypto/ohlc": route(
      "$0.015",
      "OHLC candle data",
      { id: "bitcoin", days: "7" },
      {
        properties: {
          id: { type: "string" },
          days: {
            type: "string",
            enum: ["1", "7", "14", "30", "90", "180", "365", "max"],
          },
        },
        required: ["id", "days"],
      },
      { id: "bitcoin", candles: [] }
    ),
    "/api/stock/quote": route(
      "$0.003",
      "Single stock quote",
      { symbol: "AAPL" },
      {
        properties: {
          symbol: { type: "string", description: "Ticker" },
        },
        required: ["symbol"],
      },
      { symbol: "AAPL", price: 190 }
    ),
    "/api/stock/batch": route(
      "$0.012",
      "Batch stock quotes",
      { symbols: "AAPL,TSLA,NVDA" },
      {
        properties: {
          symbols: { type: "string", description: "Comma-separated tickers" },
        },
        required: ["symbols"],
      },
      { count: 3, data: [] }
    ),
    "/api/news": route(
      "$0.02",
      "Crypto & market news",
      { q: "cryptocurrency", limit: 10 },
      {
        properties: {
          q: { type: "string" },
          limit: { type: "integer", minimum: 1, maximum: 20 },
        },
        required: ["q"],
      },
      { articles: [] }
    ),
  },
  server
);

export const config = {
  matcher: [
    "/api/crypto/price",
    "/api/crypto/top",
    "/api/crypto/ohlc",
    "/api/stock/quote",
    "/api/stock/batch",
    "/api/news",
  ],
};
