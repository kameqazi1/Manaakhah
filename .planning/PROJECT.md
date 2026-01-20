# Manaakhah

## What This Is

A Muslim business directory and community platform helping users discover halal restaurants, Islamic services, and Muslim-owned businesses. Features include business search with map views, community features (posts, events, messaging), booking system, business owner tools, and complete authentication system with mock mode support.

## Core Value

Users can find and connect with verified Muslim-owned businesses in their area.

## Current State

**Shipped:** v1.1 Map Overhaul (2026-01-19)
**Codebase:** ~44,000 lines of TypeScript across ~90 routes
**Tech stack:** Next.js 16, NextAuth v5, Prisma, Resend, PostgreSQL, MapLibre GL JS

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
- Mock mode auth with client-side registration and sessionStorage — v1
- Email verification flow with auto sign-in — v1
- Password reset flow with auto sign-in — v1
- Type-safe environment validation at build time — v1
- Mock header protection middleware — v1
- Safe OAuth account linking with email verification — v1
- 2FA email delivery with real codes — v1
- Staff invitation emails with branded templates — v1
- MapLibre GL JS with WebGL vector tile rendering — v1.1
- Native marker clustering with color-coded counts — v1.1
- Search-to-map sync (fitBounds on filter change) — v1.1
- Map-to-search sync ("Search this area" button) — v1.1
- User location marker with pulse animation — v1.1
- View mode toggle (list/map/split) on search page — v1.1
- API bounds filtering (ne_lat, sw_lat, etc.) — v1.1
- useMapSearch hook for shared state management — v1.1

### Active

<!-- Current scope. Building toward these. -->

(None currently — milestone complete, next milestone to be defined)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- OAuth login (Google/Apple) — Email/password sufficient for demo; OAuth adds complexity
- Real-time chat — High complexity, not core to business discovery
- Mobile app — Web-first for demo
- Payment processing — Not needed for directory functionality
- SMS 2FA — Removed in v1, adds cost/complexity without being in UI
- 2FA login challenge UI — Backend ready, frontend needed (v2 candidate)
- Mobile map gestures — Deferred from v1.1 to v1.2 (pinch-zoom, touch targets)
- Leaflet package removal — Deferred from v1.1 to v1.2 (cleanup after migration tested)
- Dedicated /map page — Deferred from v1.1 to v1.2

## Context

This is a brownfield project with substantial existing code (~90 routes). The codebase supports two modes:
- **Mock mode** (`USE_MOCK_DATA=true`): In-memory data, no database required
- **Production mode**: PostgreSQL via Prisma, real email via Resend

v1 shipped complete authentication with both modes working. Environment validation enforces required secrets at build time. Security vulnerabilities identified in initial audit have been addressed.

**Known limitations:**
- 2FA login challenge flow incomplete (backend throws error, no UI to catch it)
- Production login page uses API route instead of NextAuth signIn directly
- Leaflet packages still in bundle (deferred cleanup to v1.2)
- Hover state on map markers needs Layer-based approach (deferred to v1.2)

## Constraints

- **Maintain both modes**: Mock and production must both work
- **No breaking changes**: Existing functionality must keep working
- **Security first**: All new features should follow established patterns

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fix mock mode auth first | Demo use case requires no database | Good |
| Keep NextAuth v5 beta | Already integrated, migration risky | Good |
| Use Resend for email | Already configured, works well | Good |
| sessionStorage for mock session | Clears on browser close per user preference | Good |
| Client-side registration in mock | Solves server/client storage mismatch | Good |
| @t3-oss/env-nextjs for validation | Type-safe, fails fast at build time | Good |
| 24-hour token expiration | Consistent across all verification tokens | Good |
| Remove SMS 2FA completely | Not in UI, adds cost/complexity | Good |
| Log but don't block mock headers | Security through obscurity | Good |
| MapLibre GL JS over Leaflet | WebGL rendering, vector tiles, native clustering | Good |
| react-map-gl/maplibre wrapper | React-friendly markers, popups, lifecycle | Good |
| MapTiler free tier | 100K loads/month sufficient for dev/early prod | Good |
| Native clustering (cluster=true) | No additional deps, handles all logic | Good |
| isProgrammaticMove ref pattern | Prevents infinite loop between fitBounds and onMoveEnd | Good |
| URL as source of truth | Shareable links, React Query auto-refetch | Good |

---
*Last updated: 2026-01-19 after v1.1 milestone completion*
