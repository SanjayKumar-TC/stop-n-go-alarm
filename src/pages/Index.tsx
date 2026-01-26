import { useState, useEffect, useCallback, useRef } from 'react';
import { HomeScreen } from '@/components/HomeScreen';
import { MapView } from '@/components/MapView';
import { SettingsScreen } from '@/components/SettingsScreen';
import { useGeolocation, calculateDistance } from '@/hooks/useGeolocation';
import { useAlarm, AlarmSettings } from '@/hooks/useAlarm';
import { useFavorites, FavoriteDestination } from '@/hooks/useFavorites';
import { useTripHistory } from '@/hooks/useTripHistory';
import { useToast } from '@/hooks/use-toast';

interface Destination {
  lat: number;
  lng: number;
  name?: string;
}

type ViewMode = 'home' | 'map' | 'settings';
type MapSelectionMode = 'destination' | 'current' | null;

const Index = () => {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [alertRadius, setAlertRadius] = useState(1000);
  const [distanceToDestination, setDistanceToDestination] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [mapSelectionMode, setMapSelectionMode] = useState<MapSelectionMode>(null);
  const currentTripIdRef = useRef<string | null>(null);
  
  const { toast } = useToast();
  const { position, error, isLoading, startWatching, stopWatching, requestPosition } = useGeolocation();
  const { 
    isActive: isAlarmActive, 
    isRinging: isAlarmRinging, 
    settings: alarmSettings,
    updateSettings: updateAlarmSettings,
    triggerAlarm, 
    stopAlarm, 
    activateAlarm, 
    deactivateAlarm,
    testAlarm,
  } = useAlarm();
  const { favorites, addFavorite, removeFavorite } = useFavorites();
  const { trips, startTrip, endTrip, deleteTrip, clearHistory } = useTripHistory();

  const currentPosition = position
    ? { lat: position.coords.latitude, lng: position.coords.longitude }
    : null;

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (isAlarmActive) return;
    setDestination({ lat, lng });
  }, [isAlarmActive]);

  const handleSetDestination = useCallback((lat: number, lng: number, name: string) => {
    setDestination({ lat, lng, name });
    toast({
      title: "Destination Set",
      description: name,
    });
  }, [toast]);

  const handleClearDestination = useCallback(() => {
    // Auto-stop tracking when destination is cleared
    if (isAlarmActive) {
      deactivateAlarm();
      stopWatching();
      if (currentTripIdRef.current) {
        endTrip(currentTripIdRef.current, false);
        currentTripIdRef.current = null;
      }
      toast({
        title: "Tracking Stopped",
        description: "Destination was cleared",
      });
    }
    setDestination(null);
    setDistanceToDestination(null);
  }, [isAlarmActive, deactivateAlarm, stopWatching, endTrip, toast]);

  const handleOpenMapForDestination = useCallback(() => {
    setMapSelectionMode('destination');
    setViewMode('map');
  }, []);

  const handleConfirmMapSelection = useCallback(() => {
    if (destination) {
      toast({
        title: "Destination Set",
        description: destination.name || `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`,
      });
    }
    setMapSelectionMode(null);
    setViewMode('home');
  }, [destination, toast]);

  const handleActivateAlarm = useCallback(() => {
    if (!destination || !currentPosition) {
      toast({
        title: "Cannot start alarm",
        description: "Please ensure GPS is active and destination is set",
        variant: "destructive",
      });
      return;
    }

    // Start trip tracking
    const trip = startTrip(
      destination.name || `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`,
      destination.lat,
      destination.lng,
      alertRadius
    );
    currentTripIdRef.current = trip.id;

    activateAlarm();
    startWatching();
    
    toast({
      title: "Alarm Activated",
      description: `You'll be alerted when within ${alertRadius < 1000 ? alertRadius + 'm' : (alertRadius / 1000).toFixed(1) + 'km'} of your destination`,
    });
  }, [destination, currentPosition, alertRadius, activateAlarm, startWatching, startTrip, toast]);

  const handleDeactivateAlarm = useCallback(() => {
    deactivateAlarm();
    stopWatching();
    
    // End trip as incomplete
    if (currentTripIdRef.current) {
      endTrip(currentTripIdRef.current, false);
      currentTripIdRef.current = null;
    }
    
    toast({
      title: "Alarm Deactivated",
      description: "Location tracking stopped",
    });
  }, [deactivateAlarm, stopWatching, endTrip, toast]);

  const handleStopAlarm = useCallback(() => {
    stopAlarm();
    deactivateAlarm();
    stopWatching();
    
    // End trip as completed
    if (currentTripIdRef.current) {
      endTrip(currentTripIdRef.current, true);
      currentTripIdRef.current = null;
    }
    
    setDestination(null);
    
    toast({
      title: "Alarm Stopped",
      description: "Have a great day!",
    });
  }, [stopAlarm, deactivateAlarm, stopWatching, endTrip, toast]);

  const handleOpenSettings = useCallback(() => {
    setViewMode('settings');
  }, []);

  const handleUpdateAlarmSettings = useCallback((settings: Partial<AlarmSettings>) => {
    updateAlarmSettings(settings);
  }, [updateAlarmSettings]);

  const handleAddFavorite = useCallback((name: string, lat: number, lng: number, icon: FavoriteDestination['icon']) => {
    addFavorite(name, lat, lng, icon);
    toast({
      title: "Favorite Saved",
      description: name,
    });
  }, [addFavorite, toast]);

  const handleRemoveFavorite = useCallback((id: string) => {
    removeFavorite(id);
    toast({
      title: "Favorite Removed",
    });
  }, [removeFavorite, toast]);

  const handleDeleteTrip = useCallback((tripId: string) => {
    deleteTrip(tripId);
    toast({
      title: "Trip Deleted",
    });
  }, [deleteTrip, toast]);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    toast({
      title: "History Cleared",
    });
  }, [clearHistory, toast]);

  useEffect(() => {
    if (currentPosition && destination) {
      const distance = calculateDistance(
        currentPosition.lat,
        currentPosition.lng,
        destination.lat,
        destination.lng
      );
      setDistanceToDestination(distance);

      if (isAlarmActive && !isAlarmRinging && distance <= alertRadius) {
        triggerAlarm();
      }
    }
  }, [currentPosition, destination, alertRadius, isAlarmActive, isAlarmRinging, triggerAlarm]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Location Error",
        description: error.message || "Unable to get your location. Please enable GPS.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    requestPosition();
  }, [requestPosition]);

  // Settings screen
  if (viewMode === 'settings') {
    return (
      <SettingsScreen
        alarmSettings={alarmSettings}
        onUpdateSettings={handleUpdateAlarmSettings}
        onTestAlarm={testAlarm}
        onBack={() => setViewMode('home')}
      />
    );
  }

  // Map selection view (fullscreen map for detailed selection)
  if (viewMode === 'map') {
    return (
      <MapView
        currentPosition={currentPosition}
        destination={destination}
        alertRadius={alertRadius}
        isAlarmActive={false}
        onMapClick={handleMapClick}
        onBack={() => {
          setMapSelectionMode(null);
          setViewMode('home');
        }}
        onConfirm={handleConfirmMapSelection}
        onSearchSelect={handleSetDestination}
      />
    );
  }

  // Home screen (main interface with embedded map)
  return (
    <HomeScreen
      currentPosition={currentPosition}
      destination={destination}
      isLoadingLocation={isLoading}
      isAlarmActive={isAlarmActive}
      isAlarmRinging={isAlarmRinging}
      alertRadius={alertRadius}
      favorites={favorites}
      trips={trips}
      onSetDestination={handleSetDestination}
      onClearDestination={handleClearDestination}
      onOpenMapForDestination={handleOpenMapForDestination}
      onUseCurrentLocation={requestPosition}
      onActivateAlarm={handleActivateAlarm}
      onDeactivateAlarm={handleDeactivateAlarm}
      onStopAlarm={handleStopAlarm}
      onAlertRadiusChange={setAlertRadius}
      onOpenSettings={handleOpenSettings}
      onAddFavorite={handleAddFavorite}
      onRemoveFavorite={handleRemoveFavorite}
      onDeleteTrip={handleDeleteTrip}
      onClearHistory={handleClearHistory}
    />
  );
};

export default Index;
