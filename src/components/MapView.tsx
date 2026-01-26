import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Map } from '@/components/Map';

interface MapViewProps {
  currentPosition: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  alertRadius: number;
  isAlarmActive: boolean;
  onMapClick: (lat: number, lng: number) => void;
  onBack: () => void;
  onConfirm: () => void;
}

export const MapView = ({
  currentPosition,
  destination,
  alertRadius,
  isAlarmActive,
  onMapClick,
  onBack,
  onConfirm,
}: MapViewProps) => {
  return (
    <div className="h-screen w-screen relative">
      {/* Map */}
      <Map
        currentPosition={currentPosition}
        destination={destination}
        alertRadius={alertRadius}
        onMapClick={onMapClick}
        isAlarmActive={isAlarmActive}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pt-12">
        <div className="glass-panel rounded-xl p-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Tap on the map to set destination
            </p>
            <p className="text-xs text-muted-foreground">
              Or search using the search bar
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      {destination && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] p-4 pb-8">
          <div className="glass-panel rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Destination: {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
            </p>
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
