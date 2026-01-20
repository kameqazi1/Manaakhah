# Requirements: Manaakhah v1.1

**Defined:** 2026-01-19
**Core Value:** Users can find and connect with verified Muslim-owned businesses in their area

## v1.1 Requirements

Requirements for the Map Overhaul milestone. Focus on must-have features only.

### MapLibre Foundation

- [x] **MAP-01**: Replace Leaflet with MapLibre GL JS for WebGL rendering
  - Use react-map-gl ^7.x with maplibre-gl ^4.x
  - MapTiler free tier for vector tiles
  - Preserve SSR handling with dynamic imports (ssr: false)
  - Import maplibre-gl CSS in client component

- [x] **MAP-02**: Implement marker clustering for performance with many businesses
  - Use native MapLibre GeoJSON source clustering (cluster: true)
  - Cluster radius ~50px, max zoom 14
  - Display cluster count in markers
  - Click cluster to zoom in

### Search-Map Integration

- [x] **MAP-03**: Search results update map view (zoom to fit results)
  - Map bounds fit to search results via fitBounds()
  - Filter changes reflected on map immediately
  - Implement useMapSearch hook for shared state

- [x] **MAP-04**: Map drag/zoom updates search results to visible area
  - "Search this area" button pattern (not aggressive auto-refresh)
  - 300ms debounce on map movements
  - URL reflects current map position for shareability
  - API extended with bounds params (ne_lat, ne_lng, sw_lat, sw_lng)

### User Location

- [x] **MAP-05**: Show user's current location on map with distance filtering
  - "You are here" marker with distinct styling
  - Distance display on business markers/cards
  - Optional: Center on user location button

### Search Page Map

- [x] **MAP-06**: Add map view toggle to search results page
  - Toggle between list view, map view, or split view
  - Map and list share same data source (useMapSearch hook)
  - URL-first state management

### Mobile Experience

- [ ] **MAP-08**: Mobile-optimized gestures (pinch-zoom, smooth pan, touch targets)
  - WebGL rendering enables smooth pinch-to-zoom
  - 44x44px minimum touch targets on markers
  - Cooperative gestures option if scroll conflicts arise
  - Handle WebGL context loss gracefully

## Deferred to v1.2+

The following were identified as valuable but deferred to keep v1.1 focused:

- **MAP-07**: Dedicated /map page for full-screen exploration
- List-map hover sync (hovering card highlights marker)
- URL state sync for complete shareable links
- Smooth fly-to animations
- Custom map styling/branding
- Spiderfy for overlapping markers
- Advanced accessibility beyond basic keyboard nav
- Offline map support

## Technical Requirements

### API Changes

- [x] **API-01**: Extend /api/businesses to accept viewport bounds
  - Add ne_lat, ne_lng, sw_lat, sw_lng query params
  - Prisma where clause: latitude/longitude between bounds
  - Maintain backward compatibility with existing radius params

### Architecture

- [x] **ARCH-01**: Implement useMapSearch hook
  - URL as single source of truth (Next.js useSearchParams)
  - React Query for data fetching and caching
  - Debounced URL updates on map movements
  - Shared between MapView and ListView components

### Cleanup

- [ ] **CLEAN-01**: Remove Leaflet packages after migration complete
  - leaflet, react-leaflet, leaflet.markercluster, react-leaflet-cluster
  - mapbox-gl (unused)
  - Associated @types packages

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MAP-01 | Phase 1 | Complete |
| MAP-02 | Phase 2 | Complete |
| MAP-03 | Phase 3 | Complete |
| MAP-04 | Phase 4 | Complete |
| MAP-05 | Phase 1 | Complete |
| MAP-06 | Phase 3 | Complete |
| MAP-08 | Phase 5 | Pending |
| API-01 | Phase 3 | Complete |
| ARCH-01 | Phase 3 | Complete |
| CLEAN-01 | Phase 6 | Pending |

**Coverage:**
- v1.1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0

---
*Requirements defined: 2026-01-19*
