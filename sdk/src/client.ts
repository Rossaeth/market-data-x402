import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const BASE_URL = "https://market-data-x402-5wh8-ivory.vercel.app";

export interface MarketDataClientOptions {
  /** Buyer's EVM private key (0x-prefixed). Used to sign x402 payments on Base. */
  privateKey: `0x${string}`;
  /** Max retry attempts for transient failures (network errors, 5xx). Default 2. */
  maxRetries?: number;
  /** Base delay in ms between retries (exponential backoff). Default 300. */
  retryDelayMs?: number;
  /** Override the base API URL (mostly for testing). */
  baseUrl?: string;
}

export class MarketDataError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | "payment_rejected"
      | "payment_unknown"
      | "upstream_failed"
      | "network_error"
      | "invalid_response",
    public readonly status?: number,
    public readonly raw?: unknown
  ) {
    super(message);
    this.name = "MarketDataError";
  }
}

export interface PriceResult {
  [coinId: string]: { usd: number };
}

export interface TopCoin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  market_cap: number;
  volume_24h: number;
  change_24h: number;
  rank: number;
}

export interface TopResult {
  timestamp: string;
  top_by_market_cap: TopCoin[];
  top_gainers: TopCoin[];
  top_losers: TopCoin[];
}

export interface OhlcCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface OhlcResult {
  id: string;
  days: string;
  timestamp: string;
  candles: OhlcCandle[];
}

export interface StockQuoteResult {
  symbol: string;
  price: number;
  currency: string;
  exchange: string;
  timestamp: string;
  note: string;
}

export interface StockBatchItem {
  symbol: string;
  price: number;
  change: number | null;
  changePercent: number | null;
  currency: string;
}

export interface StockBatchResult {
  timestamp: string;
  count: number;
  data: StockBatchItem[];
}

export interface NewsArticle {
  title: string | null;
  url: string | null;
  source: string | null;
  published: string | null;
  body: string | null;
  categories: string[] | null;
}

export interface NewsResult {
  query: string;
  timestamp: string;
  count: number;
  articles: NewsArticle[];
}

/**
 * Client for the Market Data x402 API. Handles x402 payment signing,
 * automatic retries on transient failures, and typed responses per endpoint.
 *
 * @example
 * ```ts
 * const client = new MarketDataClient({ privateKey: "0xabc..." });
 * const prices = await client.getPrice(["bitcoin", "ethereum"]);
 * ```
 */
export class MarketDataClient {
  private readonly fetchWithPay: typeof fetch;
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(options: MarketDataClientOptions) {
    const account = privateKeyToAccount(options.privateKey);
    const x402 = registerExactEvmScheme(new x402Client(), { signer: account });
    this.fetchWithPay = wrapFetchWithPayment(fetch, x402);
    this.baseUrl = options.baseUrl ?? BASE_URL;
    this.maxRetries = options.maxRetries ?? 2;
    this.retryDelayMs = options.retryDelayMs ?? 300;
  }

  /** GET /api/crypto/price — real-time prices for one or more CoinGecko coin ids. */
  async getPrice(ids: string[]): Promise<PriceResult> {
    return this.request<PriceResult>("/api/crypto/price", {
      ids: ids.join(","),
    });
  }

  /** GET /api/crypto/top — top coins by market cap, plus gainers/losers. */
  async getTop(limit = 20): Promise<TopResult> {
    return this.request<TopResult>("/api/crypto/top", {
      limit: String(limit),
    });
  }

  /** GET /api/crypto/ohlc — OHLC candle data for a coin. */
  async getOhlc(
    id: string,
    days: "1" | "7" | "14" | "30" | "90" | "180" | "365" | "max" = "7"
  ): Promise<OhlcResult> {
    return this.request<OhlcResult>("/api/crypto/ohlc", { id, days });
  }

  /** GET /api/stock/quote — single delayed stock quote. */
  async getStockQuote(symbol: string): Promise<StockQuoteResult> {
    return this.request<StockQuoteResult>("/api/stock/quote", { symbol });
  }

  /** GET /api/stock/batch — delayed quotes for up to 10 tickers. */
  async getStockBatch(symbols: string[]): Promise<StockBatchResult> {
    return this.request<StockBatchResult>("/api/stock/batch", {
      symbols: symbols.join(","),
    });
  }

  /** GET /api/news — latest crypto & market news. */
  async getNews(q = "cryptocurrency", limit = 10): Promise<NewsResult> {
    return this.request<NewsResult>("/api/news", { q, limit: String(limit) });
  }

  private async request<T>(
    path: string,
    params: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseUrl}${path}?${new URLSearchParams(params).toString()}`;

    let lastError: MarketDataError | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const res = await this.fetchWithPay(url, { method: "GET" });

        if (res.status === 402) {
          // Payment was attempted but rejected by the server (not a
          // network issue) — retrying won't help without a fresh payment,
          // but withPaymentInterceptor already handles the retry-with-payment
          // flow internally, so a 402 here means the paid attempt itself
          // was rejected.
          throw new MarketDataError(
            `Payment was rejected for ${path}`,
            "payment_rejected",
            402
          );
        }

        if (res.status === 502 || res.status === 503) {
          throw new MarketDataError(
            `Upstream data source failed for ${path}`,
            "upstream_failed",
            res.status
          );
        }

        if (!res.ok) {
          throw new MarketDataError(
            `Unexpected response (${res.status}) for ${path}`,
            "invalid_response",
            res.status
          );
        }

        return (await res.json()) as T;
      } catch (err) {
        if (err instanceof MarketDataError) {
          lastError = err;
          // Only retry on upstream/network failures — never retry a
          // rejected payment attempt, since that could trigger duplicate
          // charges without a guaranteed refund.
          if (err.kind === "payment_rejected") throw err;
        } else {
          lastError = new MarketDataError(
            err instanceof Error ? err.message : "Unknown network error",
            "network_error",
            undefined,
            err
          );
        }

        if (attempt < this.maxRetries) {
          await sleep(this.retryDelayMs * Math.pow(2, attempt));
          continue;
        }
      }
    }

    throw lastError;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
