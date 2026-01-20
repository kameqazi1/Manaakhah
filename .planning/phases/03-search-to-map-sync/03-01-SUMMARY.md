# Plan 03-01 Summary: API Bounds + useMapSearch Hook

**Phase:** 03-search-to-map-sync
**Plan:** 01 (Wave 1)
**Status:** Complete
**Completed:** 2026-01-19

## What Was Built

Implemented the foundation for search-map synchronization: API bounds filtering, QueryClientProvider, and useMapSearch hook.

### Changes Made

**app/api/businesses/route.ts:**
1. Added parsing for bounds params: `ne_lat`, `ne_lng`, `sw_lat`, `sw_lng`
2. Added bounds-based filtering in Prisma where clause (latitude/longitude ranges)
3. Bounds filtering takes precedence over radius filtering when all 4 params present
4. Existing radius-based filtering continues to work unchanged

**components/query-provider.tsx:** (NEW)
1. Created client-side QueryProvider component
2. Uses useState pattern to avoid QueryClient recreation
3. Configured staleTime: 30000ms, refetchOnWindowFocus: false

**app/layout.tsx:**
1. Added import for QueryProvider
2. Wrapped app with QueryProvider (outermost provider)

**hooks/useMapSearch.ts:** (NEW)
1. Created useMapSearch hook with URL-first state management
2. Exports MapSearchFilters and Business interfaces
3. Reads filters from URL via useSearchParams
4. Provides setFilters function that updates URL params
5. Uses React Query for data fetching with filters in queryKey
6. Query enabled only when userLocation or bounds params present

### Key Implementation Details

- **URL as source of truth:** All filter state lives in URL search params
- **React Query integration:** `queryKey: ['businesses', filters, lat, lng]` ensures auto-refetch on filter changes
- **Bounds vs radius:** Bounds params override radius filtering for map viewport queries
- **Provider nesting:** QueryProvider wraps all other providers for global access

## Verification Results

### Automated Checks
- [x] API accepts ne_lat, ne_lng, sw_lat, sw_lng params: Line 111, 178
- [x] QueryClientProvider exists in components/query-provider.tsx
- [x] useMapSearch hook exports correctly from hooks/useMapSearch.ts
- [x] TypeScript compiles without errors (`npx tsc --noEmit`)
- [x] Build succeeds (`npm run build`)

### Success Criteria Met

- [x] API accepts ne_lat, ne_lng, sw_lat, sw_lng params and filters correctly
- [x] Existing radius-based filtering continues to work
- [x] QueryClientProvider wraps the application
- [x] useMapSearch hook exists and exports correct interface
- [x] TypeScript compiles without errors
- [x] Build succeeds

## Files Created/Modified

| File | Type | Changes |
|------|------|---------|
| app/api/businesses/route.ts | Modified | Added bounds params parsing and filtering |
| components/query-provider.tsx | Created | QueryClientProvider wrapper component |
| app/layout.tsx | Modified | Added QueryProvider wrapping |
| hooks/useMapSearch.ts | Created | Central hook for search-map sync |

## Dependencies

Ready for Plan 03-02 which will:
- Create ViewToggle component
- Refactor search page to use useMapSearch hook
- Implement split view layout

---
*Plan 03-01 completed: 2026-01-19*
