import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export type MapTheme = 'dark' | 'light' | 'satellite' | 'traffic';

interface MapThemeConfig {
  url: string;
  attribution: string;
  background: string;
}

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
    // CartoDB Voyager Labels Under - clear roads with prominent labels
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    background: 'hsl(0, 0%, 95%)',
  },
};

// Custom icons
const createCurrentLocationIcon = () => L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 20px;
    height: 20px;
    background: hsl(174, 72%, 50%);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const createDestinationIcon = () => L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 24px;
    height: 24px;
    background: hsl(0, 84%, 60%);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
    "></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface MapProps {
  currentPosition: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  alertRadius: number;
  onMapClick: (lat: number, lng: number) => void;
  isAlarmActive: boolean;
  showRoute?: boolean;
  theme?: MapTheme;
}

export const Map = ({ currentPosition, destination, alertRadius, onMapClick, isAlarmActive, showRoute = true, theme = 'dark' }: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const currentMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
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
      zoomControl: true,
    });

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

  // Update destination marker and circle
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing destination elements
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }
    if (routeLineRef.current) {
      routeLineRef.current.remove();
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

    // Add route line from current position to destination
    if (showRoute && currentPosition) {
      routeLineRef.current = L.polyline(
        [
          [currentPosition.lat, currentPosition.lng],
          [destination.lat, destination.lng]
        ],
        {
          color: 'hsl(174, 72%, 50%)',
          weight: 3,
          opacity: 0.7,
          dashArray: '10, 10',
        }
      ).addTo(mapRef.current);

      // Fit map to show both points
      const bounds = L.latLngBounds(
        [currentPosition.lat, currentPosition.lng],
        [destination.lat, destination.lng]
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [destination, alertRadius, isAlarmActive, currentPosition, showRoute]);

  return (
    <div 
      ref={mapContainerRef} 
      className="h-full w-full"
      style={{ background: themeConfig.background }}
    />
  );
};
