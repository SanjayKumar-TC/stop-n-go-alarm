import { useState, useEffect, useCallback } from 'react';
import { Map } from '@/components/Map';
import { ControlPanel } from '@/components/ControlPanel';
import { StatusBar } from '@/components/StatusBar';
import { useGeolocation, calculateDistance } from '@/hooks/useGeolocation';
import { useAlarm } from '@/hooks/useAlarm';
import { useToast } from '@/hooks/use-toast';

interface Destination {
  lat: number;
  lng: number;
}

const Index = () => {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [alertRadius, setAlertRadius] = useState(1000); // 1km default
  const [distanceToDestination, setDistanceToDestination] = useState<number | null>(null);
  
  const { toast } = useToast();
  const { position, error, isLoading, startWatching, stopWatching, isWatching } = useGeolocation();
  const { isActive: isAlarmActive, isRinging: isAlarmRinging, triggerAlarm, stopAlarm, activateAlarm, deactivateAlarm } = useAlarm();

  // Current position in simple format
  const currentPosition = position
    ? { lat: position.coords.latitude, lng: position.coords.longitude }
    : null;

  // Handle map click to set destination
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (isAlarmActive) return; // Don't allow changing destination while alarm is active
    
    setDestination({ lat, lng });
    toast({
      title: "Destination Set",
      description: "Tap 'Start Alarm' when you're ready to sleep",
    });
  }, [isAlarmActive, toast]);

  // Clear destination
  const handleClearDestination = useCallback(() => {
    setDestination(null);
    setDistanceToDestination(null);
  }, []);

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
  }, [stopAlarm, handleDeactivateAlarm]);

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

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-background">
      <StatusBar 
        isLoading={isLoading} 
        hasLocation={!!currentPosition} 
        error={error?.message || null} 
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
