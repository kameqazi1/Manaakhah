# Codebase Concerns

**Analysis Date:** 2026-01-19

## Tech Debt

**Pervasive use of `any` type:**
- Issue: Over 50 instances of `: any` type annotations throughout codebase, bypassing TypeScript's type safety
- Files: `app/api/businesses/route.ts:79-80,132-163`, `app/api/messages/conversations/route.ts:23-108`, `app/api/bookings/route.ts:24-48`, `lib/auth.ts:25,198,211-212`
- Impact: Runtime errors may not be caught at compile time, reduced IDE support, harder refactoring
- Fix approach: Create proper TypeScript interfaces for Prisma query results, API responses, and session objects

**Type casting in NextAuth configuration:**
- Issue: PrismaAdapter cast to `any`, session/token properties cast with `as any`
- Files: `lib/auth.ts:25,198,211-212`
- Impact: Type mismatches between NextAuth v5 and adapter may cause silent failures
- Fix approach: Use proper NextAuth v5 types, extend Session and JWT types in `next-auth.d.ts`

**Mock mode interleaved with production code:**
- Issue: `isMockMode()` checks scattered throughout API routes and components, creating two parallel code paths
- Files: `app/api/auth/register/route.ts:23-52`, `app/api/businesses/route.ts:192-212`, `lib/db.ts:6`
- Impact: Harder to maintain, risk of mock-only bugs going unnoticed, increased complexity
- Fix approach: Use dependency injection or environment-based module resolution instead of inline conditionals

**Large monolithic page components:**
- Issue: Several page components exceed 500+ lines with mixed concerns
- Files: `app/admin/businesses/scraper/page.tsx` (1137 lines), `lib/scraper/scraper.ts` (1020 lines), `app/business/[id]/page.tsx` (884 lines)
- Impact: Difficult to test, reuse, and maintain; slow code review; hard to understand
- Fix approach: Extract into smaller components, custom hooks, and utility functions

**Duplicated Haversine distance calculation:**
- Issue: Same distance calculation function implemented in 3 different files
- Files: `app/api/businesses/route.ts:46-63`, `lib/mock-data/client.ts:21-30`, `components/map/LeafletMap.tsx` (indirectly via coordinate math)
- Impact: Risk of inconsistent implementations, wasted code
- Fix approach: Create shared `lib/utils/geo.ts` with single implementation

## Known Bugs

**2FA email/SMS sending not implemented:**
- Symptoms: 2FA setup appears to work but codes are only logged to console, never actually sent
- Files: `lib/auth/two-factor.ts:109-127`
- Trigger: Enable 2FA with email or SMS method
- Workaround: Only AUTHENTICATOR method works; email/SMS are placeholder stubs

**Staff invitation email not implemented:**
- Symptoms: Staff can be invited but no notification is sent
- Files: `app/api/business/[id]/staff/route.ts:265`
- Trigger: Add staff member to business
- Workaround: Manual notification required

## Security Considerations

**allowDangerousEmailAccountLinking enabled:**
- Risk: Account takeover via OAuth email linking. Attacker could create Google/Apple account with victim's email and gain access
- Files: `lib/auth.ts:31,37`
- Current mitigation: None
- Recommendations: Remove `allowDangerousEmailAccountLinking: true` or implement email verification before linking

**Custom headers used for mock auth:**
- Risk: In mock mode, `x-user-id` and `x-user-role` headers control authorization without verification
- Files: `app/api/businesses/route.ts:195-199`, `app/admin/businesses/scraper/page.tsx:398-399`
- Current mitigation: Only active when `USE_MOCK_DATA` is true
- Recommendations: Ensure mock mode cannot be enabled in production; add environment checks

**Non-null assertion on environment variables:**
- Risk: Application crash if env vars not set, potential exposure of undefined behavior
- Files: `lib/auth.ts:29-36,109,251`, `lib/scraper/scraper.ts:323,339,406,421,437`
- Current mitigation: Some lazy initialization checks (e.g., in `lib/email.ts`)
- Recommendations: Validate all required env vars at startup, use zod schema for env validation

**Sensitive data in console.log:**
- Risk: 2FA codes logged to console in development
- Files: `lib/auth/two-factor.ts:111,123`
- Current mitigation: Only in TODO placeholder code
- Recommendations: Remove console.log of sensitive data, use proper logging with PII redaction

## Performance Bottlenecks

**No pagination on business listing:**
- Problem: Business listing returns up to 100 records without cursor-based pagination
- Files: `app/api/businesses/route.ts:128`
- Cause: Hard limit of 100 with `take: 100`
- Improvement path: Implement cursor-based pagination, add offset/limit query params

**N+1 query potential in reviews aggregation:**
- Problem: Each business includes all reviews for rating calculation done in JavaScript
- Files: `app/api/businesses/route.ts:119-137`
- Cause: Rating calculated per-business after fetching all reviews
- Improvement path: Use Prisma `_avg` aggregation, or maintain `averageRating` field on Business model (already exists but not used)

**localStorage used for critical features:**
- Problem: Conversations, messages, favorites stored in localStorage which is synchronous and blocks main thread
- Files: `app/messages/page.tsx:93,134,159,177,220,232,297,303`, `app/favorites/page.tsx:36-37`, `app/business/[id]/page.tsx:131-218`
- Cause: Mock mode fallback that may persist in production
- Improvement path: Ensure all localStorage usage is mock-mode only; use IndexedDB for large data

## Fragile Areas

**LeafletMap dynamic CSS injection:**
- Files: `components/map/LeafletMap.tsx:113-147`
- Why fragile: Injects CSS via document.createElement at runtime; style conflicts possible, no cleanup on unmount
- Safe modification: Extract to static CSS file, use CSS Modules, or styled-components
- Test coverage: No tests for map component

**Mock data storage state management:**
- Files: `lib/mock-data/client.ts`, `lib/mock-data/storage.ts`, `lib/mock-data/seed-data.ts`
- Why fragile: In-memory state with localStorage persistence; complex mock Prisma-like API with many edge cases
- Safe modification: Changes to mock API must mirror real Prisma behavior exactly
- Test coverage: No tests for mock data layer

**Scraper multi-source orchestration:**
- Files: `lib/scraper/scraper.ts:152-261`
- Why fragile: Complex async orchestration with error handling per-source; mock data generation mixed in
- Safe modification: Thoroughly test each source scraper independently; mock external APIs
- Test coverage: No tests

## Scaling Limits

**Single database connection pooling:**
- Current capacity: Default Prisma connection pool (~10 connections for serverless)
- Limit: High concurrent requests will exhaust pool
- Scaling path: Configure `connection_limit` in DATABASE_URL, use PgBouncer for pooling

**Image upload via base64 in request body:**
- Current capacity: 10MB limit on uploads
- Limit: Large images consume full server memory during processing
- Scaling path: Use direct-to-Cloudinary uploads with signed URLs, implement chunked uploads

## Dependencies at Risk

**next-auth beta version:**
- Risk: Using `next-auth@5.0.0-beta.30` which may have breaking changes before stable release
- Impact: Auth system may break on update; beta APIs may change
- Migration plan: Pin version, monitor for stable v5 release, review migration guides

**Leaflet marker cluster complexity:**
- Risk: Multiple related packages (`leaflet`, `leaflet.markercluster`, `react-leaflet`, `react-leaflet-cluster`) must stay compatible
- Impact: Version mismatch causes runtime errors, cluster not rendering
- Migration plan: Test upgrades carefully; consider Mapbox GL JS as unified alternative

## Missing Critical Features

**No rate limiting:**
- Problem: API routes have no rate limiting protection
- Blocks: Production deployment without DDoS protection

**No input sanitization beyond Zod:**
- Problem: XSS prevention relies only on React escaping; no server-side sanitization
- Blocks: User-generated content (reviews, posts) may contain malicious content

**No CSRF protection:**
- Problem: State-changing operations don't verify CSRF tokens
- Blocks: Secure form submissions

## Test Coverage Gaps

**Zero test files in application code:**
- What's not tested: All application code - no unit tests, integration tests, or e2e tests exist
- Files: No `*.test.ts`, `*.spec.ts`, or `__tests__/` directories in `app/`, `lib/`, or `components/`
- Risk: Regressions go undetected; refactoring is risky; bugs reach production
- Priority: High - testing infrastructure should be first priority

**No test configuration:**
- What's not tested: No Jest, Vitest, or Playwright config in package.json
- Files: `package.json` has no test script or test dependencies
- Risk: Cannot run tests even if written
- Priority: High - add testing framework setup

**Critical paths without validation:**
- What's not tested: Auth flows, payment (if added), booking creation, business verification
- Files: `app/api/auth/*`, `app/api/bookings/*`, `lib/auth.ts`
- Risk: Core functionality may silently break
- Priority: High - these paths need tests first

---

*Concerns audit: 2026-01-19*
