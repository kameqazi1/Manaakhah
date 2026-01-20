# Phase 2: Clustering - Research

**Researched:** 2026-01-19
**Domain:** MapLibre GL JS native GeoJSON clustering with react-map-gl
**Confidence:** HIGH

## Summary

Phase 2 implements marker clustering using MapLibre's native GeoJSON source clustering. This is a well-supported feature with clear documentation and an official react-map-gl example. The approach requires converting from the current DOM-based Marker components to a layer-based architecture using Source and Layer components. Native clustering handles all clustering logic server-side in the GL worker thread, providing excellent performance without additional libraries.

The migration path is clear: replace individual `<Marker>` components with a `<Source>` containing GeoJSON FeatureCollection data and multiple `<Layer>` components for clusters, cluster counts, and individual points. Click handling changes from direct marker events to using `interactiveLayerIds` prop and `onClick` on the Map component.

**Primary recommendation:** Use the official react-map-gl clusters example pattern with Source/Layer components, `cluster: true` on the GeoJSON source, and three layers (cluster circles, cluster counts, unclustered points). Handle cluster click-to-zoom via `getClusterExpansionZoom()` method.

## Standard Stack

The established approach for this phase uses only the already-installed packages.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-map-gl | ^8.1.0 | React bindings for MapLibre | Already installed, official example exists |
| maplibre-gl | ^5.16.0 | Native GeoJSON clustering | Built-in clustering via Supercluster internally |

### Supporting
No additional libraries needed. MapLibre's native clustering is built on Supercluster internally but abstracted away.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native clustering | use-supercluster hook | More control but unnecessary complexity; native handles our needs |
| Symbol layers | Marker components with clustering | Markers are DOM elements, terrible performance with 50+ points |

**Installation:**
No new packages needed. Current stack is sufficient.

## Architecture Patterns

### Recommended Component Structure

The current `MapLibreMap.tsx` uses individual Marker components. The refactored approach uses Source and Layer components with the Popup component for selected business details.

```
MapLibreMap.tsx
├── Map component
│   ├── Source (type="geojson", cluster=true)
│   │   ├── Layer (clusters - circle type)
│   │   ├── Layer (cluster-count - symbol type)
│   │   └── Layer (unclustered-point - circle/symbol type)
│   ├── Popup (conditionally rendered for selected business)
│   ├── UserLocationMarker (unchanged)
│   └── NavigationControl (unchanged)
└── Supporting UI (location button, error messages)
```

### Pattern 1: GeoJSON Source with Clustering

**What:** Configure GeoJSON source with cluster options
**When to use:** Always for point data that needs clustering
**Example:**
```typescript
// Source: https://visgl.github.io/react-map-gl/examples/maplibre/clusters
<Source
  id="businesses"
  type="geojson"
  data={geojsonData}
  cluster={true}
  clusterMaxZoom={14}
  clusterRadius={50}
>
  <Layer {...clusterLayer} />
  <Layer {...clusterCountLayer} />
  <Layer {...unclusteredPointLayer} />
</Source>
```

### Pattern 2: Layer Definitions Outside Component

**What:** Define layer styles as constants to prevent re-renders
**When to use:** Always - inline objects cause style diffing on every render
**Example:**
```typescript
// Source: https://github.com/visgl/react-map-gl/blob/8.1-release/examples/maplibre/clusters/src/layers.ts
import type {LayerProps} from 'react-map-gl/maplibre';

export const clusterLayer: LayerProps = {
  id: 'clusters',
  type: 'circle',
  source: 'businesses',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 10, '#f1f075', 50, '#f28cb1'],
    'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40]
  }
};

export const clusterCountLayer: LayerProps = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'businesses',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-size': 12
  }
};

export const unclusteredPointLayer: LayerProps = {
  id: 'unclustered-point',
  type: 'circle',
  source: 'businesses',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': '#11b4da',
    'circle-radius': 8,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#fff'
  }
};
```

### Pattern 3: Cluster Click-to-Zoom Handler

**What:** Zoom into cluster on click using expansion zoom
**When to use:** Required for usable clustering UX
**Example:**
```typescript
// Source: https://github.com/visgl/react-map-gl/blob/8.1-release/examples/maplibre/clusters/src/app.tsx
import type {MapRef, MapMouseEvent} from 'react-map-gl/maplibre';
import type {GeoJSONSource} from 'maplibre-gl';

const mapRef = useRef<MapRef>(null);

const onClusterClick = async (event: MapMouseEvent) => {
  const feature = event.features?.[0];
  if (!feature) return;

  const clusterId = feature.properties?.cluster_id;
  if (clusterId === undefined) return;

  const geojsonSource = mapRef.current?.getSource('businesses') as GeoJSONSource;
  const zoom = await geojsonSource.getClusterExpansionZoom(clusterId);

  mapRef.current?.easeTo({
    center: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
    zoom,
    duration: 500
  });
};

// On Map component:
<Map
  ref={mapRef}
  interactiveLayerIds={['clusters']}
  onClick={onClusterClick}
  // ... other props
>
```

### Pattern 4: Business Data to GeoJSON Conversion

**What:** Transform business array to GeoJSON FeatureCollection
**When to use:** When converting from current Marker-based approach
**Example:**
```typescript
// Convert businesses to GeoJSON FeatureCollection
const geojsonData = useMemo((): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
  type: 'FeatureCollection',
  features: businesses.map(business => ({
    type: 'Feature',
    properties: {
      id: business.id,
      name: business.name,
      category: business.category,
      address: business.address,
      city: business.city,
      averageRating: business.averageRating,
      reviewCount: business.reviewCount,
      distance: business.distance,
      tags: business.tags,
      imageUrl: business.imageUrl
    },
    geometry: {
      type: 'Point',
      coordinates: [business.longitude, business.latitude]
    }
  }))
}), [businesses]);
```

### Pattern 5: Handling Unclustered Point Clicks for Popup

**What:** Show popup when clicking individual business marker
**When to use:** When user clicks non-clustered point
**Example:**
```typescript
const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

const onClick = async (event: MapMouseEvent) => {
  const feature = event.features?.[0];
  if (!feature) return;

  // Check if it's a cluster
  if (feature.properties?.cluster_id !== undefined) {
    // Handle cluster zoom (Pattern 3)
    return;
  }

  // It's an unclustered point - show popup
  const businessId = feature.properties?.id;
  const business = businesses.find(b => b.id === businessId);
  if (business) {
    setSelectedBusiness(business);
  }
};

// Include both layer IDs in interactiveLayerIds
<Map
  interactiveLayerIds={['clusters', 'unclustered-point']}
  onClick={onClick}
>
  {/* ... Source and Layers ... */}

  {selectedBusiness && (
    <Popup
      latitude={selectedBusiness.latitude}
      longitude={selectedBusiness.longitude}
      anchor="bottom"
      onClose={() => setSelectedBusiness(null)}
    >
      {/* Popup content */}
    </Popup>
  )}
</Map>
```

### Anti-Patterns to Avoid

- **Inline layer objects:** Defining layer styles inline causes style diffing on every render. Define as constants outside component.
- **Using Marker components for clustered data:** DOM-based markers don't cluster and kill performance with 50+ points.
- **Using use-supercluster when native clustering suffices:** Adds complexity without benefit for our use case.
- **Forgetting interactiveLayerIds:** Without this prop, onClick never fires with features.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clustering algorithm | Custom proximity grouping | MapLibre native `cluster: true` | Supercluster-based, highly optimized, handles edge cases |
| Cluster expansion zoom | Manual zoom calculation | `getClusterExpansionZoom()` | Built-in method accounts for cluster density |
| Cluster count display | Custom counter overlay | `point_count_abbreviated` property | Automatically available on cluster features |
| Layer click detection | Manual coordinate math | `interactiveLayerIds` + `onClick` | Handles hit testing, feature lookup |

**Key insight:** MapLibre's clustering is battle-tested and handles edge cases (wrap-around, overlapping clusters, dynamic updates) that custom solutions often miss.

## Common Pitfalls

### Pitfall 1: Missing Font for Cluster Count Text

**What goes wrong:** Cluster points appear but count numbers don't display
**Why it happens:** Symbol layers with `text-field` require a font that exists in the map style
**How to avoid:** Either:
  - Use a font from the MapTiler style (check style.json for available fonts)
  - Set explicit `text-font` in layout: `'text-font': ['Noto Sans Regular']`
**Warning signs:** Console error about missing font, cluster circles visible but no text

### Pitfall 2: Inline Layer Object Definitions

**What goes wrong:** Map performance degrades, constant style updates
**Why it happens:** React re-creates objects on every render, triggering style diffing
**How to avoid:** Define layer objects as constants outside the component or memoize them
**Warning signs:** DevTools shows frequent MapLibre style update calls

### Pitfall 3: clusterMaxZoom vs Source maxzoom Conflict

**What goes wrong:** Clusters don't expand at high zoom levels
**Why it happens:** If source `maxzoom` <= `clusterMaxZoom`, clustering breaks at indoor map zoom levels
**How to avoid:** Either don't set source maxzoom, or ensure `maxzoom > clusterMaxZoom`
**Warning signs:** Zooming past clusterMaxZoom still shows clusters

### Pitfall 4: Forgetting interactiveLayerIds

**What goes wrong:** Click handlers fire but `event.features` is empty
**Why it happens:** Without interactiveLayerIds, Map doesn't query features on click
**How to avoid:** Always add clickable layer IDs to interactiveLayerIds array
**Warning signs:** onClick works but features array is undefined/empty

### Pitfall 5: Losing Category-Based Styling

**What goes wrong:** All markers look the same after migration
**Why it happens:** Current Marker approach uses DOM with inline styles; Layers use paint expressions
**How to avoid:** Use data-driven styling with `['get', 'category']` in paint expressions, or use `text-field` with emoji characters based on category
**Warning signs:** Uniform marker appearance after migration

## Code Examples

### Complete Cluster Layer Configuration

```typescript
// Source: Adapted from https://github.com/visgl/react-map-gl/blob/8.1-release/examples/maplibre/clusters/src/layers.ts
import type {LayerProps} from 'react-map-gl/maplibre';

// Cluster circles - sized by count
export const clusterLayer: LayerProps = {
  id: 'clusters',
  type: 'circle',
  source: 'businesses',
  filter: ['has', 'point_count'],
  paint: {
    // Color by count: blue (<10), yellow (10-49), pink (50+)
    'circle-color': [
      'step',
      ['get', 'point_count'],
      '#51bbd6',  // Blue: 0-9
      10, '#f1f075',  // Yellow: 10-49
      50, '#f28cb1'   // Pink: 50+
    ],
    // Radius by count: 20px (<10), 30px (10-49), 40px (50+)
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      20,
      10, 30,
      50, 40
    ],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff'
  }
};

// Cluster count labels
export const clusterCountLayer: LayerProps = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'businesses',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-size': 14,
    // Use font available in MapTiler style
    'text-font': ['Noto Sans Bold']
  },
  paint: {
    'text-color': '#ffffff'
  }
};

// Unclustered individual points
export const unclusteredPointLayer: LayerProps = {
  id: 'unclustered-point',
  type: 'circle',
  source: 'businesses',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': '#16a34a',  // Green to match current design
    'circle-radius': 12,
    'circle-stroke-width': 3,
    'circle-stroke-color': '#ffffff'
  }
};
```

### Category-Based Marker Styling (Alternative)

If category differentiation is required for unclustered points:

```typescript
// Use category property for data-driven styling
export const unclusteredPointLayer: LayerProps = {
  id: 'unclustered-point',
  type: 'circle',
  source: 'businesses',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': [
      'match',
      ['get', 'category'],
      'RESTAURANT', '#ef4444',      // Red
      'GROCERY', '#22c55e',         // Green
      'MOSQUE', '#3b82f6',          // Blue
      'HALAL_MEAT', '#f97316',      // Orange
      'CLOTHING', '#a855f7',        // Purple
      'SERVICES', '#06b6d4',        // Cyan
      'EDUCATION', '#eab308',       // Yellow
      'HEALTH_BEAUTY', '#ec4899',   // Pink
      '#6b7280'  // Default gray
    ],
    'circle-radius': 12,
    'circle-stroke-width': 3,
    'circle-stroke-color': '#ffffff'
  }
};
```

### Full Migration Example Structure

```typescript
'use client';

import { useRef, useState, useMemo, useCallback } from 'react';
import Map, { Source, Layer, Popup, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef, MapMouseEvent } from 'react-map-gl/maplibre';
import type { GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { clusterLayer, clusterCountLayer, unclusteredPointLayer } from './layers';

interface Business {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  // ... other fields
}

interface MapLibreMapProps {
  businesses: Business[];
  userLat: number;
  userLng: number;
}

export default function MapLibreMap({ businesses, userLat, userLng }: MapLibreMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  // Convert to GeoJSON
  const geojsonData = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: businesses.map(b => ({
      type: 'Feature' as const,
      properties: { id: b.id, name: b.name, category: b.category },
      geometry: { type: 'Point' as const, coordinates: [b.longitude, b.latitude] }
    }))
  }), [businesses]);

  const onClick = useCallback(async (event: MapMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) return;

    // Cluster click - zoom in
    if (feature.properties?.cluster_id !== undefined) {
      const source = mapRef.current?.getSource('businesses') as GeoJSONSource;
      const zoom = await source.getClusterExpansionZoom(feature.properties.cluster_id);
      mapRef.current?.easeTo({
        center: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
        zoom,
        duration: 500
      });
      return;
    }

    // Individual point click - show popup
    const business = businesses.find(b => b.id === feature.properties?.id);
    if (business) setSelectedBusiness(business);
  }, [businesses]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{ latitude: userLat, longitude: userLng, zoom: 12 }}
      style={{ width: '100%', height: '600px' }}
      mapStyle={`https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`}
      interactiveLayerIds={['clusters', 'unclustered-point']}
      onClick={onClick}
    >
      <NavigationControl position="top-right" />

      <Source
        id="businesses"
        type="geojson"
        data={geojsonData}
        cluster={true}
        clusterMaxZoom={14}
        clusterRadius={50}
      >
        <Layer {...clusterLayer} />
        <Layer {...clusterCountLayer} />
        <Layer {...unclusteredPointLayer} />
      </Source>

      {selectedBusiness && (
        <Popup
          latitude={selectedBusiness.latitude}
          longitude={selectedBusiness.longitude}
          anchor="bottom"
          onClose={() => setSelectedBusiness(null)}
        >
          {/* Popup content */}
        </Popup>
      )}
    </Map>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| use-supercluster + Marker | Native Source clustering + Layer | MapLibre 2.x+ | Simpler, better perf |
| react-map-gl v7 | react-map-gl v8 | 2024 | Separate /maplibre entry |
| maplibre-gl 4.x | maplibre-gl 5.x | 2025 | No breaking changes for clustering |

**Current best practice:**
- Use `react-map-gl/maplibre` import path (v8+ pattern)
- Native clustering via Source props, not external libraries
- Layer-based rendering, not Marker components for clustered data

## Open Questions

Things that couldn't be fully resolved:

1. **Emoji Icons in Unclustered Points**
   - What we know: Current implementation uses emoji icons per category
   - What's unclear: Whether to use `text-field` with emoji, `icon-image` with sprites, or simpler circle markers
   - Recommendation: Start with colored circles (matches cluster style), add emoji as enhancement if time permits

2. **Hover State Styling**
   - What we know: Current implementation has hover scale effect on markers
   - What's unclear: How to achieve hover effect with Layer-based approach
   - Recommendation: Defer hover styling to Phase 3 (search-map integration) or Phase 5 (mobile optimization)

3. **Font Availability in MapTiler Style**
   - What we know: Cluster count needs valid font
   - What's unclear: Exact fonts available in MapTiler streets-v2 style
   - Recommendation: Test with common fonts (`Noto Sans Bold`, `Open Sans Bold`), fallback to style defaults

## Sources

### Primary (HIGH confidence)
- [react-map-gl Clusters Example](https://visgl.github.io/react-map-gl/examples/maplibre/clusters) - Official example code
- [react-map-gl GitHub Source](https://github.com/visgl/react-map-gl/blob/8.1-release/examples/maplibre/clusters/src/app.tsx) - Full implementation
- [MapLibre GeoJSONSource API](https://maplibre.org/maplibre-gl-js/docs/API/classes/GeoJSONSource/) - Clustering methods
- [MapLibre Create and Style Clusters](https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/) - Native example
- [react-map-gl Adding Custom Data](https://visgl.github.io/react-map-gl/docs/get-started/adding-custom-data) - Source/Layer usage

### Secondary (MEDIUM confidence)
- [Stadia Maps Clustering Tutorial](https://docs.stadiamaps.com/tutorials/clustering-styling-points-with-maplibre/) - Practical walkthrough
- [react-map-gl Layer API](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/layer) - LayerProps reference
- [MapLibre Large Data Guide](https://maplibre.org/maplibre-gl-js/docs/guides/large-data/) - Performance tips

### Tertiary (LOW confidence)
- [GitHub Issue #2691](https://github.com/maplibre/maplibre-gl-js/issues/2691) - maxzoom/clusterMaxZoom conflict (edge case)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using already-installed packages, official example exists
- Architecture: HIGH - Official react-map-gl pattern, well-documented
- Pitfalls: HIGH - Documented in issues and tutorials, verified against multiple sources

**Research date:** 2026-01-19
**Valid until:** 60 days (MapLibre clustering API stable)
