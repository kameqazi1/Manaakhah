# Project Milestones: Manaakhah

## v1.1 Map Overhaul (Shipped: 2026-01-19)

**Delivered:** WebGL-accelerated map with MapLibre GL JS, native marker clustering, and bidirectional search-map sync with "Search this area" button.

**Phases completed:** 1-4 (7 plans total)

**Key accomplishments:**
- Replaced Leaflet with MapLibre GL JS for GPU-accelerated vector tile rendering
- Native GeoJSON clustering with color-coded markers (green/yellow/orange by count)
- Search-to-map sync via useMapSearch hook and React Query
- "Search this area" button enables map exploration with viewport-based search
- Visual feedback with stale results dimming (50% opacity transition)
- URL-based bounds persistence for shareable map links

**Stats:**
- ~15 files created/modified
- 2,347 lines in map components/hooks
- 4 phases, 7 plans
- 1 day from start to ship

**Git range:** `feat(01-01)` → `feat(04-01)`

**What's next:** User determines next milestone goals (mobile optimization, Leaflet cleanup deferred to v1.2)

---

## v1 Fix Auth & Security (Shipped: 2026-01-19)

**Delivered:** Complete authentication system with mock mode support, production email flows, security hardening, and real email delivery for 2FA and staff invitations.

**Phases completed:** 1-4 (7 plans total)

**Key accomplishments:**
- Fixed mock mode auth with client-side registration and sessionStorage persistence
- Created production auth flow pages (verify-email, forgot-password, reset-password) with auto sign-in
- Added type-safe environment validation with @t3-oss/env-nextjs at build time
- Implemented safe OAuth account linking with email verification
- Built 2FA email delivery with real codes, 10-min expiry, and single-use enforcement
- Added staff invitation emails with branded templates

**Stats:**
- 53 files created/modified
- +10,023 / -442 lines of TypeScript
- 4 phases, 7 plans, ~25 tasks
- 1 day from start to ship

**Git range:** `feat(01-01)` → `docs(phase-04)`

**What's next:** User determines next milestone goals

---
