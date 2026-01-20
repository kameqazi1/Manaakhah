# Phase 4: Map-to-Search Sync - Research

**Researched:** 2026-01-19
**Domain:** Map interaction events, URL state management, React debouncing patterns
**Confidence:** HIGH

## Summary

This phase implements bidirectional map-search sync by adding a "Search this area" button that appears when users pan/zoom the map. The user explicitly triggers a new search based on the current map viewport bounds.

The existing codebase already has strong foundations: `useMapSearch` hook manages URL-first state with bounds params (`ne_lat`, `ne_lng`, `sw_lat`, `sw_lng`), the API supports bounds-based queries, and react-map-gl/maplibre provides `onMoveEnd` events for detecting map movement completion.

Key implementation needs: (1) detect map movement via `onMoveEnd`, (2) track "stale" state when map has moved but results haven't refreshed, (3) show a button that triggers `setFilters` with current bounds, (4) apply visual dimming to indicate stale results, (5) optionally debounce rapid movements (300ms per requirements).

**Primary recommendation:** Extend `useMapSearch` to expose a `searchBounds(bounds)` method and add `isStale` state. Create a `SearchThisAreaButton` component positioned absolutely within the map container that calls `searchBounds` on click.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-map-gl | 8.1.0 | Already installed | Provides `onMoveEnd` event, `MapRef` with `getBounds()` |
| maplibre-gl | 5.16.0 | Already installed | Underlying map engine with `LngLatBounds` API |
| @tanstack/react-query | 5.90.16 | Already installed | Handles data fetching, automatic refetch when `queryKey` changes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| use-debounce | 10.0.4 | Debouncing | Recommended if 300ms debounce needed for movement detection |
| lucide-react | 0.562.0 | Already installed | `Loader2` icon for button spinner state |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| use-debounce npm | Custom hook | Custom is fine for simple debounce, but use-debounce has better edge case handling |
| nuqs | Native useSearchParams | nuqs adds complexity; current pattern works well |
| Auto-refresh on move | Button trigger | Button preserves bandwidth, matches user decision from CONTEXT.md |

**Installation (only if debounce needed):**
```bash
npm install use-debounce
```

Or use a simple custom debounce (codebase has none currently).

## Architecture Patterns

### Recommended Component Structure
```
hooks/
└── useMapSearch.ts           # EXTEND: add searchBounds(), isStale
components/
└── map/
    ├── MapLibreMap.tsx       # EXTEND: add onMoveEnd, SearchThisAreaButton
    └── SearchThisAreaButton.tsx  # NEW: floating button component
```

### Pattern 1: Stale State Tracking

**What:** Track when map bounds have moved but results haven't been refreshed.

**When to use:** Anytime the user pans/zooms the map.

**Example:**
```typescript
// Source: Custom pattern based on react-map-gl docs
// https://visgl.github.io/react-map-gl/docs/get-started/state-management

interface MapSearchState {
  // Existing filters...
  currentBounds: MapBounds | null;  // Bounds of last successful search
}

// In component:
const [viewportBounds, setViewportBounds] = useState<MapBounds | null>(null);
const isStale = viewportBounds && currentBounds &&
  !boundsEqual(viewportBounds, currentBounds);
```

### Pattern 2: onMoveEnd Event Handler

**What:** Detect when user finishes panning/zooming to capture final bounds.

**When to use:** On the Map component to track viewport changes.

**Example:**
```typescript
// Source: react-map-gl API reference
// https://visgl.github.io/react-map-gl/docs/api-reference/mapbox/map

import Map from 'react-map-gl/maplibre';
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/maplibre';

const mapRef = useRef<MapRef>(null);

const handleMoveEnd = useCallback((evt: ViewStateChangeEvent) => {
  const map = mapRef.current;
  if (!map) return;

  const bounds = map.getBounds();
  if (!bounds) return;

  setViewportBounds({
    ne_lat: bounds.getNorth().toString(),
    ne_lng: bounds.getEast().toString(),
    sw_lat: bounds.getSouth().toString(),
    sw_lng: bounds.getWest().toString(),
  });
}, []);

<Map
  ref={mapRef}
  onMoveEnd={handleMoveEnd}
  // ... other props
/>
```

### Pattern 3: Bounds from MapRef

**What:** Extract geographic bounds using MapLibre's `getBounds()` method.

**When to use:** After map movement to get current viewport coordinates.

**Example:**
```typescript
// Source: MapLibre GL JS documentation
// https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/
// https://maplibre.org/maplibre-gl-js/docs/API/classes/LngLatBounds/

const bounds = mapRef.current.getBounds();

// LngLatBounds provides these methods:
bounds.getNorth()  // number - north latitude
bounds.getSouth()  // number - south latitude
bounds.getEast()   // number - east longitude
bounds.getWest()   // number - west longitude

// Also available:
bounds.getNorthEast()  // LngLat object
bounds.getSouthWest()  // LngLat object
```

### Pattern 4: Absolute Positioned Button

**What:** Button floats on map, positioned at bottom center.

**When to use:** For "Search this area" UI pattern.

**Example:**
```typescript
// Button positioned absolutely within map container
<div className="relative w-full h-[600px]">
  <Map ...>
    {/* Map content */}
  </Map>

  {isStale && (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
      <Button onClick={handleSearchThisArea} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Searching...
          </>
        ) : (
          'Search this area'
        )}
      </Button>
    </div>
  )}
</div>
```

### Anti-Patterns to Avoid

- **Auto-refresh on every move:** User explicitly decided against this. Triggers excess API calls, confuses users.
- **Storing bounds in component state only:** Bounds should go to URL for shareable links.
- **Removing results during stale state:** Keep results visible, just dim them.
- **Ignoring the `enabled` flag in React Query:** Could cause queries with incomplete data.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debouncing | setTimeout wrapper | `use-debounce` or memoized callback | Edge cases around cleanup, component unmounting |
| Map bounds extraction | Manual coordinate math | `mapRef.getBounds()` | Already handles bearing/pitch edge cases |
| URL state sync | Custom history manipulation | Existing `setFilters` pattern | Already working, uses Next.js router.replace |
| Loading spinner | Custom CSS spinner | `Loader2` from lucide-react | Codebase already uses this pattern consistently |

**Key insight:** The existing `useMapSearch` hook already handles URL sync and React Query integration. Extend it rather than creating parallel state management.

## Common Pitfalls

### Pitfall 1: Infinite Loop Between Map and Search

**What goes wrong:** Map movement updates URL, URL change triggers search, search results update map position, which triggers movement...

**Why it happens:** Bidirectional sync without distinguishing user-initiated vs. programmatic moves.

**How to avoid:**
- Track whether move is user-initiated vs. programmatic (e.g., fitBounds)
- Use `isStale` flag that only sets on user interaction
- The `onMoveEnd` fires for both, so need to distinguish

**Warning signs:** Continuous API calls, map jumping around.

### Pitfall 2: Stale State Not Clearing After Search

**What goes wrong:** "Search this area" button remains visible after user clicks it.

**Why it happens:** Forgetting to clear `isStale` when search completes.

**How to avoid:**
- Clear stale state when `setFilters` is called with new bounds
- Use React Query's `isFetching` to show loading state
- Update `currentBounds` to match `viewportBounds` after successful search

**Warning signs:** Button stays visible indefinitely, visual confusion.

### Pitfall 3: URL Gets Cluttered With Precision

**What goes wrong:** URLs become very long with full precision lat/lng values.

**Why it happens:** Using `.toString()` on floats gives many decimal places.

**How to avoid:**
- Round to 6 decimal places (about 0.1m precision)
- `lat.toFixed(6)` is sufficient for any practical use

**Warning signs:** URLs with 15+ decimal places, potential floating point issues.

### Pitfall 4: Map Bounds During Animation

**What goes wrong:** Getting bounds mid-animation gives intermediate values.

**Why it happens:** Using `onMove` instead of `onMoveEnd`, or calling getBounds during flyTo.

**How to avoid:**
- Only capture bounds in `onMoveEnd` callback
- For non-axis-aligned views (bearing/pitch), bounds encompass visible region

**Warning signs:** Bounds don't match what user sees, searches return unexpected results.

### Pitfall 5: React Query Caching Issues

**What goes wrong:** Old results persist when bounds change slightly.

**Why it happens:** React Query's queryKey doesn't include enough precision.

**How to avoid:**
- Include all bound coordinates in queryKey
- Existing hook already does this correctly with `[filters, userLocation]`
- `staleTime: 30000` is reasonable

**Warning signs:** Results don't change when map moves, cache hits when expecting misses.

## Code Examples

Verified patterns from official sources:

### Getting Bounds on Move End
```typescript
// Source: react-map-gl state management guide
// https://visgl.github.io/react-map-gl/docs/get-started/state-management

import { useCallback, useRef } from 'react';
import Map from 'react-map-gl/maplibre';
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/maplibre';

function MapWithBoundsTracking() {
  const mapRef = useRef<MapRef>(null);

  const handleMoveEnd = useCallback((evt: ViewStateChangeEvent) => {
    const bounds = mapRef.current?.getBounds();
    if (bounds) {
      console.log('New bounds:', {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    }
  }, []);

  return (
    <Map
      ref={mapRef}
      onMoveEnd={handleMoveEnd}
      initialViewState={{ latitude: 37.5, longitude: -122, zoom: 10 }}
      mapStyle="..."
    />
  );
}
```

### Debounced Callback Pattern
```typescript
// Source: use-debounce documentation
// https://github.com/xnimorz/use-debounce

import { useDebouncedCallback } from 'use-debounce';

const debouncedSetBounds = useDebouncedCallback(
  (bounds: MapBounds) => {
    setViewportBounds(bounds);
  },
  300 // 300ms per requirements
);

// In onMoveEnd handler:
const handleMoveEnd = useCallback((evt: ViewStateChangeEvent) => {
  const bounds = mapRef.current?.getBounds();
  if (bounds) {
    debouncedSetBounds({
      ne_lat: bounds.getNorth().toFixed(6),
      ne_lng: bounds.getEast().toFixed(6),
      sw_lat: bounds.getSouth().toFixed(6),
      sw_lng: bounds.getWest().toFixed(6),
    });
  }
}, [debouncedSetBounds]);
```

### Simple Custom Debounce (if not adding dependency)
```typescript
// Alternative if not wanting to add use-debounce package
import { useCallback, useRef } from 'react';

function useSimpleDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;
}
```

### Stale Results Visual Indicator
```typescript
// CSS for dimming stale results
// Uses Tailwind transition for smooth fade

<div className={cn(
  "transition-opacity duration-300",
  isStale ? "opacity-50" : "opacity-100"
)}>
  {/* Business cards/markers */}
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Auto-refresh on pan | "Search this area" button | UX best practice | Reduces API calls, gives user control |
| Store state in component | URL-first state | Next.js App Router era | Shareable links, SSR-friendly |
| Custom history API | Next.js router.replace | Next.js 13+ | Built-in support, less boilerplate |
| Full page re-render | React Query cache | 2022+ | Instant UI updates, smart caching |

**Deprecated/outdated:**
- `react-map-gl` < 7.0 used different import paths
- Manual viewport state management (now handled by initialViewState)

## Open Questions

Things that couldn't be fully resolved:

1. **Debounce placement: onMoveEnd vs. state update?**
   - What we know: `onMoveEnd` already fires after movement stops
   - What's unclear: Whether 300ms debounce is needed at all, or just for rapid scroll-wheel zooms
   - Recommendation: Start without debounce, add if testing shows rapid-fire events

2. **Distinguish user move from programmatic fitBounds?**
   - What we know: Both trigger `onMoveEnd`
   - What's unclear: Best pattern to distinguish them
   - Recommendation: Use a flag that gets set before fitBounds and cleared after

3. **Clear bounds when switching back to radius search?**
   - What we know: Currently bounds override radius when present
   - What's unclear: Should distance slider clear bounds?
   - Recommendation: Changing distance should clear bounds (makes UX sense)

## Sources

### Primary (HIGH confidence)
- [react-map-gl State Management](https://visgl.github.io/react-map-gl/docs/get-started/state-management) - Event handling, controlled vs uncontrolled
- [react-map-gl Map Component](https://visgl.github.io/react-map-gl/docs/api-reference/mapbox/map) - onMoveEnd signature
- [MapLibre GL JS Map.getBounds()](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/) - Bounds extraction
- [MapLibre LngLatBounds](https://maplibre.org/maplibre-gl-js/docs/API/classes/LngLatBounds/) - getNorth/South/East/West methods
- Existing codebase: `hooks/useMapSearch.ts`, `components/map/MapLibreMap.tsx`

### Secondary (MEDIUM confidence)
- [Next.js useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params) - URL state patterns
- [use-debounce npm](https://github.com/xnimorz/use-debounce) - Debounce hook API
- [Map UI Patterns - Search This Area](https://mapuipatterns.com/search-this-area/) - UX best practices

### Tertiary (LOW confidence)
- WebSearch results on debouncing patterns - verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in codebase, APIs verified
- Architecture: HIGH - Patterns match existing codebase style, official docs
- Pitfalls: MEDIUM - Based on common patterns, some from experience

**Research date:** 2026-01-19
**Valid until:** 60 days (stable libraries, well-established patterns)
