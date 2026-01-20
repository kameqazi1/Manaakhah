# Phase 3: Search-to-Map Sync - Research

**Researched:** 2026-01-19
**Domain:** Map-search synchronization, URL state management, React Query integration
**Confidence:** HIGH

## Summary

This phase implements one-way synchronization where search results update the map view. The existing codebase already has partial fitBounds implementation in MapLibreMap.tsx (Phase 2 added this), but the search page lacks shared state between its list view and map view. The core challenge is establishing a single source of truth that both components can consume.

The standard approach for this pattern is URL-first state management with React Query for data fetching. URL params become the source of truth, React Query handles caching and refetching when params change, and the map/list components simply consume the query results. This is well-established in the ecosystem and matches the prior decisions in ROADMAP.md.

**Primary recommendation:** Create a `useMapSearch` hook that reads filters from URL params (via `useSearchParams`), fetches data via React Query with those params in the queryKey, and provides shared state including businesses array and fitBounds trigger.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | ^5.90.16 | Data fetching and caching | Already installed, industry standard for server state |
| next/navigation | (Next.js 16) | useSearchParams for URL state | Built-in, recommended by Next.js for App Router |
| react-map-gl | ^8.1.0 | Map ref and fitBounds | Already installed, native method access via ref |
| maplibre-gl | ^5.16.0 | Underlying map engine | Already installed from Phase 1 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lodash.debounce | ^4.0.8 | Debounce URL updates | When map pan/zoom triggers URL changes (Phase 4) |
| nuqs | ^2.x | Type-safe URL state | Consider if useSearchParams becomes unwieldy |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| useSearchParams | nuqs | nuqs adds type safety and convenience but adds dependency; useSearchParams is sufficient for this scope |
| React Query | SWR | Both work; project already has React Query installed |
| URL state | Zustand | Zustand loses URL shareability; URL-first is better for maps |

**Installation:**
```bash
# Already installed - no new packages needed
# Optional for Phase 4:
npm install lodash.debounce
```

## Architecture Patterns

### Recommended Project Structure
```
hooks/
  useMapSearch.ts           # Central hook for search-map sync
  useBusinesses.ts          # React Query wrapper (optional extraction)
components/
  search/
    SearchFilters.tsx       # Refactored to use URL params
    ViewToggle.tsx          # List/Map/Split toggle
  map/
    MapLibreMap.tsx         # Extended with fitBounds callback
app/
  search/
    page.tsx                # Orchestrates components with useMapSearch
```

### Pattern 1: URL as Single Source of Truth
**What:** All filter state lives in URL search params, not React state
**When to use:** Always for shareable, bookmarkable search experiences
**Example:**
```typescript
// Source: Next.js docs and project conventions
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export function useSearchFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read filters from URL
  const filters = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
    distance: searchParams.get('distance') || '25',
    sort: searchParams.get('sort') || 'distance',
    // Bounds for map view
    ne_lat: searchParams.get('ne_lat'),
    ne_lng: searchParams.get('ne_lng'),
    sw_lat: searchParams.get('sw_lat'),
    sw_lng: searchParams.get('sw_lng'),
  };

  // Update URL (triggers re-render via useSearchParams)
  const setFilters = useCallback((newFilters: Partial<typeof filters>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        value.length > 0 ? params.set(key, value.join(',')) : params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  return { filters, setFilters };
}
```

### Pattern 2: React Query with URL Params in QueryKey
**What:** Include all filter params in queryKey so React Query auto-refetches on changes
**When to use:** Always when URL params drive data fetching
**Example:**
```typescript
// Source: TanStack Query best practices
import { useQuery } from '@tanstack/react-query';
import { useSearchFilters } from './useSearchFilters';

export function useBusinessSearch() {
  const { filters } = useSearchFilters();

  return useQuery({
    // Include all filters in key - React Query refetches when any change
    queryKey: ['businesses', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.category) params.set('category', filters.category);
      if (filters.tags.length) params.set('tags', filters.tags.join(','));
      if (filters.ne_lat && filters.sw_lat) {
        params.set('ne_lat', filters.ne_lat);
        params.set('ne_lng', filters.ne_lng!);
        params.set('sw_lat', filters.sw_lat);
        params.set('sw_lng', filters.sw_lng!);
      } else {
        params.set('radius', filters.distance);
        // lat/lng from user location...
      }
      params.set('status', 'PUBLISHED');

      const res = await fetch(`/api/businesses?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: 30000, // 30 seconds
  });
}
```

### Pattern 3: fitBounds After Data Fetch
**What:** Map automatically fits to show all search results when data changes
**When to use:** When search filters change and new results load
**Example:**
```typescript
// Source: react-map-gl docs, existing MapLibreMap.tsx implementation
import { useRef, useEffect } from 'react';
import Map from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';

interface Business {
  latitude: number;
  longitude: number;
  // ... other fields
}

function MapWithFitBounds({ businesses }: { businesses: Business[] }) {
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    if (!mapRef.current || businesses.length === 0) return;

    const lngs = businesses.map(b => b.longitude);
    const lats = businesses.map(b => b.latitude);

    mapRef.current.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)], // SW
        [Math.max(...lngs), Math.max(...lats)], // NE
      ],
      {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15,
        duration: 1000,
      }
    );
  }, [businesses]);

  return <Map ref={mapRef} /* ... */ />;
}
```

### Pattern 4: QueryClientProvider Setup
**What:** Wrap app with QueryClientProvider for React Query to work
**When to use:** Required before using any useQuery hooks
**Example:**
```typescript
// Source: TanStack Query docs
// components/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Create client in state to avoid recreating on each render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000, // 30 seconds default
            refetchOnWindowFocus: false, // Disable for map UX
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Anti-Patterns to Avoid
- **useState for filter state:** Loses URL shareability, breaks back button, not bookmarkable
- **Fetching in useEffect without React Query:** No caching, no deduplication, race conditions
- **Calling fitBounds on every render:** Only call when data actually changes (use effect with dependency)
- **Controlled map without purpose:** Use uncontrolled mode (initialViewState) unless you need to drive map externally
- **Aggressive auto-refetch on map move:** Causes jarring UX; use "Search this area" button (Phase 4)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL param serialization | Manual string building | useSearchParams + URLSearchParams | Edge cases with encoding, arrays |
| Data caching | Manual cache object | React Query | Handles staleness, deduplication, refetch logic |
| Map bounds calculation | Manual min/max loops | mapRef.fitBounds() | Native method handles edge cases |
| Debouncing | setTimeout chains | lodash.debounce or useMemo pattern | Cleanup, memory leaks handled |

**Key insight:** The browser, React Query, and MapLibre all have battle-tested implementations for these problems. Custom solutions introduce edge cases (encoding issues, stale closures, memory leaks) that aren't obvious until production.

## Common Pitfalls

### Pitfall 1: Missing Suspense Boundary
**What goes wrong:** Build fails with "Missing Suspense boundary with useSearchParams"
**Why it happens:** Next.js App Router requires Suspense around client components that use useSearchParams
**How to avoid:** Wrap component using useSearchParams in Suspense
**Warning signs:** Build error, not runtime error

### Pitfall 2: QueryClient Recreation on Re-renders
**What goes wrong:** Cache is wiped on every render, infinite loops possible
**Why it happens:** Creating new QueryClient inside component body
**How to avoid:** Use useState or useRef to create client once
**Warning signs:** Queries constantly refetching, no cache hits

### Pitfall 3: Stale Closure in Debounced Callbacks
**What goes wrong:** Debounced function captures old state values
**Why it happens:** JavaScript closure captures values at creation time
**How to avoid:** Use useMemo with proper dependencies, or pass values as arguments
**Warning signs:** URL updates with old values, intermittent bugs

### Pitfall 4: fitBounds Called Before Map Loads
**What goes wrong:** Error or no-op, map doesn't fit to bounds
**Why it happens:** mapRef.current is null during initial render
**How to avoid:** Guard with `if (!mapRef.current) return;` and use effect with data dependency
**Warning signs:** Map stays at initial position despite having results

### Pitfall 5: Bounds Query Returns No Results
**What goes wrong:** User zooms to area with no businesses, empty state
**Why it happens:** Bounding box query is more restrictive than radius query
**How to avoid:** Show helpful empty state with "expand search" option, fall back to nearest results
**Warning signs:** Frequent empty results when map is zoomed in

## Code Examples

Verified patterns from official sources and existing codebase:

### API Bounds Extension
```typescript
// Source: Prisma docs, adapted for existing API structure
// app/api/businesses/route.ts - extend existing GET handler

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Existing params
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius");

  // New bounds params (Phase 3)
  const ne_lat = searchParams.get("ne_lat");
  const ne_lng = searchParams.get("ne_lng");
  const sw_lat = searchParams.get("sw_lat");
  const sw_lng = searchParams.get("sw_lng");

  const where: any = { status: "PUBLISHED" };

  // ... existing filter logic ...

  // Bounds-based filtering (takes precedence over radius if provided)
  if (ne_lat && ne_lng && sw_lat && sw_lng) {
    where.latitude = {
      gte: parseFloat(sw_lat),
      lte: parseFloat(ne_lat),
    };
    where.longitude = {
      gte: parseFloat(sw_lng),
      lte: parseFloat(ne_lng),
    };
  }

  // ... rest of existing logic ...
}
```

### useMapSearch Hook
```typescript
// Source: Composite pattern from research
// hooks/useMapSearch.ts

'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

export interface MapSearchFilters {
  search: string;
  category: string;
  tags: string[];
  distance: string;
  sort: string;
  priceRange: string;
  minRating: string;
  lat: string | null;
  lng: string | null;
  // Bounds override lat/lng/distance when present
  ne_lat: string | null;
  ne_lng: string | null;
  sw_lat: string | null;
  sw_lng: string | null;
}

export interface Business {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  // ... other fields
}

export function useMapSearch(userLocation: { lat: number; lng: number } | null) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse filters from URL
  const filters: MapSearchFilters = useMemo(() => ({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
    distance: searchParams.get('distance') || '25',
    sort: searchParams.get('sort') || 'distance',
    priceRange: searchParams.get('priceRange') || '',
    minRating: searchParams.get('minRating') || '',
    lat: searchParams.get('lat'),
    lng: searchParams.get('lng'),
    ne_lat: searchParams.get('ne_lat'),
    ne_lng: searchParams.get('ne_lng'),
    sw_lat: searchParams.get('sw_lat'),
    sw_lng: searchParams.get('sw_lng'),
  }), [searchParams]);

  // Update filters (merges with existing)
  const setFilters = useCallback((updates: Partial<MapSearchFilters>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        value.length > 0 ? params.set(key, value.join(',')) : params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // Fetch businesses with React Query
  const { data: businesses = [], isLoading, error } = useQuery<Business[]>({
    queryKey: ['businesses', filters, userLocation?.lat, userLocation?.lng],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('status', 'PUBLISHED');

      if (filters.search) params.set('search', filters.search);
      if (filters.category) params.set('category', filters.category);
      if (filters.tags.length) params.set('tags', filters.tags.join(','));
      if (filters.priceRange) params.set('priceRange', filters.priceRange);
      if (filters.minRating) params.set('minRating', filters.minRating);

      // Use bounds if available, otherwise use radius
      if (filters.ne_lat && filters.sw_lat) {
        params.set('ne_lat', filters.ne_lat);
        params.set('ne_lng', filters.ne_lng!);
        params.set('sw_lat', filters.sw_lat);
        params.set('sw_lng', filters.sw_lng!);
      } else if (userLocation) {
        params.set('lat', String(userLocation.lat));
        params.set('lng', String(userLocation.lng));
        params.set('radius', filters.distance);
      }

      const res = await fetch(`/api/businesses?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch businesses');
      return res.json();
    },
    enabled: !!(userLocation || (filters.ne_lat && filters.sw_lat)),
    staleTime: 30000,
  });

  return {
    filters,
    setFilters,
    businesses,
    isLoading,
    error,
  };
}
```

### View Toggle Component
```typescript
// Source: Project conventions (shadcn/ui style)
// components/search/ViewToggle.tsx

'use client';

import { cn } from '@/lib/utils';

type ViewMode = 'list' | 'map' | 'split';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const modes: { key: ViewMode; label: string }[] = [
    { key: 'list', label: 'List' },
    { key: 'map', label: 'Map' },
    { key: 'split', label: 'Split' },
  ];

  return (
    <div className="flex border rounded-lg overflow-hidden">
      {modes.map((mode) => (
        <button
          key={mode.key}
          onClick={() => onChange(mode.key)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium transition-colors',
            value === mode.key
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useState for filters | URL params as source of truth | 2023+ | Enables sharing, back button, bookmarks |
| fetch in useEffect | React Query useQuery | 2022+ | Caching, deduplication, loading/error states |
| Controlled map viewState | Uncontrolled with ref for imperative calls | react-map-gl v7 | Simpler code, fewer re-renders |
| onViewportChange callback | onMove callback | react-map-gl v7 | Cleaner API |

**Deprecated/outdated:**
- `onViewportChange` prop: Removed in react-map-gl v7, use `onMove` instead
- `viewport-mercator-project`: No longer a dependency, use native map methods
- Redux for URL state: Overkill, URL params are simpler and more appropriate

## Open Questions

Things that couldn't be fully resolved:

1. **Split view layout details**
   - What we know: Need list, map, and split view modes
   - What's unclear: Exact split ratio (50/50? 40/60?), mobile behavior (stack? toggle?)
   - Recommendation: Start with 50/50 on desktop, stack on mobile (map below list)

2. **React Query provider placement**
   - What we know: Need QueryClientProvider wrapping useQuery calls
   - What's unclear: Whether to add to root layout or search page only
   - Recommendation: Add to root layout for future reusability, but could scope to search route group

3. **User location fallback**
   - What we know: Current code uses geolocation with DEFAULT_LOCATION fallback
   - What's unclear: Should bounds query work without any location? IP-based fallback?
   - Recommendation: Keep existing fallback behavior; bounds queries don't need user location

## Sources

### Primary (HIGH confidence)
- [react-map-gl State Management](https://visgl.github.io/react-map-gl/docs/get-started/state-management) - Controlled vs uncontrolled, onMove, refs
- [Next.js useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params) - URL state in App Router
- [TanStack Query Docs](https://tanstack.com/query/latest) - queryKey best practices
- Existing codebase: `MapLibreMap.tsx` already has fitBounds implementation
- Existing codebase: `app/api/businesses/route.ts` already has radius-based filtering

### Secondary (MEDIUM confidence)
- [nuqs documentation](https://nuqs.dev/) - Type-safe URL state alternative
- [Prisma with coordinates](https://alizahid.dev/blog/geo-queries-with-prisma) - Bounds queries without PostGIS
- [LogRocket useSearchParams guide](https://blog.logrocket.com/url-state-usesearchparams/) - URL state patterns

### Tertiary (LOW confidence)
- Various blog posts on debouncing patterns (verified against lodash docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and documented
- Architecture: HIGH - Patterns verified against official docs and existing code
- Pitfalls: MEDIUM - Based on common issues in research, some project-specific

**Research date:** 2026-01-19
**Valid until:** 30 days (stable patterns, no fast-moving APIs)
