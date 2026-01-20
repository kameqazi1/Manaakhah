/**
 * Type-safe environment validation using @t3-oss/env-nextjs
 *
 * This module validates environment variables at build time and runtime.
 * It uses mode-aware validation:
 * - In production: DATABASE_URL, RESEND_API_KEY required
 * - In mock mode (USE_MOCK_DATA=true): DATABASE_URL, RESEND_API_KEY optional
 * - NEXTAUTH_SECRET is always required
 */

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Determine validation mode
// Check both USE_MOCK_DATA variants - the NEXT_PUBLIC_ version is available at build time
const isMockMode = process.env.USE_MOCK_DATA === "true" || process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export const env = createEnv({
  server: {
    // Always required (but allow shorter in mock mode for easier setup)
    NEXTAUTH_SECRET: isMockMode
      ? z.string().min(1, "NEXTAUTH_SECRET is required")
      : z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
    NEXTAUTH_URL: z.string().url().optional(),

    // Required in production non-mock mode only
    // In mock mode, these are completely optional
    DATABASE_URL: isMockMode
      ? z.string().optional()
      : z.string().min(1, "DATABASE_URL is required in production"),

    RESEND_API_KEY: isMockMode
      ? z.string().optional()
      : z.string().startsWith("re_", "RESEND_API_KEY must start with 're_'"),

    FROM_EMAIL: z.string().email().optional(),

    // Cloudinary - optional
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    // OAuth providers - optional
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    APPLE_CLIENT_ID: z.string().optional(),
    APPLE_CLIENT_SECRET: z.string().optional(),

    // Mock mode flag (server-side)
    USE_MOCK_DATA: z.enum(["true", "false"]).optional().default("false"),
  },

  client: {
    // App URL with sensible default
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

    // Mock mode flag (client-side)
    NEXT_PUBLIC_USE_MOCK_DATA: z.enum(["true", "false"]).optional().default("false"),

    // Cloudinary - optional
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),

    // Map configuration - optional
    NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),

    // Default location - optional
    NEXT_PUBLIC_DEFAULT_LAT: z.string().optional(),
    NEXT_PUBLIC_DEFAULT_LNG: z.string().optional(),
    NEXT_PUBLIC_DEFAULT_CITY: z.string().optional(),
  },

  runtimeEnv: {
    // Server
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
    APPLE_CLIENT_SECRET: process.env.APPLE_CLIENT_SECRET,
    USE_MOCK_DATA: process.env.USE_MOCK_DATA,

    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_DEFAULT_LAT: process.env.NEXT_PUBLIC_DEFAULT_LAT,
    NEXT_PUBLIC_DEFAULT_LNG: process.env.NEXT_PUBLIC_DEFAULT_LNG,
    NEXT_PUBLIC_DEFAULT_CITY: process.env.NEXT_PUBLIC_DEFAULT_CITY,
  },

  // Skip validation in CI environments or when explicitly requested
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",

  // Called when validation fails
  onValidationError: (error) => {
    console.error("\n========================================");
    console.error("ENVIRONMENT VALIDATION FAILED");
    console.error("========================================\n");

    // t3-env passes either a ZodError (with issues) or an array-like structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const issues: Array<{ path?: string[]; message?: string }> =
      "issues" in error && Array.isArray((error as { issues: unknown }).issues)
        ? (error as { issues: Array<{ path?: string[]; message?: string }> }).issues
        : Array.isArray(error)
        ? error
        : [];

    if (issues.length > 0) {
      const formatted = issues
        .map((issue) =>
          `  - ${issue.path?.join(".") || "unknown"}: ${issue.message || "Invalid value"}`
        )
        .join("\n");
      console.error("Missing or invalid environment variables:\n");
      console.error(formatted);
      console.error("\n========================================\n");
      throw new Error(`Environment validation failed:\n${formatted}`);
    } else {
      console.error("Unknown validation error:", error);
      console.error("\n========================================\n");
      throw new Error(`Environment validation failed. Check your .env.local file.`);
    }
  },

  // Called when a server-side variable is accessed on the client
  onInvalidAccess: (variable) => {
    throw new Error(
      `Attempted to access server-side environment variable "${variable}" on the client. ` +
      `Only NEXT_PUBLIC_* variables can be accessed on the client.`
    );
  },

  // Treat empty strings as undefined (common in Docker environments)
  emptyStringAsUndefined: true,
});
