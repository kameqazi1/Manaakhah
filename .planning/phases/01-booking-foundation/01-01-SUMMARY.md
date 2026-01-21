---
phase: 01-booking-foundation
plan: 01
subsystem: database
tags: [prisma, service-model, booking, schema]

dependency-graph:
  requires: []
  provides:
    - Service model for structured booking services
    - Business-to-Service one-to-many relationship
    - Booking-to-Service optional relationship
  affects:
    - 01-02 (calendar utilities use Service model)
    - 01-03 (booking flow uses Service)
    - 01-04 (service management CRUD)

tech-stack:
  added: []
  patterns:
    - Service model with price/duration/category structure
    - Optional serviceId on Booking for backwards compatibility

key-files:
  created: []
  modified:
    - prisma/schema.prisma

decisions:
  - id: serviceList-rename
    summary: Renamed Business.services String[] to serviceList to avoid conflict with Service[] relation
    rationale: The new Service model needs a relation field named "services" on Business. Legacy string array renamed for backwards compatibility.
  - id: optional-serviceId
    summary: Made Booking.serviceId optional to support existing bookings
    rationale: Existing bookings use serviceType String. New bookings will use serviceId for proper service reference.

metrics:
  duration: 3min
  completed: 2026-01-21
---

# Phase 01 Plan 01: Service Model Schema Summary

**Service model with price, duration, priceType fields and relations to Business and Booking models**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-21T06:15:00Z
- **Completed:** 2026-01-21T06:18:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added Service model with full schema (id, businessId, name, description, price, priceType, duration, category, isActive, isFeatured, sortOrder, timestamps)
- Established Business-to-Service one-to-many relationship
- Added optional serviceId to Booking model for service reference
- Renamed legacy services String[] to serviceList for backwards compatibility
- Generated Prisma client with new Service model

## Task Commits

Note: Plan 01-01 schema changes were committed together with plan 01-02 work in a prior session.

1. **Task 1: Add Service model to Prisma schema** - `b6bc71d` (feat)
   - Service model with all required fields
   - Business.services relation to Service[]
   - Booking.serviceId and service relation
   - Renamed services -> serviceList for legacy field
2. **Task 2: Generate Prisma client and push schema** - (no separate commit needed)
   - `npx prisma generate` completed successfully
   - `npx prisma db push` skipped - project uses USE_MOCK_DATA=true with no database

## Files Created/Modified

- `prisma/schema.prisma` - Added Service model (lines 1140-1160), Business.services relation (line 618), Booking.serviceId/service (lines 1053, 1099), renamed services to serviceList (line 531)
- `app/api/businesses/route.ts` - Updated to use serviceList field
- `app/api/admin/scraper/run/route.ts` - Updated to use serviceList field
- `lib/mock-data/client.ts` - Updated to use serviceList field
- `lib/mock-data/types.ts` - Updated MockBusiness interface

## Decisions Made

1. **Renamed services to serviceList** - The legacy Business.services String[] conflicted with the new Service[] relation. Renamed to serviceList to maintain backwards compatibility while adding the structured Service model.

2. **Optional serviceId on Booking** - Made serviceId optional to support existing bookings that only have serviceType String. New bookings should use serviceId for proper service reference.

3. **Skipped db push** - Project is configured for mock data mode (USE_MOCK_DATA=true) with no DATABASE_URL configured. Schema changes are validated via prisma format and generate.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Schema field naming conflict**
- **Found during:** Task 1 (prisma format validation)
- **Issue:** Business model already had `services String[]` field, conflicting with new `services Service[]` relation name
- **Fix:** Renamed legacy field to `serviceList String[]` with descriptive comment
- **Files modified:** prisma/schema.prisma, lib/mock-data/client.ts, lib/mock-data/types.ts, app/api/businesses/route.ts, app/api/admin/scraper/run/route.ts
- **Verification:** `npx prisma format` completes without errors
- **Committed in:** b6bc71d

---

**Total deviations:** 1 auto-fixed (blocking issue)
**Impact on plan:** Field rename was necessary for schema validity. No scope creep.

## Issues Encountered

1. **No database configured** - DATABASE_URL is empty in .env.local. Project uses USE_MOCK_DATA=true mode. Prisma db push skipped but generate completed successfully.

## User Setup Required

None - no external service configuration required for this plan.

## Next Phase Readiness

**Ready for 01-02 and beyond:**
- Service model is available in Prisma client
- API routes can import Service type from @prisma/client
- Booking model can reference services via serviceId
- No blockers identified

---
*Phase: 01-booking-foundation*
*Completed: 2026-01-21*
