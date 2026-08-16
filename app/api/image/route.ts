import { NextRequest, NextResponse } from "next/server";
import { protect, routeConfig } from "@/lib/x402";

export const dynamic = "force-dynamic";

const CF_ACCOUNT_ID =
  process.env.CLOUDFLARE_ACCOUNT_ID || "516772a6c4aca600c2b1f1594ea74335";
const CF_MODEL = "@cf/black-forest-labs/flux-1-schnell";

const config = routeConfig(
  "$0.01",
  "AI image generation from a text prompt",
  { prompt: "a cyberpunk bull running through a neon city" },
  {
    properties: {
      prompt: { type: "string", description: "Text description of the image to generate" },
    },
    required: ["prompt"],
  },
  { prompt: "...", mime_type: "image/jpeg", image_base64: "..." }
);

async function handler(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const prompt = sp.get("prompt");

  if (!prompt) {
    return NextResponse.json(
      { error: "missing required 'prompt' parameter" },
      { status: 400 }
    );
  }
  if (prompt.length > 2048) {
    return NextResponse.json(
      { error: "'prompt' must be 2048 characters or fewer" },
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
        input: { prompt, steps: 4 },
      }),
    }
  );

  if (!res.ok) {
    const rawBody = await res.text().catch(() => "");
    console.log(
      JSON.stringify({
        event: "IMAGE_DEBUG",
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
  const imageBase64 = json?.result?.image;

  if (!imageBase64) {
    return NextResponse.json(
      { error: "no image returned by upstream", upstream_body: JSON.stringify(json).slice(0, 300) },
      { status: 502 }
    );
  }

  return NextResponse.json({
    prompt,
    timestamp: new Date().toISOString(),
    mime_type: "image/jpeg",
    image_base64: imageBase64,
  });
}

export const GET = protect("/api/image", config, handler);
