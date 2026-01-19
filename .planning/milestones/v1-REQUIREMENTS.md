# Requirements Archive: v1 Fix Auth & Security

**Archived:** 2026-01-19
**Status:** SHIPPED

This is the archived requirements specification for v1.
For current requirements, see `.planning/REQUIREMENTS.md` (created for next milestone).

---

# Requirements: Manaakhah v1

**Defined:** 2026-01-19
**Core Value:** Users can find and connect with verified Muslim-owned businesses in their area

## v1 Requirements

Requirements for this work phase. Each maps to roadmap phases.

### Authentication (Mock Mode)

- [x] **AUTH-01**: User can register with email/password and immediately sign in
- [x] **AUTH-02**: User session persists across page refreshes in mock mode
- [x] **AUTH-03**: Mock session provider correctly stores and retrieves user data

### Authentication (Production Mode)

- [x] **AUTH-04**: User receives verification email after registration
- [x] **AUTH-05**: User can verify email by clicking link
- [x] **AUTH-06**: User can request password reset email
- [x] **AUTH-07**: User can reset password via email link

### Security

- [x] **SEC-01**: Remove `allowDangerousEmailAccountLinking` from OAuth config
- [x] **SEC-02**: Environment variables validated at app startup
- [x] **SEC-03**: Mock auth headers (`x-user-id`, `x-user-role`) only work when `USE_MOCK_DATA=true`

### Missing Functionality

- [x] **FEAT-01**: 2FA codes sent via email (not just logged to console)
- [x] **FEAT-02**: 2FA codes sent via SMS (or remove SMS option if not implementing)
- [x] **FEAT-03**: Staff invitation emails sent when adding staff to business

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 2 | Complete |
| AUTH-05 | Phase 2 | Complete |
| AUTH-06 | Phase 2 | Complete |
| AUTH-07 | Phase 2 | Complete |
| SEC-01 | Phase 3 | Complete |
| SEC-02 | Phase 3 | Complete |
| SEC-03 | Phase 3 | Complete |
| FEAT-01 | Phase 4 | Complete |
| FEAT-02 | Phase 4 | Complete |
| FEAT-03 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 13 total
- Shipped: 13
- Unmapped: 0

---

## Milestone Summary

**Shipped:** 13 of 13 v1 requirements

**Adjusted:**
- FEAT-02 (SMS 2FA): Changed from "implement SMS" to "remove SMS option" - Decision made during Phase 4 research that SMS adds cost/complexity without being in the UI.

**Dropped:** None

**Deferred to v2:**
- PROD-01: Rate limiting on all API routes
- PROD-02: CSRF token validation
- PROD-03: Input sanitization beyond Zod
- PROD-04: Structured logging with PII redaction
- TEST-01/02/03: Unit, integration, and E2E tests
- QUAL-01/02/03: Code quality improvements
- FEAT-04 (New): 2FA login challenge UI (identified during milestone audit)

---
*Archived: 2026-01-19 as part of v1 milestone completion*
