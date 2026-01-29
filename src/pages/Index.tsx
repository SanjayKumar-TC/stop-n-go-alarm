import { useState, useEffect, useCallback, useRef } from 'react';
import { HomeScreen } from '@/components/HomeScreen';
import { MapView } from '@/components/MapView';
import { SettingsScreen } from '@/components/SettingsScreen';
import { useNativeGeolocation } from '@/hooks/useNativeGeolocation';
import { calculateDistance } from '@/hooks/useGeolocation';
import { useNativeAlarm, AlarmSettings } from '@/hooks/useNativeAlarm';
import { useFavorites, FavoriteDestination } from '@/hooks/useFavorites';
import { useTripHistory } from '@/hooks/useTripHistory';
import { usePushNotifications } from '@/hooks/usePushNotifications';
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
  const { 
    position, 
    error, 
    isLoading, 
    startWatching, 
    stopWatching, 
    requestPosition,
    startBackgroundTracking,
    stopBackgroundTracking,
    isNative,
  } = useNativeGeolocation();
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
  } = useNativeAlarm();
  const { favorites, addFavorite, removeFavorite } = useFavorites();
  const { trips, startTrip, endTrip, deleteTrip, clearHistory } = useTripHistory();
  const { 
    permission: notificationPermission, 
    requestPermission: requestNotificationPermission,
    showAlarmNotification,
    showArrivalConfirmation,
    showTrackingStarted,
  } = usePushNotifications();

  const currentPosition = position;

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
      if (isNative) {
        stopBackgroundTracking();
      } else {
        stopWatching();
      }
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
  }, [isAlarmActive, deactivateAlarm, stopWatching, stopBackgroundTracking, isNative, endTrip, toast]);

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

  const handleActivateAlarm = useCallback(async () => {
    if (!destination || !currentPosition) {
      toast({
        title: "Cannot start alarm",
        description: "Please ensure GPS is active and destination is set",
        variant: "destructive",
      });
      return;
    }

    // Request notification permission if not granted
    if (notificationPermission.status !== 'granted') {
      await requestNotificationPermission();
    }

    const destinationName = destination.name || `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`;

    // Start trip tracking
    const trip = startTrip(
      destinationName,
      destination.lat,
      destination.lng,
      alertRadius
    );
    currentTripIdRef.current = trip.id;

    activateAlarm();
    
    // Use background tracking on native, regular watching on web
    if (isNative) {
      startBackgroundTracking((lat, lng) => {
        // This callback handles location updates in background
        if (destination) {
          const distance = calculateDistance(lat, lng, destination.lat, destination.lng);
          if (distance <= alertRadius && !isAlarmRinging) {
            triggerAlarm(destinationName);
          }
        }
      });
    } else {
      startWatching();
    }
    
    // Show push notification for tracking started
    showTrackingStarted(destinationName, alertRadius);
    
    toast({
      title: "Alarm Activated",
      description: `You'll be alerted when within ${alertRadius < 1000 ? alertRadius + 'm' : (alertRadius / 1000).toFixed(1) + 'km'} of your destination`,
    });
  }, [destination, currentPosition, alertRadius, activateAlarm, startWatching, startBackgroundTracking, isNative, startTrip, notificationPermission, requestNotificationPermission, showTrackingStarted, triggerAlarm, isAlarmRinging, toast]);

  const handleDeactivateAlarm = useCallback(() => {
    deactivateAlarm();
    if (isNative) {
      stopBackgroundTracking();
    } else {
      stopWatching();
    }
    
    // End trip as incomplete
    if (currentTripIdRef.current) {
      endTrip(currentTripIdRef.current, false);
      currentTripIdRef.current = null;
    }
    
    toast({
      title: "Alarm Deactivated",
      description: "Location tracking stopped",
    });
  }, [deactivateAlarm, stopWatching, stopBackgroundTracking, isNative, endTrip, toast]);

  const handleStopAlarm = useCallback(() => {
    const destinationName = destination?.name || 'your destination';
    
    stopAlarm();
    deactivateAlarm();
    if (isNative) {
      stopBackgroundTracking();
    } else {
      stopWatching();
    }
    
    // End trip as completed
    if (currentTripIdRef.current) {
      endTrip(currentTripIdRef.current, true);
      currentTripIdRef.current = null;
    }
    
    // Show push notification
    showArrivalConfirmation(destinationName);
    
    setDestination(null);
    
    toast({
      title: "👋 Hope you didn't miss your stop!",
      description: "Have a great day ahead!",
    });
  }, [stopAlarm, deactivateAlarm, stopWatching, stopBackgroundTracking, isNative, endTrip, destination, showArrivalConfirmation, toast]);

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
        // Show push notification when alarm triggers
        const destinationName = destination.name || 'your destination';
        showAlarmNotification(destinationName);
      }
    }
  }, [currentPosition, destination, alertRadius, isAlarmActive, isAlarmRinging, triggerAlarm, showAlarmNotification]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Location Error",
        description: error || "Unable to get your location. Please enable GPS.",
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
