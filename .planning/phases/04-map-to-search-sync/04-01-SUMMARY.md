---
phase: 04-map-to-search-sync
plan: 01
subsystem: ui
tags: [maplibre, react-query, url-state, geolocation]

# Dependency graph
requires:
  - phase: 03-search-to-map-sync
    provides: useMapSearch hook, MapLibreMap component, search page with view modes
provides:
  - "Search this area" button for map viewport search
  - Stale state tracking for bidirectional sync
  - Visual dimming feedback for stale results
  - URL-based bounds persistence for shareable links
affects: [05-mobile-optimization]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isProgrammaticMove ref for infinite loop prevention"
    - "onMoveEnd handler for user-initiated map movement"
    - "Opacity transition for stale state visual feedback"

key-files:
  created:
    - components/map/SearchThisAreaButton.tsx
  modified:
    - hooks/useMapSearch.ts
    - components/map/MapLibreMap.tsx
    - app/search/page.tsx

key-decisions:
  - "Button only appears after user-initiated pan/zoom, not programmatic fitBounds"
  - "Clear distance filter when searching by bounds (UX: bounds replaces radius mode)"
  - "Clear bounds when distance filter changes (return to radius mode)"

patterns-established:
  - "isProgrammaticMove ref pattern: Set before fitBounds, clear in onMoveEnd"
  - "MapBounds interface: ne_lat, ne_lng, sw_lat, sw_lng as strings (6 decimal places)"

# Metrics
duration: 4min
completed: 2026-01-20
---

# Phase 4 Plan 1: Map-to-Search Sync Summary

**Bidirectional map-search sync with "Search this area" button and stale results visual feedback**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-20T06:23:14Z
- **Completed:** 2026-01-20T06:27:32Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Extended useMapSearch hook with isStale, setIsStale, searchBounds, and currentBounds
- Created SearchThisAreaButton component with loading state
- Added onMoveEnd handler with isProgrammaticMove ref for loop prevention
- Implemented visual dimming (opacity 50%) for stale results
- URL updates with bounds for shareable links

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend useMapSearch hook with stale tracking** - `2a17eb4` (feat)
2. **Task 2: Create SearchThisAreaButton and wire to MapLibreMap** - `bb161cd` (feat)
3. **Task 3: Wire search page with stale state and visual dimming** - `db01288` (feat)

## Files Created/Modified

- `components/map/SearchThisAreaButton.tsx` - Floating button component with loading spinner
- `hooks/useMapSearch.ts` - Added isStale state, searchBounds method, MapBounds interface
- `components/map/MapLibreMap.tsx` - Added onMoveEnd handler, isProgrammaticMove ref, renders button
- `app/search/page.tsx` - Wires stale state, passes map props, adds opacity transitions

## Decisions Made

1. **Button trigger**: Only shows after user pan/zoom, not after programmatic fitBounds
2. **Mode switching**: Changing distance clears bounds (returns to radius mode), searching by bounds clears distance
3. **Visual feedback**: 50% opacity transition (300ms) indicates stale results

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Bidirectional map-search sync complete
- Ready for Phase 5 (Mobile Optimization)
- No blockers

---
*Phase: 04-map-to-search-sync*
*Completed: 2026-01-20*
