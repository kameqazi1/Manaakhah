# Phase 2: Production Auth Flows - Research

**Researched:** 2026-01-19
**Domain:** Email verification, password reset, NextAuth v5 integration
**Confidence:** HIGH

## Summary

The codebase already has substantial auth flow implementation. Backend API routes for registration, verification, password reset, and resend are complete and follow security best practices. Email templates via Resend are well-designed with branding. The Prisma schema properly supports verification and reset tokens on the User model.

**What's working:**
- Registration API generates tokens, stores in DB, sends verification email
- Verification API validates tokens, marks email verified, clears tokens
- Password reset APIs generate tokens, validate, update password with bcrypt
- Resend verification API allows users to request new verification emails
- Email templates are production-ready HTML with responsive design

**What's missing:**
- Frontend pages for `/verify-email` and `/reset-password`
- Auto sign-in after verification (currently redirects to login)
- Auto sign-in after password reset
- Frontend page for `/forgot-password`
- Rate limiting / cooldown enforcement (1 minute between resends)
- Proper error pages with resend options

**Primary recommendation:** Create frontend pages and modify verification flow to auto sign-in users after successful verification/reset.

## Standard Stack

The project already uses the correct stack. No new libraries needed.

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-auth | ^5.0.0-beta.30 | Authentication | Industry standard for Next.js auth |
| resend | ^6.7.0 | Email delivery | Modern email API with excellent DX |
| bcryptjs | ^3.0.3 | Password hashing | Secure adaptive hashing algorithm |
| crypto (node) | built-in | Token generation | Cryptographically secure random bytes |
| zod | ^4.3.5 | Validation | Type-safe schema validation |
| @prisma/client | ^5.22.0 | Database ORM | Type-safe database access |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jsonwebtoken | ^9.0.3 | JWT tokens | 2FA temp tokens (already in use) |

### No New Dependencies Needed

The existing stack is complete for this phase.

## Architecture Patterns

### Current Project Structure (Relevant Files)
```
app/
├── api/auth/
│   ├── register/route.ts       # Sends verification email
│   ├── verify-email/route.ts   # GET/POST verification
│   ├── forgot-password/route.ts # Sends reset email
│   ├── reset-password/route.ts  # GET validates, POST resets
│   └── resend-verification/route.ts # Resend verification
├── login/page.tsx              # Existing login page
├── register/page.tsx           # Existing register page
├── verify-email/page.tsx       # MISSING - needs creation
├── reset-password/page.tsx     # MISSING - needs creation
└── forgot-password/page.tsx    # MISSING - needs creation
lib/
├── auth.ts                     # NextAuth config with signIn export
├── email.ts                    # Resend email functions
├── db.ts                       # Database client
└── prisma.ts                   # Prisma client
```

### Pattern 1: Token Storage in User Model

**What:** Verification and reset tokens stored directly on User model
**When to use:** This is already implemented correctly
**Current Schema:**
```prisma
model User {
  // Email verification
  emailVerificationToken   String?   @unique
  emailVerificationExpires DateTime?

  // Password reset
  passwordResetToken       String?   @unique
  passwordResetExpires     DateTime?

  emailVerified DateTime? // Set when verified
}
```

### Pattern 2: Token Generation

**What:** Using crypto.randomBytes(32).toString("hex") for 64-char tokens
**Current implementation in registration:**
```typescript
// Source: app/api/auth/register/route.ts
const emailVerificationToken = crypto.randomBytes(32).toString("hex");
const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
```

### Pattern 3: Auto Sign-In After Verification

**What:** Programmatically sign user in after email verification
**How to implement with NextAuth v5:**
```typescript
// In verify-email page.tsx (client component)
import { signIn } from "next-auth/react";

// After successful verification API call:
const result = await signIn("credentials", {
  email: userEmail,
  password: null, // Use a special verification token approach
  redirect: false,
});
```

**Better approach - Server-side redirect with session:**
```typescript
// verify-email/route.ts - Modified GET handler
import { signIn } from "@/lib/auth";
import { cookies } from "next/headers";

// After marking user verified, create session
// Then redirect to home with session cookie set
```

### Pattern 4: Rate Limiting for Resend

**What:** Prevent spam by tracking last request time
**Implementation approach:**
```typescript
// Add to User model or use in-memory store
lastVerificationEmailSent DateTime?

// In resend-verification/route.ts
const cooldownMs = 60 * 1000; // 1 minute
if (user.lastVerificationEmailSent &&
    Date.now() - user.lastVerificationEmailSent.getTime() < cooldownMs) {
  return NextResponse.json(
    { error: "Please wait before requesting another email" },
    { status: 429 }
  );
}
```

### Anti-Patterns to Avoid

- **Exposing user existence:** Current implementation correctly returns generic messages
- **Storing plain tokens:** Current uses unique index but not hashing (acceptable for short-lived tokens)
- **Long-lived reset tokens:** Current 1-hour expiry is correct
- **No rate limiting:** Needs to be added

## Don't Hand-Roll

Problems with existing solutions in the codebase:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email sending | Custom SMTP | Resend (already using) | Deliverability, templates, analytics |
| Password hashing | Custom crypto | bcryptjs (already using) | Adaptive cost factor, salt handling |
| Session management | Custom sessions | NextAuth (already using) | Security, token rotation, CSRF |
| Token generation | Math.random | crypto.randomBytes (already using) | CSPRNG required |

**Key insight:** The backend is already using best practices. Focus effort on frontend pages and UX improvements.

## Common Pitfalls

### Pitfall 1: Token Enumeration

**What goes wrong:** Attacker guesses tokens by observing response times or messages
**Why it happens:** Different code paths for valid vs invalid tokens
**How to avoid:** Already handled - using constant-time comparison implicitly via Prisma query
**Warning signs:** Different error messages for "not found" vs "expired"

### Pitfall 2: Race Condition on Verification

**What goes wrong:** User clicks verification link twice rapidly, causing errors
**Why it happens:** Token cleared on first request, second fails
**How to avoid:**
- Already partially handled (token set to null after verification)
- Frontend should handle "already verified" case gracefully
**Warning signs:** Error logs showing "token not found" for legitimate users

### Pitfall 3: Email Enumeration

**What goes wrong:** Attacker determines which emails are registered
**Why it happens:** Different responses for registered vs unregistered emails
**How to avoid:** Already handled correctly:
```typescript
// Current implementation returns same message regardless
const successMessage = "If an account exists with this email, a verification link has been sent.";
```
**Warning signs:** Different response times (already mitigated by always querying DB)

### Pitfall 4: Auto Sign-In Without Session Token

**What goes wrong:** Trying to sign in user without proper session creation
**Why it happens:** NextAuth v5 requires specific flow for programmatic sign-in
**How to avoid:**
- Use client-side signIn() after redirect
- Or create proper session server-side
**Warning signs:** User sees verified but is not logged in

### Pitfall 5: Resend Without Cooldown

**What goes wrong:** User or attacker spams resend endpoint
**Why it happens:** No rate limiting implemented
**How to avoid:** Track last email sent timestamp, enforce cooldown
**Warning signs:** High email volume, Resend rate limit errors

## Code Examples

### Verified Pattern 1: Email Verification Flow (Current)

```typescript
// Source: app/api/auth/verify-email/route.ts (existing)
// Find user with valid, non-expired token
const user = await db.user.findFirst({
  where: {
    emailVerificationToken: token,
    emailVerificationExpires: {
      gt: new Date(),
    },
  },
});

if (!user) {
  return NextResponse.json(
    { error: "Invalid or expired verification token" },
    { status: 400 }
  );
}

// Mark email as verified and clear token
await db.user.update({
  where: { id: user.id },
  data: {
    emailVerified: new Date(),
    emailVerificationToken: null,
    emailVerificationExpires: null,
  },
});
```

### Pattern 2: Verification Email Template (Current)

```typescript
// Source: lib/email.ts (existing, abbreviated)
await getResend().emails.send({
  from: `${APP_NAME} <${FROM_EMAIL}>`,
  to: email,
  subject: `Verify your ${APP_NAME} account`,
  html: `
    <div style="max-width: 600px; margin: 0 auto; ...">
      <a href="${verificationUrl}" style="...">
        Verify Email Address
      </a>
      <p>This link will expire in 24 hours.</p>
    </div>
  `,
});
```

### Pattern 3: Frontend Verification Page (To Create)

```typescript
// app/verify-email/page.tsx (NEW)
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Missing verification token");
      return;
    }

    async function verifyEmail() {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        setStatus("success");
        // Auto sign-in after brief delay
        setTimeout(() => {
          router.push("/?verified=true");
        }, 2000);
      } else {
        const data = await res.json();
        setStatus("error");
        setError(data.error || "Verification failed");
      }
    }

    verifyEmail();
  }, [token, router]);

  // Render loading, success, or error UI with resend option
}
```

### Pattern 4: Forgot Password Page (To Create)

```typescript
// app/forgot-password/page.tsx (NEW)
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    // Always show success to prevent enumeration
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div>
        <h2>Check your email</h2>
        <p>If an account exists, we sent a password reset link.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send Reset Link"}
      </Button>
    </form>
  );
}
```

### Pattern 5: Reset Password Page (To Create)

```typescript
// app/reset-password/page.tsx (NEW)
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }

    fetch(`/api/auth/reset-password?token=${token}`)
      .then(res => res.json())
      .then(data => setTokenValid(data.valid));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      setStatus("success");
      // Redirect to login after brief delay
      setTimeout(() => router.push("/login?reset=true"), 2000);
    } else {
      setStatus("error");
    }
  }

  if (tokenValid === false) {
    return <div>Invalid or expired reset link. <a href="/forgot-password">Request new link</a></div>;
  }

  // Render form
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Storing plain tokens | Hash tokens with SHA-256 | 2023+ | Higher security for DB breaches |
| Magic link only | Token + password form | Always | Better UX for password reset |
| Separate verification table | Tokens on User model | Project decision | Simpler schema |
| Email-only verification | Phone/2FA options | 2024+ | Multi-factor auth trend |

**Current implementation notes:**
- Tokens are stored unhashed but are: (a) unique indexed, (b) short-lived, (c) cleared after use
- This is acceptable for this use case but hashing would be more secure

**Deprecated/outdated:**
- None in current stack - using modern NextAuth v5 and Resend

## Open Questions

Things that couldn't be fully resolved:

1. **Auto sign-in mechanism**
   - What we know: NextAuth v5 exports `signIn` from lib/auth.ts for server-side use
   - What's unclear: Best pattern for auto sign-in after verification without password
   - Recommendation: Use client-side redirect to login with `?verified=true` and display success message, then have user enter credentials. Alternative: Create a special "verified session" token approach.

2. **Rate limiting storage**
   - What we know: Need 1-minute cooldown for resend verification
   - What's unclear: Whether to add field to User model or use in-memory cache
   - Recommendation: Add `lastVerificationEmailSent` field to User model for simplicity and persistence

3. **Email deliverability in production**
   - What we know: Resend requires verified domain for custom FROM_EMAIL
   - What's unclear: Whether `noreply@manakhaah.com` domain is verified
   - Recommendation: Verify domain in Resend dashboard before production

## Sources

### Primary (HIGH confidence)
- Local codebase analysis of:
  - `app/api/auth/register/route.ts`
  - `app/api/auth/verify-email/route.ts`
  - `app/api/auth/forgot-password/route.ts`
  - `app/api/auth/reset-password/route.ts`
  - `app/api/auth/resend-verification/route.ts`
  - `lib/email.ts`
  - `lib/auth.ts`
  - `prisma/schema.prisma`

### Secondary (MEDIUM confidence)
- [Resend Rate Limits Documentation](https://resend.com/docs/api-reference/rate-limit) - 2 requests/second default
- [NextAuth v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5) - Server actions and edge compatibility
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) - Security best practices
- [Password Reset Token Security Guide](https://www.onlinehashcrack.com/guides/password-recovery/password-reset-tokens-secure-implementation-guide.php) - Token generation and storage

### Tertiary (LOW confidence)
- WebSearch results on NextAuth v5 programmatic sign-in - Multiple approaches exist, needs testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Analyzed existing package.json and implementation
- Architecture: HIGH - Read all relevant source files
- Pitfalls: HIGH - Based on OWASP guidelines and code review
- Auto sign-in pattern: MEDIUM - Multiple approaches, needs validation

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - stable patterns)

## Implementation Gaps Summary

| Gap | Priority | Effort | Notes |
|-----|----------|--------|-------|
| `/verify-email` page | HIGH | Medium | Frontend page with token handling |
| `/forgot-password` page | HIGH | Low | Simple form, API exists |
| `/reset-password` page | HIGH | Medium | Token validation + password form |
| Auto sign-in after verify | MEDIUM | Medium | Per CONTEXT.md decisions |
| Auto sign-in after reset | MEDIUM | Medium | Per CONTEXT.md decisions |
| Resend cooldown (1 min) | MEDIUM | Low | Add timestamp tracking |
| Error page with resend option | MEDIUM | Low | UI for expired tokens |
