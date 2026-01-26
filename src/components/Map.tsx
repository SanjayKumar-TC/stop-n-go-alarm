import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const currentLocationIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 20px;
    height: 20px;
    background: hsl(174 72% 50%);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const destinationIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 24px;
    height: 24px;
    background: hsl(0 84% 60%);
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
}

// Component to handle map events
const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to recenter map
const RecenterMap = ({ position }: { position: { lat: number; lng: number } }) => {
  const map = useMap();
  const hasRecentered = useRef(false);

  useEffect(() => {
    if (position && !hasRecentered.current) {
      map.setView([position.lat, position.lng], 15);
      hasRecentered.current = true;
    }
  }, [map, position]);

  return null;
};

export const Map = ({ currentPosition, destination, alertRadius, onMapClick, isAlarmActive }: MapProps) => {
  const defaultCenter: [number, number] = [20.5937, 78.9629]; // India center

  return (
    <MapContainer
      center={currentPosition ? [currentPosition.lat, currentPosition.lng] : defaultCenter}
      zoom={15}
      className="map-container h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      <MapEvents onMapClick={onMapClick} />
      
      {currentPosition && (
        <>
          <RecenterMap position={currentPosition} />
          <Marker 
            position={[currentPosition.lat, currentPosition.lng]} 
            icon={currentLocationIcon}
          />
        </>
      )}
      
      {destination && (
        <>
          <Marker 
            position={[destination.lat, destination.lng]} 
            icon={destinationIcon}
          />
          <Circle
            center={[destination.lat, destination.lng]}
            radius={alertRadius}
            pathOptions={{
              color: isAlarmActive ? 'hsl(0, 84%, 60%)' : 'hsl(174, 72%, 50%)',
              fillColor: isAlarmActive ? 'hsl(0, 84%, 60%)' : 'hsl(174, 72%, 50%)',
              fillOpacity: 0.15,
              weight: 2,
            }}
          />
        </>
      )}
    </MapContainer>
  );
};
