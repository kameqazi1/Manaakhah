---
phase: 03-security-fixes
plan: 02
subsystem: auth
tags: [oauth, next-auth, prisma, email-verification, account-linking]

# Dependency graph
requires:
  - phase: 02-production-auth-flows
    provides: email functions, auth configuration
provides:
  - Safe OAuth account linking with email verification
  - PendingAccountLink model for token storage
  - /api/auth/link-account endpoint for token verification
  - /link-account page for user communication
affects: [04-missing-email-features, future-oauth-providers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "OAuth email conflict handling via PendingAccountLink tokens"
    - "Email verification before account linking"

key-files:
  created:
    - app/api/auth/link-account/route.ts
    - app/link-account/page.tsx
  modified:
    - prisma/schema.prisma
    - lib/auth.ts
    - lib/email.ts
    - app/login/page.tsx

key-decisions:
  - "24-hour expiration for account link tokens (matches other verification tokens)"
  - "Delete existing pending links before creating new one (prevents token accumulation)"
  - "Log account linking as CREATE action on Account entity type"

patterns-established:
  - "OAuth email conflict flow: redirect to info page -> send verification email -> token click -> account linked"

# Metrics
duration: 12min
completed: 2026-01-19
---

# Phase 03 Plan 02: Safe OAuth Account Linking Summary

**Replaced dangerous OAuth email matching with verified linking flow using PendingAccountLink model, verification email, and confirmation endpoint**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-19T17:30:00Z
- **Completed:** 2026-01-19T17:42:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Removed `allowDangerousEmailAccountLinking` from Google and Apple OAuth providers
- Created PendingAccountLink model for secure token storage with 24-hour expiration
- Implemented complete email verification flow for OAuth account linking
- Added /link-account page with clear user messaging for pending and error states
- Updated login page to show success message after account linking

## Task Commits

Each task was committed atomically:

1. **Task 1: Add PendingAccountLink model and email function** - `999710c` (feat)
2. **Task 2: Modify OAuth signIn callback for safe linking** - `54a3abf` (feat)
3. **Task 3: Create link-account API and page** - `38a78e0` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Added PendingAccountLink model with user relation
- `lib/email.ts` - Added sendAccountLinkEmail function with branded template
- `lib/auth.ts` - Removed dangerous linking, implemented safe OAuth flow in signIn callback
- `app/api/auth/link-account/route.ts` - Token verification and account linking endpoint
- `app/link-account/page.tsx` - User-facing page for pending/error states
- `app/login/page.tsx` - Added success message for account linked

## Decisions Made
- **24-hour token expiration**: Matches email verification token expiration for consistency
- **Delete existing pending links first**: Prevents token accumulation if user retries OAuth multiple times
- **Redirect to info page, not error page**: OAuth conflict is not an error, just a required step
- **Log as CREATE on Account entity**: Account linking creates a new Account record

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npx prisma db push` failed due to missing DATABASE_URL (expected in local dev without DB)
- Resolved by verifying `npx prisma generate` produces correct client types

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- SEC-01 (OAuth email linking vulnerability) is now fixed
- OAuth flow is secure: email conflicts require verification before linking
- Ready to continue with remaining security fixes or Phase 4

---
*Phase: 03-security-fixes*
*Completed: 2026-01-19*
