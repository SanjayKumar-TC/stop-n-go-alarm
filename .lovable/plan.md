
# Fix Route Line Attachment to Markers

## Problem
The route line from OSRM doesn't connect directly to the current location and destination markers. This happens because OSRM snaps the route to the nearest road, which may be several meters away from the actual marker positions.

## Solution
Modify the route drawing logic to:
1. Prepend the current location coordinates to the start of the route
2. Append the destination coordinates to the end of the route

This ensures the polyline always starts exactly at the user's location marker and ends exactly at the destination marker.

## Changes

### File: `src/components/Map.tsx`

**Modify the route drawing section (around lines 357-380):**

After fetching route points from OSRM, add the current position at the start and destination at the end of the route array:

```typescript
if (routePoints && mapRef.current) {
  // Ensure route connects exactly to markers
  const fullRoute: [number, number][] = [
    [currentPosition.lat, currentPosition.lng], // Start at current location
    ...routePoints,
    [destination.lat, destination.lng] // End at destination
  ];

  // Draw dark border/outline first for depth
  const routeBorder = L.polyline(fullRoute, { ... });

  // Draw the main route on top with brighter blue
  routeLineRef.current = L.polyline(fullRoute, { ... });
}
```

---

## Technical Details

- The OSRM API snaps coordinates to the nearest road network point
- By adding the exact marker coordinates at the start and end, we create short connecting segments from the markers to the road
- The `smoothFactor: 0` already ensures instant rendering during zoom
- The `lineCap: 'round'` and `lineJoin: 'round'` options ensure smooth visual connections
