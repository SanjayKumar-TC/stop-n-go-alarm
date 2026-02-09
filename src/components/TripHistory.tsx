import { MapPin, Clock, Trash2, CheckCircle, XCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Trip } from '@/hooks/useTripHistory';
import { formatDistance } from '@/hooks/useGeolocation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TripHistoryProps {
  trips: Trip[];
  onDeleteTrip: (tripId: string) => void;
  onClearHistory: () => void;
  onSelectDestination: (lat: number, lng: number, name: string) => void;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatDuration = (startTime: number, endTime: number | null): string => {
  if (!endTime) return 'In progress';
  const durationMs = endTime - startTime;
  const minutes = Math.round(durationMs / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const TripHistory = ({
  trips,
  onDeleteTrip,
  onClearHistory,
  onSelectDestination,
}: TripHistoryProps) => {
  const safeTrips = trips || [];

  if (safeTrips.length === 0) {
    return (
      <div className="glass-panel design-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Trip History</h3>
        </div>
        <div className="text-center py-6 text-muted-foreground">
          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No trips yet</p>
          <p className="text-xs">Your journey history will appear here</p>
        </div>
      </div>
    );
  }

  // Group trips by date
  const groupedTrips = safeTrips.reduce((groups, trip) => {
    const dateKey = formatDate(trip.startTime);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(trip);
    return groups;
  }, {} as Record<string, Trip[]>);

  return (
    <div className="glass-panel design-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Trip History</h3>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground">
              Clear All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Trip History</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your trip history. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onClearHistory}>Clear All</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-4 max-h-64 overflow-y-auto">
        {Object.entries(groupedTrips).map(([date, dateTrips]) => (
          <div key={date}>
            <p className="text-xs text-muted-foreground mb-2">{date}</p>
            <div className="space-y-2">
              {dateTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 group"
                >
                  <div className={`p-1.5 rounded-md ${trip.completed ? 'bg-success/20' : 'bg-muted'}`}>
                    {trip.completed ? (
                      <CheckCircle className="w-3 h-3 text-success" />
                    ) : (
                      <XCircle className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    className="flex-1 h-auto p-0 justify-start hover:bg-transparent"
                    onClick={() => onSelectDestination(trip.destinationLat, trip.destinationLng, trip.destinationName)}
                  >
                    <div className="text-left min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {trip.destinationName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatTime(trip.startTime)}</span>
                        <span>•</span>
                        <span>{formatDuration(trip.startTime, trip.endTime)}</span>
                        <span>•</span>
                        <span>{formatDistance(trip.alertDistance)}</span>
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTrip(trip.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
