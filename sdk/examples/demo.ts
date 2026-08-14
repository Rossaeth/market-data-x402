/**
 * Run with: BUYER_PRIVATE_KEY=0x... npx tsx examples/demo.ts
 *
 * Requires a small amount of USDC on Base in the wallet derived from
 * BUYER_PRIVATE_KEY. Each call below costs $0.002–$0.02.
 */
import { MarketDataClient, MarketDataError } from "../src/index.js";

async function main() {
  const privateKey = process.env.BUYER_PRIVATE_KEY as `0x${string}` | undefined;
  if (!privateKey) {
    throw new Error("Set BUYER_PRIVATE_KEY env var before running this demo.");
  }

  const client = new MarketDataClient({ privateKey });

  console.log("Fetching BTC/ETH prices...");
  const prices = await client.getPrice(["bitcoin", "ethereum"]);
  console.log(prices);

  console.log("\nFetching top 10 coins by market cap...");
  const top = await client.getTop(10);
  console.log(top.top_by_market_cap.map((c) => `${c.symbol.toUpperCase()}: $${c.price}`));

  console.log("\nFetching AAPL quote...");
  try {
    const aapl = await client.getStockQuote("AAPL");
    console.log(aapl);
  } catch (err) {
    if (err instanceof MarketDataError) {
      console.error(`Failed (${err.kind}): ${err.message}`);
    } else {
      throw err;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
