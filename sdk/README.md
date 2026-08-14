# market-data-x402-sdk

Typed Node.js/TypeScript client for the [Market Data x402 API](https://market-data-x402-5wh8-ivory.vercel.app) — pay-per-request crypto & stock data, settled in USDC on Base via [x402](https://x402.org). No API keys, no subscriptions.

## Install

```bash
npm install market-data-x402-sdk
```

## Quick start

```ts
import { MarketDataClient } from "market-data-x402-sdk";

const client = new MarketDataClient({
  privateKey: process.env.BUYER_PRIVATE_KEY as `0x${string}`,
});

const prices = await client.getPrice(["bitcoin", "ethereum"]);
console.log(prices);
// { bitcoin: { usd: 62996 }, ethereum: { usd: 1873.94 } }
```

Your wallet needs a small amount of USDC on Base — each call costs $0.002–$0.02 depending on the endpoint. Payment is signed and settled automatically; you never touch raw x402 headers.

## Endpoints

| Method | Price | Description |
|---|---|---|
| `getPrice(ids)` | $0.002 | Real-time prices for one or more CoinGecko coin ids |
| `getTop(limit?)` | $0.006 | Top coins by market cap, plus gainers/losers |
| `getOhlc(id, days?)` | $0.015 | OHLC candle data |
| `getStockQuote(symbol)` | $0.003 | Single delayed stock quote |
| `getStockBatch(symbols)` | $0.012 | Delayed quotes for up to 10 tickers |
| `getNews(q?, limit?)` | $0.02 | Latest crypto & market news |

### Examples

```ts
// Top 20 coins by market cap
const top = await client.getTop(20);
console.log(top.top_by_market_cap[0]); // { id: "bitcoin", price: 62996, ... }

// 7-day OHLC candles for Bitcoin
const ohlc = await client.getOhlc("bitcoin", "7");

// Single stock quote
const aapl = await client.getStockQuote("AAPL");

// Batch stock quotes
const batch = await client.getStockBatch(["AAPL", "TSLA", "NVDA"]);

// Latest news
const news = await client.getNews("cryptocurrency", 10);
```

## Error handling

All errors throw a `MarketDataError` with a `kind` field so you can branch on failure type:

```ts
import { MarketDataError } from "market-data-x402-sdk";

try {
  const prices = await client.getPrice(["bitcoin"]);
} catch (err) {
  if (err instanceof MarketDataError) {
    switch (err.kind) {
      case "payment_rejected":
        // Payment signature was rejected by the server. Not retried
        // automatically — check your schema/params before retrying.
        break;
      case "upstream_failed":
        // The API's own data source (CoinGecko, Yahoo Finance, etc.)
        // failed. Already retried internally before this was thrown.
        break;
      case "network_error":
        // Connection issue reaching the API.
        break;
    }
  }
}
```

## Retry behavior

By default, the client retries up to 2 times (exponential backoff starting at 300ms) on network errors and upstream failures (HTTP 502/503). Payment rejections are **never** retried automatically, since retrying a rejected payment could risk a duplicate charge.

Configure retry behavior:

```ts
const client = new MarketDataClient({
  privateKey: "0x...",
  maxRetries: 3,
  retryDelayMs: 500,
});
```

## Requirements

- Node.js 18+
- A funded EVM wallet with USDC on Base (chain id 8453)

## License

MIT
