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
      // Use multiple search strategies for better results
      const searches: Promise<SearchResult[]>[] = [];

      // 1. Photon API (OSM-based with better autocomplete)
      const photonParams = new URLSearchParams({
        q: searchQuery,
        limit: '15',
        lang: 'en',
      });
      
      // Bias towards current location if available
      if (currentPosition) {
        photonParams.set('lat', currentPosition.lat.toString());
        photonParams.set('lon', currentPosition.lng.toString());
      }

      const photonSearch = fetch(
        `https://photon.komoot.io/api/?${photonParams.toString()}`
      )
        .then(res => res.json())
        .then(data => {
          // Convert Photon format to our format
          return (data.features || []).map((feature: any) => ({
            place_id: feature.properties.osm_id || Math.random(),
            display_name: formatPhotonResult(feature.properties),
            lat: feature.geometry.coordinates[1].toString(),
            lon: feature.geometry.coordinates[0].toString(),
            type: feature.properties.type || feature.properties.osm_value,
            class: feature.properties.osm_key,
            address: {
              city: feature.properties.city,
              town: feature.properties.town,
              village: feature.properties.village,
              state: feature.properties.state,
              country: feature.properties.country,
              road: feature.properties.street,
              suburb: feature.properties.suburb || feature.properties.district,
            },
          }));
        })
        .catch(() => []);

      searches.push(photonSearch);

      // 2. Nominatim search as backup with wildcards
      const nominatimParams = new URLSearchParams({
        format: 'json',
        q: searchQuery,
        limit: '10',
        addressdetails: '1',
        'accept-language': 'en',
        dedupe: '1',
      });

      if (currentPosition) {
        const delta = 5; // Larger area for more results
        nominatimParams.set('viewbox', `${currentPosition.lng - delta},${currentPosition.lat + delta},${currentPosition.lng + delta},${currentPosition.lat - delta}`);
        nominatimParams.set('bounded', '0');
      }

      const nominatimSearch = fetch(
        `https://nominatim.openstreetmap.org/search?${nominatimParams.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'GPSTravelAlarm/1.0',
          },
        }
      )
        .then(res => res.json())
        .catch(() => []);

      searches.push(nominatimSearch);

      // Wait for all searches
      const [photonResults, nominatimResults] = await Promise.all(searches);

      // Merge and deduplicate results
      const allResults = [...photonResults, ...nominatimResults];
      const uniqueResults = deduplicateResults(allResults);

      // Sort by distance if we have current position
      if (currentPosition && uniqueResults.length > 0) {
        uniqueResults.sort((a, b) => {
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

      setResults(uniqueResults.slice(0, 15)); // Limit to 15 results
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPosition]);

  // Format Photon result into readable display name
  const formatPhotonResult = (props: any): string => {
    const parts: string[] = [];
    
    if (props.name) parts.push(props.name);
    if (props.street) parts.push(props.street);
    if (props.suburb || props.district) parts.push(props.suburb || props.district);
    if (props.city || props.town || props.village) {
      parts.push(props.city || props.town || props.village);
    }
    if (props.state) parts.push(props.state);
    if (props.country) parts.push(props.country);
    
    return parts.join(', ') || 'Unknown location';
  };

  // Remove duplicate results based on coordinates
  const deduplicateResults = (results: SearchResult[]): SearchResult[] => {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${parseFloat(result.lat).toFixed(4)},${parseFloat(result.lon).toFixed(4)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

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
