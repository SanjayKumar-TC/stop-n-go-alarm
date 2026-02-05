import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate';
import { Locate, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Decode polyline from OSRM response
const decodePolyline = (encoded: string): [number, number][] => {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
};

// Fetch route from OSRM
const fetchRoute = async (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<[number, number][] | null> => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=polyline`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 'Ok' && data.routes?.[0]?.geometry) {
      return decodePolyline(data.routes[0].geometry);
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch route:', error);
    return null;
  }
};

export type MapTheme = 'dark' | 'light' | 'satellite' | 'traffic';

interface MapThemeConfig {
  url: string;
  attribution: string;
  background: string;
  trafficUrl?: string;
}

// TomTom API key for traffic layer
const TOMTOM_API_KEY = '62IjLnK5pVM2HxLhdXPN63bcrG8jvbYt';

// High-quality map themes with clear labels (no API key required)
const MAP_THEMES: Record<MapTheme, MapThemeConfig & { labelsUrl?: string }> = {
  dark: {
    // CartoDB Dark Matter - dark theme with visible labels
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    background: 'hsl(220, 25%, 8%)',
  },
  light: {
    // CartoDB Voyager - Google Maps-like with colorful, readable labels
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    background: 'hsl(0, 0%, 98%)',
  },
  satellite: {
    // Esri World Imagery with labels overlay
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labelsUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    background: 'hsl(220, 25%, 15%)',
  },
  traffic: {
    // Light base map with TomTom traffic overlay
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    trafficUrl: `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}&tileSize=256`,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.tomtom.com">TomTom</a>',
    background: 'hsl(0, 0%, 98%)',
  },
};

// Custom icons with high z-index for visibility
const createCurrentLocationIcon = () => {
  // Google Maps-style: blue dot with pulsing ring and directional cone
  // Cone is always rendered but hidden via CSS when no heading
  return L.divIcon({
    className: 'current-location-marker',
    html: `<div class="gmap-location-container">
      <div class="location-pulse-ring-gmap"></div>
      <div class="location-direction-cone" style="opacity: 0;"></div>
      <div class="location-dot-gmap"></div>
    </div>`,
    iconSize: [80, 80],
    iconAnchor: [40, 40],
  });
};

const createDestinationIcon = () => L.divIcon({
  className: 'destination-marker',
  html: `<div class="destination-marker-container">
    <div class="destination-marker-dot">
      <div class="destination-marker-inner"></div>
    </div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface MapProps {
  currentPosition: { lat: number; lng: number } | null;
  heading: number | null;
  destination: { lat: number; lng: number } | null;
  alertRadius: number;
  onMapClick: (lat: number, lng: number) => void;
  isAlarmActive: boolean;
  showRoute?: boolean;
  theme?: MapTheme;
  buttonOffsetBottom?: string;
}

export const Map = ({ currentPosition, heading, destination, alertRadius, onMapClick, isAlarmActive, showRoute = true, theme = 'dark', buttonOffsetBottom = 'bottom-4' }: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const currentMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const trafficLayerRef = useRef<L.TileLayer | null>(null);
  const hasInitializedRef = useRef(false);

  const themeConfig = MAP_THEMES[theme];

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] = [20.5937, 78.9629]; // India center
    const center = currentPosition 
      ? [currentPosition.lat, currentPosition.lng] as [number, number]
      : defaultCenter;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 15,
      zoomControl: false,
      rotate: true,
      rotateControl: {
        closeOnZeroBearing: false,
      },
      touchRotate: true,
      shiftKeyRotate: true,
      bearing: 0,
    } as L.MapOptions & { rotate?: boolean; rotateControl?: any; touchRotate?: boolean; shiftKeyRotate?: boolean; bearing?: number });

    // Initial tile layer with retina support
    tileLayerRef.current = L.tileLayer(themeConfig.url, {
      attribution: themeConfig.attribution,
      maxZoom: 20,
      tileSize: 256,
    }).addTo(map);

    // Add labels layer for satellite view
    if (themeConfig.labelsUrl) {
      labelsLayerRef.current = L.tileLayer(themeConfig.labelsUrl, {
        maxZoom: 20,
        tileSize: 256,
      }).addTo(map);
    }

    // Add traffic layer if available
    if (themeConfig.trafficUrl) {
      trafficLayerRef.current = L.tileLayer(themeConfig.trafficUrl, {
        maxZoom: 20,
        tileSize: 256,
        opacity: 0.8,
      }).addTo(map);
    }

    // Handle map clicks
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update tile layer when theme changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old tile layers
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }
    if (labelsLayerRef.current) {
      labelsLayerRef.current.remove();
      labelsLayerRef.current = null;
    }
    if (trafficLayerRef.current) {
      trafficLayerRef.current.remove();
      trafficLayerRef.current = null;
    }

    // Add new tile layer with retina support
    tileLayerRef.current = L.tileLayer(themeConfig.url, {
      attribution: themeConfig.attribution,
      maxZoom: 20,
      tileSize: 256,
    }).addTo(mapRef.current);

    // Add labels layer for satellite view
    if (themeConfig.labelsUrl) {
      labelsLayerRef.current = L.tileLayer(themeConfig.labelsUrl, {
        maxZoom: 20,
        tileSize: 256,
      }).addTo(mapRef.current);
    }

    // Add traffic layer if available
    if (themeConfig.trafficUrl) {
      trafficLayerRef.current = L.tileLayer(themeConfig.trafficUrl, {
        maxZoom: 20,
        tileSize: 256,
        opacity: 0.8,
      }).addTo(mapRef.current);
    }
  }, [theme, themeConfig]);

  // Update click handler when onMapClick changes
  useEffect(() => {
    if (!mapRef.current) return;
    
    mapRef.current.off('click');
    mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });
  }, [onMapClick]);

  // Update current position marker and center map once
  useEffect(() => {
    if (!mapRef.current || !currentPosition) return;

    // Center map on first position
    if (!hasInitializedRef.current) {
      mapRef.current.setView([currentPosition.lat, currentPosition.lng], 15);
      hasInitializedRef.current = true;
    }

    // Update or create current location marker
    if (currentMarkerRef.current) {
      currentMarkerRef.current.setLatLng([currentPosition.lat, currentPosition.lng]);
    } else {
      currentMarkerRef.current = L.marker([currentPosition.lat, currentPosition.lng], {
        icon: createCurrentLocationIcon(),
      }).addTo(mapRef.current);
    }
  }, [currentPosition]);

  // Smoothly update heading rotation without recreating the icon
  useEffect(() => {
    if (!currentMarkerRef.current) return;

    const markerElement = currentMarkerRef.current.getElement();
    if (!markerElement) return;

    const cone = markerElement.querySelector('.location-direction-cone') as HTMLElement;
    if (!cone) return;

    if (heading !== null && !isNaN(heading)) {
      const rotation = heading - 90; // Adjust so 0° points up
      cone.style.opacity = '1';
      cone.style.transform = `rotate(${rotation}deg)`;
    } else {
      cone.style.opacity = '0';
    }
  }, [heading]);

  // Update destination marker and circle
  useEffect(() => {
    if (!mapRef.current) return;

    // Track if this effect is still valid (not cleaned up)
    let isActive = true;

    // Fade out and remove existing destination elements
    const fadeOutAndRemove = (layer: L.Layer, duration: number = 300) => {
      const element = (layer as any)._path || (layer as any)._icon;
      if (element) {
        element.style.transition = `opacity ${duration}ms ease-out`;
        element.style.opacity = '0';
        setTimeout(() => layer.remove(), duration);
      } else {
        layer.remove();
      }
    };

    if (destinationMarkerRef.current) {
      fadeOutAndRemove(destinationMarkerRef.current);
      destinationMarkerRef.current = null;
    }
    if (circleRef.current) {
      fadeOutAndRemove(circleRef.current);
      circleRef.current = null;
    }
    if (routeLineRef.current) {
      // Also fade out the border if it exists
      if ((routeLineRef.current as any)._border) {
        fadeOutAndRemove((routeLineRef.current as any)._border);
      }
      fadeOutAndRemove(routeLineRef.current);
      routeLineRef.current = null;
    }

    if (!destination) return;

    // Add destination marker
    destinationMarkerRef.current = L.marker([destination.lat, destination.lng], {
      icon: createDestinationIcon(),
    }).addTo(mapRef.current);

    // Add alert circle
    const circleColor = isAlarmActive ? 'hsl(0, 84%, 60%)' : 'hsl(174, 72%, 50%)';
    circleRef.current = L.circle([destination.lat, destination.lng], {
      radius: alertRadius,
      color: circleColor,
      fillColor: circleColor,
      fillOpacity: 0.15,
      weight: 2,
    }).addTo(mapRef.current);

    // Fetch and draw actual route from current position to destination
    if (showRoute && currentPosition) {
      const drawRoute = async () => {
        const routePoints = await fetchRoute(currentPosition, destination);
        
        // Check if effect was cleaned up while fetching
        if (!isActive || !mapRef.current) return;
        
        if (routePoints) {
          // Ensure route connects exactly to markers
          const fullRoute: [number, number][] = [
            [currentPosition.lat, currentPosition.lng], // Start at current location
            ...routePoints,
            [destination.lat, destination.lng] // End at destination
          ];

          // Draw dark border/outline first for depth
          const routeBorder = L.polyline(fullRoute, {
            color: '#1a365d', // Dark navy blue border
            weight: 8,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
            smoothFactor: 0, // Instant rendering during zoom
            interactive: false, // Non-interactive for performance
          }).addTo(mapRef.current);

          // Draw the main route on top with brighter blue
          routeLineRef.current = L.polyline(fullRoute, {
            color: '#3b82f6', // Bright blue route
            weight: 5,
            opacity: 1,
            lineCap: 'round',
            lineJoin: 'round',
            smoothFactor: 0, // Instant rendering during zoom
            interactive: false, // Non-interactive for performance
          }).addTo(mapRef.current);

          // Store border for cleanup
          (routeLineRef.current as any)._border = routeBorder;

          // Fit map to show the route with smooth animation
          const bounds = routeLineRef.current.getBounds();
          mapRef.current.fitBounds(bounds, { 
            padding: [50, 50],
            animate: true,
            duration: 0.8,
          });
        } else if (mapRef.current) {
          // Fallback to straight line if route fetch fails
          routeLineRef.current = L.polyline(
            [
              [currentPosition.lat, currentPosition.lng],
              [destination.lat, destination.lng]
            ],
            {
              color: '#1e40af',
              weight: 4,
              opacity: 0.8,
              dashArray: '12, 8',
              smoothFactor: 0,
              interactive: false,
            }
          ).addTo(mapRef.current);

          const bounds = L.latLngBounds(
            [currentPosition.lat, currentPosition.lng],
            [destination.lat, destination.lng]
          );
          mapRef.current.fitBounds(bounds, { 
            padding: [50, 50],
            animate: true,
            duration: 0.8,
          });
        }
      };

      drawRoute();
    }

    // Cleanup function to prevent stale route drawing
    return () => {
      isActive = false;
    };
  }, [destination, alertRadius, isAlarmActive, currentPosition, showRoute]);

  const handleLocateMe = () => {
    if (mapRef.current && currentPosition) {
      mapRef.current.setView([currentPosition.lat, currentPosition.lng], 16, {
        animate: true,
        duration: 0.5,
      });
    }
  };

  const handleResetNorth = () => {
    if (mapRef.current) {
      (mapRef.current as any).setBearing(0);
    }
  };

  return (
    <div className="relative h-full w-full">
      <div 
        ref={mapContainerRef} 
        className="h-full w-full"
        style={{ background: themeConfig.background }}
      />
      <div className={`absolute ${buttonOffsetBottom} right-4 z-[1000] flex flex-col gap-2`}>
        <Button
          onClick={handleResetNorth}
          size="icon"
          variant="secondary"
          className="h-10 w-10 rounded-full shadow-lg bg-background/90 backdrop-blur-sm hover:bg-background"
          title="Reset to North"
        >
          <Compass className="h-5 w-5" />
        </Button>
        {currentPosition && (
          <Button
            onClick={handleLocateMe}
            size="icon"
            variant="secondary"
            className="h-10 w-10 rounded-full shadow-lg bg-background/90 backdrop-blur-sm hover:bg-background"
            title="My location"
          >
            <Locate className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
