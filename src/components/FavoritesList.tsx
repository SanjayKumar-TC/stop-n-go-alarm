import { Home, Briefcase, Train, Star, Plus, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FavoriteDestination } from '@/hooks/useFavorites';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface FavoritesListProps {
  favorites: FavoriteDestination[];
  currentDestination: { lat: number; lng: number; name?: string } | null;
  onSelectFavorite: (fav: FavoriteDestination) => void;
  onAddFavorite: (name: string, lat: number, lng: number, icon: FavoriteDestination['icon']) => void;
  onRemoveFavorite: (id: string) => void;
}

const iconMap = {
  home: Home,
  briefcase: Briefcase,
  train: Train,
  star: Star,
};

const iconOptions: { value: FavoriteDestination['icon']; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'briefcase', label: 'Work' },
  { value: 'train', label: 'Station' },
  { value: 'star', label: 'Other' },
];

export const FavoritesList = ({
  favorites = [],
  currentDestination,
  onSelectFavorite,
  onAddFavorite,
  onRemoveFavorite,
}: FavoritesListProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState<FavoriteDestination['icon']>('star');

  // Safety check for favorites array
  const safefavorites = favorites || [];

  const handleAddCurrent = () => {
    if (!currentDestination || !newName.trim()) return;
    onAddFavorite(newName.trim(), currentDestination.lat, currentDestination.lng, newIcon);
    setNewName('');
    setNewIcon('star');
    setIsAddDialogOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          Favorite Stops
        </h3>
        {currentDestination && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                <Plus className="w-3 h-3 mr-1" />
                Save Current
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Save as Favorite</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Name</label>
                  <Input
                    placeholder="e.g., Home, Office, Central Station"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Icon</label>
                  <div className="flex gap-2">
                    {iconOptions.map((opt) => {
                      const IconComp = iconMap[opt.value];
                      return (
                        <Button
                          key={opt.value}
                          variant={newIcon === opt.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setNewIcon(opt.value)}
                          className="flex-1"
                        >
                          <IconComp className="w-4 h-4 mr-1" />
                          {opt.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>
                    {currentDestination.name || 
                      `${currentDestination.lat.toFixed(4)}, ${currentDestination.lng.toFixed(4)}`}
                  </span>
                </div>
                <Button 
                  onClick={handleAddCurrent} 
                  className="w-full"
                  disabled={!newName.trim()}
                >
                  Save Favorite
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {safefavorites.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          <Star className="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No favorites yet</p>
          <p className="text-xs">Set a destination and tap "Save Current"</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {safefavorites.map((fav) => {
            const IconComp = iconMap[fav.icon];
            return (
              <div
                key={fav.id}
                className="glass-panel rounded-lg p-2 flex items-center gap-2 group relative"
              >
                <Button
                  variant="ghost"
                  className="flex-1 h-auto p-2 justify-start hover:bg-muted/50"
                  onClick={() => onSelectFavorite(fav)}
                >
                  <div className="p-1.5 rounded-md bg-primary/20 mr-2">
                    <IconComp className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-xs font-medium truncate">{fav.name}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFavorite(fav.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
