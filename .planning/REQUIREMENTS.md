# Requirements: Manaakhah

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

- [ ] **FEAT-01**: 2FA codes sent via email (not just logged to console)
- [ ] **FEAT-02**: 2FA codes sent via SMS (or remove SMS option if not implementing)
- [ ] **FEAT-03**: Staff invitation emails sent when adding staff to business

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Production Hardening

- **PROD-01**: Rate limiting on all API routes
- **PROD-02**: CSRF token validation on state-changing operations
- **PROD-03**: Input sanitization beyond Zod validation
- **PROD-04**: Structured logging with PII redaction

### Testing

- **TEST-01**: Unit tests for auth flows
- **TEST-02**: Integration tests for API routes
- **TEST-03**: E2E tests for critical user journeys

### Code Quality

- **QUAL-01**: Replace `any` types with proper TypeScript interfaces
- **QUAL-02**: Break up large components (>500 lines)
- **QUAL-03**: Extract duplicated Haversine calculation to shared utility

## Out of Scope

| Feature | Reason |
|---------|--------|
| OAuth login (Google/Apple) | Adds complexity, email/password sufficient for demo |
| Real-time features | Not core to business discovery |
| Mobile app | Web-first approach |
| Payment processing | Not needed for directory |
| Full test coverage | After auth works |

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
| FEAT-01 | Phase 4 | Pending |
| FEAT-02 | Phase 4 | Pending |
| FEAT-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-19 after Phase 3 completion*
