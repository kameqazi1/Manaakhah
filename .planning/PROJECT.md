# Manaakhah

## What This Is

A Muslim business directory and community platform helping users discover halal restaurants, Islamic services, and Muslim-owned businesses. It provides business search with map views, community features (posts, events, messaging), booking system, and business owner tools.

## Core Value

Users can find and connect with verified Muslim-owned businesses in their area.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- Business listing with search, filtering, and map view
- User profiles with roles (consumer, business owner, staff, admin)
- Business detail pages with photos, hours, reviews
- Community posts and events
- Messaging between users
- Business owner dashboard with claiming workflow
- Admin moderation and analytics dashboard
- Internationalization (English, Arabic, Urdu)
- Mock data mode for development without database

### Active

<!-- Current scope. Building toward these. -->

- [ ] **AUTH-01**: User can register and sign in with newly created credentials (mock mode)
- [ ] **AUTH-02**: User can sign in and session persists properly (mock mode)
- [ ] **AUTH-03**: Email verification flow works end-to-end (production mode)
- [ ] **AUTH-04**: Password reset flow sends email and works (production mode)
- [ ] **SEC-01**: Remove `allowDangerousEmailAccountLinking` security risk
- [ ] **SEC-02**: Validate environment variables at startup
- [ ] **SEC-03**: Ensure mock auth headers only work in mock mode
- [ ] **FEAT-01**: 2FA email/SMS actually sends codes (not just console.log)
- [ ] **FEAT-02**: Staff invitation emails are sent

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- OAuth login (Google/Apple) — Email/password sufficient for demo; OAuth adds complexity
- Real-time chat — High complexity, not core to business discovery
- Mobile app — Web-first for demo
- Payment processing — Not needed for directory functionality
- Full test suite — Add after auth is working; currently just need functional auth
- Rate limiting — Not needed for internal demo
- CSRF protection — Not needed for internal demo

## Context

This is a brownfield project with substantial existing code (~86 routes). The codebase supports two modes:
- **Mock mode** (`USE_MOCK_DATA=true`): In-memory data, no database required
- **Production mode**: PostgreSQL via Prisma, real email via Resend

Current focus is making auth work in mock mode for demos, then ensuring production mode auth flows function correctly.

**Known issues from codebase audit:**
- Auth flow has issues in mock mode (registration succeeds but login fails)
- Email verification and password reset depend on Resend which requires API key
- Security issue: `allowDangerousEmailAccountLinking` is enabled
- 2FA email/SMS methods log to console instead of actually sending

## Constraints

- **Mock mode first**: Auth must work without database for demos
- **Production mode second**: Verify flows work with real database and email
- **No breaking changes**: Existing functionality must keep working
- **Security**: Fix identified vulnerabilities before any public use

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fix mock mode auth first | Demo use case requires no database | — Pending |
| Keep NextAuth v5 beta | Already integrated, migration risky | — Pending |
| Use Resend for email | Already configured, works well | — Pending |

---
*Last updated: 2026-01-19 after initial project definition*
