# Manaakhah

## What This Is

A Muslim business directory and community platform helping users discover halal restaurants, Islamic services, and Muslim-owned businesses. Features include business search with map views, community features (posts, events, messaging), booking system, business owner tools, and complete authentication system with mock mode support.

## Core Value

Users can find and connect with verified Muslim-owned businesses in their area.

## Current State

**Shipped:** v1 Fix Auth & Security (2026-01-19)
**Codebase:** 41,848 lines of TypeScript across ~90 routes
**Tech stack:** Next.js 16, NextAuth v5, Prisma, Resend, PostgreSQL

## Current Milestone: v1.1 Map Overhaul

**Goal:** Replace Leaflet with MapLibre GL JS and build a map-first browsing experience

**Target features:**
- Migrate from Leaflet to MapLibre GL JS (WebGL rendering, vector tiles)
- Bidirectional search-map integration (search updates map, map updates results)
- User location with "you are here" marker and distance filtering
- Marker clustering for performance with many businesses
- Better mobile gestures (pinch-to-zoom, smooth pan)
- Map on homepage, search page, and dedicated /map exploration page

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

### Active

<!-- Current scope. Building toward these. -->

- [ ] **MAP-01**: Replace Leaflet with MapLibre GL JS for WebGL rendering
- [ ] **MAP-02**: Implement marker clustering for performance with many businesses
- [ ] **MAP-03**: Search results update map view (zoom to fit results)
- [ ] **MAP-04**: Map drag/zoom updates search results to visible area
- [ ] **MAP-05**: Show user's current location on map with distance filtering
- [ ] **MAP-06**: Add map view toggle to search results page
- [ ] **MAP-07**: Create dedicated /map page for full-screen exploration
- [ ] **MAP-08**: Mobile-optimized gestures (pinch-zoom, smooth pan, touch targets)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- OAuth login (Google/Apple) — Email/password sufficient for demo; OAuth adds complexity
- Real-time chat — High complexity, not core to business discovery
- Mobile app — Web-first for demo
- Payment processing — Not needed for directory functionality
- SMS 2FA — Removed in v1, adds cost/complexity without being in UI
- 2FA login challenge UI — Backend ready, frontend needed (v2 candidate)

## Context

This is a brownfield project with substantial existing code (~90 routes). The codebase supports two modes:
- **Mock mode** (`USE_MOCK_DATA=true`): In-memory data, no database required
- **Production mode**: PostgreSQL via Prisma, real email via Resend

v1 shipped complete authentication with both modes working. Environment validation enforces required secrets at build time. Security vulnerabilities identified in initial audit have been addressed.

**Known limitations:**
- 2FA login challenge flow incomplete (backend throws error, no UI to catch it)
- Production login page uses API route instead of NextAuth signIn directly
- Current map uses Leaflet (DOM-based) — slow with many markers, no vector tiles

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

---
*Last updated: 2026-01-19 after v1.1 milestone definition*
