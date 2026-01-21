---
phase: 01-booking-foundation
plan: 03
subsystem: booking-api
tags: [api-routes, services, availability, mock-data, crud]

dependency-graph:
  requires:
    - 01-01 (Service model schema)
    - 01-02 (generateTimeSlots utility)
  provides:
    - Service CRUD API for business service management
    - Availability API for time slot querying
    - Mock data support for Service and Availability models
  affects:
    - 01-04 (booking form will consume these APIs)
    - 01-05 (booking management will use service data)

tech-stack:
  added: []
  patterns:
    - Business owner authorization for service CRUD
    - Compound key lookups for availability (businessId + dayOfWeek/date)
    - Array orderBy support in mock data client

key-files:
  created:
    - app/api/businesses/[id]/services/route.ts
    - app/api/businesses/[id]/availability/route.ts
  modified:
    - lib/mock-data/types.ts
    - lib/mock-data/storage.ts
    - lib/mock-data/client.ts

decisions:
  - id: service-crud-in-business-scope
    summary: Service CRUD endpoints nested under /api/businesses/[id]/services
    rationale: Services belong to businesses, scoping under businessId ensures proper ownership context and simpler authorization

metrics:
  duration: ~4 minutes
  completed: 2026-01-21
---

# Phase 01 Plan 03: Booking Flow APIs Summary

**One-liner:** Service CRUD API with owner auth and availability slot API using generateTimeSlots utility.

## What Was Delivered

### Task 1: Service CRUD API Routes
- Created `app/api/businesses/[id]/services/route.ts` with:
  - **GET** - List services for a business (active only by default, `?active=false` for all)
  - **POST** - Create new service (requires business owner auth)
  - **PUT** - Update service (serviceId in body, owner auth)
  - **DELETE** - Delete service (serviceId in query param, owner auth)
- Input validation: name/price/duration required, duration 1-480 min, price >= 0
- Owner verification before any write operations

### Task 2: Availability API Route
- Created `app/api/businesses/[id]/availability/route.ts` with:
  - **GET** `?date=YYYY-MM-DD&duration=60` - Returns available time slots
  - Checks BusinessAvailability for day-of-week hours
  - Checks AvailabilityException for date-specific overrides (closures or modified hours)
  - Fetches existing PENDING/CONFIRMED bookings for conflict detection
  - Uses `generateTimeSlots()` from lib/availability.ts
- Response includes: slots array, isOpen status, business hours, serviceDuration

### Task 3: Mock Data Support
- Added new types: MockService, MockBusinessAvailability, MockAvailabilityException
- Updated MockDatabase interface with new collections
- Added storage methods: getServices/setServices, getBusinessAvailabilities/setBusinessAvailabilities, getAvailabilityExceptions/setAvailabilityExceptions
- Added mock client models:
  - `service` - findMany (with array orderBy), findUnique, create, update, delete
  - `businessAvailability` - findUnique (compound key), findMany, create, update
  - `availabilityException` - findUnique (compound key with date), findMany, create, update, delete

## Technical Details

### Service API Endpoints
```
GET    /api/businesses/[id]/services          - List services
POST   /api/businesses/[id]/services          - Create service
PUT    /api/businesses/[id]/services          - Update service
DELETE /api/businesses/[id]/services?serviceId=xxx - Delete service
```

### Availability API Response
```typescript
{
  slots: TimeSlot[],           // Array of { time, available, reason? }
  date: string,                // "2026-01-21"
  dayOfWeek: number,           // 0-6
  isOpen: boolean,
  hours: { start, end },       // Business hours for this date
  serviceDuration: number      // Duration used for slot calculation
}
```

### Mock Data Compound Keys
```typescript
// BusinessAvailability lookup
businessId_dayOfWeek: { businessId: string; dayOfWeek: number }

// AvailabilityException lookup
businessId_date: { businessId: string; date: Date }
```

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 5f0a778 | feat | Create Service CRUD API routes |
| 86120d0 | feat | Create Availability API route |
| ad8ba2c | feat | Add mock data support for Service and Availability models |

## Verification Results

- [x] `npm run build` completes without errors
- [x] GET /api/businesses/[id]/services returns services array
- [x] POST /api/businesses/[id]/services creates a service (with auth)
- [x] GET /api/businesses/[id]/availability?date=YYYY-MM-DD returns slots array
- [x] Mock mode works for service operations

## Success Criteria Met

- [x] Service CRUD API handles GET (list), POST (create), PUT (update), DELETE operations
- [x] Service API validates ownership (only business owner can modify)
- [x] Availability API returns time slots based on BusinessAvailability and existing bookings
- [x] Both APIs work in mock mode (USE_MOCK_DATA=true)
- [x] All routes compile and handle errors gracefully

## Next Phase Readiness

**Ready for 01-04 (Booking Form UI):**
- Service list API ready for service selection dropdown
- Availability API ready for time slot picker
- Mock data support enables frontend development without database
- No blockers identified
