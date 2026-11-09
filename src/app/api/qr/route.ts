import { NextRequest, NextResponse } from "next/server";
import { generateQrDataUrl, generateQrSvg } from "@/lib/qr";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("url");
  const format = searchParams.get("format") || "dataUrl";

  if (!text) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    if (format === "svg") {
      const svg = await generateQrSvg(text);
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    const dataUrl = await generateQrDataUrl(text);
    return NextResponse.json({ dataUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate QR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

