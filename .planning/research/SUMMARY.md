# Project Research Summary

**Project:** Manaakhah v1.1 Map Overhaul
**Domain:** Map library migration with bidirectional search integration
**Researched:** 2026-01-19
**Confidence:** MEDIUM

## Executive Summary

The Manaakhah v1.1 Map Overhaul involves replacing Leaflet with MapLibre GL JS to unlock WebGL-accelerated vector tile rendering, native clustering support, and smoother mobile touch interactions. The migration is well-supported by mature tooling: **react-map-gl** provides declarative React components, **MapTiler free tier** offers sufficient tile quota for early growth (100K/month), and MapLibre's native GeoJSON clustering eliminates the need for external clustering libraries. The current architecture has map and search operating as separate silos; the migration presents an opportunity to unify them with URL-based state management for shareable, bookmarkable map views.

The recommended approach is a phased migration that prioritizes foundation work (SSR handling, tile provider setup, basic map rendering) before tackling bidirectional sync between map and search. The current codebase already uses dynamic imports with `ssr: false` for Leaflet, which MUST be preserved for MapLibre. The biggest architectural change is introducing a shared `useMapSearch` hook with URL as the single source of truth, replacing the current pattern where BusinessMap and SearchPage fetch data independently.

Key risks center on SSR/hydration mismatches (MapLibre's WebGL context fails on server), marker migration complexity (Leaflet's DOM-based markers vs MapLibre's layer-based approach), and infinite loop potential in bidirectional sync. These are well-documented patterns with clear mitigations. The major uncertainty is MapLibre accessibility support, which will require verification against current documentation during implementation.

## Key Findings

### Recommended Stack

The migration stack is straightforward with strong consensus across research.

**Core technologies:**
- **maplibre-gl ^4.x**: WebGL vector map rendering, open source fork of Mapbox GL JS v1, no API key required for the library itself
- **react-map-gl ^7.x**: Uber's maintained React bindings with first-class MapLibre support via `mapLib` prop, declarative components
- **MapTiler Free Tier**: 100K map loads/month, pre-built styles, CDN-hosted vector tiles, simple API key model

**Remove after migration:**
- leaflet, react-leaflet, leaflet.markercluster, react-leaflet-cluster (and their @types)
- mapbox-gl (currently unused)

**Bundle size note:** MapLibre (~220KB gzipped) is larger than Leaflet (~14KB gzipped), but WebGL enables GPU acceleration and vector tiles reduce data transfer. Use code-splitting with dynamic imports to mitigate initial load impact.

### Expected Features

**Must have (table stakes):**
- Business markers on map with category differentiation
- Click marker to see details popup
- User location indicator ("you are here")
- Marker clustering for 50+ businesses
- Search-to-map sync (search results update map bounds)
- Mobile touch gestures (pinch-to-zoom, smooth pan)
- Fit bounds to search results

**Should have (differentiators for v1.1):**
- Dedicated `/map` exploration page with full-screen map-first browsing
- "Search this area" button for user-initiated map-to-search sync
- List-map hover sync (hovering card highlights marker, and vice versa)
- Smooth fly-to animations when selecting a business
- URL state sync for shareable map views

**Defer (v2+):**
- Custom map styling/branding
- Spiderfy for overlapping markers
- Advanced accessibility beyond basic keyboard navigation
- Offline map support
- 3D terrain rendering

**Anti-features (do NOT build):**
- Auto-refresh on every map move (use button pattern instead)
- In-app routing/directions (deep link to Google/Apple Maps)
- Custom marker icons per business (performance nightmare)
- Full geocoding search (users search for businesses, not addresses)

### Architecture Approach

The current architecture has map and search as isolated silos with duplicate data fetching. The migration introduces URL-first state management where URL search params are the single source of truth, parsed by a shared `useMapSearch` hook that manages fetching, filters, and coordinates between MapView and ListView components.

**Major components:**
1. **useMapSearch hook** (`hooks/useMapSearch.ts`) - Central state management: parses URL, manages data fetching with React Query, provides actions that update URL
2. **MapView** (`components/map/MapView.tsx`) - MapLibre wrapper, receives businesses as props, fires events on bounds/zoom changes, does NOT fetch its own data
3. **ListView** (`components/search/ListView.tsx`) - Business card list, receives same businesses array, handles hover/select interactions
4. **SearchFilters** (`components/search/SearchFilters.tsx`) - Filter UI refactored to accept props instead of owning state

**API modification required:** Extend `/api/businesses` to accept viewport bounds (`ne_lat`, `ne_lng`, `sw_lat`, `sw_lng`) in addition to existing radius-based queries.

### Critical Pitfalls

1. **SSR Hydration Mismatch** - MapLibre requires browser APIs. Use `dynamic(() => import('./MapLibreMap'), { ssr: false })`. Current Leaflet pattern already does this - preserve it.

2. **Marker Migration Complexity** - Leaflet uses DOM-based `L.divIcon` with HTML strings. MapLibre markers are either expensive DOM overlays OR efficient symbol layers requiring image sprites. Decision point: use symbol layers with pre-loaded category icons for performance.

3. **Bidirectional Sync Infinite Loops** - Map pan triggers search, search updates map, which triggers search again. Mitigation: 300ms debounce on map movements, track update source with ref to break loops.

4. **CSS Import Order** - MapLibre CSS must be imported in client component, may conflict with Tailwind reset. Import `maplibre-gl/dist/maplibre-gl.css` early, test all controls.

5. **Bundle Size Regression** - Adding MapLibre without removing Leaflet doubles bundle. Complete Leaflet removal MUST happen in final phase after full migration tested.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: MapLibre Foundation
**Rationale:** All other work depends on having a working MapLibre setup. SSR handling, tile provider, and basic rendering must be validated first.
**Delivers:** MapLibreMap.tsx component rendering with MapTiler tiles, basic markers, preserving current visual behavior
**Addresses:** Core map display, markers on map, zoom/pan (table stakes)
**Avoids:** SSR hydration mismatch, CSS conflicts, tile provider setup issues

### Phase 2: Clustering Implementation
**Rationale:** Clustering is required before adding more businesses to the map. Native MapLibre GeoJSON clustering is simpler than Leaflet plugins.
**Delivers:** Clustered markers that expand on click, cluster counts displayed
**Uses:** MapLibre native clustering via GeoJSON source with `cluster: true`
**Avoids:** Performance issues from too many markers

### Phase 3: Search-to-Map Sync
**Rationale:** One-way sync (search filters map) is simpler than bidirectional and delivers immediate value.
**Delivers:** Search results update map bounds via fitBounds, filter changes reflected on map
**Implements:** useMapSearch hook (partial), API bounds support
**Avoids:** Infinite loops (one direction only)

### Phase 4: Map-to-Search Sync
**Rationale:** Builds on Phase 3's hook architecture to add reverse direction with "Search this area" button.
**Delivers:** User-initiated map-to-search sync, URL reflects map position
**Addresses:** "Search this area" button (differentiator), shareable URLs
**Avoids:** Aggressive auto-update (button pattern instead), infinite loops (debounce + source tracking)

### Phase 5: List-Map Hover Sync
**Rationale:** Polish feature that creates cohesive experience between panels. Requires both views integrated.
**Delivers:** Hovering business card highlights marker, hovering marker highlights list item
**Addresses:** List-map hover sync (differentiator)

### Phase 6: Dedicated /map Page
**Rationale:** Full-screen map-first browsing requires prior phases to be solid. Adds mobile bottom sheet pattern.
**Delivers:** `/map` route with full-screen map, bottom sheet on mobile, map-first discovery experience
**Addresses:** Dedicated /map page, mobile bottom sheet (differentiators)

### Phase 7: Mobile Optimization
**Rationale:** Mobile-specific issues (touch conflicts, WebGL context loss) need dedicated attention after core features work.
**Delivers:** Cooperative gestures option, WebGL context recovery, mobile-optimized touch handling
**Avoids:** Mobile touch event conflicts, WebGL context loss

### Phase 8: Cleanup and Polish
**Rationale:** Remove Leaflet only after all migration phases tested. Bundle analysis, final polish.
**Delivers:** Leaflet packages removed, bundle optimized, smooth animations, final testing
**Avoids:** Bundle size regression

### Phase Ordering Rationale

- **Foundation first:** Phases 1-2 establish the map library. No sync work can happen until MapLibre renders correctly with clustering.
- **One-way before bidirectional:** Phase 3 (search-to-map) is simpler and validates the useMapSearch hook before Phase 4 adds the tricky reverse direction.
- **Polish after core:** Phases 5-7 are enhancements that require the core bidirectional sync to be working.
- **Cleanup last:** Removing Leaflet (Phase 8) can only happen after complete migration is tested in production.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Verify MapLibre 4.x + react-map-gl 7.x compatibility, current MapTiler free tier limits
- **Phase 2:** Verify native clustering API if not using Supercluster directly
- **Phase 6:** Mobile bottom sheet implementation patterns (may need library research)

Phases with standard patterns (skip research-phase):
- **Phase 3:** URL state management is well-documented Next.js pattern
- **Phase 4:** Debounce + source tracking is established pattern
- **Phase 5:** Hover sync is straightforward React state
- **Phase 8:** Package removal is mechanical

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Versions may have incremented since training cutoff. Verify maplibre-gl and react-map-gl current versions on npm. |
| Features | HIGH | Table stakes and differentiators based on well-established patterns from Google Maps, Yelp, etc. |
| Architecture | MEDIUM | URL-first pattern is established, but react-map-gl controlled mode needs verification against current docs. |
| Pitfalls | HIGH | SSR, marker migration, and sync loop pitfalls are well-documented and match current codebase analysis. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **MapLibre accessibility:** Research rated LOW confidence. Verify current a11y capabilities before Phase 7. May require custom implementation.
- **MapTiler free tier limits:** May have changed since training cutoff. Verify at maptiler.com/cloud/pricing before Phase 1.
- **react-map-gl MapLibre 4.x compatibility:** Verify current version supports MapLibre 4.x via `mapLib` prop.
- **Next.js 16 dynamic import behavior:** Verify SSR handling hasn't changed in latest Next.js.
- **Mobile bottom sheet library:** Phase 6 needs library research or custom implementation decision.

## Sources

### Primary (HIGH confidence)
- Current codebase analysis: `components/map/LeafletMap.tsx`, `app/search/page.tsx`, `app/api/businesses/route.ts`
- Package.json dependency analysis: Current Leaflet packages identified for removal
- CONCERNS.md: Known fragile areas (dynamic CSS injection)

### Secondary (MEDIUM confidence)
- Training data: MapLibre GL JS, react-map-gl patterns (May 2025 cutoff)
- Training data: React state management, URL-first patterns
- Training data: Supercluster, map clustering patterns

### Tertiary (LOW confidence)
- MapLibre accessibility features: Needs verification against current documentation
- MapTiler free tier limits: May have changed, verify before implementation

---
*Research completed: 2026-01-19*
*Ready for roadmap: yes*
