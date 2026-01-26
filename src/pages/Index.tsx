import { useState, useEffect, useCallback } from 'react';
import { HomeScreen } from '@/components/HomeScreen';
import { MapView } from '@/components/MapView';
import { ControlPanel } from '@/components/ControlPanel';
import { StatusBar } from '@/components/StatusBar';
import { SettingsScreen } from '@/components/SettingsScreen';
import { Map } from '@/components/Map';
import { useGeolocation, calculateDistance } from '@/hooks/useGeolocation';
import { useAlarm, AlarmSettings } from '@/hooks/useAlarm';
import { useToast } from '@/hooks/use-toast';

interface Destination {
  lat: number;
  lng: number;
  name?: string;
}

type ViewMode = 'home' | 'map' | 'tracking' | 'settings';

const Index = () => {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [alertRadius, setAlertRadius] = useState(1000);
  const [distanceToDestination, setDistanceToDestination] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  
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
    setDestination(null);
    setDistanceToDestination(null);
  }, []);

  const handleOpenMap = useCallback(() => {
    setViewMode('map');
  }, []);

  const handleConfirmMapSelection = useCallback(() => {
    if (destination) {
      toast({
        title: "Destination Set",
        description: destination.name || `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`,
      });
    }
    setViewMode('home');
  }, [destination, toast]);

  const handleStartAlarmSetup = useCallback(() => {
    if (!destination || !currentPosition) {
      toast({
        title: "Cannot start alarm",
        description: "Please ensure GPS is active and destination is set",
        variant: "destructive",
      });
      return;
    }
    setViewMode('tracking');
  }, [destination, currentPosition, toast]);

  const handleActivateAlarm = useCallback(() => {
    if (!destination || !currentPosition) {
      toast({
        title: "Cannot start alarm",
        description: "Please ensure GPS is active and destination is set",
        variant: "destructive",
      });
      return;
    }

    activateAlarm();
    startWatching();
    
    toast({
      title: "Alarm Activated",
      description: `You'll be alerted when within ${alertRadius < 1000 ? alertRadius + 'm' : (alertRadius / 1000).toFixed(1) + 'km'} of your destination`,
    });
  }, [destination, currentPosition, alertRadius, activateAlarm, startWatching, toast]);

  const handleDeactivateAlarm = useCallback(() => {
    deactivateAlarm();
    stopWatching();
    
    toast({
      title: "Alarm Deactivated",
      description: "Location tracking stopped",
    });
  }, [deactivateAlarm, stopWatching, toast]);

  const handleStopAlarm = useCallback(() => {
    stopAlarm();
    handleDeactivateAlarm();
    setViewMode('home');
    setDestination(null);
  }, [stopAlarm, handleDeactivateAlarm]);

  const handleGoBack = useCallback(() => {
    if (isAlarmActive) {
      handleDeactivateAlarm();
    }
    setViewMode('home');
  }, [isAlarmActive, handleDeactivateAlarm]);

  const handleOpenSettings = useCallback(() => {
    setViewMode('settings');
  }, []);

  const handleUpdateAlarmSettings = useCallback((settings: Partial<AlarmSettings>) => {
    updateAlarmSettings(settings);
  }, [updateAlarmSettings]);

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

  // Home screen
  if (viewMode === 'home') {
    return (
      <HomeScreen
        currentPosition={currentPosition}
        destination={destination}
        isLoadingLocation={isLoading}
        onSetDestination={handleSetDestination}
        onOpenMap={handleOpenMap}
        onUseCurrentLocation={requestPosition}
        onStartAlarm={handleStartAlarmSetup}
        onOpenSettings={handleOpenSettings}
      />
    );
  }

  // Map selection view
  if (viewMode === 'map') {
    return (
      <MapView
        currentPosition={currentPosition}
        destination={destination}
        alertRadius={alertRadius}
        isAlarmActive={false}
        onMapClick={handleMapClick}
        onBack={() => setViewMode('home')}
        onConfirm={handleConfirmMapSelection}
        onSearchSelect={handleSetDestination}
      />
    );
  }

  // Tracking view
  return (
    <div className="h-screen w-screen overflow-hidden relative bg-background">
      <StatusBar 
        isLoading={isLoading} 
        hasLocation={!!currentPosition} 
        error={error?.message || null}
        onBack={handleGoBack}
        showBack={true}
      />
      
      <Map
        currentPosition={currentPosition}
        destination={destination}
        alertRadius={alertRadius}
        onMapClick={handleMapClick}
        isAlarmActive={isAlarmActive || isAlarmRinging}
      />
      
      <ControlPanel
        destination={destination}
        alertRadius={alertRadius}
        onAlertRadiusChange={setAlertRadius}
        distanceToDestination={distanceToDestination}
        isAlarmActive={isAlarmActive}
        isAlarmRinging={isAlarmRinging}
        onActivateAlarm={handleActivateAlarm}
        onDeactivateAlarm={handleDeactivateAlarm}
        onStopAlarm={handleStopAlarm}
        onClearDestination={handleClearDestination}
      />
    </div>
  );
};

export default Index;
