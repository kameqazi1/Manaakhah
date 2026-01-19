# Domain Pitfalls: Leaflet to MapLibre Migration

**Domain:** Map library migration (Leaflet to MapLibre GL JS) in Next.js
**Project:** Manaakhah v1.1 Map Overhaul
**Researched:** 2026-01-19
**Confidence:** MEDIUM (based on training data patterns; verify with official docs during implementation)

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: SSR Hydration Mismatch

**What goes wrong:** MapLibre GL JS requires browser APIs (`window`, `document`, WebGL context) that don't exist during server-side rendering. Importing MapLibre directly causes build failures or hydration mismatches.

**Why it happens:**
- MapLibre is a WebGL-based library that initializes immediately on import
- Next.js pre-renders pages on the server where browser APIs are undefined
- Unlike Leaflet which can be dynamically imported, MapLibre's WebGL context check runs at module load

**Consequences:**
- Build failure with "window is not defined"
- Hydration mismatch errors in development
- Blank map with console errors
- React tree unmounting and remounting unexpectedly

**Warning signs:**
- `ReferenceError: window is not defined` during build
- "Hydration failed because the initial UI does not match" warning
- Map container renders but map doesn't appear
- Development works but production build fails

**Prevention:**
```typescript
// CORRECT: Dynamic import with ssr: false
const MapComponent = dynamic(() => import('./MapLibreMap'), {
  ssr: false,
  loading: () => <MapSkeleton />
});

// INSIDE MapLibreMap.tsx - check before initialization
useEffect(() => {
  if (typeof window === 'undefined') return;
  // Initialize map here
}, []);
```

**Current state:** Project already uses `dynamic(() => import('./LeafletMap'), { ssr: false })` - this pattern MUST be preserved for MapLibre.

**Phase:** MAP-01 (Core Migration) - Validate SSR handling first

---

### Pitfall 2: CSS Import Order and Conflicts

**What goes wrong:** MapLibre's CSS must be imported correctly, and it can conflict with existing Leaflet CSS or Tailwind utilities. Missing CSS causes invisible controls, broken popups, or misaligned markers.

**Why it happens:**
- MapLibre uses different CSS class names than Leaflet
- Tailwind's reset may override MapLibre's positioning
- Multiple map library CSS files can conflict
- CSS may be imported multiple times or not at all in dynamic components

**Consequences:**
- Controls (zoom, attribution) invisible or mispositioned
- Popups render outside viewport
- Markers don't appear at correct positions
- Z-index conflicts between map layers and UI

**Warning signs:**
- Map renders but controls are invisible
- Popups appear but content is offset
- Markers flicker or jump positions
- Attribution overlaps other elements

**Prevention:**
```typescript
// In MapLibreMap.tsx (client component only)
import 'maplibre-gl/dist/maplibre-gl.css';

// Tailwind config - preserve MapLibre classes
// tailwind.config.ts
module.exports = {
  important: false, // Don't use !important globally
  corePlugins: {
    preflight: true, // But may need layer adjustments
  }
}

// If conflicts persist, scope MapLibre container
<div className="maplibre-container [&_.maplibregl-ctrl]:z-50">
```

**Current state:** LeafletMap.tsx injects CSS dynamically via `document.createElement('style')` (fragile - noted in CONCERNS.md). MapLibre migration should use proper CSS imports.

**Phase:** MAP-01 - Part of initial setup

---

### Pitfall 3: Marker Migration - Different APIs Entirely

**What goes wrong:** Leaflet markers use DOM elements (`L.divIcon` with HTML strings). MapLibre markers are either DOM-based (`maplibregl.Marker`) or symbol layers (GeoJSON + style). Attempting to port Leaflet patterns directly fails.

**Why it happens:**
- Leaflet: Each marker is a DOM element you can manipulate directly
- MapLibre: Markers are either expensive DOM overlays OR efficient symbol layers
- Current implementation uses `L.divIcon` with inline HTML and CSS
- MapLibre symbol layers require image sprites, not inline HTML

**Consequences:**
- Performance regression if using DOM markers for all businesses
- Loss of rich marker styling (current emoji icons, color-coded categories)
- Clustering won't work with DOM markers
- Hover effects need complete reimplementation

**Warning signs:**
- Markers appear but clustering doesn't work
- Performance worse than Leaflet with many markers
- Category colors and icons missing
- Hover/click events not firing

**Prevention:**
```typescript
// OPTION 1: Symbol layers (recommended for performance)
// Requires pre-loading category icons as sprites
map.loadImage('/icons/restaurant.png', (error, image) => {
  map.addImage('restaurant', image);
});

// Then use in layer
map.addLayer({
  id: 'business-markers',
  type: 'symbol',
  source: 'businesses',
  layout: {
    'icon-image': ['get', 'icon'], // From GeoJSON properties
    'icon-size': 0.5
  }
});

// OPTION 2: DOM markers (for rich HTML, but limited)
businesses.forEach(b => {
  const el = document.createElement('div');
  el.className = 'marker';
  el.innerHTML = `<span style="background:${b.color}">${b.icon}</span>`;
  new maplibregl.Marker({ element: el })
    .setLngLat([b.longitude, b.latitude])
    .addTo(map);
});
```

**Current state:** 11 categories with emoji icons and color codes defined in `CATEGORIES` array. Markers use `L.divIcon` with inline styles for 44x44px colored circles with emoji centers.

**Phase:** MAP-01 - Major implementation decision point

---

### Pitfall 4: Popup Migration - React Components vs HTML Strings

**What goes wrong:** Current implementation generates popup HTML as template strings (`createPopupContent` returns HTML string). MapLibre popups work similarly but React integration requires different patterns for interactive popups.

**Why it happens:**
- Current: `marker.bindPopup(popupContent)` where `popupContent` is raw HTML
- Popup contains interactive "View Details" link and hover effects
- MapLibre popups also accept HTML, but React state/routing won't work inside raw HTML
- Need either: string templates (lose React), or custom overlay (more complex)

**Consequences:**
- Links inside popups don't use Next.js router
- React state can't update popup content
- Click handlers in popup HTML don't work as expected
- No access to React Query or other providers inside popup

**Warning signs:**
- Popup link clicks cause full page reload instead of client navigation
- Popup content doesn't update when business data changes
- onClick handlers in popup HTML silently fail
- DevTools show popup content outside React tree

**Prevention:**
```typescript
// OPTION 1: Use HTML strings but handle links via event delegation
popup.setHTML(createPopupContent(business));
// Then attach click listener to popup container
popup.getElement().addEventListener('click', (e) => {
  if (e.target.matches('a[data-business-id]')) {
    e.preventDefault();
    router.push(`/business/${e.target.dataset.businessId}`);
  }
});

// OPTION 2: Use custom overlay with ReactDOM.createPortal
// More complex but allows full React components in popup
```

**Current state:** Popup uses inline `onmouseover`/`onmouseout` handlers and plain `<a href>` links. This pattern will need adaptation.

**Phase:** MAP-01 - After markers work, before clustering

---

### Pitfall 5: Bundle Size Regression

**What goes wrong:** MapLibre GL JS (~500KB minified, ~150KB gzipped) is larger than Leaflet (~140KB minified). Adding it without removing Leaflet doubles map-related bundle size.

**Why it happens:**
- MapLibre includes WebGL rendering engine
- Vector tile parsing is computationally intensive
- Teams add MapLibre but forget to remove Leaflet dependencies
- Both libraries may be bundled if shared code references both

**Consequences:**
- First load performance regression
- Longer time to interactive on mobile
- Failed Core Web Vitals (LCP, TBT)
- App bundle exceeds recommended size

**Warning signs:**
- Bundle analyzer shows both leaflet and maplibre-gl
- Initial page load noticeably slower
- Lighthouse performance score drops
- Mobile users report slow loading

**Prevention:**
```bash
# After migration is complete, remove Leaflet entirely
npm uninstall leaflet react-leaflet leaflet.markercluster react-leaflet-cluster
npm uninstall @types/leaflet @types/leaflet.markercluster

# Verify in bundle analyzer
npx @next/bundle-analyzer
```

```javascript
// next.config.js - if keeping both temporarily
experimental: {
  optimizePackageImports: ['maplibre-gl']
}
```

**Current packages to remove:**
- leaflet ^1.9.4
- react-leaflet ^5.0.0
- react-leaflet-cluster ^4.0.0
- leaflet.markercluster ^1.5.3
- @types/leaflet ^1.9.21
- @types/leaflet.markercluster ^1.5.6

**Phase:** Final phase (MAP-08 or dedicated cleanup) - After all migration complete and tested

---

## Moderate Pitfalls

Mistakes that cause delays or technical debt.

### Pitfall 6: Tile Provider Rate Limits and API Keys

**What goes wrong:** MapLibre requires vector tile sources. Free providers have rate limits. Production traffic may exceed limits causing map failures.

**Why it happens:**
- Leaflet uses raster tiles (CartoDB Positron) with generous free tier
- MapLibre vector tiles need different providers
- Free tiers: MapTiler (limited), Stadia Maps (limited), self-hosted (complex)
- No API key = no tiles = blank map

**Warning signs:**
- Maps work in development but fail in production
- HTTP 429 errors in console
- Maps load for some users but not others
- Monthly traffic reports show overages

**Prevention:**
- Start with MapTiler free tier (100K requests/month) for development
- Plan for production: Stadia Maps, Maptiler Cloud, or self-hosted
- Implement tile caching if self-hosting
- Monitor usage from day one

**Tile provider options:**
| Provider | Free Tier | Vector Tiles | Notes |
|----------|-----------|--------------|-------|
| MapTiler | 100K/mo | Yes | Good docs, easy setup |
| Stadia Maps | 200K/mo | Yes | MapLibre-friendly |
| OpenFreeMap | Unlimited | Yes | Self-hosted, no API key |
| Self-hosted | N/A | Depends | PMTiles + CDN approach |

**Current state:** Using CartoDB Positron raster tiles. No vector tile provider configured.

**Phase:** MAP-01 - Decide tile provider during initial setup

---

### Pitfall 7: User Location Permission Handling

**What goes wrong:** Geolocation API behaves inconsistently across browsers and requires user permission. Poor handling causes broken UX or location features that silently fail.

**Why it happens:**
- Safari requires HTTPS for geolocation
- Permission prompts differ by browser
- Users may deny permission or have it disabled
- iOS requires specific meta tags

**Warning signs:**
- Location works on Chrome but not Safari
- Users report "my location" button does nothing
- Console shows geolocation permission denied
- Location works on desktop but not mobile

**Prevention:**
```typescript
// Proper geolocation with error handling
const getUserLocation = async (): Promise<GeolocationPosition | null> => {
  if (!navigator.geolocation) {
    console.warn('Geolocation not supported');
    return null;
  }

  try {
    return await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 min cache
      });
    });
  } catch (error) {
    if (error.code === error.PERMISSION_DENIED) {
      // Show UI explaining why location is useful
    }
    return null;
  }
};

// Always have fallback location
const DEFAULT_CENTER = { lat: 37.5485, lng: -121.9886 }; // Current default
```

**Current state:** BusinessMap has hardcoded default coordinates. No explicit geolocation request.

**Phase:** MAP-05 - When implementing user location feature

---

### Pitfall 8: Clustering Library Selection

**What goes wrong:** MapLibre doesn't have built-in clustering like Leaflet.markercluster. Using wrong approach causes performance issues or clustering that doesn't work with filters.

**Why it happens:**
- Multiple clustering options: Supercluster, MapLibre native, custom
- Supercluster is standard but needs proper integration
- Clustering must work with real-time filtering
- Cluster click should zoom to show children

**Warning signs:**
- Clustering works but zoom doesn't expand clusters
- Filtering doesn't update cluster counts
- Performance degrades with many businesses
- Clusters appear at wrong zoom levels

**Prevention:**
```typescript
// Use Supercluster for client-side clustering
import Supercluster from 'supercluster';

const cluster = new Supercluster({
  radius: 60,
  maxZoom: 14,
  minPoints: 2
});

// Update clusters when data or viewport changes
const updateClusters = useCallback(() => {
  cluster.load(geojsonPoints);
  const bounds = map.getBounds();
  const zoom = map.getZoom();
  setClusters(cluster.getClusters(
    [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
    Math.floor(zoom)
  ));
}, [businesses, map]);
```

**Current state:** `react-leaflet-cluster` and `leaflet.markercluster` in dependencies but unclear if actively used in LeafletMap.tsx (not visible in current implementation).

**Phase:** MAP-02 - Dedicated clustering phase

---

### Pitfall 9: Mobile Touch Event Conflicts

**What goes wrong:** MapLibre's touch handling can conflict with page scroll, pull-to-refresh, or custom gestures. Users can't scroll past map or accidentally pan when trying to scroll.

**Why it happens:**
- Map captures touch events for pan/zoom
- No distinction between "user wants to interact with map" vs "user wants to scroll page"
- iOS pull-to-refresh conflicts with map pan
- Two-finger zoom conflicts with browser zoom

**Warning signs:**
- Users get "stuck" on map when scrolling page
- Pull-to-refresh triggers during map pan
- Pinch zoom inconsistent behavior
- Touch targets too small on mobile

**Prevention:**
```typescript
// Option 1: Require two fingers for map interaction
const map = new maplibregl.Map({
  cooperativeGestures: true // Shows "Use two fingers to move the map"
});

// Option 2: Disable map scroll zoom when embedded
const map = new maplibregl.Map({
  scrollZoom: false, // Require pinch or buttons
  touchZoomRotate: true
});

// Option 3: Only enable full interaction in full-screen map
const isFullScreen = pathname === '/map';
scrollZoom: isFullScreen
```

**Current state:** Leaflet has `scrollWheelZoom: true`. No specific mobile handling visible.

**Phase:** MAP-08 - Mobile optimization phase

---

### Pitfall 10: Map State Synchronization with URL/Search

**What goes wrong:** Bidirectional map-search sync creates infinite loops or race conditions. Map pan triggers search which updates results which updates map which triggers search...

**Why it happens:**
- Map "moveend" event fires frequently during pan/zoom
- Search results change map bounds
- Both directions try to be "source of truth"
- Debouncing not properly configured

**Consequences:**
- Infinite request loops
- Janky map movement
- Search results flickering
- Browser performance issues

**Warning signs:**
- Network tab shows repeated identical requests
- Map jumps or stutters during pan
- Results list flickers constantly
- Console shows "maximum update depth exceeded"

**Prevention:**
```typescript
// 1. Single source of truth (URL)
const [bounds, setBounds] = useQueryState('bounds'); // URL state

// 2. Debounce map movements
const debouncedBounds = useDebouncedValue(mapBounds, 300);

// 3. Track update source to prevent loops
const updateSource = useRef<'map' | 'search' | null>(null);

const handleMapMove = () => {
  if (updateSource.current === 'search') return; // Ignore if search caused this
  updateSource.current = 'map';
  setBounds(map.getBounds().toString());
};

const handleSearchResults = (results) => {
  if (updateSource.current === 'map') return; // Ignore if map caused this
  updateSource.current = 'search';
  map.fitBounds(calculateBounds(results));
};

// Reset after settling
useEffect(() => {
  const timeout = setTimeout(() => updateSource.current = null, 500);
  return () => clearTimeout(timeout);
}, [bounds]);
```

**Phase:** MAP-03 (search updates map) and MAP-04 (map updates search) - Core sync logic

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 11: Attribution Requirements

**What goes wrong:** MapLibre and tile providers require attribution. Hiding or incorrectly displaying attribution violates terms of service.

**Prevention:**
- Keep default attribution control visible
- If customizing position, ensure it remains visible
- Include all required attributions (MapLibre, tile provider, data sources)

**Phase:** MAP-01 - Verify during initial setup

---

### Pitfall 12: Development vs Production Tile URLs

**What goes wrong:** Hardcoding tile URLs that work in dev but not prod, or vice versa.

**Prevention:**
```typescript
const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILES_URL ||
  'https://api.maptiler.com/maps/streets/style.json?key=YOUR_KEY';
```

**Phase:** MAP-01 - Use environment variables from start

---

### Pitfall 13: Map Container Sizing Issues

**What goes wrong:** Map container must have explicit height. CSS `height: 100%` doesn't work if parent has no height.

**Prevention:**
```typescript
// Explicit height
<div style={{ height: '600px' }} ref={mapContainer} />

// Or flex-based with explicit parent
<div className="h-screen flex flex-col">
  <header className="h-16" />
  <div className="flex-1" ref={mapContainer} /> // This works
</div>
```

**Current state:** LeafletMap uses `h-[600px]` and `minHeight: "600px"` - good practice to maintain.

**Phase:** MAP-01 - Preserve current sizing patterns

---

### Pitfall 14: WebGL Context Lost

**What goes wrong:** On mobile or low-memory devices, WebGL context can be lost. Map goes blank without proper handling.

**Prevention:**
```typescript
map.on('webglcontextlost', () => {
  console.warn('WebGL context lost - attempting recovery');
});

map.on('webglcontextrestored', () => {
  console.log('WebGL context restored');
  // May need to re-add custom layers
});
```

**Phase:** MAP-08 - Mobile optimization phase

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|----------------|------------|
| MAP-01 | Core Migration | SSR/hydration issues | Dynamic import with ssr:false, verify build |
| MAP-01 | Core Migration | CSS conflicts | Import MapLibre CSS, test all controls |
| MAP-01 | Core Migration | Tile provider setup | Choose provider early, get API key |
| MAP-02 | Clustering | Library selection | Use Supercluster, test with filters |
| MAP-02 | Clustering | Performance | Profile with realistic data volume |
| MAP-03 | Search -> Map | Bounds calculation | Test edge cases (single result, zero results) |
| MAP-04 | Map -> Search | Infinite loops | Debounce, track update source |
| MAP-04 | Map -> Search | Rate limiting | Debounce API calls, cache results |
| MAP-05 | User Location | Permission handling | Graceful fallback, clear UX |
| MAP-05 | User Location | HTTPS requirement | Test on deployed environment |
| MAP-06 | Search Toggle | State preservation | URL state for view mode |
| MAP-07 | Full-screen Map | Layout conflicts | Dedicated route with proper mobile handling |
| MAP-08 | Mobile | Touch conflicts | cooperative gestures, test on devices |
| MAP-08 | Mobile | WebGL context loss | Add recovery handlers |
| Final | Cleanup | Bundle size | Remove all Leaflet dependencies |

## Current Implementation Specifics

Based on analysis of `components/map/LeafletMap.tsx`:

**What must be preserved:**
- `"use client"` directive
- Dynamic import with `ssr: false` (in BusinessMap.tsx)
- Category colors and icons from `CATEGORIES` array (11 categories)
- Business tags from `BUSINESS_TAGS` array (6 tags)
- Popup content structure (image, name, category, rating, tags, address, distance, link)
- User location marker with pulse animation
- Radius circle visualization
- Tooltip on marker hover
- Marker hover scale effect
- Selected business detail card

**What will change:**
- `L.map()` -> `new maplibregl.Map()`
- `L.tileLayer()` -> style.json with vector sources
- `L.divIcon()` -> maplibregl.Marker or symbol layer
- `L.marker()` -> maplibregl.Marker or GeoJSON source
- `L.circle()` -> GeoJSON circle or turf.js buffer
- `marker.bindPopup()` -> maplibregl.Popup
- `marker.bindTooltip()` -> custom hover handling
- Dynamic CSS injection -> proper CSS import

**Files affected:**
- `components/map/LeafletMap.tsx` - Complete rewrite as MapLibreMap.tsx
- `components/map/BusinessMap.tsx` - Update dynamic import path
- `package.json` - Add maplibre-gl, remove leaflet packages

---

## Sources

**Training data (MEDIUM confidence):**
- MapLibre GL JS documentation patterns
- Next.js dynamic import best practices
- Common WebGL map library integration patterns
- Supercluster clustering patterns

**Project analysis (HIGH confidence):**
- `/Users/saeed/Desktop/Manaakhah/components/map/LeafletMap.tsx` - Current implementation
- `/Users/saeed/Desktop/Manaakhah/components/map/BusinessMap.tsx` - Component wrapper
- `/Users/saeed/Desktop/Manaakhah/package.json` - Current dependencies
- `/Users/saeed/Desktop/Manaakhah/.planning/codebase/CONCERNS.md` - Known fragile areas
- `/Users/saeed/Desktop/Manaakhah/.planning/PROJECT.md` - Migration requirements

**Verification needed during implementation:**
- MapLibre GL JS official documentation for current API
- Tile provider documentation for rate limits and setup
- Supercluster documentation for clustering configuration
- Next.js 16 specific dynamic import behavior

---

*Pitfalls research: 2026-01-19*
