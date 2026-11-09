import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const SESSION_COOKIE = "linkforge_session";
const GUEST_COOKIE = "linkforge_guest_token";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "linkforge-fallback-secret-at-least-32-chars-long";
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  email: string;
  name?: string | null;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  name: string | null;
  role: string;
} | null> {
  try {
    let token: string | undefined;

    const cookieStore = await cookies();
    token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      const headerStore = await headers();
      const authHeader = headerStore.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      }
    }

    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function hashGuestToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function getOrCreateGuestToken(): Promise<{
  rawToken: string;
  tokenHash: string;
}> {
  const cookieStore = await cookies();
  let token = cookieStore.get(GUEST_COOKIE)?.value;

  if (!token) {
    token = crypto.randomBytes(24).toString("hex");
    cookieStore.set(GUEST_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });
  }

  return {
    rawToken: token,
    tokenHash: hashGuestToken(token),
  };
}

export async function getExistingGuestTokenHash(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(GUEST_COOKIE)?.value;
    if (!token) return null;
    return hashGuestToken(token);
  } catch {
    return null;
  }
}
