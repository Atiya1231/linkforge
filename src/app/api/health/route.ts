import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const linkCount = await prisma.link.count();
    return NextResponse.json({
      status: "ok",
      database: "connected",
      userCount,
      linkCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 }
    );
  }
}

