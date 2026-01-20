# Phase 4: Map-to-Search Sync - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can explore the map by panning/zooming and then search the visible area. This is the reverse direction of Phase 3's search-to-map sync. Bidirectional sync enables map-first discovery while keeping search filters relevant.

</domain>

<decisions>
## Implementation Decisions

### Trigger behavior
- **Button only** — User must click "Search this area" to refresh results (no auto-refresh on pan)
- Button appears after **any map movement** (pan or zoom), not just significant changes
- Existing results **fade/dim** while user explores to indicate they may not match current view
- Results stay visible (not removed) until user explicitly triggers new search

### Button placement & visibility
- Button positioned at **bottom center of map** area
- Use **standard button style** matching site's existing UI components
- Button shows **spinner inside** while fetching, stays visible until results load
- Button text: "Search this area" (or similar)

### Claude's Discretion
- Button entrance animation (fade, slide, or pop)
- Marker interactivity during stale state (whether clicking markers works while results are stale)
- Exact opacity/styling for stale results indication
- Debounce timing for detecting map movement has stopped

</decisions>

<specifics>
## Specific Ideas

- The fade/dim pattern for stale results is similar to how Google Maps shows "Move map to update results"
- Button should feel native to the existing UI — don't introduce new design patterns

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-map-to-search-sync*
*Context gathered: 2026-01-19*
