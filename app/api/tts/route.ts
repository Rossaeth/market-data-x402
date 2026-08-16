import { NextRequest, NextResponse } from "next/server";
import { protect, routeConfig } from "@/lib/x402";

export const dynamic = "force-dynamic";

const CF_ACCOUNT_ID =
  process.env.CLOUDFLARE_ACCOUNT_ID || "516772a6c4aca600c2b1f1594ea74335";
const CF_MODEL = "elevenlabs/eleven-turbo-v2-5";
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";

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
  { text: "...", audio_url: "https://..." }
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
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CF_MODEL,
        input: {
          text,
          voice_id: DEFAULT_VOICE_ID,
          output_format: "mp3_44100_128",
        },
      }),
    }
  );

  if (!res.ok) {
    const rawBody = await res.text().catch(() => "");
    console.log(
      JSON.stringify({
        event: "TTS_DEBUG",
        status: res.status,
        body: rawBody.slice(0, 500),
      })
    );
    return NextResponse.json(
      { error: "upstream failed", status: res.status, upstream_body: rawBody.slice(0, 300) },
      { status: 502 }
    );
  }

  const json = await res.json();
  const audioUrl = json?.result?.audio;

  if (!audioUrl) {
    return NextResponse.json(
      { error: "no audio returned by upstream", upstream_body: JSON.stringify(json).slice(0, 300) },
      { status: 502 }
    );
  }

  return NextResponse.json({
    text,
    timestamp: new Date().toISOString(),
    audio_url: audioUrl,
  });
}

export const GET = protect("/api/tts", config, handler);
