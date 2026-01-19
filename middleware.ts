/**
 * Mock Header Protection Middleware
 *
 * Detects and logs when mock auth headers (x-user-id, x-user-role) are sent
 * while not in mock mode. This is a security measure to detect potential
 * header injection attacks.
 *
 * IMPORTANT: This middleware logs warnings but NEVER rejects requests.
 * Security through obscurity - attackers should not know their attempts are detected.
 * Real auth continues normally even when mock headers are sent.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiting for mock header abuse
// Note: Resets on cold start - acceptable for logging/warning only
const suspiciousIPs = new Map<
  string,
  { attempts: number; firstSeen: number; blocked: boolean }
>();

// Rate limiting configuration
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_ATTEMPTS = 5; // Attempts before "blocking" (just logging)
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minute block duration
const CLEANUP_INTERVAL_MS = 60 * 1000; // Clean old entries every minute

// Track last cleanup time
let lastCleanup = Date.now();

/**
 * Clean up old entries from the rate limit map to prevent memory growth
 */
function cleanupOldEntries(): void {
  const now = Date.now();

  // Only run cleanup once per minute
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  lastCleanup = now;

  for (const [ip, data] of suspiciousIPs) {
    // Remove entries older than block duration
    if (now - data.firstSeen > BLOCK_DURATION_MS) {
      suspiciousIPs.delete(ip);
    }
  }
}

/**
 * Extract client IP from request headers
 * Handles common proxy headers: x-forwarded-for, x-real-ip
 */
function getClientIP(request: NextRequest): string {
  // x-forwarded-for may contain multiple IPs, first one is the client
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIP = forwardedFor.split(",")[0]?.trim();
    if (firstIP) return firstIP;
  }

  // Fallback to x-real-ip
  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;

  return "unknown";
}

export function middleware(request: NextRequest): NextResponse {
  // Only check API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check if we're in mock mode
  const isMockMode = process.env.USE_MOCK_DATA === "true";

  // In mock mode, headers are expected - no action needed
  if (isMockMode) {
    return NextResponse.next();
  }

  // Check for mock headers in production mode
  const hasMockUserId = request.headers.has("x-user-id");
  const hasMockUserRole = request.headers.has("x-user-role");

  if (hasMockUserId || hasMockUserRole) {
    const ip = getClientIP(request);
    const now = Date.now();

    // Periodic cleanup
    cleanupOldEntries();

    // Get or create rate limit record
    let record = suspiciousIPs.get(ip);

    if (!record) {
      // First attempt from this IP
      record = { attempts: 1, firstSeen: now, blocked: false };
      suspiciousIPs.set(ip, record);
    } else if (!record.blocked && now - record.firstSeen > WINDOW_MS) {
      // Window expired, reset counter (but keep tracking if previously blocked)
      record.attempts = 1;
      record.firstSeen = now;
    } else {
      // Within window, increment attempts
      record.attempts++;
    }

    // Check if should mark as blocked (for logging purposes)
    if (record.attempts >= MAX_ATTEMPTS && !record.blocked) {
      record.blocked = true;
      console.error(
        `[SECURITY] IP ${ip} blocked: ${record.attempts} mock header attempts in ${WINDOW_MS / 1000}s`
      );
    }

    // Build header list for logging
    const detectedHeaders: string[] = [];
    if (hasMockUserId) {
      detectedHeaders.push(`x-user-id: ${request.headers.get("x-user-id")}`);
    }
    if (hasMockUserRole) {
      detectedHeaders.push(`x-user-role: ${request.headers.get("x-user-role")}`);
    }

    // Log the security warning
    console.warn(
      `[SECURITY] Mock headers in production - ` +
        `IP: ${ip}, ` +
        `Path: ${request.nextUrl.pathname}, ` +
        `Headers: ${detectedHeaders.join(", ")}, ` +
        `Attempt: ${record.attempts}` +
        (record.blocked ? " (BLOCKED)" : "")
    );

    // IMPORTANT: Continue request normally with real auth
    // Don't reveal detection to attacker - they should see the same response
    // as if they didn't send mock headers at all
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all API routes
    "/api/:path*",
  ],
};
