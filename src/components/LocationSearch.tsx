import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, MapPin, Loader2, Clock, Navigation, Building2, TreePine, Train, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { calculateDistance, formatDistance } from '@/hooks/useGeolocation';

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  importance?: number;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    road?: string;
    suburb?: string;
    neighbourhood?: string;
  };
}

interface LocationSearchProps {
  placeholder?: string;
  onSelectLocation: (lat: number, lng: number, name: string) => void;
  value?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  currentPosition?: { lat: number; lng: number } | null;
}

// Get icon based on place type
const getPlaceIcon = (type?: string, placeClass?: string) => {
  const t = type?.toLowerCase() || '';
  const c = placeClass?.toLowerCase() || '';
  
  if (c === 'railway' || t.includes('station') || t.includes('rail')) {
    return <Train className="w-5 h-5" />;
  }
  if (c === 'shop' || t.includes('mall') || t.includes('market')) {
    return <ShoppingBag className="w-5 h-5" />;
  }
  if (c === 'building' || t.includes('office') || t.includes('commercial')) {
    return <Building2 className="w-5 h-5" />;
  }
  if (c === 'natural' || t.includes('park') || t.includes('garden')) {
    return <TreePine className="w-5 h-5" />;
  }
  return <MapPin className="w-5 h-5" />;
};

export const LocationSearch = ({
  placeholder = "Search here",
  onSelectLocation,
  value = "",
  disabled = false,
  onChange,
  currentPosition,
}: LocationSearchProps) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPlaces = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Enhanced Nominatim search with viewbox bias if we have current position
      const params = new URLSearchParams({
        format: 'json',
        q: searchQuery,
        limit: '12',
        addressdetails: '1',
        extratags: '1',
        namedetails: '1',
        'accept-language': 'en',
        dedupe: '1',
      });

      // Bias results towards current location if available
      if (currentPosition) {
        const delta = 2; // ~200km radius bias
        params.set('viewbox', `${currentPosition.lng - delta},${currentPosition.lat + delta},${currentPosition.lng + delta},${currentPosition.lat - delta}`);
        params.set('bounded', '0'); // Don't strictly limit, just prefer
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'GPSTravelAlarm/1.0',
          },
        }
      );
      const data = await response.json();
      
      // Sort by distance if we have current position
      if (currentPosition && data.length > 0) {
        data.sort((a: SearchResult, b: SearchResult) => {
          const distA = calculateDistance(
            currentPosition.lat, currentPosition.lng,
            parseFloat(a.lat), parseFloat(a.lon)
          );
          const distB = calculateDistance(
            currentPosition.lat, currentPosition.lng,
            parseFloat(b.lat), parseFloat(b.lon)
          );
          return distA - distB;
        });
      }
      
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPosition]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onChange?.(newQuery);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      searchPlaces(newQuery);
    }, 300);
  };

  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const shortName = result.display_name.split(',').slice(0, 2).join(', ');
    
    setQuery(shortName);
    setShowResults(false);
    setIsFocused(false);
    setResults([]);
    onSelectLocation(lat, lng, shortName);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onChange?.('');
    inputRef.current?.focus();
  };

  const getDistanceText = (result: SearchResult) => {
    if (!currentPosition) return null;
    const distance = calculateDistance(
      currentPosition.lat, currentPosition.lng,
      parseFloat(result.lat), parseFloat(result.lon)
    );
    return formatDistance(distance);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Google Maps style search bar */}
      <div 
        className={`
          relative flex items-center bg-card rounded-full shadow-lg border transition-all duration-200
          ${isFocused ? 'border-primary shadow-xl ring-2 ring-primary/20' : 'border-border'}
        `}
      >
        <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            if (results.length > 0) setShowResults(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 border-0 bg-transparent h-12 text-base placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
        />
        
        {query && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="flex-shrink-0 h-10 w-10 mr-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown - Google Maps style */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto">
            {results.map((result, index) => {
              const parts = result.display_name.split(',');
              const primaryName = parts[0]?.trim();
              const secondaryInfo = parts.slice(1, 3).join(', ').trim();
              const distanceText = getDistanceText(result);
              
              return (
                <button
                  key={result.place_id}
                  onClick={() => handleSelectResult(result)}
                  className={`
                    w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/60 transition-colors text-left
                    ${index !== results.length - 1 ? 'border-b border-border/50' : ''}
                  `}
                >
                  {/* Icon container */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    {getPlaceIcon(result.type, result.class)}
                  </div>
                  
                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {primaryName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {secondaryInfo}
                    </p>
                  </div>
                  
                  {/* Distance badge */}
                  {distanceText && (
                    <div className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      <Navigation className="w-3 h-3" />
                      <span>{distanceText}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* No results message */}
      {showResults && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl z-50 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No places found</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
        </div>
      )}

      {/* Search hint when focused but no query */}
      {isFocused && query.length === 0 && !showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl z-50 p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Search for places, addresses, or landmarks</span>
          </div>
        </div>
      )}
    </div>
  );
};
