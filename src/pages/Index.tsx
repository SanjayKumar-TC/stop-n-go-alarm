import { useState, useEffect, useCallback } from 'react';
import { HomeScreen } from '@/components/HomeScreen';
import { MapView } from '@/components/MapView';
import { ControlPanel } from '@/components/ControlPanel';
import { StatusBar } from '@/components/StatusBar';
import { Map } from '@/components/Map';
import { useGeolocation, calculateDistance } from '@/hooks/useGeolocation';
import { useAlarm } from '@/hooks/useAlarm';
import { useToast } from '@/hooks/use-toast';

interface Destination {
  lat: number;
  lng: number;
  name?: string;
}

type ViewMode = 'home' | 'map' | 'tracking';

const Index = () => {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [alertRadius, setAlertRadius] = useState(1000); // 1km default
  const [distanceToDestination, setDistanceToDestination] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  
  const { toast } = useToast();
  const { position, error, isLoading, startWatching, stopWatching, requestPosition } = useGeolocation();
  const { isActive: isAlarmActive, isRinging: isAlarmRinging, triggerAlarm, stopAlarm, activateAlarm, deactivateAlarm } = useAlarm();

  // Current position in simple format
  const currentPosition = position
    ? { lat: position.coords.latitude, lng: position.coords.longitude }
    : null;

  // Handle map click to set destination
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (isAlarmActive) return;
    setDestination({ lat, lng });
  }, [isAlarmActive]);

  // Handle destination selection from search
  const handleSetDestination = useCallback((lat: number, lng: number, name: string) => {
    setDestination({ lat, lng, name });
    toast({
      title: "Destination Set",
      description: name,
    });
  }, [toast]);

  // Clear destination
  const handleClearDestination = useCallback(() => {
    setDestination(null);
    setDistanceToDestination(null);
  }, []);

  // Open map view
  const handleOpenMap = useCallback(() => {
    setViewMode('map');
  }, []);

  // Confirm map selection and go back
  const handleConfirmMapSelection = useCallback(() => {
    if (destination) {
      toast({
        title: "Destination Set",
        description: `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`,
      });
    }
    setViewMode('home');
  }, [destination, toast]);

  // Start alarm setup (go to tracking view)
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

  // Activate alarm and start watching position
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

  // Deactivate alarm
  const handleDeactivateAlarm = useCallback(() => {
    deactivateAlarm();
    stopWatching();
    
    toast({
      title: "Alarm Deactivated",
      description: "Location tracking stopped",
    });
  }, [deactivateAlarm, stopWatching, toast]);

  // Stop ringing alarm
  const handleStopAlarm = useCallback(() => {
    stopAlarm();
    handleDeactivateAlarm();
    setViewMode('home');
    setDestination(null);
  }, [stopAlarm, handleDeactivateAlarm]);

  // Go back to home
  const handleGoBack = useCallback(() => {
    if (isAlarmActive) {
      handleDeactivateAlarm();
    }
    setViewMode('home');
  }, [isAlarmActive, handleDeactivateAlarm]);

  // Calculate distance when position or destination changes
  useEffect(() => {
    if (currentPosition && destination) {
      const distance = calculateDistance(
        currentPosition.lat,
        currentPosition.lng,
        destination.lat,
        destination.lng
      );
      setDistanceToDestination(distance);

      // Check if within alert radius and alarm is active
      if (isAlarmActive && !isAlarmRinging && distance <= alertRadius) {
        triggerAlarm();
      }
    }
  }, [currentPosition, destination, alertRadius, isAlarmActive, isAlarmRinging, triggerAlarm]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        title: "Location Error",
        description: error.message || "Unable to get your location. Please enable GPS.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Request position on mount
  useEffect(() => {
    requestPosition();
  }, [requestPosition]);

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
      />
    );
  }

  // Tracking view (with map and control panel)
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
