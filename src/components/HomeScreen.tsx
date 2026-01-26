import { useState, useEffect } from 'react';
import { MapPin, Navigation, ChevronRight, Map as MapIcon, Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationSearch } from '@/components/LocationSearch';
import { calculateDistance, formatDistance } from '@/hooks/useGeolocation';

interface HomeScreenProps {
  currentPosition: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number; name?: string } | null;
  isLoadingLocation: boolean;
  onSetDestination: (lat: number, lng: number, name: string) => void;
  onOpenMap: () => void;
  onUseCurrentLocation: () => void;
  onStartAlarm: () => void;
  onOpenSettings: () => void;
}

// Estimate travel time based on distance
const estimateTravelTime = (distanceMeters: number): string => {
  const avgSpeedKmH = 30;
  const hours = distanceMeters / 1000 / avgSpeedKmH;
  const minutes = Math.round(hours * 60);
  
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const HomeScreen = ({
  currentPosition,
  destination,
  isLoadingLocation,
  onSetDestination,
  onOpenMap,
  onUseCurrentLocation,
  onStartAlarm,
  onOpenSettings,
}: HomeScreenProps) => {
  const [destinationName, setDestinationName] = useState<string>('');

  // Update destination name when destination changes from map selection
  useEffect(() => {
    if (destination?.name) {
      setDestinationName(destination.name);
    }
  }, [destination?.name]);

  const handleSelectDestination = (lat: number, lng: number, name: string) => {
    setDestinationName(name);
    onSetDestination(lat, lng, name);
  };

  const distance = currentPosition && destination
    ? calculateDistance(currentPosition.lat, currentPosition.lng, destination.lat, destination.lng)
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-6 pt-10 safe-area-top">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Travel Alarm</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-muted-foreground">
          Never miss your stop again. Set your destination and we'll wake you up.
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Current Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            Your Location
          </label>
          <div className="glass-panel p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/20">
                  <Navigation className="w-5 h-5 text-success" />
                </div>
                <div>
                  {isLoadingLocation ? (
                    <p className="text-foreground">Getting your location...</p>
                  ) : currentPosition ? (
                    <>
                      <p className="text-foreground font-medium">Current Location</p>
                      <p className="text-xs text-muted-foreground">
                        {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Location unavailable</p>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onUseCurrentLocation}
                disabled={isLoadingLocation}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Destination */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Destination
          </label>
          
          {/* Search Input */}
          <LocationSearch
            placeholder="Search for your destination..."
            onSelectLocation={handleSelectDestination}
            value={destinationName}
          />

          {/* Or Select on Map */}
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={onOpenMap}
          >
            <span className="flex items-center gap-2">
              <MapIcon className="w-4 h-4" />
              Select on map
            </span>
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Selected Destination with Distance/Time */}
          {destination && (
            <div className="glass-panel p-4 rounded-xl mt-3 border border-primary/30 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/20">
                  <MapPin className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground font-medium">
                    {destination.name || 'Selected Location'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                  </p>
                </div>
              </div>
              
              {/* Distance and Time */}
              {distance !== null && (
                <div className="flex items-center justify-around pt-2 border-t border-border">
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">{formatDistance(distance)}</p>
                    <p className="text-xs text-muted-foreground">Distance</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">{estimateTravelTime(distance)}</p>
                    <p className="text-xs text-muted-foreground">Est. Time</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action */}
      <div className="p-6 pb-8 safe-area-bottom">
        <Button
          onClick={onStartAlarm}
          disabled={!destination || !currentPosition}
          size="lg"
          className="w-full py-6 font-bold text-base bg-primary hover:bg-primary/90 text-primary-foreground glow-primary disabled:opacity-50"
        >
          <Bell className="w-5 h-5 mr-2" />
          Set Up Alarm
        </Button>
        {!currentPosition && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Please enable location access to continue
          </p>
        )}
        {currentPosition && !destination && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Search or select a destination to continue
          </p>
        )}
      </div>
    </div>
  );
};
