import { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Bell, BellOff, Settings, Maximize2, Minimize2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { LocationSearch } from '@/components/LocationSearch';
import { Map } from '@/components/Map';
import { FavoritesList } from '@/components/FavoritesList';
import { calculateDistance, formatDistance } from '@/hooks/useGeolocation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FavoriteDestination } from '@/hooks/useFavorites';

interface HomeScreenProps {
  currentPosition: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number; name?: string } | null;
  isLoadingLocation: boolean;
  isAlarmActive: boolean;
  isAlarmRinging: boolean;
  alertRadius: number;
  favorites: FavoriteDestination[];
  onSetDestination: (lat: number, lng: number, name: string) => void;
  onUseCurrentLocation: () => void;
  onActivateAlarm: () => void;
  onDeactivateAlarm: () => void;
  onStopAlarm: () => void;
  onAlertRadiusChange: (value: number) => void;
  onOpenSettings: () => void;
  onAddFavorite: (name: string, lat: number, lng: number, icon: FavoriteDestination['icon']) => void;
  onRemoveFavorite: (id: string) => void;
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
  isAlarmActive,
  isAlarmRinging,
  alertRadius,
  favorites,
  onSetDestination,
  onUseCurrentLocation,
  onActivateAlarm,
  onDeactivateAlarm,
  onStopAlarm,
  onAlertRadiusChange,
  onOpenSettings,
  onAddFavorite,
  onRemoveFavorite,
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
    if (isAlarmActive) return;
    onSetDestination(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  const handleSelectFavorite = (fav: FavoriteDestination) => {
    setDestinationName(fav.name);
    onSetDestination(fav.lat, fav.lng, fav.name);
  };

  const distance = currentPosition && destination
    ? calculateDistance(currentPosition.lat, currentPosition.lng, destination.lat, destination.lng)
    : null;

  const isWithinAlertZone = distance !== null && distance <= alertRadius;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 pt-10 safe-area-top">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isAlarmActive ? 'bg-success/20' : 'bg-primary/20'}`}>
              <Bell className={`w-6 h-6 ${isAlarmActive ? 'text-success' : 'text-primary'}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Travel Alarm</h1>
              {isAlarmActive && (
                <p className="text-xs text-success font-medium">Tracking Active</p>
              )}
            </div>
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
        {!isAlarmActive && (
          <p className="text-sm text-muted-foreground">
            Never miss your stop again
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 space-y-4 overflow-y-auto pb-4">
        {/* Alarm Ringing Alert */}
        {isAlarmRinging && (
          <div className="glass-panel rounded-xl p-4 border-2 border-destructive animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-destructive/20">
                <Bell className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-destructive">WAKE UP!</h2>
                <p className="text-sm text-muted-foreground">You've reached your destination</p>
              </div>
            </div>
            <Button
              onClick={onStopAlarm}
              size="lg"
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
            >
              I'M AWAKE
            </Button>
          </div>
        )}

        {/* Proximity Warning */}
        {isWithinAlertZone && !isAlarmRinging && isAlarmActive && (
          <div className="flex items-center gap-2 p-3 bg-warning/20 rounded-xl border border-warning/30">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
            <p className="text-sm font-medium text-warning">You're approaching your destination!</p>
          </div>
        )}

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

        {/* Destination Search - disabled when alarm active */}
        {!isAlarmActive && (
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
        )}

        {/* Favorites */}
        {!isAlarmActive && (
          <div className="glass-panel rounded-xl p-3">
            <FavoritesList
              favorites={favorites}
              currentDestination={destination}
              onSelectFavorite={handleSelectFavorite}
              onAddFavorite={onAddFavorite}
              onRemoveFavorite={onRemoveFavorite}
            />
          </div>
        )}

        {/* Collapsible Map */}
        <Collapsible open={isMapExpanded} onOpenChange={setIsMapExpanded}>
          <div className="glass-panel rounded-xl overflow-hidden">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between p-3 h-auto hover:bg-muted/50"
              >
                <span className="text-sm font-medium text-foreground">
                  {isMapExpanded ? 'Map View' : 'Tap to expand map'}
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
                  alertRadius={alertRadius}
                  onMapClick={handleMapClick}
                  isAlarmActive={isAlarmActive}
                  showRoute={true}
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
                  alertRadius={alertRadius}
                  onMapClick={handleMapClick}
                  isAlarmActive={isAlarmActive}
                  showRoute={true}
                />
              </div>
              <div className="p-2 text-center border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {isAlarmActive ? 'Tracking your location...' : 'Tap on map to set destination'}
                </p>
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

              {/* Alert Radius Slider */}
              {!isAlarmRinging && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Alert Distance</span>
                    <span className="text-sm font-medium text-primary">{formatDistance(alertRadius)}</span>
                  </div>
                  <Slider
                    value={[alertRadius]}
                    onValueChange={(value) => onAlertRadiusChange(value[0])}
                    min={100}
                    max={5000}
                    step={100}
                    disabled={isAlarmActive}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>100m</span>
                    <span>5km</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No destination selected</p>
              <p className="text-xs">Search, pick a favorite, or tap on the map</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action */}
      {!isAlarmRinging && (
        <div className="p-4 pb-6 safe-area-bottom border-t border-border bg-background">
          <Button
            onClick={isAlarmActive ? onDeactivateAlarm : onActivateAlarm}
            disabled={!destination || !currentPosition}
            size="lg"
            className={`w-full py-5 font-bold text-base ${
              isAlarmActive 
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                : 'bg-primary hover:bg-primary/90 text-primary-foreground glow-primary'
            } disabled:opacity-50`}
          >
            {isAlarmActive ? (
              <>
                <BellOff className="w-5 h-5 mr-2" />
                Stop Tracking
              </>
            ) : (
              <>
                <Bell className="w-5 h-5 mr-2" />
                Set Alarm
              </>
            )}
          </Button>
          {!currentPosition && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Please enable location access
            </p>
          )}
        </div>
      )}
    </div>
  );
};
