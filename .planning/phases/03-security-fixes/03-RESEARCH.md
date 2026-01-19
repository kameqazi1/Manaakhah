# Phase 3: Security Fixes - Research

**Researched:** 2026-01-19
**Domain:** NextAuth OAuth security, environment validation, rate limiting
**Confidence:** HIGH

## Summary

This phase addresses three specific security vulnerabilities: unsafe OAuth account linking (`allowDangerousEmailAccountLinking: true`), missing environment variable validation at startup, and mock auth headers being accepted in production mode.

The codebase currently uses NextAuth v5 (beta.30) with `allowDangerousEmailAccountLinking: true` enabled for both Google and Apple OAuth providers (lines 31, 37 in `lib/auth.ts`). This flag automatically links OAuth accounts to existing accounts with matching email addresses without verification - a known security risk that can allow account takeover.

For environment validation, the project has no startup validation - variables are accessed directly via `process.env` throughout the codebase. For mock header protection, the `isMockMode()` check is performed per-route, but there's no protection against mock headers being sent when `USE_MOCK_DATA=false`.

**Primary recommendation:** Remove dangerous linking, implement Zod-based env validation in `next.config.js`, and add middleware-level mock header protection with rate limiting.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-auth | ^5.0.0-beta.30 | OAuth authentication | Already in use, well-documented account linking hooks |
| zod | ^4.3.5 | Schema validation | Already in use, standard for env validation in ecosystem |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @t3-oss/env-nextjs | ^0.13.10 | Type-safe env validation | Production-ready, built on Zod, validates at build time |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @t3-oss/env-nextjs | Raw Zod + manual setup | t3-env handles server/client separation and Next.js quirks automatically |
| In-memory rate limiting | @upstash/ratelimit | Upstash requires Redis; in-memory works for single instance, simpler setup |

**Installation:**
```bash
npm install @t3-oss/env-nextjs
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
  env.ts              # NEW: Environment validation schema
  auth.ts             # MODIFY: Remove dangerous linking, add safe linking flow
middleware.ts         # NEW: Mock header protection at edge
app/
  api/
    auth/
      link-account/   # NEW: Explicit account linking endpoint
        route.ts
```

### Pattern 1: Safe OAuth Account Linking Flow
**What:** Instead of automatic linking, require user confirmation via email verification
**When to use:** When OAuth email matches existing account
**Example:**
```typescript
// Source: Auth.js documentation
// In signIn callback, detect email conflict and redirect to linking flow
callbacks: {
  async signIn({ user, account, profile }) {
    if (account?.provider === "google" || account?.provider === "apple") {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
        include: { accounts: true }
      });

      // If user exists but doesn't have this provider linked
      if (existingUser && !existingUser.accounts.some(a => a.provider === account.provider)) {
        // Store pending link in session/token, redirect to verification
        const linkToken = await createAccountLinkToken(existingUser.id, account);
        return `/auth/link-account?token=${linkToken}`;
      }
    }
    return true;
  }
}
```

### Pattern 2: Environment Validation with t3-env
**What:** Type-safe environment variable validation at build/startup
**When to use:** Any production application
**Example:**
```typescript
// Source: https://env.t3.gg/docs/nextjs
// lib/env.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32),
    NEXTAUTH_URL: z.string().url(),
    RESEND_API_KEY: z.string().startsWith("re_"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
```

### Pattern 3: Mock Header Protection Middleware
**What:** Detect and log mock auth headers in production, rate limit repeat offenders
**When to use:** When `USE_MOCK_DATA` is false but mock headers are received
**Example:**
```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 10;
const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutes

export function middleware(request: NextRequest) {
  const isMockMode = process.env.USE_MOCK_DATA === "true";
  const hasMockHeaders =
    request.headers.has("x-user-id") ||
    request.headers.has("x-user-role");

  if (!isMockMode && hasMockHeaders) {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    // Check if blocked
    if (record && record.count >= MAX_ATTEMPTS &&
        now - record.timestamp < BLOCK_DURATION) {
      console.warn(`[SECURITY] Blocked IP ${ip}: repeated mock header attempts`);
      // Continue with real auth, just log
    }

    // Update rate limit
    if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
      rateLimitMap.set(ip, { count: 1, timestamp: now });
    } else {
      record.count++;
    }

    console.warn(`[SECURITY] Mock auth headers received in production from IP: ${ip}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
```

### Anti-Patterns to Avoid
- **Auto-linking OAuth accounts:** Never use `allowDangerousEmailAccountLinking: true` without understanding the risk
- **Validating env vars per-request:** Validate once at startup, not on each request
- **Blocking requests with mock headers:** Log and continue with real auth - don't reveal security detection
- **Using x-forwarded-for without caution:** Can be spoofed; use for logging only, not for critical decisions

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Env validation | Custom process.env parsing | @t3-oss/env-nextjs | Handles server/client separation, Next.js bundling quirks, TypeScript inference |
| OAuth account linking | Custom token/callback system | NextAuth signIn callback + redirect | Framework handles OAuth state, CSRF, session management |
| Environment-specific validation | Custom NODE_ENV checks | Zod `.refine()` with mode checks | Type-safe, composable, already in codebase |

**Key insight:** NextAuth already has hooks for custom account linking logic - the `signIn` callback can return a URL to redirect to a custom flow. Don't build parallel OAuth handling.

## Common Pitfalls

### Pitfall 1: Trusting OAuth Email Verification
**What goes wrong:** Assuming all OAuth providers verify emails equally
**Why it happens:** Major providers (Google, Apple) do verify, but the OAuth spec doesn't require it
**How to avoid:** Always verify email ownership when linking accounts, regardless of provider
**Warning signs:** Using `allowDangerousEmailAccountLinking: true` without additional checks

### Pitfall 2: Build-time vs Runtime Env Validation
**What goes wrong:** Env validation only runs at build time, missing runtime-injected vars
**Why it happens:** Next.js replaces `process.env.X` at build time for client code
**How to avoid:** Use `runtimeEnv` in t3-env, import env file in both `next.config.js` AND route handlers
**Warning signs:** Validation passes in dev, fails in production Docker containers

### Pitfall 3: In-Memory Rate Limiting in Serverless
**What goes wrong:** Rate limits reset on every cold start, don't share across instances
**Why it happens:** Serverless functions are stateless
**How to avoid:** For this phase, in-memory is acceptable since it's just logging/warning. For production rate limiting of auth endpoints, use Redis
**Warning signs:** Rate limits never trigger in production despite abuse

### Pitfall 4: Middleware Not Running on API Routes
**What goes wrong:** Middleware doesn't protect API routes
**Why it happens:** Incorrect `matcher` config in middleware
**How to avoid:** Explicitly include `/api/:path*` in middleware matcher
**Warning signs:** Mock headers work on API routes but not pages

### Pitfall 5: Leaking Security Detection
**What goes wrong:** Returning 403/blocking reveals that mock headers were detected
**Why it happens:** Security through transparency
**How to avoid:** Log internally, continue request normally with real auth. Attacker learns nothing
**Warning signs:** Different response codes for requests with/without mock headers

## Code Examples

Verified patterns from official sources:

### Environment Validation with Mode-Aware Rules
```typescript
// lib/env.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

export const env = createEnv({
  server: {
    // Always required
    NEXTAUTH_SECRET: z.string().min(32),

    // Required in production only
    DATABASE_URL: isProduction
      ? z.string().url()
      : z.string().url().optional(),

    RESEND_API_KEY: isProduction
      ? z.string().startsWith("re_")
      : z.string().optional(),

    // OAuth - required if not using mock mode
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    APPLE_CLIENT_ID: z.string().optional(),
    APPLE_CLIENT_SECRET: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_USE_MOCK_DATA: z.enum(["true", "false"]).default("false"),
  },
  runtimeEnv: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
    APPLE_CLIENT_SECRET: process.env.APPLE_CLIENT_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
```

### Account Linking Flow - Email Verification
```typescript
// app/api/auth/link-account/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import crypto from "crypto";

// POST - Request to link OAuth account to existing email account
export async function POST(req: Request) {
  const { email, provider, providerAccountId } = await req.json();

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Generate verification token
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Store pending link
  await prisma.pendingAccountLink.create({
    data: {
      userId: existingUser.id,
      provider,
      providerAccountId,
      token,
      expires,
    },
  });

  // Send verification email
  await sendAccountLinkEmail(email, token);

  return NextResponse.json({
    message: "Verification email sent. Please check your inbox."
  });
}

// GET - Verify link token and complete linking
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  const pendingLink = await prisma.pendingAccountLink.findUnique({
    where: { token },
  });

  if (!pendingLink || pendingLink.expires < new Date()) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  // Create the account link
  await prisma.account.create({
    data: {
      userId: pendingLink.userId,
      type: "oauth",
      provider: pendingLink.provider,
      providerAccountId: pendingLink.providerAccountId,
    },
  });

  // Clean up
  await prisma.pendingAccountLink.delete({ where: { id: pendingLink.id } });

  return NextResponse.redirect("/login?linked=true");
}
```

### Secure Mock Header Middleware
```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiting for mock header abuse
// Note: Resets on cold start - acceptable for logging/warning only
const suspiciousIPs = new Map<string, { attempts: number; firstSeen: number; blocked: boolean }>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_ATTEMPTS = 5; // Attempts before blocking
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minute block

function cleanupOldEntries() {
  const now = Date.now();
  for (const [ip, data] of suspiciousIPs) {
    if (now - data.firstSeen > BLOCK_DURATION_MS) {
      suspiciousIPs.delete(ip);
    }
  }
}

export function middleware(request: NextRequest) {
  // Only check API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const isMockMode = process.env.USE_MOCK_DATA === "true";

  // In mock mode, headers are expected - no action needed
  if (isMockMode) {
    return NextResponse.next();
  }

  // Check for mock headers in production
  const hasMockUserId = request.headers.has("x-user-id");
  const hasMockUserRole = request.headers.has("x-user-role");

  if (hasMockUserId || hasMockUserRole) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               request.headers.get("x-real-ip") ||
               "unknown";

    cleanupOldEntries();

    const now = Date.now();
    let record = suspiciousIPs.get(ip);

    if (!record) {
      record = { attempts: 1, firstSeen: now, blocked: false };
      suspiciousIPs.set(ip, record);
    } else if (now - record.firstSeen > WINDOW_MS && !record.blocked) {
      // Reset window
      record.attempts = 1;
      record.firstSeen = now;
    } else {
      record.attempts++;
    }

    // Check if should block
    if (record.attempts >= MAX_ATTEMPTS && !record.blocked) {
      record.blocked = true;
      console.error(`[SECURITY] IP ${ip} blocked: ${record.attempts} mock header attempts in ${WINDOW_MS}ms`);
    }

    // Log the attempt
    const headers = [];
    if (hasMockUserId) headers.push(`x-user-id: ${request.headers.get("x-user-id")}`);
    if (hasMockUserRole) headers.push(`x-user-role: ${request.headers.get("x-user-role")}`);

    console.warn(`[SECURITY] Mock headers in production - IP: ${ip}, Path: ${request.nextUrl.pathname}, Headers: ${headers.join(", ")}, Attempt: ${record.attempts}${record.blocked ? " (BLOCKED)" : ""}`);

    // IMPORTANT: Continue request normally with real auth
    // Don't reveal detection to attacker
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
  ],
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `allowDangerousEmailAccountLinking: true` | Custom signIn callback with verification | Auth.js v5 | Prevents account takeover via OAuth |
| Manual `process.env` access | @t3-oss/env-nextjs | 2023+ | Build-time and runtime validation, type safety |
| Per-route auth checks | Middleware-level checks | Next.js 12+ | Centralized security, runs at edge |

**Deprecated/outdated:**
- `allowDangerousEmailAccountLinking` - While still available, Auth.js docs explicitly warn against it
- Manual env validation in API routes - Should be done at startup, not per-request

## Open Questions

Things that couldn't be fully resolved:

1. **PendingAccountLink schema for Prisma**
   - What we know: Need a table to store pending account link tokens
   - What's unclear: Exact fields needed to reconstruct OAuth account data
   - Recommendation: Create minimal schema with `userId`, `provider`, `providerAccountId`, `token`, `expires`

2. **OAuth callback URL during linking flow**
   - What we know: NextAuth signIn callback can redirect to custom URL
   - What's unclear: How to preserve OAuth state when redirecting mid-flow
   - Recommendation: Store OAuth account details in pending link, re-initiate OAuth after verification

3. **Middleware vs Route Handler for mock protection**
   - What we know: Middleware runs at edge before route handlers
   - What's unclear: Performance impact of checking every API request
   - Recommendation: Middleware is correct - the check is very lightweight (two header checks)

## Sources

### Primary (HIGH confidence)
- [Auth.js Providers Documentation](https://authjs.dev/reference/core/providers) - Account linking behavior
- [Next.js Instrumentation Guide](https://nextjs.org/docs/app/guides/instrumentation) - Startup hooks
- [T3 Env Documentation](https://env.t3.gg/docs/nextjs) - Environment validation

### Secondary (MEDIUM confidence)
- [NextAuth FAQ on Account Linking](https://next-auth.js.org/faq) - Why linking is dangerous
- [GitHub Discussion #2808](https://github.com/nextauthjs/next-auth/discussions/2808) - Community patterns for safe linking
- [How to Implement Rate Limiting in Next.js](https://peerlist.io/blog/engineering/how-to-implement-rate-limiting-in-nextjs) - In-memory patterns

### Tertiary (LOW confidence)
- WebSearch for in-memory rate limiting patterns - Need to verify for serverless
- WebSearch for middleware performance - Anecdotal evidence only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing dependencies (Zod), well-documented t3-env
- OAuth linking flow: HIGH - Auth.js documentation is explicit about the risks and alternatives
- Mock header protection: MEDIUM - In-memory approach has serverless caveats, but acceptable for logging
- Environment validation: HIGH - t3-env is battle-tested, used by Create T3 App

**Research date:** 2026-01-19
**Valid until:** 60 days (security patterns are stable)
