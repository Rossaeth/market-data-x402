const base = "https://market-data-x402-5wh8-ivory.vercel.app";

const endpoints = [
  {
    path: "/api/crypto/price",
    price: "$0.002",
    desc: "Real-time crypto prices by coin id",
    example: "?ids=bitcoin,ethereum,solana",
  },
  {
    path: "/api/crypto/top",
    price: "$0.006",
    desc: "Top coins by market cap + gainers/losers",
    example: "?limit=20",
  },
  {
    path: "/api/crypto/ohlc",
    price: "$0.015",
    desc: "OHLC candle data for charting",
    example: "?id=bitcoin&days=7",
  },
  {
    path: "/api/stock/quote",
    price: "$0.003",
    desc: "Single stock quote (delayed)",
    example: "?symbol=AAPL",
  },
  {
    path: "/api/stock/batch",
    price: "$0.012",
    desc: "Multiple stock quotes at once (max 10)",
    example: "?symbols=AAPL,TSLA,NVDA",
  },
  {
    path: "/api/news",
    price: "$0.02",
    desc: "Latest crypto & market news",
    example: "?q=cryptocurrency&limit=10",
  },
  {
    path: "/api/solana/wallet",
    price: "$0.008",
    desc: "Solana wallet portfolio (SOL + SPL token holdings)",
    example: "?address=5oNDLrU6qw9Q3KJu2zEqufZ3gqU1n4JUoWVvoMGvmiDa",
  },
  {
    path: "/api/solana/transactions",
    price: "$0.006",
    desc: "Recent transaction history for a Solana wallet",
    example: "?address=5oNDLrU6qw9Q3KJu2zEqufZ3gqU1n4JUoWVvoMGvmiDa&limit=10",
  },
];

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37,99,235,0.25), transparent), #09090b",
        color: "#fafafa",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "48px 20px 64px" }}>
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 999,
            border: "1px solid #3f3f46",
            background: "rgba(24,24,27,0.8)",
            fontSize: 13,
            color: "#d4d4d8",
            marginBottom: 20,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 8px #22c55e",
            }}
          />
          Live on Base Mainnet · x402
        </div>

        {/* Hero */}
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            lineHeight: 1.1,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: "0 0 16px",
          }}
        >
          Market Data
          <span
            style={{
              background: "linear-gradient(90deg, #60a5fa, #22d3ee)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {" "}
            x402 API
          </span>
        </h1>

        <p
          style={{
            fontSize: 18,
            lineHeight: 1.6,
            color: "#a1a1aa",
            maxWidth: 560,
            margin: "0 0 28px",
          }}
        >
          Pay-per-request crypto & stock data for AI agents and developers.
          No API keys. No accounts. Just USDC on Base.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 48 }}>
          <a
            href="#endpoints"
            style={{
              background: "#2563eb",
              color: "#fff",
              padding: "12px 20px",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            View Endpoints
          </a>
          <a
            href="/.well-known/x402"
            style={{
              background: "#18181b",
              color: "#e4e4e7",
              padding: "12px 20px",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 15,
              border: "1px solid #3f3f46",
            }}
          >
            Discovery Spec
          </a>
        </div>

        {/* Features */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
            marginBottom: 48,
          }}
        >
          {[
            { t: "No API Keys", d: "Pay with USDC via x402. Zero signup friction." },
            { t: "Base Mainnet", d: "Settled on eip155:8453 — fast & low cost." },
            { t: "Agent Ready", d: "Works with x402 clients & discovery crawlers." },
          ].map((f) => (
            <div
              key={f.t}
              style={{
                background: "rgba(24,24,27,0.7)",
                border: "1px solid #27272a",
                borderRadius: 16,
                padding: 18,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{f.t}</div>
              <div style={{ color: "#a1a1aa", fontSize: 14, lineHeight: 1.5 }}>{f.d}</div>
            </div>
          ))}
        </div>

        {/* Endpoints */}
        <h2 id="endpoints" style={{ fontSize: 22, fontWeight: 700, margin: "0 0 14px" }}>
          Endpoints & Pricing
        </h2>

        <div
          style={{
            border: "1px solid #27272a",
            borderRadius: 16,
            overflow: "hidden",
            background: "rgba(9,9,11,0.6)",
            marginBottom: 40,
          }}
        >
          {endpoints.map((e, i) => (
            <div
              key={e.path}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 12,
                padding: "16px 18px",
                borderBottom: i === endpoints.length - 1 ? "none" : "1px solid #27272a",
              }}
            >
              <div>
                <code style={{ color: "#22d3ee", fontSize: 14 }}>{e.path}</code>
                <div style={{ color: "#d4d4d8", fontSize: 14, marginTop: 4 }}>{e.desc}</div>
                <div style={{ color: "#71717a", fontSize: 12, marginTop: 4 }}>{e.example}</div>
              </div>
              <div
                style={{
                  alignSelf: "center",
                  color: "#4ade80",
                  fontWeight: 700,
                  fontSize: 15,
                  whiteSpace: "nowrap",
                }}
              >
                {e.price}
              </div>
            </div>
          ))}
        </div>

        {/* How to call */}
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 14px" }}>How to call</h2>
        <div
          style={{
            background: "#0c0c0e",
            border: "1px solid #27272a",
            borderRadius: 16,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <div style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 10 }}>cURL — expect HTTP 402</div>
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              fontSize: 13,
              color: "#67e8f9",
              lineHeight: 1.5,
            }}
          >
            {`curl -v "${base}/api/crypto/price?ids=bitcoin,ethereum"`}
          </pre>
        </div>

        <div
          style={{
            background: "#0c0c0e",
            border: "1px solid #27272a",
            borderRadius: 16,
            padding: 18,
            marginBottom: 40,
          }}
        >
          <div style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 10 }}>
            Payment flow
          </div>
          <ol style={{ margin: 0, paddingLeft: 18, color: "#d4d4d8", fontSize: 14, lineHeight: 1.7 }}>
            <li>Call any endpoint without payment</li>
            <li>Receive <span style={{ color: "#fbbf24" }}>402</span> + payment requirements</li>
            <li>Pay USDC on Base (x402 client handles it)</li>
            <li>Retry request → get JSON data</li>
          </ol>
        </div>

        {/* Footer */}
        <footer
          style={{
            borderTop: "1px solid #27272a",
            paddingTop: 24,
            color: "#71717a",
            fontSize: 14,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span>
            Built by <strong style={{ color: "#fafafa" }}>Rossadi</strong> · Powered by x402 on Base
          </span>
          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
            payTo: 0xd850…4d45
          </span>
        </footer>
      </div>
    </main>
  );
}
