import { MapPin, Navigation, Bell, BellOff, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatDistance } from '@/hooks/useGeolocation';

interface ControlPanelProps {
  destination: { lat: number; lng: number } | null;
  alertRadius: number;
  onAlertRadiusChange: (value: number) => void;
  distanceToDestination: number | null;
  isAlarmActive: boolean;
  isAlarmRinging: boolean;
  onActivateAlarm: () => void;
  onDeactivateAlarm: () => void;
  onStopAlarm: () => void;
  onClearDestination: () => void;
}

export const ControlPanel = ({
  destination,
  alertRadius,
  onAlertRadiusChange,
  distanceToDestination,
  isAlarmActive,
  isAlarmRinging,
  onActivateAlarm,
  onDeactivateAlarm,
  onStopAlarm,
  onClearDestination,
}: ControlPanelProps) => {
  const isWithinAlertZone = distanceToDestination !== null && distanceToDestination <= alertRadius;

  return (
    <div className="glass-panel design-card absolute bottom-0 left-0 right-0 rounded-t-3xl p-6 pb-8 animate-slide-up">
      {/* Alarm ringing overlay */}
      {isAlarmRinging && (
        <div className="absolute inset-0 rounded-t-3xl bg-destructive/20 pointer-events-none pulse-alert" />
      )}

      {/* Handle bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted-foreground/30 rounded-full" />

      <div className="space-y-5 relative z-10">
        {/* Status section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isAlarmActive ? 'bg-success/20' : 'bg-muted'}`}>
              <Navigation className={`w-5 h-5 ${isAlarmActive ? 'text-success' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {isAlarmRinging ? 'WAKE UP!' : isAlarmActive ? 'Tracking Active' : 'Tap map to set destination'}
              </p>
              <p className="text-lg font-semibold">
                {destination 
                  ? distanceToDestination !== null 
                    ? formatDistance(distanceToDestination)
                    : 'Calculating...'
                  : 'No destination set'
                }
              </p>
            </div>
          </div>

          {destination && !isAlarmActive && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearDestination}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Proximity warning */}
        {isWithinAlertZone && !isAlarmRinging && (
          <div className="flex items-center gap-2 p-3 bg-warning/20 rounded-xl border border-warning/30 design-card">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <p className="text-sm font-medium text-warning">You're approaching your destination!</p>
          </div>
        )}

        {/* Alarm ringing UI */}
        {isAlarmRinging && (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/20 mb-3 pulse-alert">
              <Bell className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold text-destructive mb-1">DESTINATION REACHED!</h3>
            <p className="text-muted-foreground mb-4">Time to get ready to disembark</p>
            <Button
              onClick={onStopAlarm}
              size="lg"
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold py-6"
            >
              I'M AWAKE
            </Button>
          </div>
        )}

        {/* Alert radius slider */}
        {destination && !isAlarmRinging && (
          <div className="space-y-3">
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

        {/* Action button */}
        {destination && !isAlarmRinging && (
          <Button
            onClick={isAlarmActive ? onDeactivateAlarm : onActivateAlarm}
            size="lg"
            className={`w-full py-6 font-bold text-base ${
              isAlarmActive 
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                : 'bg-primary hover:bg-primary/90 text-primary-foreground glow-primary'
            }`}
          >
            {isAlarmActive ? (
              <>
                <BellOff className="w-5 h-5 mr-2" />
                Stop Tracking
              </>
            ) : (
              <>
                <Bell className="w-5 h-5 mr-2" />
                Start Alarm
              </>
            )}
          </Button>
        )}

        {/* Instructions when no destination */}
        {!destination && (
          <div className="flex items-center justify-center gap-3 py-4 px-4 bg-muted/50 rounded-xl design-card">
            <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm text-muted-foreground text-center">
              Tap anywhere on the map to set your destination stop
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
