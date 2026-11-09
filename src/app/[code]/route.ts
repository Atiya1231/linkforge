import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RedirectParams {
  params: Promise<{ code: string }>;
}

function detectDevice(userAgent: string | null): string {
  if (!userAgent) return "Desktop";
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent)) return "Tablet";
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle/i.test(userAgent)) return "Mobile";
  return "Desktop";
}

export async function GET(req: NextRequest, { params }: RedirectParams) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.redirect(new URL("/link-not-found", req.url));
    }

    const link = await prisma.link.findUnique({
      where: { shortCode: code },
    });

    if (!link) {
      return NextResponse.redirect(new URL(`/link-not-found?code=${encodeURIComponent(code)}`, req.url));
    }

    // Check if link has been disabled
    if (link.disabledAt) {
      return NextResponse.redirect(new URL(`/link-disabled?code=${encodeURIComponent(code)}`, req.url));
    }

    // Check if link has expired
    if (link.expiresAt && link.expiresAt < new Date()) {
      return NextResponse.redirect(new URL(`/link-expired?code=${encodeURIComponent(code)}`, req.url));
    }

    // Capture click telemetry
    const userAgent = req.headers.get("user-agent");
    const referrer = req.headers.get("referer");
    const country =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-country-code") ||
      null;
    const deviceType = detectDevice(userAgent);

    // Log click event telemetry
    try {
      await prisma.clickEvent.create({
        data: {
          linkId: link.id,
          referrer: referrer ? referrer.slice(0, 500) : null,
          userAgent: userAgent ? userAgent.slice(0, 500) : null,
          country,
          deviceType,
        },
      });
    } catch (err) {
      console.error("Failed to record click event:", err);
    }

    return NextResponse.redirect(link.originalUrl, 307);
  } catch (error) {
    console.error("Redirect error:", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}

