---
phase: 02-production-auth-flows
plan: 02
subsystem: auth
tags: [nextauth, jwt, auto-login, rate-limiting, session-storage, credentials-provider]

# Dependency graph
requires:
  - phase: 02-01
    provides: Frontend pages for verify-email, forgot-password, reset-password
provides:
  - Auto-login token system for post-verification sign-in
  - Password-less authentication via autoLoginToken credential
  - 1-minute cooldown on resend verification emails
  - Auto sign-in after email verification (redirects to home)
  - Auto sign-in after password reset (redirects to home)
  - Success banners on login page for verified/reset/registered states
affects: [03-security-fixes, user-registration-flow, email-verification-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - autoLoginToken credential in NextAuth Credentials provider
    - sessionStorage for cross-page token passing
    - Rate limiting via lastVerificationEmailSent timestamp in User model

key-files:
  created: []
  modified:
    - prisma/schema.prisma
    - lib/auth.ts
    - app/api/auth/register/route.ts
    - app/api/auth/verify-email/route.ts
    - app/api/auth/reset-password/route.ts
    - app/api/auth/resend-verification/route.ts
    - app/register/page.tsx
    - app/verify-email/page.tsx
    - app/reset-password/page.tsx
    - app/login/page.tsx

key-decisions:
  - "Auto-login token stored in sessionStorage (cleared on browser close)"
  - "One-time use tokens - cleared after successful auto-login"
  - "24-hour token validity to match email verification link"
  - "Cooldown enforced server-side with client countdown UI"

patterns-established:
  - "Token-based auto-login: Register stores token, verify-email uses it for sign-in"
  - "Rate limiting pattern: Timestamp field on User model, 429 response with seconds remaining"
  - "Suspense boundary pattern for pages using useSearchParams"

# Metrics
duration: 12min
completed: 2026-01-19
---

# Phase 2 Plan 2: Auto Sign-In & Rate Limiting Summary

**Auto-login token system enabling password-less sign-in after email verification, plus 1-minute cooldown on resend verification with countdown UI**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-19T17:00:00Z
- **Completed:** 2026-01-19T17:12:00Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Token-based auto sign-in after email verification (user redirected to home page)
- Auto sign-in after password reset using new password (user redirected to home page)
- Server-side 1-minute cooldown on resend verification with countdown UI
- Success banners on login page for fallback cases (verified, reset, registered)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add auto-login token system and rate limiting field** - `cf60f28` (feat)
2. **Task 2: Implement auto sign-in on register, verify-email, and reset-password pages** - `43a436d` (feat)
3. **Task 3: Handle resend cooldown in verify-email page UI** - `10ea05e` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Added lastVerificationEmailSent, autoLoginToken, autoLoginTokenExpires fields to User model
- `lib/auth.ts` - Extended Credentials provider to accept autoLoginToken for password-less sign-in
- `app/api/auth/register/route.ts` - Generates and returns autoLoginToken on registration
- `app/api/auth/verify-email/route.ts` - Returns email and canAutoLogin flag on verification
- `app/api/auth/reset-password/route.ts` - Returns user email for auto sign-in
- `app/api/auth/resend-verification/route.ts` - Enforces 1-minute cooldown with 429 response
- `app/register/page.tsx` - Stores autoLoginToken in sessionStorage
- `app/verify-email/page.tsx` - Attempts auto sign-in with stored token, cooldown UI
- `app/reset-password/page.tsx` - Auto signs in with new password after reset
- `app/login/page.tsx` - Success banners for verified/reset/registered query params

## Decisions Made
- **sessionStorage for token storage:** Per CONTEXT.md, tokens should clear on browser close for security
- **24-hour auto-login token validity:** Matches email verification link expiration
- **One-time use tokens:** Token cleared immediately after successful sign-in to prevent replay
- **Server-side cooldown enforcement:** Rate limiting happens at API level, client UI is informational

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma client regeneration required**
- **Found during:** Task 1 (after adding new fields to schema)
- **Issue:** Build failed with "autoLoginToken does not exist in type 'UserWhereInput'"
- **Fix:** Ran `npx prisma generate` to regenerate client with new fields
- **Files modified:** Generated files in node_modules/@prisma/client
- **Verification:** Build passes after regeneration
- **Committed in:** cf60f28 (part of Task 1)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for Prisma type safety. No scope creep.

## Issues Encountered
- DATABASE_URL not set in environment prevented `npx prisma db push` - used `npx prisma format` to validate schema syntax instead (db push must be done manually in production)

## User Setup Required

**Database migration required.** The schema has new fields that need to be applied:

```bash
# Apply schema changes to database
npx prisma db push
# Or for production:
npx prisma migrate deploy
```

## Next Phase Readiness
- Auto sign-in flows complete, users get seamless experience after verification/reset
- Rate limiting prevents email spam
- Ready for Phase 3: Security Fixes (if any security hardening is planned)

---
*Phase: 02-production-auth-flows*
*Completed: 2026-01-19*
