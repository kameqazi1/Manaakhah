# Technology Stack: MapLibre GL JS Migration

**Project:** Manaakhah - Muslim Business Directory
**Researched:** 2026-01-19
**Research Mode:** Stack-focused for Leaflet to MapLibre migration

## Confidence Notice

WebSearch and Context7 were unavailable during this research. Recommendations are based on training knowledge (cutoff May 2025). **Verify versions against npm/official docs before implementation.**

---

## Current Stack (Being Replaced)

| Technology | Version | Purpose |
|------------|---------|---------|
| leaflet | 1.9.4 | Core map library |
| react-leaflet | 5.0.0 | React bindings |
| leaflet.markercluster | 1.5.3 | Clustering |
| react-leaflet-cluster | 4.0.0 | React clustering |
| mapbox-gl | 3.17.0 | Unused (can remove) |

**Tile Source:** CartoDB Positron (raster tiles)

---

## Recommended Stack

### Core Map Library

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| maplibre-gl | ^4.x | WebGL vector map rendering | Fork of Mapbox GL JS v1, fully open source, no token required, GPU-accelerated |

**Confidence:** MEDIUM (version may have incremented since training)

**Why MapLibre over alternatives:**
- **vs Mapbox GL JS:** MapLibre is free, no API key for library itself. Mapbox GL JS 2.x+ requires token and has usage limits
- **vs Leaflet:** WebGL rendering = smoother zoom/pan, better performance with many markers, vector tiles = sharper at all zooms
- **vs OpenLayers:** MapLibre has simpler API, better React ecosystem, lighter bundle

### React Bindings

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-map-gl | ^7.x | React components for map rendering | Uber's library, actively maintained, first-class MapLibre support |

**Confidence:** MEDIUM

**Why react-map-gl:**
- Maintained by Uber's vis.gl team (same folks behind deck.gl)
- Declarative React components (`<Map>`, `<Marker>`, `<Source>`, `<Layer>`)
- Works with both Mapbox GL JS AND MapLibre GL JS via `mapLib` prop
- TypeScript support built-in
- Large community, good documentation

**NOT recommended:**
- `maplibre-react-native` - Mobile only, not for web
- Raw `maplibre-gl` without React wrapper - More boilerplate, imperative style conflicts with React patterns
- `@vis.gl/react-maplibre` - This doesn't exist; react-map-gl IS the vis.gl solution

### Clustering

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| supercluster | ^8.x | Fast geospatial point clustering | Algorithm library used by MapLibre's native clustering |

**Confidence:** HIGH (stable, mature library)

**Implementation approach:** Use MapLibre's **native clustering via GeoJSON sources** rather than supercluster directly. MapLibre GL JS has built-in clustering when you configure a GeoJSON source with `cluster: true`.

```typescript
// Example: Native clustering in react-map-gl
<Source
  id="businesses"
  type="geojson"
  data={geojsonData}
  cluster={true}
  clusterMaxZoom={14}
  clusterRadius={50}
>
  <Layer
    id="clusters"
    type="circle"
    filter={['has', 'point_count']}
    paint={{
      'circle-color': '#3B82F6',
      'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40]
    }}
  />
  <Layer
    id="unclustered-point"
    type="circle"
    filter={['!', ['has', 'point_count']]}
    paint={{
      'circle-color': '#10B981',
      'circle-radius': 8
    }}
  />
</Source>
```

**NOT recommended:**
- `react-map-gl-cluster` - Outdated, uses deprecated patterns
- `@mapbox/supercluster` - Same as `supercluster`, just old package name
- Manual DOM marker clustering - Defeats WebGL performance benefits

### Tile Providers (Free Tiers)

| Provider | Free Tier | Style Quality | Why/Why Not |
|----------|-----------|---------------|-------------|
| **MapTiler** | 100K loads/month | Excellent | **RECOMMENDED** - Best free option, multiple styles, reliable CDN |
| Stadia Maps | 200K tiles/month | Good | Alternative if MapTiler limits hit |
| Protomaps | Self-host or pay | Customizable | Best for full control, requires hosting setup |
| OpenFreeMap | Unlimited | Basic | New project, less proven reliability |

**Recommendation: MapTiler Free Tier**

**Why MapTiler:**
1. 100,000 map loads/month free (sufficient for MVP/early growth)
2. Pre-built styles: Streets, Satellite, Topo, Basic, Bright
3. Simple API key model (no complex auth)
4. CDN-hosted tiles = no infrastructure needed
5. Good documentation

**Setup:**
1. Create free account at maptiler.com
2. Get API key
3. Use style URL: `https://api.maptiler.com/maps/streets-v2/style.json?key=YOUR_KEY`

**Confidence:** MEDIUM (free tier limits may have changed)

**Alternative tile options if avoiding external services:**

| Option | Effort | When to Use |
|--------|--------|-------------|
| Self-hosted OpenMapTiles | High | Full control needed, have DevOps capacity |
| Protomaps PMTiles | Medium | Want single-file tile archive, CDN-friendly |
| Stadia Maps | Low | MapTiler limits exceeded |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @turf/turf | ^7.x | Geospatial calculations | Distance, bounding boxes, point-in-polygon |
| @maplibre/maplibre-gl-geocoder | ^1.x | Search/autocomplete | If adding address search (optional) |

**Confidence:** MEDIUM

---

## TypeScript Types

| Package | Purpose |
|---------|---------|
| Types included in maplibre-gl | Core map types |
| Types included in react-map-gl | React component types |

No separate `@types/` packages needed - both libraries include TypeScript definitions.

---

## Installation

```bash
# Remove old packages
npm uninstall leaflet react-leaflet leaflet.markercluster react-leaflet-cluster mapbox-gl @types/leaflet @types/leaflet.markercluster @types/mapbox-gl

# Install new packages
npm install maplibre-gl react-map-gl

# Optional: Geospatial utilities
npm install @turf/turf
```

**Post-install:**
1. Add MapTiler API key to `.env.local`: `NEXT_PUBLIC_MAPTILER_KEY=your_key`
2. Import MapLibre CSS in layout or component: `import 'maplibre-gl/dist/maplibre-gl.css'`

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Map library | maplibre-gl | mapbox-gl | Requires API key, usage limits, not fully open source |
| React bindings | react-map-gl | Raw maplibre-gl | More boilerplate, imperative patterns |
| Clustering | Native GeoJSON clustering | supercluster direct | Native is simpler, GPU-accelerated |
| Tiles | MapTiler | Mapbox | Mapbox has lower free tier, MapTiler more generous |
| Tiles | MapTiler | Self-hosted | Unnecessary complexity for MVP |

---

## Migration Complexity Assessment

| Aspect | Complexity | Notes |
|--------|------------|-------|
| Basic map display | Low | Swap imports, update props |
| Markers | Medium | Change from DOM markers to GeoJSON layers |
| Clustering | Medium | Built-in clustering is simpler than Leaflet plugins |
| Popups | Medium | Different API, but react-map-gl has `<Popup>` component |
| Custom styling | Low | MapLibre expressions are powerful |
| User location | Low | Browser Geolocation API same, map API slightly different |
| Fit bounds | Low | `map.fitBounds()` exists in MapLibre |

**Estimated migration effort:** 1-2 days for experienced developer

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_MAPTILER_KEY=your_maptiler_api_key
```

**Note:** Prefix with `NEXT_PUBLIC_` to expose to browser (required for client-side map).

---

## Bundle Size Comparison

| Library | Minified Size | Gzipped |
|---------|--------------|---------|
| leaflet | ~40KB | ~14KB |
| maplibre-gl | ~800KB | ~220KB |

**MapLibre is larger** because it includes WebGL renderer. However:
- WebGL enables GPU acceleration = better runtime performance
- Vector tiles are smaller than raster = less data transfer
- Code-splitting: Load map component lazily

```typescript
// Lazy load map to reduce initial bundle
const MapComponent = dynamic(() => import('@/components/map/MapLibreMap'), {
  ssr: false,
  loading: () => <MapSkeleton />
});
```

---

## SSR Considerations (Next.js)

MapLibre requires browser APIs (WebGL, canvas). Must disable SSR for map components:

```typescript
// Option 1: Dynamic import with ssr: false
import dynamic from 'next/dynamic';
const Map = dynamic(() => import('./MapLibreMap'), { ssr: false });

// Option 2: Check window existence
if (typeof window !== 'undefined') {
  // Safe to use maplibre-gl
}
```

**react-map-gl handles this internally** for its components, but the CSS import and any direct maplibre-gl usage needs protection.

---

## Version Verification Needed

Before implementation, verify current versions:

```bash
npm view maplibre-gl version
npm view react-map-gl version
npm view @turf/turf version
```

Check MapTiler free tier limits at: https://www.maptiler.com/cloud/pricing/

---

## Sources

- Training knowledge (May 2025 cutoff) - MEDIUM confidence
- Package analysis of current codebase - HIGH confidence
- MapLibre project knowledge - MEDIUM confidence (verify versions)

**Verification recommended:**
- [ ] Check maplibre-gl npm for current stable version
- [ ] Check react-map-gl npm for MapLibre compatibility notes
- [ ] Verify MapTiler free tier limits haven't changed
- [ ] Review react-map-gl docs for Next.js 16 compatibility

---

## Quick Start Code

```typescript
// components/map/MapLibreMap.tsx
'use client';

import { useRef, useCallback } from 'react';
import Map, { Marker, Popup, Source, Layer, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

export default function MapLibreMap({ businesses, userLat, userLng }) {
  const mapRef = useRef<MapRef>(null);

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        latitude: userLat,
        longitude: userLng,
        zoom: 13
      }}
      style={{ width: '100%', height: '600px' }}
      mapStyle={`https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`}
    >
      {/* User location marker */}
      <Marker latitude={userLat} longitude={userLng}>
        <div className="user-marker" />
      </Marker>

      {/* Business markers with clustering */}
      <Source
        id="businesses"
        type="geojson"
        data={{
          type: 'FeatureCollection',
          features: businesses.map(b => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [b.longitude, b.latitude] },
            properties: { id: b.id, name: b.name, category: b.category }
          }))
        }}
        cluster={true}
        clusterMaxZoom={14}
        clusterRadius={50}
      >
        <Layer
          id="clusters"
          type="circle"
          filter={['has', 'point_count']}
          paint={{
            'circle-color': '#3B82F6',
            'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40]
          }}
        />
        <Layer
          id="cluster-count"
          type="symbol"
          filter={['has', 'point_count']}
          layout={{
            'text-field': '{point_count_abbreviated}',
            'text-size': 12
          }}
          paint={{ 'text-color': '#ffffff' }}
        />
        <Layer
          id="unclustered-point"
          type="circle"
          filter={['!', ['has', 'point_count']]}
          paint={{
            'circle-color': '#10B981',
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }}
        />
      </Source>
    </Map>
  );
}
```

---

## Summary

**Install:** `maplibre-gl` + `react-map-gl`
**Tiles:** MapTiler free tier (100K/month)
**Clustering:** Native GeoJSON source clustering
**Key benefits:** GPU-accelerated, vector tiles, better performance, fully open source
