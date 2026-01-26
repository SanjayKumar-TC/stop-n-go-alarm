import { MapPin, Wifi, WifiOff, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StatusBarProps {
  isLoading: boolean;
  hasLocation: boolean;
  error: string | null;
  onBack?: () => void;
  showBack?: boolean;
}

export const StatusBar = ({ isLoading, hasLocation, error, onBack, showBack = false }: StatusBarProps) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-[1000] glass-panel rounded-b-2xl">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {showBack && onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="flex-shrink-0 mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="p-1.5 rounded-lg bg-primary/20">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-lg font-bold">Travel Alarm</h1>
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Locating...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-destructive">
              <WifiOff className="w-4 h-4" />
              <span className="text-xs">No GPS</span>
            </div>
          ) : hasLocation ? (
            <div className="flex items-center gap-2 text-success">
              <Wifi className="w-4 h-4" />
              <span className="text-xs">GPS Active</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
