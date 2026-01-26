import { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Bell, Settings, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationSearch } from '@/components/LocationSearch';
import { Map } from '@/components/Map';
import { calculateDistance, formatDistance } from '@/hooks/useGeolocation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [isMapExpanded, setIsMapExpanded] = useState(false);

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

  const handleMapClick = (lat: number, lng: number) => {
    onSetDestination(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  const distance = currentPosition && destination
    ? calculateDistance(currentPosition.lat, currentPosition.lng, destination.lat, destination.lng)
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 pt-10 safe-area-top">
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
        <p className="text-sm text-muted-foreground">
          Never miss your stop again
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 space-y-4 overflow-y-auto pb-4">
        {/* Current Location */}
        <div className="glass-panel p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <Navigation className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Your Location</p>
                {isLoadingLocation ? (
                  <p className="text-sm text-foreground">Getting location...</p>
                ) : currentPosition ? (
                  <p className="text-sm text-foreground font-medium">
                    {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Unavailable</p>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onUseCurrentLocation}
              disabled={isLoadingLocation}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Destination Search */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            Search Destination
          </label>
          <LocationSearch
            placeholder="Search for your destination..."
            onSelectLocation={handleSelectDestination}
            value={destinationName}
          />
        </div>

        {/* Collapsible Map */}
        <Collapsible open={isMapExpanded} onOpenChange={setIsMapExpanded}>
          <div className="glass-panel rounded-xl overflow-hidden">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between p-3 h-auto hover:bg-muted/50"
              >
                <span className="text-sm font-medium text-foreground">
                  {isMapExpanded ? 'Map View' : 'Tap to select on map'}
                </span>
                {isMapExpanded ? (
                  <Minimize2 className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            {/* Mini map preview when collapsed */}
            {!isMapExpanded && (
              <div 
                className="h-32 relative cursor-pointer"
                onClick={() => setIsMapExpanded(true)}
              >
                <Map
                  currentPosition={currentPosition}
                  destination={destination}
                  alertRadius={1000}
                  onMapClick={handleMapClick}
                  isAlarmActive={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
                <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-muted-foreground">
                  Tap to expand map
                </p>
              </div>
            )}

            <CollapsibleContent>
              <div className={`transition-all duration-300 ${isMapExpanded ? 'h-64' : 'h-0'}`}>
                <Map
                  currentPosition={currentPosition}
                  destination={destination}
                  alertRadius={1000}
                  onMapClick={handleMapClick}
                  isAlarmActive={false}
                />
              </div>
              <div className="p-2 text-center border-t border-border">
                <p className="text-xs text-muted-foreground">Tap on map to set destination</p>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Travel Details */}
        <div className="glass-panel rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Travel Details</h3>
          
          {destination ? (
            <>
              {/* Destination Info */}
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="p-2 rounded-lg bg-destructive/20">
                  <MapPin className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Destination</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {destination.name || 'Selected Location'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                  </p>
                </div>
              </div>

              {/* Distance and Time */}
              {distance !== null && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xl font-bold text-foreground">{formatDistance(distance)}</p>
                    <p className="text-xs text-muted-foreground">Distance</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xl font-bold text-foreground">{estimateTravelTime(distance)}</p>
                    <p className="text-xs text-muted-foreground">Est. Time</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No destination selected</p>
              <p className="text-xs">Search or tap on the map above</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action */}
      <div className="p-4 pb-6 safe-area-bottom border-t border-border bg-background">
        <Button
          onClick={onStartAlarm}
          disabled={!destination || !currentPosition}
          size="lg"
          className="w-full py-5 font-bold text-base bg-primary hover:bg-primary/90 text-primary-foreground glow-primary disabled:opacity-50"
        >
          <Bell className="w-5 h-5 mr-2" />
          Set Up Alarm
        </Button>
        {!currentPosition && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Please enable location access
          </p>
        )}
      </div>
    </div>
  );
};
