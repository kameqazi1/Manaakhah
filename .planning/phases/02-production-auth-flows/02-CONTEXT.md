# Phase 2 Context: Production Auth Flows

**Created:** 2026-01-19
**Phase Goal:** Email verification and password reset work with real database and email

## Requirements Addressed

- AUTH-04: User receives verification email after registration
- AUTH-05: User can verify email by clicking link
- AUTH-06: User can request password reset email
- AUTH-07: User can reset password via email link

## Implementation Decisions

### Verification Flow UX

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auto sign-in after email verification | Yes | Reduces friction, user just proved ownership |
| Redirect after verification | Home page | Get user into the app immediately |
| Invalid/expired link handling | Error page with resend option | Clear error + actionable next step |
| Auto sign-in after password reset | Yes | User just set new password, don't make them type it again |

### Token Expiration & Retry

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Verification link validity | 24 hours | Balance security with user convenience |
| Password reset link validity | 1 hour | More sensitive operation, shorter window |
| Retry allowed | Yes | Users may need to request new links |
| Retry cooldown | 1 minute | Prevent spam while allowing legitimate retries |

## Key Files

- `lib/email.ts` - Email sending via Resend
- `app/api/auth/register/route.ts` - Sends verification email
- `app/api/auth/verify-email/route.ts` - Handles verification link
- `app/api/auth/forgot-password/route.ts` - Sends reset email
- `app/api/auth/reset-password/route.ts` - Handles password reset

## Dependencies

- Resend API key (`RESEND_API_KEY`) for email delivery
- PostgreSQL database (`DATABASE_URL`) for token storage
- NextAuth for session management after verification/reset

## Success Criteria

- [ ] Registration sends verification email
- [ ] Verification link works and marks user verified
- [ ] Auto sign-in after verification, redirect to home
- [ ] Forgot password sends reset email
- [ ] Reset link allows setting new password
- [ ] Auto sign-in after reset with new password
- [ ] Invalid/expired links show error with resend option
- [ ] Retry cooldown enforced (1 min)

---
*Context gathered: 2026-01-19*
