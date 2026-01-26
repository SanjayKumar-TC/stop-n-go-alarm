import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchProps {
  placeholder?: string;
  onSelectLocation: (lat: number, lng: number, name: string) => void;
  value?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export const LocationSearch = ({
  placeholder = "Search for a place...",
  onSelectLocation,
  value = "",
  disabled = false,
  onChange,
}: LocationSearchProps) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPlaces = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      const data = await response.json();
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Notify parent of change
    onChange?.(newQuery);

    // Debounce search
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
    
    // Extract a shorter name from display_name
    const shortName = result.display_name.split(',').slice(0, 2).join(', ');
    
    setQuery(shortName);
    setShowResults(false);
    setResults([]);
    onSelectLocation(lat, lng, shortName);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onChange?.('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-10 bg-muted/50 border-muted-foreground/20"
        />
        {query && !isLoading && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {results.map((result) => (
            <button
              key={result.place_id}
              onClick={() => handleSelectResult(result)}
              className="w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0"
            >
              <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground line-clamp-2">
                {result.display_name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showResults && query.length >= 3 && results.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 p-4 text-center">
          <p className="text-sm text-muted-foreground">No places found</p>
        </div>
      )}
    </div>
  );
};
