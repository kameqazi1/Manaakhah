# Roadmap: Manaakhah v1

**Created:** 2026-01-19
**Milestone:** Fix Auth & Security

## Overview

| Phase | Name | Status | Requirements |
|-------|------|--------|--------------|
| 1 | Mock Mode Auth Fix | Complete | AUTH-01, AUTH-02, AUTH-03 |
| 2 | Production Auth Flows | Complete | AUTH-04, AUTH-05, AUTH-06, AUTH-07 |
| 3 | Security Fixes | Pending | SEC-01, SEC-02, SEC-03 |
| 4 | Missing Email Features | Pending | FEAT-01, FEAT-02, FEAT-03 |

## Phase 1: Mock Mode Auth Fix

**Goal:** User can register and sign in successfully in mock mode

**Requirements:**
- AUTH-01: User can register with email/password and immediately sign in
- AUTH-02: User session persists across page refreshes in mock mode
- AUTH-03: Mock session provider correctly stores and retrieves user data

**Context:**
Currently, registration creates a user in mock storage but login fails to authenticate against it. Need to trace the mock auth flow and fix the disconnect.

**Key files:**
- `lib/mock-auth.ts` - Mock authentication logic
- `lib/mock-data/client.ts` - Mock database client
- `components/mock-session-provider.tsx` - Session context provider
- `app/api/auth/register/route.ts` - Registration endpoint
- `app/(auth)/login/page.tsx` - Login page

**Success criteria:**
- [x] Register new user in mock mode
- [x] Sign in with same credentials immediately after
- [x] Session persists on page refresh
- [x] Sign out works correctly

**Completed:** 2026-01-19

---

## Phase 2: Production Auth Flows

**Goal:** Email verification and password reset work with real database and email

**Requirements:**
- AUTH-04: User receives verification email after registration
- AUTH-05: User can verify email by clicking link
- AUTH-06: User can request password reset email
- AUTH-07: User can reset password via email link

**Context:**
Backend APIs exist and work. Frontend pages missing. Per CONTEXT.md decisions: auto sign-in after verification/reset, 1-minute resend cooldown.

**Key files:**
- `lib/email.ts` - Email sending via Resend
- `app/api/auth/verify-email/route.ts` - Handles verification link
- `app/api/auth/forgot-password/route.ts` - Sends reset email
- `app/api/auth/reset-password/route.ts` - Handles password reset

**Plans:** 2 plans

Plans:
- [x] 02-01-PLAN.md - Create frontend pages (verify-email, forgot-password, reset-password)
- [x] 02-02-PLAN.md - Add auto sign-in and resend cooldown

**Success criteria:**
- [x] Registration sends verification email
- [x] Verification link works and marks user verified
- [x] Auto sign-in after verification, redirect to home
- [x] Forgot password sends reset email
- [x] Reset link allows setting new password
- [x] Auto sign-in after reset with new password
- [x] Invalid/expired links show error with resend option
- [x] Retry cooldown enforced (1 min)

**Completed:** 2026-01-19

---

## Phase 3: Security Fixes

**Goal:** Remove identified security vulnerabilities

**Requirements:**
- SEC-01: Remove `allowDangerousEmailAccountLinking` from OAuth config
- SEC-02: Environment variables validated at app startup
- SEC-03: Mock auth headers only work when `USE_MOCK_DATA=true`

**Context:**
Security issues identified in codebase audit. Must be fixed before any public or stakeholder access.

**Key files:**
- `lib/auth.ts` - NextAuth config with dangerous linking
- API routes using `x-user-id`/`x-user-role` headers

**Success criteria:**
- [ ] `allowDangerousEmailAccountLinking` removed or properly secured
- [ ] App fails fast with clear error if required env vars missing
- [ ] Mock auth headers rejected when not in mock mode

---

## Phase 4: Missing Email Features

**Goal:** 2FA and staff invitation emails actually send

**Requirements:**
- FEAT-01: 2FA codes sent via email
- FEAT-02: 2FA codes sent via SMS (or remove option)
- FEAT-03: Staff invitation emails sent

**Context:**
2FA email/SMS currently just logs to console. Staff invitations create records but don't notify. These are placeholder implementations that need completing.

**Key files:**
- `lib/auth/two-factor.ts` - 2FA code generation/sending
- `app/api/business/[id]/staff/route.ts` - Staff invitation
- `lib/email.ts` - Email sending

**Success criteria:**
- [ ] 2FA email method sends real email with code
- [ ] SMS method either works or is removed from UI
- [ ] Staff invitation sends email to invited user

---

## Dependencies

```
Phase 1 (Mock Auth) → independent
Phase 2 (Production Auth) → independent
Phase 3 (Security) → independent
Phase 4 (Email Features) → depends on Phase 2 (email infrastructure verified)
```

---
*Roadmap created: 2026-01-19*
*Phase 2 planned: 2026-01-19*
