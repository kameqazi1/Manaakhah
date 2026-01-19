# Feature Landscape: Map-First Business Directory

**Domain:** Map-based business directory (Muslim business discovery)
**Researched:** 2026-01-19
**Confidence:** MEDIUM (based on training data patterns, verified against current codebase)

---

## Table Stakes

Features users expect from any map-based business directory. Missing these makes the product feel incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Business markers on map** | Core functionality - users expect to see businesses visually located | Low | Current Leaflet implementation has this |
| **Click marker to see details** | Standard map interaction pattern (Google Maps, Yelp, etc.) | Low | Already implemented with popups |
| **User location indicator** | "Where am I?" is the first question in local search | Low | Current implementation has "you are here" marker |
| **Zoom and pan** | Basic map navigation | Low | Default browser/library behavior |
| **Category-differentiated markers** | Users need visual distinction at a glance | Low | Current has colored category icons |
| **Distance display** | Local search requires knowing how far businesses are | Low | Already showing "X miles away" |
| **Search filters** | Users expect to narrow results | Medium | Category and tag filtering exists |
| **Responsive/mobile-friendly** | 60%+ of local search is mobile | Medium | Current map works but mobile UX not optimized |
| **Loading states** | Map data takes time - users need feedback | Low | Basic loading implemented |
| **Fit bounds to results** | After search, map should show all relevant results | Low | Current uses fitBounds() |

### Currently Missing Table Stakes

| Feature | Why Critical | Priority |
|---------|-------------|----------|
| **Marker clustering** | Without clustering, 50+ markers create visual chaos and performance issues | HIGH |
| **Search-to-map sync** | When user searches, map should update to show results - this is expected from Yelp/Google | HIGH |
| **Map-to-search sync** | Moving the map should optionally update results - "search this area" pattern | HIGH |
| **Mobile touch gestures** | Pinch-to-zoom must work smoothly; current Leaflet can be janky | HIGH |
| **Keyboard navigation** | Accessibility requirement - users must navigate markers without mouse | MEDIUM |

---

## Differentiators

Features that set the product apart. Not strictly expected, but valued when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Dedicated /map exploration page** | Full-screen map-first browsing (vs search-first with map sidebar) | Medium | Currently no /map route |
| **Bidirectional search-map integration** | Search updates map AND map movements update search - feels seamless | High | Requires state coordination |
| **"Search this area" button** | User-initiated map-to-search sync (less aggressive than auto-update) | Medium | Better UX than aggressive auto-update |
| **Cluster expansion animation** | Smooth animation when clicking cluster to reveal businesses | Medium | MapLibre supports this natively |
| **List-map hover sync** | Hovering business card highlights marker; hovering marker highlights list item | Medium | Creates cohesive experience |
| **Radius visualization** | Show search radius as a circle on map | Low | Current has this - keep it |
| **Rich marker popups** | Business preview in popup with image, rating, quick actions | Medium | Current has good popups |
| **URL state sync** | Map position, filters, selected business persist in URL for sharing | Medium | Currently not implemented |
| **Smooth fly-to animations** | When selecting a business, smoothly animate to its location | Low | MapLibre native feature |
| **Custom map style** | Branded colors/styling that matches Manaakhah design | Medium | Vector tiles enable this |
| **Spiderfy overlapping markers** | When markers are at exact same location, expand them | Medium | Plugin available |

### Recommended Differentiators for v1.1

1. **Dedicated /map page** - Full-screen map exploration mode
2. **Bidirectional sync with "Search this area" button** - Not aggressive auto-update
3. **List-map hover sync** - Makes the two panels feel connected
4. **Smooth fly-to animations** - Low effort, high perceived quality

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Auto-refresh on every map move** | Triggers excessive API calls, janky UX, user loses context | Use "Search this area" button pattern |
| **3D map rendering** | Adds complexity and load time without value for directory use case | Stick to 2D map with optional terrain for outdoor businesses only |
| **Custom marker icons per business** | Performance nightmare at scale, visual chaos | Use category-based icons (current approach is correct) |
| **Street view integration** | Adds Google dependency, rarely used in directory context | Link to Google Maps for navigation instead |
| **Routing/directions in-app** | Complex to build, users expect to use their preferred maps app | Deep link to Google/Apple Maps |
| **Real-time tracking** | Not relevant for business directory | N/A |
| **Offline maps** | High complexity, niche use case for directory | Focus on caching business data, not map tiles |
| **Custom map tiles hosting** | Expensive, complex operations | Use free tier from Stadia/MapTiler/OpenFreeMap |
| **Full geocoding search** | Beyond scope - users search for businesses, not addresses | Keep location-based with radius, not address search |
| **Aggressive preloading** | Loading all businesses regardless of viewport wastes bandwidth | Load based on viewport bounds with buffer |

---

## Interaction Patterns

### Desktop Interactions

| Interaction | Expected Behavior | Priority |
|-------------|-------------------|----------|
| Click marker | Open popup/details panel | TABLE STAKES |
| Click elsewhere | Close popup | TABLE STAKES |
| Mouse wheel | Zoom in/out | TABLE STAKES |
| Click + drag | Pan map | TABLE STAKES |
| Double-click | Zoom in | TABLE STAKES |
| Shift + drag | Box zoom | NICE TO HAVE |
| Hover marker | Show tooltip with name, highlight in list | DIFFERENTIATOR |
| Hover list item | Highlight corresponding marker | DIFFERENTIATOR |
| Click cluster | Zoom in to reveal contents | TABLE STAKES (once clustering added) |

### Mobile Interactions

| Interaction | Expected Behavior | Priority |
|-------------|-------------------|----------|
| Single finger drag | Pan map | TABLE STAKES |
| Pinch | Zoom in/out | TABLE STAKES |
| Double-tap | Zoom in | TABLE STAKES |
| Two-finger drag | Tilt/rotate (optional - can disable) | NICE TO HAVE |
| Tap marker | Open popup | TABLE STAKES |
| Tap elsewhere | Close popup | TABLE STAKES |
| Long press marker | Quick actions menu (optional) | NICE TO HAVE |

### Keyboard Interactions (Accessibility)

| Interaction | Expected Behavior | Priority |
|-------------|-------------------|----------|
| Tab | Move focus between markers | REQUIRED (a11y) |
| Enter/Space | Activate focused marker | REQUIRED (a11y) |
| Escape | Close popup, return focus to map | REQUIRED (a11y) |
| Arrow keys | Pan map when focused | NICE TO HAVE |
| +/- | Zoom in/out | NICE TO HAVE |

---

## Mobile Considerations

### Critical for v1.1

| Consideration | Why Important | Implementation Notes |
|---------------|--------------|---------------------|
| **Touch-friendly marker size** | 44x44px minimum touch target (WCAG) | Current markers are 44px - maintain this |
| **Smooth pinch-to-zoom** | Janky zoom feels broken to users | MapLibre's WebGL rendering handles this well |
| **Map/list toggle on small screens** | Can't show both; need easy switching | Bottom sheet pattern or tabs |
| **Popup positioning** | Popup shouldn't overflow screen edge | MapLibre auto-positions; verify implementation |
| **Reduced initial load** | Mobile networks are slower | Lazy load markers outside viewport |

### Mobile Layout Patterns

**Pattern 1: Bottom Sheet (Recommended)**
- Map fills screen
- Business list in collapsible bottom sheet
- Pull up to expand list, pull down to focus map
- Used by: Google Maps, Apple Maps, Uber

**Pattern 2: Tab Toggle**
- Toggle between "Map" and "List" views
- Simpler to implement
- Less seamless than bottom sheet
- Used by: Yelp, many directory apps

**Pattern 3: Split View (Landscape Only)**
- Side-by-side on tablets
- Not suitable for phones in portrait

**Recommendation:** Implement bottom sheet pattern for /map page, tab toggle for /search page (since it's search-first).

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance (Required)

| Requirement | How to Address |
|-------------|----------------|
| **Keyboard navigable** | All markers must be reachable via Tab |
| **Focus visible** | Clear focus ring on focused marker |
| **Screen reader support** | Markers need aria-labels with business name |
| **Sufficient contrast** | Marker icons need 4.5:1 contrast ratio |
| **Non-color indicators** | Don't rely solely on color - use icons |
| **Skip link** | "Skip to results" link to bypass map |
| **Text alternatives** | Map should have accessible name |

### Implementation Notes

MapLibre accessibility is not automatic. Requires:
1. Setting `accessibleTitle` on map container
2. Adding `aria-label` to marker elements
3. Managing focus with JavaScript
4. Providing "skip map" link for screen reader users
5. Announcing marker count and updates

**Confidence:** LOW - MapLibre accessibility features need verification against current documentation. This is an area that commonly requires custom implementation.

---

## Feature Dependencies

```
Marker clustering ─────┬──► Better mobile performance
                       │
                       └──► Cleaner visual at zoom-out

MapLibre migration ────┬──► Vector tiles (better zoom quality)
                       │
                       ├──► WebGL rendering (smoother gestures)
                       │
                       └──► Native clustering support

Bidirectional sync ────┬──► Search updates map bounds
                       │
                       └──► Map bounds filter API query

/map page ─────────────┬──► Full-screen map layout
                       │
                       ├──► Bottom sheet for mobile
                       │
                       └──► URL state sync (shareable links)
```

---

## MVP Recommendation for v1.1

### Phase 1: Foundation (Do First)
1. **MapLibre migration** - Unlocks everything else
2. **Marker clustering** - Required for scale
3. **Search-to-map sync** - Results update map bounds

### Phase 2: Bidirectional Sync
4. **Map-to-search sync** - "Search this area" button
5. **List-map hover sync** - Visual connection between panels

### Phase 3: Dedicated Map Experience
6. **/map exploration page** - Full-screen map-first browsing
7. **Mobile bottom sheet** - Optimal mobile UX
8. **URL state sync** - Shareable map views

### Defer to Post-v1.1
- Custom map styling (aesthetic, not functional)
- Spiderfy overlapping markers (edge case)
- Advanced accessibility (beyond basic keyboard nav)
- Offline support

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Table Stakes | HIGH | Well-established patterns from Google Maps, Yelp, etc. |
| Differentiators | HIGH | Based on competitive analysis patterns |
| Anti-Features | HIGH | Common mistakes documented in training data |
| Mobile Patterns | MEDIUM | Bottom sheet is current best practice but may have evolved |
| Accessibility | LOW | MapLibre-specific a11y needs verification against current docs |
| Implementation Details | MEDIUM | MapLibre API may have updates not in training data |

---

## Sources

- **Current codebase analysis**: `/Users/saeed/Desktop/Manaakhah/components/map/LeafletMap.tsx`, `/Users/saeed/Desktop/Manaakhah/components/map/BusinessMap.tsx`, `/Users/saeed/Desktop/Manaakhah/app/search/page.tsx`
- **PROJECT.md**: Target features for v1.1 milestone
- **Training data**: Map UX patterns from Google Maps, Yelp, Foursquare, Apple Maps (as of training cutoff)
- **WCAG 2.1 Guidelines**: Accessibility requirements

**Note:** WebSearch and WebFetch were unavailable during this research. MapLibre-specific features and current best practices should be verified against official documentation at https://maplibre.org/maplibre-gl-js/docs/ during implementation planning.
