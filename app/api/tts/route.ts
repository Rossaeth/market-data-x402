import { NextRequest, NextResponse } from "next/server";
import { protect, routeConfig } from "@/lib/x402";

export const dynamic = "force-dynamic";

const CF_ACCOUNT_ID =
  process.env.CLOUDFLARE_ACCOUNT_ID || "516772a6c4aca600c2b1f1594ea74335";
const CF_MODEL = "@cf/elevenlabs/eleven-turbo-v2-5";

const config = routeConfig(
  "$0.01",
  "Text-to-speech audio generation (any text)",
  { text: "Bitcoin just crossed sixty three thousand dollars." },
  {
    properties: {
      text: { type: "string", description: "Text to convert to speech" },
    },
    required: ["text"],
  },
  { text: "...", mime_type: "audio/mpeg", audio_base64: "..." }
);

async function handler(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const text = sp.get("text");

  if (!text) {
    return NextResponse.json(
      { error: "missing required 'text' parameter" },
      { status: 400 }
    );
  }
  if (text.length > 1000) {
    return NextResponse.json(
      { error: "'text' must be 1000 characters or fewer" },
      { status: 400 }
    );
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_MODEL}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    }
  );

  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    const rawBody = await res.text().catch(() => "");
    console.log(
      JSON.stringify({
        event: "TTS_DEBUG",
        status: res.status,
        contentType,
        body: rawBody.slice(0, 500),
      })
    );
    return NextResponse.json(
      { error: "upstream failed", status: res.status, upstream_body: rawBody.slice(0, 300) },
      { status: 502 }
    );
  }

  // Cloudflare TTS models return raw audio bytes directly when successful.
  // If it ever returns JSON (e.g. an error wrapped as 200), surface that too.
  if (contentType.includes("application/json")) {
    const json = await res.json();
    return NextResponse.json(
      { error: "unexpected JSON from upstream", body: json },
      { status: 502 }
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  const audioBase64 = Buffer.from(arrayBuffer).toString("base64");

  return NextResponse.json({
    text,
    timestamp: new Date().toISOString(),
    mime_type: contentType || "audio/mpeg",
    audio_base64: audioBase64,
  });
}

export const GET = protect("/api/tts", config, handler);
