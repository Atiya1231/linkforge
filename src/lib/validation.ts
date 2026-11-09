import { z } from "zod";
import crypto from "crypto";

export const RESERVED_ALIASES = new Set([
  "api",
  "app",
  "dashboard",
  "login",
  "signup",
  "register",
  "auth",
  "logout",
  "health",
  "admin",
  "settings",
  "profile",
  "link",
  "links",
  "qr",
  "analytics",
  "about",
  "features",
  "pricing",
  "terms",
  "privacy",
  "contact",
  "help",
  "faq",
  "blog",
  "static",
  "public",
  "assets",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "link-expired",
  "link-disabled",
  "link-not-found",
]);

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateShortCode(length = 6): string {
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

export function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    if (!url.hostname || url.hostname.length < 3) return false;
    // Disallow loopback / local addresses in production if required
    const isLocal = ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(url.hostname);
    if (process.env.NODE_ENV === "production" && isLocal) return false;
    return true;
  } catch {
    return false;
  }
}

export const createLinkSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(2048, "URL is too long")
    .refine((val) => isValidHttpUrl(val), {
      message: "Please enter a valid URL starting with http:// or https://",
    }),
  customAlias: z
    .string()
    .trim()
    .max(32, "Custom alias must be at most 32 characters")
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        return /^[a-zA-Z0-9_-]{3,32}$/.test(val);
      },
      {
        message: "Alias must be 3-32 characters long and contain only letters, numbers, hyphens, and underscores",
      }
    )
    .refine(
      (val) => {
        if (!val) return true;
        return !RESERVED_ALIASES.has(val.toLowerCase());
      },
      {
        message: "This alias is reserved by the system. Please pick another.",
      }
    ),
  title: z
    .string()
    .trim()
    .max(120, "Title cannot exceed 120 characters")
    .optional()
    .nullable(),
  expiresAt: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date.getTime() > Date.now();
      },
      {
        message: "Expiration date must be in the future",
      }
    ),
});

export const updateLinkSchema = z.object({
  title: z.string().trim().max(120).optional().nullable(),
  disabled: z.boolean().optional(),
  expiresAt: z.string().optional().nullable(),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name too long"),
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

