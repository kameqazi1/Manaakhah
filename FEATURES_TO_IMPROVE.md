# Features to Improve Before App is Usable

**Project:** Manaakhah - Muslim-owned Business Directory
**Generated:** 2026-02-03

---

## Critical (Must Fix Before Launch)

### 1. Authentication System - Switch from Mock to Real ✅ COMPLETED (2026-02-04)
**Current State:** App now uses real NextAuth with PostgreSQL database
**Files:** `.env.local` (created), `lib/auth.ts`, `components/mock-session-provider.tsx`
**Status:** `USE_MOCK_DATA=false` - Real authentication active
**Completed:**
- [x] Configure NextAuth with real database sessions
- [x] Remove mock session fallbacks from all pages
- [ ] Test email verification flow end-to-end (requires Resend API key)
- [ ] Test password reset flow end-to-end (requires Resend API key)
- [ ] Test 2FA setup and verification (API exists but untested)

### 2. Forum/Community Posts - Needs Database Persistence ✅ COMPLETED (2026-02-04)
**Current State:** Uses database with `CommunityPost` and `PostComment` models
**Files:** `app/forum/page.tsx`, `app/api/community/posts/*`
**Status:** Posts persist in PostgreSQL and shared between all users
**Completed:**
- [x] Connect to existing `CommunityPost` and `PostComment` Prisma models
- [x] Wire up `/api/community/posts` endpoints with NextAuth support
- [ ] Add real-time updates or polling for new posts (optional enhancement)

### 3. Events System - Needs Database Persistence ✅ COMPLETED (2026-02-04)
**Current State:** Uses database with `Event` and `EventRsvp` models
**Files:** `app/events/page.tsx`, `app/api/events/*` (created)
**Status:** Events persist in PostgreSQL with RSVP tracking
**Completed:**
- [x] Use existing Event model in Prisma
- [x] Build API endpoints for GET events and RSVP operations
- [x] Update events page to fetch from database
- [ ] Connect business dashboard to create events (enhancement)

### 4. Referral Program - Needs Backend Implementation
**Current State:** Complete UI but localStorage-only
**Files:** `app/referrals/page.tsx`
**Issue:** Referral codes, rewards, and tracking all in localStorage
**Required:**
- [ ] Create Referral and ReferralReward tables
- [ ] Build API endpoints for referral tracking
- [ ] Implement actual reward system (credits/discounts)
- [ ] Send real invite emails via Resend

### 5. Prayer Times - Verify Real Data Source
**Current State:** UI exists, API route exists
**Files:** `app/prayer-times/page.tsx`, `app/api/prayer-times/route.ts`, `app/api/islamic/prayer-times/route.ts`
**Issue:** May be using mock/static data
**Required:**
- [ ] Verify API fetches from real prayer time service (Aladhan API or similar)
- [ ] Handle geolocation for accurate times
- [ ] Test timezone handling

---

## High Priority (Important for User Experience)

### 6. Community Impact Page - Placeholder Only
**Current State:** Shows "Impact Data Coming Soon"
**Files:** `app/community-impact/page.tsx`
**Issue:** No actual data collection or display
**Required:**
- [ ] Define what metrics to track (businesses listed, users, spending)
- [ ] Build aggregation queries
- [ ] Create real dashboard with live data

### 7. Spending Insights - Placeholder Only
**Current State:** Shows "No Spending Data Yet"
**Files:** `app/insights/page.tsx`
**Issue:** No mechanism to track user spending
**Required:**
- [ ] Design spending tracking approach (manual entry? receipts? check-ins?)
- [ ] Build data model and API
- [ ] Create visualization dashboard

### 8. Saved Searches - UI Only, No Backend
**Current State:** Form exists to save searches
**Files:** `app/saved-searches/page.tsx`
**Issue:** No persistence, no notifications
**Required:**
- [ ] Create SavedSearch model
- [ ] Build API for CRUD operations
- [ ] Implement notification system for matching businesses

### 9. Lists Feature - UI Shell Only
**Current State:** Create list form exists
**Files:** `app/lists/page.tsx`
**Issue:** Lists stored locally, can't be shared
**Required:**
- [ ] Create List and ListItem models
- [ ] Build sharing/collaboration features
- [ ] Connect to business cards

### 10. Offline Mode - Page Only, No PWA
**Current State:** Static offline.tsx page
**Files:** `app/offline/page.tsx`
**Issue:** No service worker, no caching, no PWA manifest
**Required:**
- [ ] Implement service worker for caching
- [ ] Add PWA manifest
- [ ] Cache business data for offline viewing
- [ ] Queue actions for sync when online

---

## Medium Priority (Enhance Before Full Launch)

### 11. Business Verification Workflow - Models Exist, No UI
**Current State:** Prisma has `VerificationType`, `VerificationStatus` enums
**Files:** `prisma/schema.prisma`
**Issue:** No admin UI to manage verifications
**Required:**
- [ ] Build verification request UI for business owners
- [ ] Build admin verification queue
- [ ] Display verification badges on business profiles

### 12. Business Claim System - Models Exist, Partial UI
**Current State:** `ClaimStatus` enum exists, claim page exists
**Files:** `app/claim-business/page.tsx`, `prisma/schema.prisma`
**Issue:** Claim flow may not be fully connected to backend
**Required:**
- [ ] Test full claim workflow end-to-end
- [ ] Build admin approval queue for claims
- [ ] Implement phone/email verification for claims

### 13. Messaging System - Verify Backend Integration
**Current State:** Full UI exists, API endpoints exist
**Files:** `app/messages/page.tsx`, `app/api/messages/*`
**Issue:** Need to verify real-time updates, read receipts
**Required:**
- [ ] Test message sending/receiving with real users
- [ ] Implement real-time updates (WebSocket or polling)
- [ ] Add push notifications for new messages

### 14. Booking System - Verify End-to-End Flow
**Current State:** API exists, booking form exists
**Files:** `app/business/[id]/book/page.tsx`, `app/api/bookings/*`
**Issue:** Status management, cancellation flow untested
**Required:**
- [ ] Test booking creation flow
- [ ] Test booking approval/rejection by business
- [ ] Test email notifications for booking updates
- [ ] Implement waitlist functionality

### 15. Admin Analytics - Mock Data Only
**Current State:** Charts exist with placeholder data
**Files:** `app/admin/analytics/*`, `app/dashboard/analytics/page.tsx`
**Issue:** No real data queries, just UI shells
**Required:**
- [ ] Build real aggregation queries
- [ ] Connect charts to actual data
- [ ] Add date range filters

### 16. Image Uploads - Verify Cloudinary Integration
**Current State:** Cloudinary config in env, upload route exists
**Files:** `app/api/upload/route.ts`
**Issue:** Upload returns placeholder URL in some cases
**Required:**
- [ ] Test actual Cloudinary uploads
- [ ] Add image optimization
- [ ] Handle upload failures gracefully

---

## Lower Priority (Nice to Have)

### 17. Wallet/Payment System - Schema Only
**Current State:** `PaymentStatus` enum exists
**Issue:** No payment UI, no payment processor integration
**Required:**
- [ ] Decide on payment processor (Stripe?)
- [ ] Build payment flow for bookings
- [ ] Handle refunds

### 18. Appeal System - Schema Only
**Current State:** `AppealStatus` enum exists
**Issue:** No appeal UI for rejected businesses
**Required:**
- [ ] Build appeal submission form
- [ ] Build admin appeal review queue

### 19. Two-Factor Authentication - API Exists, UI Untested
**Current State:** 2FA API routes exist, models in schema
**Files:** `app/api/auth/2fa/*`, `lib/auth/two-factor.ts`
**Issue:** SMS 2FA removed (see comment), TOTP needs testing
**Required:**
- [ ] Test TOTP setup flow
- [ ] Test QR code generation
- [ ] Test verification during login

### 20. Business Benchmarking - Placeholder
**Current State:** Page exists
**Files:** `app/dashboard/benchmarking/page.tsx`
**Required:**
- [ ] Define benchmarking metrics
- [ ] Build comparison logic
- [ ] Create visualization

### 21. Business Deals/Promotions - Page Exists
**Current State:** Deals management page exists
**Files:** `app/dashboard/deals/page.tsx`
**Required:**
- [ ] Verify deal creation/management
- [ ] Display deals on business profiles
- [ ] Add deal search/filter

---

## Technical Debt

### 22. Environment Configuration
- [ ] Ensure `USE_MOCK_DATA=false` works properly
- [ ] Document all required environment variables
- [ ] Add environment validation on startup

### 23. Error Handling
- [ ] Add proper error boundaries
- [ ] Implement user-friendly error messages
- [ ] Add error logging/monitoring

### 24. Performance
- [ ] Audit and optimize database queries
- [ ] Add pagination where missing
- [ ] Implement proper caching

### 25. Testing
- [ ] Add unit tests for critical paths
- [ ] Add integration tests for API routes
- [ ] Add E2E tests for user flows

---

## Summary

| Priority | Count | Status |
|----------|-------|--------|
| Critical | 5 | Must fix before any user testing |
| High | 5 | Important for basic usability |
| Medium | 6 | Enhance before public launch |
| Lower | 5 | Nice to have |
| Technical | 4 | Ongoing |

**Recommended Order:**
1. Fix authentication (switch off mock mode)
2. Connect forum/events/referrals to database
3. Verify booking and messaging flows
4. Build out remaining placeholder pages
5. Polish admin tools and analytics
