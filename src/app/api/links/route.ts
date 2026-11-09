import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getOrCreateGuestToken, getExistingGuestTokenHash } from "@/lib/auth";
import { createLinkSchema, generateShortCode } from "@/lib/validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`create-link:${ip}`, 30, 60 * 1000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a minute before creating more links." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = createLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input parameters" },
        { status: 400 }
      );
    }

    const { url, customAlias, title, expiresAt } = parsed.data;

    let shortCode: string;
    if (customAlias) {
      const existing = await prisma.link.findUnique({
        where: { shortCode: customAlias },
      });
      if (existing) {
        return NextResponse.json(
          { error: `The custom alias "${customAlias}" is already in use. Please pick another.` },
          { status: 409 }
        );
      }
      shortCode = customAlias;
    } else {
      let uniqueCode = "";
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateShortCode(6);
        const exists = await prisma.link.findUnique({
          where: { shortCode: candidate },
        });
        if (!exists) {
          uniqueCode = candidate;
          break;
        }
      }
      if (!uniqueCode) {
        uniqueCode = generateShortCode(8);
      }
      shortCode = uniqueCode;
    }

    const currentUser = await getCurrentUser();
    let userId: string | null = null;
    let guestTokenHash: string | null = null;

    if (currentUser) {
      userId = currentUser.id;
    } else {
      const guest = await getOrCreateGuestToken();
      guestTokenHash = guest.tokenHash;
    }

    const expirationDate = expiresAt ? new Date(expiresAt) : null;

    const link = await prisma.link.create({
      data: {
        originalUrl: url,
        shortCode,
        title: title || null,
        userId,
        guestTokenHash,
        expiresAt: expirationDate,
      },
      include: {
        _count: {
          select: { clicks: true },
        },
      },
    });

    const baseUrl = getBaseUrl(req);
    const shortUrl = `${baseUrl}/${link.shortCode}`;

    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        originalUrl: link.originalUrl,
        shortCode: link.shortCode,
        shortUrl,
        title: link.title,
        isGuest: !userId,
        expiresAt: link.expiresAt,
        disabledAt: link.disabledAt,
        createdAt: link.createdAt,
        clicks: link._count.clicks,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create short link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const guestTokenHash = await getExistingGuestTokenHash();

    let whereClause = {};
    if (currentUser) {
      whereClause = { userId: currentUser.id };
    } else if (guestTokenHash) {
      whereClause = { guestTokenHash, userId: null };
    } else {
      return NextResponse.json({ links: [], total: 0 });
    }

    const links = await prisma.link.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { clicks: true },
        },
      },
    });

    const baseUrl = getBaseUrl(req);
    const formatted = links.map((link) => ({
      id: link.id,
      originalUrl: link.originalUrl,
      shortCode: link.shortCode,
      shortUrl: `${baseUrl}/${link.shortCode}`,
      title: link.title,
      isGuest: !link.userId,
      expiresAt: link.expiresAt,
      disabledAt: link.disabledAt,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      clicks: link._count.clicks,
    }));

    return NextResponse.json({
      links: formatted,
      total: formatted.length,
      isGuest: !currentUser,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch links";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

