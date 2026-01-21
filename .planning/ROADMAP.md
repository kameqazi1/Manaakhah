# Roadmap: v1.2 Booking, Notifications & Mobile

**Milestone:** v1.2
**Created:** 2026-01-21
**Status:** Active

## Phase Overview

| Phase | Name | Goal | Requirements |
|-------|------|------|--------------|
| 1 | Booking Foundation | Users can book appointments through a visual calendar interface | BOOK-01, BOOK-02, BOOK-03, BOOK-04 |
| 2 | Notifications Core | All notifications are real, clickable, and navigate correctly | NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05, NOTIF-08 |
| 3 | Business Booking Tools | Business owners can manage availability and bookings efficiently | BOOK-05, BOOK-06, BOOK-07, MOB-05 |
| 4 | Notification Delivery | Users receive email notifications for important events | NOTIF-06, NOTIF-07 |
| 5 | Mobile Polish | Mobile experience is touch-optimized with proper navigation | MOB-01, MOB-02, MOB-03 |

---

## Phase 1: Booking Foundation

**Goal:** Users can browse a business's services and book an appointment through a visual calendar interface

**Plans:** 6 plans

Plans:
- [ ] 01-01-PLAN.md — Add Service model to Prisma schema
- [ ] 01-02-PLAN.md — Install react-day-picker and create booking utilities
- [ ] 01-03-PLAN.md — Create Service API and Availability API routes
- [ ] 01-04-PLAN.md — Migrate dashboard services page to use API
- [ ] 01-05-PLAN.md — Create booking page and components
- [ ] 01-06-PLAN.md — Verify booking flow end-to-end (checkpoint)

**Must-Haves:**
1. Service model and API for business services (name, duration, price, description)
2. Business service management UI in owner dashboard
3. Public booking page at /business/[id]/book
4. Available time slots displayed in calendar/grid view
5. Slot selection with service summary
6. Booking confirmation with details display
7. New booking creates database record with PENDING status

**Builds on:** Existing Booking, BusinessAvailability Prisma models

---

## Phase 2: Notifications Core

**Goal:** Notifications are real (not mock), clickable, and take users to the correct destination

**Must-Haves:**
1. Remove mock notification data from /api/notifications
2. Notification creation utility function
3. Create notification on booking request (to business owner)
4. Create notification on booking confirm/cancel (to customer)
5. Create notification on new review (to business owner)
6. Notification click navigates to relevant page (booking, review, message)
7. Mark as read on click
8. Accurate unread count in NotificationBell badge

**Builds on:** Existing Notification model, NotificationBell component

---

## Phase 3: Business Booking Tools

**Goal:** Business owners can manage their availability and handle bookings efficiently

**Must-Haves:**
1. Availability management page in business dashboard
2. Set recurring weekly hours (day, start time, end time)
3. Add exception dates (holidays, special hours)
4. View incoming booking requests
5. Automated reminder emails (24h before, via Resend)
6. Reschedule flow (propose new time)
7. Mobile-optimized booking management (single column layout)

**Builds on:** Phase 1 booking infrastructure, BusinessAvailability model

---

## Phase 4: Notification Delivery

**Goal:** Users receive email notifications for important events and can manage all notifications

**Must-Haves:**
1. Notifications inbox page (/notifications)
2. Filter by type, read/unread status
3. Bulk mark as read
4. Email delivery for booking confirmations (Resend)
5. Email delivery for new reviews (Resend)
6. Respect user notification preferences
7. Unsubscribe link in emails

**Builds on:** Phase 2 notification system, existing Resend setup

---

## Phase 5: Mobile Polish

**Goal:** Mobile users have a touch-optimized experience with proper navigation

**Must-Haves:**
1. Bottom navigation bar (Home, Search, Bookings, Profile)
2. Touch-friendly tap targets (44px minimum)
3. Map pinch-zoom and two-finger pan enabled
4. Mobile header simplified
5. Responsive booking flow (large buttons, single column)
6. Pull-to-refresh on key pages

**Builds on:** Existing Tailwind responsive setup, MapLibre touch support

---

## Progress Tracking

| Phase | Status | Plans | Completed |
|-------|--------|-------|-----------|
| 1 | Planned | 6 | 0 |
| 2 | Not Started | 0 | 0 |
| 3 | Not Started | 0 | 0 |
| 4 | Not Started | 0 | 0 |
| 5 | Not Started | 0 | 0 |

---
*Last updated: 2026-01-21*
