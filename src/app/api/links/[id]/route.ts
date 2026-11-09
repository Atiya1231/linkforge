import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getExistingGuestTokenHash } from "@/lib/auth";
import { updateLinkSchema } from "@/lib/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function verifyLinkOwnership(linkId: string) {
  const currentUser = await getCurrentUser();
  const guestTokenHash = await getExistingGuestTokenHash();

  const link = await prisma.link.findUnique({
    where: { id: linkId },
  });

  if (!link) return { link: null, authorized: false };

  // If user is authenticated and matches link.userId
  if (currentUser && link.userId === currentUser.id) {
    return { link, authorized: true, isGuest: false };
  }

  // If link was created by guest and matches guest token
  if (guestTokenHash && link.guestTokenHash === guestTokenHash) {
    return { link, authorized: true, isGuest: true };
  }

  return { link, authorized: false, isGuest: false };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { link, authorized } = await verifyLinkOwnership(id);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access to this link" }, { status: 403 });
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const shortUrl = `${proto}://${host}/${link.shortCode}`;

    // Get clicks and breakdown
    const clickEvents = await prisma.clickEvent.findMany({
      where: { linkId: id },
      orderBy: { clickedAt: "desc" },
      take: 100,
    });

    const totalClicks = await prisma.clickEvent.count({
      where: { linkId: id },
    });

    // Device breakdown
    const deviceCounts: Record<string, number> = {};
    const referrerCounts: Record<string, number> = {};
    const countryCounts: Record<string, number> = {};

    clickEvents.forEach((c) => {
      const device = c.deviceType || "Desktop";
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;

      const ref = c.referrer ? new URL(c.referrer).hostname : "Direct";
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;

      const country = c.country || "Unknown";
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });

    return NextResponse.json({
      link: {
        id: link.id,
        originalUrl: link.originalUrl,
        shortCode: link.shortCode,
        shortUrl,
        title: link.title,
        expiresAt: link.expiresAt,
        disabledAt: link.disabledAt,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
      },
      analytics: {
        totalClicks,
        recentClicks: clickEvents.slice(0, 30),
        deviceCounts,
        referrerCounts,
        countryCounts,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load link details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { link, authorized } = await verifyLinkOwnership(id);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const dataToUpdate: Record<string, unknown> = {};

    if (parsed.data.title !== undefined) {
      dataToUpdate.title = parsed.data.title;
    }

    if (parsed.data.disabled !== undefined) {
      dataToUpdate.disabledAt = parsed.data.disabled ? new Date() : null;
    }

    if (parsed.data.expiresAt !== undefined) {
      dataToUpdate.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
    }

    const updated = await prisma.link.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, link: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { link, authorized } = await verifyLinkOwnership(id);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "You do not have permission to delete this link" },
        { status: 403 }
      );
    }

    // Safely remove click telemetry records and the link in an atomic transaction
    await prisma.$transaction([
      prisma.clickEvent.deleteMany({ where: { linkId: id } }),
      prisma.link.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Link and associated analytics deleted successfully",
      deletedId: id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
