import { ArrowLeft, MapPin, Clock, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Map } from '@/components/Map';
import { LocationSearch } from '@/components/LocationSearch';
import { formatDistance, calculateDistance } from '@/hooks/useGeolocation';

interface MapViewProps {
  currentPosition: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number; name?: string } | null;
  alertRadius: number;
  isAlarmActive: boolean;
  onMapClick: (lat: number, lng: number) => void;
  onBack: () => void;
  onConfirm: () => void;
  onSearchSelect: (lat: number, lng: number, name: string) => void;
}

// Estimate travel time based on distance (assuming average speed of 30 km/h for local transport)
const estimateTravelTime = (distanceMeters: number): string => {
  const avgSpeedKmH = 30; // Average speed for local transport
  const hours = distanceMeters / 1000 / avgSpeedKmH;
  const minutes = Math.round(hours * 60);
  
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const MapView = ({
  currentPosition,
  destination,
  alertRadius,
  isAlarmActive,
  onMapClick,
  onBack,
  onConfirm,
  onSearchSelect,
}: MapViewProps) => {
  const distance = currentPosition && destination
    ? calculateDistance(currentPosition.lat, currentPosition.lng, destination.lat, destination.lng)
    : null;

  return (
    <div className="h-screen w-screen relative">
      {/* Map */}
      <Map
        currentPosition={currentPosition}
        destination={destination}
        alertRadius={alertRadius}
        onMapClick={onMapClick}
        isAlarmActive={isAlarmActive}
        buttonOffsetBottom="bottom-44"
      />

      {/* Header with back button and search */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pt-10 safe-area-top">
        <div className="glass-panel rounded-xl p-3 space-y-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="flex-shrink-0 h-10 w-10 bg-muted/50 hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <LocationSearch
                placeholder="Search destination..."
                onSelectLocation={onSearchSelect}
                value={destination?.name || ''}
                currentPosition={currentPosition}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Or tap on the map to set destination
          </p>
        </div>
      </div>

      {/* Current Location Indicator */}
      {currentPosition && (
        <div className="absolute top-36 left-4 z-[1000]">
          <div className="glass-panel rounded-lg px-3 py-2 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-success" />
            <span className="text-xs text-muted-foreground">You are here</span>
          </div>
        </div>
      )}

      {/* Bottom Panel with Distance and Time */}
      {destination && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] p-4 pb-8 safe-area-bottom">
          <div className="glass-panel rounded-xl p-4 space-y-4">
            {/* Distance and Time Info */}
            {distance !== null && (
              <div className="flex items-center justify-around py-2 border-b border-border">
                <div className="flex items-center gap-2 text-center">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-lg font-bold text-foreground">{formatDistance(distance)}</p>
                    <p className="text-xs text-muted-foreground">Distance</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="flex items-center gap-2 text-center">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-lg font-bold text-foreground">{estimateTravelTime(distance)}</p>
                    <p className="text-xs text-muted-foreground">Est. Time</p>
                  </div>
                </div>
              </div>
            )}

            {/* Destination Info */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/20">
                <MapPin className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {destination.name || 'Selected Location'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                </p>
              </div>
            </div>

            <Button
              onClick={onConfirm}
              size="lg"
              className="w-full py-5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Confirm Location
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
