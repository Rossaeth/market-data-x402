import { NextRequest, NextResponse } from "next/server";
import { protect, routeConfig } from "@/lib/x402";

export const dynamic = "force-dynamic";

const ELEVENLABS_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";

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
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_flash_v2_5",
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

  const arrayBuffer = await res.arrayBuffer();
  const audioBase64 = Buffer.from(arrayBuffer).toString("base64");

  return NextResponse.json({
    text,
    timestamp: new Date().toISOString(),
    mime_type: "audio/mpeg",
    audio_base64: audioBase64,
  });
}

export const GET = protect("/api/tts", config, handler);
