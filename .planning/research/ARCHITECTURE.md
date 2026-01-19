# Architecture Patterns: MapLibre Map Migration

**Domain:** Map/Search bidirectional sync for business directory
**Researched:** 2026-01-19
**Confidence:** MEDIUM (based on codebase analysis and established React patterns; WebSearch unavailable for latest MapLibre docs)

## Executive Summary

This research addresses how MapLibre should integrate with existing Next.js search and business listing components, with focus on state management for bidirectional sync between map interactions and search results.

**Key finding:** The current architecture has map and search as completely separate silos. Successful bidirectional sync requires introducing a shared state layer with URL as the source of truth.

---

## Current Architecture Analysis

### Existing Component Structure

```
app/page.tsx (Homepage)
  |-- BusinessMap (filter + map wrapper)
       |-- LeafletMap (actual map rendering)
            - Props: businesses[], userLat, userLng, radius
            - State: selectedBusiness, local markers
            - Data fetch: Own API call in BusinessMap

app/search/page.tsx (Search Page)
  |-- SearchContent
       - State: filters, businesses[], userLocation
       - Data fetch: Own API call to /api/businesses
       - No map integration
```

### Current Data Flow Problems

| Issue | Current Behavior | Impact |
|-------|-----------------|--------|
| Duplicate fetching | BusinessMap and SearchPage both call `/api/businesses` independently | Wasted requests, data inconsistency |
| No map on search | Search page is list-only | Users cannot see results spatially |
| No search on map | Homepage map has its own filters, not URL-synced | Cannot share/bookmark map views |
| State silos | Each component manages own state | No bidirectional communication possible |
| URL not authoritative | Filters in React state, not URL params | Cannot deep-link to specific views |

### Current API Structure

The `/api/businesses` endpoint supports:
- `lat`, `lng`, `radius` - location-based filtering
- `category`, `tags`, `search` - content filtering
- `priceRange`, `minRating` - attribute filtering
- Returns: businesses with `distance` calculated

**Good news:** API already supports bounds-based queries (via lat/lng/radius). We need to extend for viewport bounds (`ne_lat`, `ne_lng`, `sw_lat`, `sw_lng`).

---

## Recommended Architecture

### Component Boundaries

```
                    +------------------+
                    |  URL Search Params |  <-- Source of Truth
                    +------------------+
                            |
                    +------------------+
                    |  useMapSearch()  |  <-- Shared Hook
                    |  - parses URL    |
                    |  - provides API  |
                    |  - manages fetch |
                    +------------------+
                       /           \
              +--------+           +--------+
              | MapView |           | ListView |
              | (MapLibre)|         | (Cards)  |
              +--------+           +--------+
                   \                   /
                    \                 /
                 +----------------------+
                 | SearchFilters/Controls |
                 +----------------------+
```

### State Management Approach: URL-First

**Why URL params over React state or Context:**

1. **Shareable** - Users can copy URL to share exact search
2. **Bookmarkable** - Browser back/forward works
3. **SSR-compatible** - Server can render with filters from URL
4. **No state sync bugs** - Single source of truth
5. **Next.js optimized** - `useSearchParams` is the idiomatic approach

**URL parameter schema:**

```
/search?
  lat=37.5485&
  lng=-121.9886&
  zoom=13&
  bounds=37.6,-121.8,37.5,-122.0&     // ne_lat,ne_lng,sw_lat,sw_lng
  category=RESTAURANT&
  tags=HALAL_VERIFIED,MUSLIM_OWNED&
  search=kebab&
  sort=distance&
  view=map                             // "map" | "list" | "split"
```

### Component Responsibilities

#### 1. SearchPage Layout (`app/search/page.tsx`)

**Responsibility:** Layout orchestration, view mode switching

```typescript
// Conceptual structure
function SearchPage() {
  const viewMode = useSearchParam('view') || 'split';

  return (
    <MapSearchProvider>
      <SearchHeader />
      <SearchFilters />
      {viewMode === 'map' && <MapView />}
      {viewMode === 'list' && <ListView />}
      {viewMode === 'split' && (
        <SplitView>
          <MapView />
          <ListView />
        </SplitView>
      )}
    </MapSearchProvider>
  );
}
```

#### 2. useMapSearch Hook (`hooks/useMapSearch.ts`)

**Responsibility:** Central state management, URL sync, data fetching

```typescript
interface MapSearchState {
  // From URL
  center: { lat: number; lng: number };
  zoom: number;
  bounds: { ne: LatLng; sw: LatLng } | null;
  filters: SearchFilters;
  viewMode: 'map' | 'list' | 'split';

  // Derived/Fetched
  businesses: Business[];
  isLoading: boolean;
  error: Error | null;

  // Actions (update URL, which triggers re-fetch)
  setCenter: (lat: number, lng: number) => void;
  setZoom: (zoom: number) => void;
  setBounds: (bounds: Bounds) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setViewMode: (mode: ViewMode) => void;
}
```

**Key behaviors:**
- Reads initial state from URL on mount
- Debounces map drag/zoom to avoid excessive URL updates (300ms)
- Updates URL on filter/map changes
- Fetches data when URL changes
- Uses React Query for caching/deduplication

#### 3. MapView Component (`components/map/MapView.tsx`)

**Responsibility:** Map rendering, map event handling

```typescript
interface MapViewProps {
  // From useMapSearch context
  businesses: Business[];
  center: LatLng;
  zoom: number;
  selectedBusinessId: string | null;

  // Callbacks to useMapSearch
  onBoundsChange: (bounds: Bounds) => void;
  onCenterChange: (center: LatLng) => void;
  onZoomChange: (zoom: number) => void;
  onBusinessSelect: (id: string) => void;
}
```

**Does NOT:**
- Fetch its own data
- Manage filter state
- Own the selected business state (that's in URL or shared context)

#### 4. ListView Component (`components/search/ListView.tsx`)

**Responsibility:** Card list rendering, list interactions

```typescript
interface ListViewProps {
  businesses: Business[];
  selectedBusinessId: string | null;
  onBusinessSelect: (id: string) => void;
  onBusinessHover: (id: string | null) => void;
}
```

**Hover/select sync with map:**
- Hovering a card highlights marker on map
- Selecting a card centers map on business
- Both managed through shared context

#### 5. SearchFilters Component (`components/search/SearchFilters.tsx`)

**Responsibility:** Filter UI, filter changes

```typescript
interface SearchFiltersProps {
  filters: SearchFilters;
  onChange: (filters: Partial<SearchFilters>) => void;
}
```

**Already exists** in current search page, needs refactoring to:
- Accept filters as props (not own state)
- Call onChange instead of setting local state

---

## Data Flow Patterns

### Pattern 1: User Drags Map

```
1. User drags map in MapView
2. MapLibre fires 'moveend' event
3. MapView calls onBoundsChange(newBounds)
4. useMapSearch debounces (300ms)
5. useMapSearch updates URL: ?bounds=...
6. URL change triggers useEffect
7. useMapSearch fetches /api/businesses?bounds=...
8. New businesses flow to both MapView and ListView
```

### Pattern 2: User Changes Filter

```
1. User selects category in SearchFilters
2. SearchFilters calls onChange({ category: 'RESTAURANT' })
3. useMapSearch updates URL: ?category=RESTAURANT
4. URL change triggers useEffect
5. useMapSearch fetches with new filter
6. New businesses flow to both views
```

### Pattern 3: User Clicks List Item

```
1. User clicks business card in ListView
2. ListView calls onBusinessSelect(businessId)
3. useMapSearch updates selectedBusinessId (URL or context)
4. MapView receives selectedBusinessId prop
5. MapView zooms to business, opens popup
```

### Pattern 4: User Shares URL

```
1. User copies URL: /search?bounds=...&category=RESTAURANT
2. Friend opens URL
3. useMapSearch parses URL params
4. Initial fetch with those params
5. Map renders at correct bounds
6. List shows filtered results
7. Filter UI reflects current filters
```

---

## API Modifications Required

### Current API
```
GET /api/businesses?lat=37.5&lng=-121.9&radius=10&category=RESTAURANT
```

### Extended API for Bounds
```
GET /api/businesses?
  ne_lat=37.6&ne_lng=-121.8&sw_lat=37.4&sw_lng=-122.0&
  category=RESTAURANT&
  search=kebab
```

**Implementation:** Add bounds-based filtering alongside existing radius filtering:

```typescript
// In route.ts
if (searchParams.get('ne_lat')) {
  // Viewport-based query
  const ne_lat = parseFloat(searchParams.get('ne_lat')!);
  const ne_lng = parseFloat(searchParams.get('ne_lng')!);
  const sw_lat = parseFloat(searchParams.get('sw_lat')!);
  const sw_lng = parseFloat(searchParams.get('sw_lng')!);

  where.latitude = { gte: sw_lat, lte: ne_lat };
  where.longitude = { gte: sw_lng, lte: ne_lng };
} else if (lat && lng && radius) {
  // Existing radius-based query
}
```

---

## Suggested Build Order

Based on dependencies, the recommended implementation sequence:

### Phase 1: Foundation (No User-Facing Changes)

1. **API bounds support** - Add `ne_lat/ne_lng/sw_lat/sw_lng` params to `/api/businesses`
2. **useMapSearch hook** - Create hook with URL sync, React Query integration
3. **Types/interfaces** - Define shared types for MapSearch state

**Why first:** All visual components depend on this foundation.

### Phase 2: MapLibre Integration

4. **MapLibre component** - New `MapView.tsx` using MapLibre GL JS
5. **Business markers** - Port marker rendering from LeafletMap
6. **Map events** - Wire bounds/center/zoom change handlers

**Why second:** Can test MapView in isolation before wiring to search.

### Phase 3: Search Page Integration

7. **Refactor SearchPage** - Use useMapSearch context
8. **Refactor SearchFilters** - Props-based instead of local state
9. **Add MapView to search** - Split view with map + list
10. **List-map sync** - Hover highlighting, click to select

**Why third:** Requires both hook and MapView to be ready.

### Phase 4: Homepage Integration

11. **Refactor BusinessMap** - Use same MapView component
12. **Homepage map updates** - Sync with URL params if desired

**Why last:** Homepage is separate route, less critical for core search UX.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Prop Drilling Through Many Layers

**Problem:** Passing map state through 5+ component levels
**Instead:** Use React Context via `MapSearchProvider`

### Anti-Pattern 2: Multiple Sources of Truth

**Problem:** Filter state in both URL and React state
**Instead:** URL is the ONLY source; React state derives from URL

### Anti-Pattern 3: Immediate URL Updates on Every Map Frame

**Problem:** Map drag fires 60 events/second, each updating URL
**Instead:** Debounce with 300ms delay on `moveend` event

### Anti-Pattern 4: Separate Fetch Logic in Each Component

**Problem:** MapView and ListView both fetching
**Instead:** Single fetch in useMapSearch, data flows down as props

### Anti-Pattern 5: Global State for Page-Specific Concerns

**Problem:** Using Redux/Zustand for map state
**Instead:** URL params + Context scoped to search pages

---

## MapLibre-Specific Considerations

### React Integration Options

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| react-map-gl | Declarative, maintained by Visgl | Extra dependency | **Recommended** for React apps |
| Vanilla MapLibre in useRef | Full control, no wrapper overhead | More imperative code | Good for complex custom behavior |
| @vis.gl/react-maplibre | New official React wrapper | Newer, less battle-tested | Monitor for v1 stability |

**Recommendation:** Use `react-map-gl` with MapLibre as the map library. It's maintained, well-documented, and designed for this exact use case.

```typescript
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
```

### Controlled vs Uncontrolled Map

**Controlled (recommended for bidirectional sync):**
```typescript
<Map
  longitude={center.lng}
  latitude={center.lat}
  zoom={zoom}
  onMove={evt => handleMove(evt.viewState)}
/>
```

**Why controlled:** URL must be source of truth, so map position must be externally controlled.

### Performance Considerations

1. **Marker clustering** - Use Supercluster for 100+ markers
2. **Virtualization** - Don't render off-screen markers
3. **Debouncing** - 300ms debounce on bounds change before fetch
4. **React Query** - Caches API responses, avoids re-fetch on back navigation

---

## File Structure Recommendation

```
components/
  map/
    MapView.tsx              # MapLibre wrapper, event handlers
    MapMarker.tsx            # Single business marker
    MarkerCluster.tsx        # Cluster component
    MapPopup.tsx             # Business popup
    index.ts                 # Exports
  search/
    SearchFilters.tsx        # Filter controls (refactored)
    ListView.tsx             # Business card list
    BusinessCard.tsx         # Single card
    SearchHeader.tsx         # Search input + view toggle
    index.ts

hooks/
  useMapSearch.ts            # Central state management
  useDebounce.ts             # Debounce utility

lib/
  map/
    types.ts                 # LatLng, Bounds, etc.
    url-state.ts             # URL parse/serialize helpers

app/
  search/
    page.tsx                 # Search page (uses context)
    layout.tsx               # MapSearchProvider wrapper
```

---

## Confidence Assessment

| Aspect | Confidence | Reasoning |
|--------|------------|-----------|
| URL-as-source-of-truth pattern | HIGH | Established Next.js pattern, used in many production apps |
| useMapSearch hook structure | HIGH | Standard React custom hook pattern |
| react-map-gl recommendation | MEDIUM | Well-established but verify current version supports MapLibre 4.x |
| API bounds extension | HIGH | Straightforward Prisma query modification |
| Build order | HIGH | Clear dependencies between phases |
| Debounce timing (300ms) | MEDIUM | Common value, may need tuning based on UX testing |

---

## Open Questions for Implementation

1. **Offline support** - Should map tiles be cached for offline use? (PWA consideration)
2. **Initial viewport** - User location, or default Bay Area view?
3. **Empty state** - What to show when bounds contain no businesses?
4. **Mobile layout** - Stacked vs drawer map on small screens?
5. **Animation** - Should map animate to new bounds on filter change?

---

## Sources

- Codebase analysis: `/Users/saeed/Desktop/Manaakhah/components/map/LeafletMap.tsx`
- Codebase analysis: `/Users/saeed/Desktop/Manaakhah/app/search/page.tsx`
- Codebase analysis: `/Users/saeed/Desktop/Manaakhah/app/api/businesses/route.ts`
- Existing architecture: `/Users/saeed/Desktop/Manaakhah/.planning/codebase/ARCHITECTURE.md`
- React patterns: Training data on React state management patterns (MEDIUM confidence - verify against current docs)
- MapLibre React integration: Training data (MEDIUM confidence - verify react-map-gl compatibility with MapLibre 4.x)

---

*Architecture research: 2026-01-19*
