import { paymentProxy } from "@x402/next";
import { x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { createCdpFacilitatorClient } from "@coinbase/cdp-sdk/x402";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";

const facilitator = createCdpFacilitatorClient();
const server = new x402ResourceServer(facilitator)
  .register("eip155:8453", new ExactEvmScheme());

const payTo = process.env.EVM_ADDRESS!;

export const proxy = paymentProxy(
  {
    "/api/crypto/price": {
      accepts: [{ scheme: "exact", price: "$0.002", network: "eip155:8453", payTo }],
      description: "Crypto prices by coin ids",
      mimeType: "application/json",
      extensions: {
        ...declareDiscoveryExtension({
          input: { ids: "bitcoin,ethereum" },
          inputSchema: {
            properties: {
              ids: { type: "string", description: "Comma-separated CoinGecko ids" },
            },
          },
        }),
      },
    },
    "/api/crypto/top": {
      accepts: [{ scheme: "exact", price: "$0.006", network: "eip155:8453", payTo }],
      description: "Top coins + gainers/losers",
      mimeType: "application/json",
    },
    "/api/crypto/ohlc": {
      accepts: [{ scheme: "exact", price: "$0.015", network: "eip155:8453", payTo }],
      description: "OHLC candle data",
      mimeType: "application/json",
    },
    "/api/stock/quote": {
      accepts: [{ scheme: "exact", price: "$0.003", network: "eip155:8453", payTo }],
      description: "Single stock quote",
      mimeType: "application/json",
    },
    "/api/stock/batch": {
      accepts: [{ scheme: "exact", price: "$0.012", network: "eip155:8453", payTo }],
      description: "Multiple stock quotes",
      mimeType: "application/json",
    },
    "/api/news": {
      accepts: [{ scheme: "exact", price: "$0.02", network: "eip155:8453", payTo }],
      description: "Crypto & market news",
      mimeType: "application/json",
    },
  },
  server
);

export const config = {
  matcher: ["/api/crypto/:path*", "/api/stock/:path*", "/api/news/:path*"],
};
