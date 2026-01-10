# Map Troubleshooting Guide

## Current Status

The interactive Leaflet map has been fully implemented with the following features:
- ✅ Leaflet.js with CartoDB Positron tiles
- ✅ Marker clustering with custom icons
- ✅ Category-colored markers (44px) with emoji icons
- ✅ Hover effects and tooltips showing business names
- ✅ Rich popup cards with business details
- ✅ Location-based API filtering (lat/lng/radius)
- ✅ Distance calculation using Haversine formula

## How to Test

### 1. Start the Development Server

```bash
npm run dev
```

Visit: `http://localhost:3000`

### 2. Check Browser Console

Open your browser's Developer Tools (F12) and go to the Console tab. You should see:

```
Fetching businesses near 37.5485, -121.9886 within 10 miles
Received 3 businesses from API: [...]
Rendering 3 businesses on map [...]
```

If you see these logs, the data flow is working correctly.

### 3. Visual Checks

**Map Container:**
- Should see a gray background (600px height) even before tiles load
- This confirms the map container is rendering

**Map Tiles:**
- CartoDB Positron tiles should load (light gray/white background with roads)
- If tiles don't load, check internet connection

**User Location:**
- Blue pulsing dot in the center
- "Your Location" popup when clicked

**Business Markers:**
- Colored circular icons with emojis
- Should see 3 businesses near Fremont, CA:
  1. 🕌 Islamic Center of Fremont (Purple)
  2. 🔧 Bay Area Auto Repair (Orange)
  3. 🍽️ Al-Noor Halal Market (Red/Green)

**Interactions:**
- Hover over marker → scales up + tooltip appears
- Click marker → rich popup card opens
- Zoom out → markers cluster into numbered groups
- Click cluster → zooms in to reveal individual markers

## Common Issues & Solutions

### Issue 1: Map container visible but no tiles

**Symptom:** Gray background shows, but no map tiles load

**Cause:** CartoDB API might be down or network issue

**Solution:**
1. Check internet connection
2. Try a different tile provider
3. Check browser console for network errors

### Issue 2: No markers visible

**Symptom:** Map loads but no business markers appear

**Diagnosis Steps:**

1. **Check API Response**
   ```bash
   curl "http://localhost:3000/api/businesses?lat=37.5485&lng=-121.9886&radius=10"
   ```

   Should return JSON with businesses array

2. **Check Browser Console**
   - Look for "Received X businesses from API"
   - Look for "Rendering X businesses on map"

3. **Check Data Structure**
   - Ensure businesses have `latitude` and `longitude` fields
   - Ensure businesses have `category` field matching CATEGORIES

**Common Causes:**
- API not returning data (check console)
- Business coordinates are null/undefined
- Businesses filtered out by radius (too far away)
- Category mismatch (check CATEGORIES in BusinessMap.tsx)

**Solutions:**
1. Verify mock data has coordinates:
   ```bash
   grep -A 5 "latitude" lib/mock-data/seed-data.ts
   ```

2. Check businesses are PUBLISHED status:
   ```typescript
   status: "PUBLISHED"  // not "DRAFT" or "PENDING_REVIEW"
   ```

3. Increase radius temporarily:
   ```typescript
   // In app/page.tsx
   <BusinessMap radius={50} />  // Try 50 miles instead of 10
   ```

### Issue 3: Markers cluster but don't expand

**Symptom:** See numbered clusters, but clicking doesn't zoom in

**Cause:** `zoomToBoundsOnClick: false` in cluster config

**Solution:** Check LeafletMap.tsx line ~105:
```typescript
zoomToBoundsOnClick: true,  // Should be true
```

### Issue 4: Tooltips don't appear

**Symptom:** Hover over marker, but no business name shows

**Cause:** Tooltip CSS not loading or tooltip not bound

**Solutions:**
1. Check `.leaflet-tooltip` CSS exists in styles
2. Verify `marker.bindTooltip()` is called (LeafletMap.tsx line ~226)

### Issue 5: Map loads then disappears

**Symptom:** Map briefly appears, then vanishes

**Cause:** Component unmounting/remounting, triggering cleanup

**Solution:**
1. Check useEffect dependencies (LeafletMap.tsx line ~63)
2. Ensure `mapRef.current` check prevents re-initialization
3. Check parent component isn't re-rendering excessively

## Debugging Checklist

Run through this checklist if markers aren't visible:

- [ ] Dev server is running (`npm run dev`)
- [ ] Navigate to homepage (http://localhost:3000)
- [ ] Open browser console (F12)
- [ ] See "Fetching businesses..." log
- [ ] See "Received X businesses..." log
- [ ] See "Rendering X businesses..." log
- [ ] Map container has gray background (visible)
- [ ] Map tiles load (see roads/streets)
- [ ] Blue user location dot appears in center
- [ ] Radius circle visible (dashed blue line)
- [ ] Colored business markers appear on map

## API Endpoint Test

Test the businesses API directly:

```bash
# Test with curl
curl -s "http://localhost:3000/api/businesses?lat=37.5485&lng=-121.9886&radius=10" | jq '.[] | {name, category, latitude, longitude, distance}'
```

Expected output:
```json
{
  "name": "Islamic Center of Fremont",
  "category": "MASJID",
  "latitude": 37.5502,
  "longitude": -121.9816,
  "distance": 0.123
}
```

## Code Locations

**Key Files:**
- `components/map/BusinessMap.tsx` - Filter UI, data fetching
- `components/map/LeafletMap.tsx` - Map rendering, markers
- `app/api/businesses/route.ts` - API with location filtering
- `lib/mock-data/seed-data.ts` - Mock business data
- `lib/mock-data/client.ts` - Mock database findMany

**Important Functions:**
- `fetchNearbyBusinesses()` - Calls API (BusinessMap.tsx:82)
- `initializeMap()` - Sets up Leaflet (LeafletMap.tsx:68)
- `calculateDistance()` - Haversine formula (route.ts:46)
- `createPopupContent()` - Popup HTML (LeafletMap.tsx:414)

**Marker Creation:**
- Marker icon defined: LeafletMap.tsx:237-275
- Tooltip bound: LeafletMap.tsx:265-270
- Popup bound: LeafletMap.tsx:273-278
- Hover effects: LeafletMap.tsx:280-371
- Click handler: LeafletMap.tsx:373-375

## Console Commands for Debugging

Run these in browser console while on the map page:

```javascript
// Check if businesses were fetched
console.log('Businesses loaded:', window.localStorage.getItem('mock-businesses'))

// Count published businesses
JSON.parse(window.localStorage.getItem('mock-businesses') || '[]')
  .filter(b => b.status === 'PUBLISHED').length

// Check if Leaflet is loaded
console.log('Leaflet loaded:', typeof L !== 'undefined')

// Check if map instance exists
console.log('Map layers:', document.querySelectorAll('.leaflet-marker-icon').length)
```

## Expected Behavior

### On Page Load:
1. Gray map container appears immediately
2. "Fetching businesses..." logged to console
3. API call made to `/api/businesses?lat=...&lng=...&radius=...`
4. "Received X businesses..." logged with data
5. Map tiles begin loading (white/gray with roads)
6. Blue user location dot appears with pulsing animation
7. Dashed radius circle appears
8. Business markers appear as colored circles with emoji icons
9. "Rendering X businesses..." logged with count

### On Hover:
1. Cursor changes to pointer
2. Marker scales up to 1.25x
3. Background ring expands
4. Tooltip with business name appears above marker

### On Click:
1. Rich popup card opens
2. Shows business image/gradient
3. Shows name, category, rating, tags, address
4. "View Details" button links to business page
5. selectedBusiness state updates
6. Detail panel appears below map

### On Zoom Out:
1. Nearby markers combine into clusters
2. Cluster shows count (e.g., "3")
3. Cluster size increases with marker count
4. Blue gradient cluster icons

### On Zoom In:
1. Clusters expand back into individual markers
2. All marker details become visible again

## What the Logs Tell You

**"Fetching businesses near X, Y within Z miles"**
→ Map component is mounted and calling API

**"Received 0 businesses from API"**
→ API returned empty array - check business status or radius

**"Received X businesses from API: [...]"**
→ API working, check if businesses have coordinates

**"Rendering X businesses on map"**
→ Marker creation loop is running

**"MarkerClusterGroup is not available"**
→ leaflet.markercluster plugin didn't load - check dynamic import

**No logs at all**
→ Component might not be rendering - check React dev tools

## Quick Fixes

### Reset Mock Data
```javascript
// In browser console
localStorage.clear()
location.reload()
```

### Force All Businesses to PUBLISHED
```javascript
// In browser console
const businesses = JSON.parse(localStorage.getItem('mock-businesses') || '[]')
businesses.forEach(b => b.status = 'PUBLISHED')
localStorage.setItem('mock-businesses', JSON.stringify(businesses))
location.reload()
```

### Manually Add Test Business
```javascript
const businesses = JSON.parse(localStorage.getItem('mock-businesses') || '[]')
businesses.push({
  id: 'test-1',
  name: 'Test Business',
  category: 'RESTAURANT',
  latitude: 37.5485,
  longitude: -121.9886,
  status: 'PUBLISHED',
  tags: ['MUSLIM_OWNED'],
  // ... other required fields
})
localStorage.setItem('mock-businesses', JSON.stringify(businesses))
location.reload()
```

## Success Criteria

Map is working correctly when:
1. ✅ Gray background visible (map container rendered)
2. ✅ Map tiles load (CartoDB Positron)
3. ✅ Blue user location dot appears and pulses
4. ✅ Dashed radius circle visible
5. ✅ Colored emoji markers appear for each business
6. ✅ Console shows "Received X businesses" and "Rendering X businesses"
7. ✅ Hovering marker shows tooltip with business name
8. ✅ Clicking marker opens popup card
9. ✅ Zoom out creates clusters
10. ✅ Zoom in expands clusters

## Next Steps

If markers still aren't visible after checking everything above:

1. **Enable Verbose Logging**
   - Add more console.logs throughout LeafletMap.tsx
   - Log each marker creation: `console.log('Creating marker for', business.name)`

2. **Test with Hardcoded Data**
   - Temporarily hardcode a business array in LeafletMap
   - Bypass API to test if marker rendering works

3. **Check Leaflet Version**
   - Ensure leaflet and react-leaflet versions are compatible
   - Check package.json for version conflicts

4. **Browser Compatibility**
   - Test in Chrome, Firefox, Safari
   - Check for browser-specific CSS issues

5. **Network Tab**
   - Open DevTools → Network tab
   - Check if tile requests are succeeding
   - Check API request/response

## Contact Points

If you've gone through all troubleshooting steps and markers still aren't visible, provide:

1. Screenshot of browser console (with all logs)
2. Screenshot of Network tab (API call)
3. Output of: `curl "http://localhost:3000/api/businesses?lat=37.5485&lng=-121.9886&radius=10"`
4. Browser and version you're using

This will help identify the exact issue quickly.

---

**Last Updated:** January 9, 2026
**Map Implementation:** Leaflet.js with marker clustering
**Total Markers Expected:** 3-5 in Fremont area (depending on seed data)
