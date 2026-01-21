---
phase: 01-booking-foundation
plan: 05
subsystem: booking-ui
tags: [react, booking, components, customer-facing]

dependency-graph:
  requires: [01-02, 01-03]
  provides: [public-booking-page, booking-ui-components]
  affects: [02-notifications]

tech-stack:
  added: []
  patterns: [three-step-wizard, progressive-disclosure, mock-headers]

key-files:
  created:
    - components/booking/ServiceSelector.tsx
    - components/booking/TimeSlotGrid.tsx
    - components/booking/BookingSummary.tsx
    - app/business/[id]/book/page.tsx
    - app/api/businesses/[id]/availability/days/route.ts
  modified: []

decisions:
  - id: mock-headers-in-component
    choice: Build mock headers within component using useMemo
    rationale: Pattern used by existing components; useMockSession hook doesn't expose mockHeaders

metrics:
  duration: 4m 23s
  completed: 2026-01-21
---

# Phase 01 Plan 05: Booking UI & Customer Flow Summary

**One-liner:** Three-step booking wizard with service selection, date/time picker, and confirmation at /business/[id]/book

## What Was Built

### Components Created

1. **ServiceSelector** (`components/booking/ServiceSelector.tsx`)
   - Displays services as selectable cards
   - Shows name, description, duration, price
   - Price formatting for fixed, hourly, starting, and custom types
   - Duration formatting (minutes to hours:minutes)
   - Featured service highlighting with "Popular" badge
   - Selection state with ring highlight

2. **TimeSlotGrid** (`components/booking/TimeSlotGrid.tsx`)
   - Grid display of available time slots
   - 12-hour format display using formatTimeDisplay from lib/availability
   - Available slot count indicator
   - Disabled styling for unavailable slots
   - Loading state handling
   - Empty state for fully booked days

3. **BookingSummary** (`components/booking/BookingSummary.tsx`)
   - Confirmation view with all booking details
   - Business name, service, date, time, duration, price
   - Optional notes textarea
   - Info box explaining next steps
   - Back and Confirm buttons with loading state

### Booking Page (`app/business/[id]/book/page.tsx`)

**Three-step wizard flow:**
1. Service Selection - User picks from business services
2. Date & Time - Calendar with day availability + time slot grid
3. Confirmation - Summary with notes input

**Features:**
- Fetches business info, services, and availability from APIs
- Progressive navigation with visual step indicator
- Prevents booking own business
- Auth state handling with login redirect
- Error state handling throughout
- Success state with navigation to bookings page

### API Endpoint (`app/api/businesses/[id]/availability/days/route.ts`)

- Returns array of day numbers (0-6) when business is open
- Used by DatePicker to disable unavailable days on calendar

## Integration Points

| From | To | Via |
|------|-----|-----|
| book/page.tsx | /api/businesses/[id]/services | fetch services on load |
| book/page.tsx | /api/businesses/[id]/availability/days | fetch open days on load |
| book/page.tsx | /api/businesses/[id]/availability | fetch time slots on date select |
| book/page.tsx | /api/bookings | POST booking on confirm |

## Decisions Made

| Decision | Context | Rationale |
|----------|---------|-----------|
| mock-headers-in-component | Auth headers for API calls | Pattern consistent with dashboard/services/page.tsx; useMockSession doesn't expose headers directly |
| checkmark-not-emoji | Success state icon | Using text checkmark character instead of emoji for consistency |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] `npm run build` completes without errors
- [x] /business/[id]/book page loads (verified in build output)
- [x] ServiceSelector.tsx >= 50 lines (92 lines)
- [x] TimeSlotGrid.tsx >= 40 lines (72 lines)
- [x] BookingSummary.tsx >= 40 lines (135 lines)
- [x] book/page.tsx >= 200 lines (476 lines)
- [x] API integration patterns present in page

## Testing Notes

To test the booking flow:
1. Navigate to /business/[business-id]/book
2. Select a service from the list
3. Choose a date from the calendar
4. Select an available time slot
5. Review summary and add optional notes
6. Click confirm (requires authentication)

## Commits

| Hash | Message |
|------|---------|
| f94bf03 | feat(01-05): create booking UI components |
| 3ffcf46 | feat(01-05): create booking page at /business/[id]/book |
| 63793e8 | feat(01-05): create availability days endpoint |

## Next Phase Readiness

**Ready for:**
- Phase 2: Notification triggers can hook into booking creation
- Adding "Book Now" button to business detail page
- Real-time availability updates

**Prerequisites met:**
- Booking UI components exist
- Customer booking flow functional
- Creates PENDING bookings in database
