---
phase: 04-missing-email-features
plan: 01
subsystem: auth/2fa
tags: [2fa, email, verification, security]

dependency_graph:
  requires: [phase-02-auth-flows]
  provides: [email-2fa-complete]
  affects: []

tech_stack:
  added: []
  patterns: [temporary-code-storage, server-side-verification, rate-limited-resend]

key_files:
  created:
    - app/api/auth/2fa/send-code/route.ts
  modified:
    - prisma/schema.prisma
    - lib/email.ts
    - lib/auth/two-factor.ts
    - app/api/auth/2fa/setup/route.ts
    - app/api/auth/2fa/verify/route.ts

decisions:
  - id: 04-01-code-storage
    description: "Store 2FA codes in database with expiry fields"
    rationale: "Server-side verification required for security, enables single-use enforcement"
  - id: 04-01-10min-expiry
    description: "10-minute code expiration"
    rationale: "Industry standard, balances security with usability"
  - id: 04-01-60sec-cooldown
    description: "60-second cooldown between code sends"
    rationale: "Prevents spam, matches Phase 2 email verification pattern"

metrics:
  duration: "3 minutes"
  completed: "2026-01-19"
---

# Phase 4 Plan 1: 2FA Email Code Implementation Summary

**One-liner:** Real 2FA email delivery with 6-digit codes, 10-min expiry, and single-use enforcement using existing Resend infrastructure.

## What Was Built

### Task 1: Database Schema Update
Added two fields to the User model for temporary 2FA code storage:
- `twoFactorCode` (String?) - Stores the 6-digit verification code
- `twoFactorCodeExpires` (DateTime?) - Stores expiration timestamp (10 minutes from creation)

Prisma client regenerated with new fields.

### Task 2: Email and Verification Functions
**lib/email.ts:**
- Added `send2FACodeEmail(email, code)` - Sends branded HTML email with 6-digit code matching existing template style

**lib/auth/two-factor.ts:**
- Updated `sendTwoFactorEmail()` - Now calls real email function instead of console.log
- Added `generateAndSendEmailCode(userId, email)` - Generates code, stores in DB with expiry, sends email
- Added `verifyEmailCode(userId, code)` - Validates code against DB, enforces expiry, clears after use (single-use)

### Task 3: API Endpoints
**New: /api/auth/2fa/send-code (POST)**
- Sends 2FA code via email for users with EMAIL 2FA method enabled
- 60-second cooldown between requests (rate limiting)
- Returns error if user hasn't set up EMAIL 2FA

**Updated: /api/auth/2fa/setup (POST)**
- EMAIL method now sends code immediately upon setup initiation
- User can verify code to complete setup

**Updated: /api/auth/2fa/setup (PUT)**
- Handles EMAIL code verification during setup completion
- Generates backup codes and enables 2FA on successful verification

**Updated: /api/auth/2fa/verify (POST)**
- Handles EMAIL codes during login (alongside AUTHENTICATOR and backup codes)
- Removed hard requirement for twoFactorSecret (EMAIL doesn't use it)

## Key Patterns Established

1. **Temporary Code Storage:** Codes stored in database, not JWT/session, enabling single-use enforcement
2. **10-Minute Expiry:** Standard expiration matches industry best practices
3. **60-Second Cooldown:** Rate limiting prevents code spam, consistent with Phase 2 patterns
4. **Single-Use Codes:** Code cleared immediately after successful verification

## Verification Checklist

- [x] Build passes: `npm run build` completes successfully
- [x] TypeScript compiles: `npx tsc --noEmit` passes
- [x] Schema updated: twoFactorCode and twoFactorCodeExpires fields added to User model
- [x] Email function added: send2FACodeEmail exported from lib/email.ts
- [x] Two-factor functions added: generateAndSendEmailCode, verifyEmailCode exported
- [x] Send-code endpoint created: /api/auth/2fa/send-code with 60s cooldown
- [x] Setup endpoint updated: EMAIL sends code immediately, PUT verifies email codes
- [x] Verify endpoint updated: Handles EMAIL codes during login

## Success Criteria Met

- [x] FEAT-01 complete: 2FA codes sent via real email (not console.log)
- [x] Codes stored in database with twoFactorCode and twoFactorCodeExpires fields
- [x] 10-minute expiry enforced in verifyEmailCode function
- [x] Single-use enforcement (code cleared after verification)
- [x] 60-second cooldown between sends in send-code endpoint
- [x] Matches existing email template branding (green gradient, Manakhaah branding)

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Type | Message |
|------|------|---------|
| a57e095 | feat | Add 2FA code fields to User model |
| 887e385 | feat | Add 2FA email code generation and verification |
| d960b9f | feat | Implement 2FA email code endpoints |

## Files Changed

| File | Change Type | Lines |
|------|-------------|-------|
| prisma/schema.prisma | Modified | +4 |
| lib/email.ts | Modified | +35 |
| lib/auth/two-factor.ts | Modified | +45 |
| app/api/auth/2fa/send-code/route.ts | Created | +57 |
| app/api/auth/2fa/setup/route.ts | Modified | +25 |
| app/api/auth/2fa/verify/route.ts | Modified | +15 |

## Testing Notes

To test the EMAIL 2FA flow:
1. Go to /settings/security
2. Select "Email Verification" as 2FA method
3. Receive email with 6-digit code (requires RESEND_API_KEY)
4. Enter code to enable 2FA
5. On next login, receive email code and enter to verify

**Note:** DATABASE_URL must be configured for production testing. Local development with USE_MOCK_DATA=true will not have database access for storing codes.

## Next Phase Readiness

This plan completes FEAT-01 (2FA email delivery). Phase 4 can continue with:
- Plan 02: Staff invitation emails (if planned)
- Plan 03: SMS 2FA (if decided to implement rather than remove)

No blockers for next phase.
