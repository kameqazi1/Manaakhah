# Roadmap: Manaakhah v1.1 Map Overhaul

## Overview

This milestone replaces the current Leaflet-based map with MapLibre GL JS to unlock WebGL-accelerated vector tile rendering, native clustering, and smoother mobile interactions. The migration proceeds in layers: foundation work establishes the new map library, followed by clustering for performance, then bidirectional search-map integration that unifies the currently siloed map and search experiences. Mobile optimization and cleanup complete the milestone. Each phase delivers testable functionality, with the core map working from Phase 1.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: MapLibre Foundation** - Replace Leaflet with MapLibre GL JS, add user location marker
- [x] **Phase 2: Clustering** - Native GeoJSON clustering for performance with many businesses
- [x] **Phase 3: Search-to-Map Sync** - Search results update map bounds via useMapSearch hook
- [x] **Phase 4: Map-to-Search Sync** - Map interactions update search results with "Search this area" button
- [ ] **Phase 5: Mobile Optimization** - Touch gestures, WebGL context recovery, touch targets
- [ ] **Phase 6: Cleanup** - Remove Leaflet packages, bundle optimization

## Phase Details

### Phase 1: MapLibre Foundation
**Goal**: Users see businesses on a WebGL-accelerated map with their current location indicated
**Depends on**: Nothing (first phase)
**Requirements**: MAP-01, MAP-05
**Plans**: 3 plans

**Key Files**:
- `components/map/MapLibreMap.tsx` (new, replaces LeafletMap.tsx)
- `components/map/UserLocationMarker.tsx` (new)
- `app/search/page.tsx` (add map view)
- CSS imports for maplibre-gl

**Success Criteria** (what must be TRUE):
1. Map renders with MapTiler vector tiles on search page and homepage
2. Business markers display at correct locations with category differentiation
3. Clicking a marker shows business details popup
4. User's current location displays as a distinct "You are here" marker
5. SSR works without hydration errors (dynamic import with ssr: false preserved)

Plans:
- [x] 01-01-PLAN.md — Install MapLibre, create MapLibreMap component with markers and popups
- [x] 01-02-PLAN.md — Add user location marker, geolocation, and distance display
- [x] 01-03-PLAN.md — Add map view to search page (gap closure)

---

### Phase 2: Clustering
**Goal**: Map performs smoothly with 50+ businesses by clustering nearby markers
**Depends on**: Phase 1
**Requirements**: MAP-02
**Plans**: 1 plan

**Key Files**:
- `components/map/MapLibreMap.tsx` (extend with clustering)
- `components/map/clusterLayers.ts` (new, layer style definitions)

**Success Criteria** (what must be TRUE):
1. Business markers cluster when zoomed out (radius ~50px)
2. Cluster markers display count of businesses within
3. Clicking a cluster zooms the map to reveal individual markers
4. Individual markers appear when sufficiently zoomed in (max zoom 14)

Plans:
- [x] 02-01-PLAN.md — Native MapLibre clustering implementation with Source/Layer architecture

---

### Phase 3: Search-to-Map Sync
**Goal**: Search filters and results automatically update the map view
**Depends on**: Phase 2
**Requirements**: MAP-03, MAP-06, API-01, ARCH-01
**Plans**: 2 plans

**Key Files**:
- `hooks/useMapSearch.ts` (new, central state management)
- `app/api/businesses/route.ts` (extend with bounds params)
- `components/search/ViewToggle.tsx` (new, view mode toggle)
- `app/search/page.tsx` (refactor to use hook, add view toggles)

**Success Criteria** (what must be TRUE):
1. Search results cause map to fit bounds to show all results
2. Changing filters updates markers on map immediately
3. List view, map view, and split view toggle works on search page
4. API accepts viewport bounds (ne_lat, ne_lng, sw_lat, sw_lng) parameters
5. useMapSearch hook provides shared state between map and list components

Plans:
- [x] 03-01-PLAN.md — API bounds extension and useMapSearch hook
- [x] 03-02-PLAN.md — Search page map integration and view toggles

---

### Phase 4: Map-to-Search Sync
**Goal**: Users can explore the map and search the visible area
**Depends on**: Phase 3
**Requirements**: MAP-04
**Plans**: 1 plan

**Key Files**:
- `hooks/useMapSearch.ts` (extend for bidirectional sync)
- `components/map/SearchThisAreaButton.tsx` (new)
- `components/map/MapLibreMap.tsx` (add onMoveEnd tracking)
- `app/search/page.tsx` (stale state visual feedback)

**Success Criteria** (what must be TRUE):
1. "Search this area" button appears after user pans/zooms the map
2. Clicking button fetches businesses within current map bounds
3. URL reflects current map position (shareable links work)
4. No infinite loops between map and search updates (300ms debounce)

Plans:
- [x] 04-01-PLAN.md — Bidirectional sync with Search this area button

---

### Phase 5: Mobile Optimization
**Goal**: Map interactions feel native on mobile devices
**Depends on**: Phase 4
**Requirements**: MAP-08
**Plans**: TBD

**Key Files**:
- `components/map/MapLibreMap.tsx` (gesture configuration)
- Touch target styling
- WebGL context recovery handling

**Success Criteria** (what must be TRUE):
1. Pinch-to-zoom works smoothly on mobile
2. Pan gestures feel responsive without scroll conflicts
3. Marker touch targets are at least 44x44px
4. WebGL context loss recovers gracefully (map reloads)

Plans:
- [ ] 05-01: Mobile gestures and WebGL recovery

---

### Phase 6: Cleanup
**Goal**: Leaflet removed, bundle optimized, migration complete
**Depends on**: Phase 5
**Requirements**: CLEAN-01
**Plans**: TBD

**Key Files**:
- `package.json` (remove dependencies)
- `components/map/LeafletMap.tsx` (delete)
- Any remaining Leaflet imports

**Success Criteria** (what must be TRUE):
1. Leaflet packages removed (leaflet, react-leaflet, leaflet.markercluster, react-leaflet-cluster)
2. mapbox-gl package removed (unused)
3. Associated @types packages removed
4. Bundle size verified (no duplicate map libraries)
5. All map functionality works without Leaflet code

Plans:
- [ ] 06-01: Leaflet removal and bundle verification

---

## Phase Ordering Rationale

1. **Foundation first (Phase 1)**: All subsequent work depends on MapLibre rendering correctly. SSR handling, tile provider setup, and basic map display must be validated before any sync work.

2. **Clustering before sync (Phase 2)**: Performance with many markers must be solved before adding dynamic data loading. Clustering is simpler to implement in isolation.

3. **One-way sync before bidirectional (Phases 3-4)**: Search-to-map sync (Phase 3) validates the useMapSearch hook architecture with simpler one-way data flow. Map-to-search (Phase 4) adds the tricky reverse direction with debouncing and loop prevention.

4. **Mobile after core (Phase 5)**: Mobile-specific issues (touch conflicts, WebGL context loss) need dedicated attention after core features work on desktop.

5. **Cleanup last (Phase 6)**: Removing Leaflet only happens after complete migration is tested. This prevents regressions if issues are found during earlier phases.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. MapLibre Foundation | 3/3 | Complete | 2026-01-19 |
| 2. Clustering | 1/1 | Complete | 2026-01-19 |
| 3. Search-to-Map Sync | 2/2 | Complete | 2026-01-19 |
| 4. Map-to-Search Sync | 1/1 | Complete | 2026-01-19 |
| 5. Mobile Optimization | 0/1 | Not started | - |
| 6. Cleanup | 0/1 | Not started | - |

---
*Roadmap created: 2026-01-19*
*Phase 1 planned: 2026-01-19*
*Gap closure plan added: 2026-01-19*
*Phase 2 planned: 2026-01-19*
*Phase 3 planned: 2026-01-20*
*Phase 3 complete: 2026-01-19*
*Phase 4 planned: 2026-01-19*
*Phase 4 complete: 2026-01-19*
*Milestone: v1.1 Map Overhaul*
