import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Sparkles, X, Loader2, Compass, CheckCircle2, AlertCircle } from 'lucide-react';
import { LocationCoordinates, CanonicalDestination } from '../types';

export interface DestinationSuggestionItem {
  id: string;
  name: string;
  displayName: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  coordinates: LocationCoordinates;
  isCurated?: boolean;
  image?: string;
  heroImage?: string;
  tagline?: string;
  source?: 'dataset' | 'geocoding' | 'osm' | 'google_places' | 'serpapi' | string;
  alternateNames?: string[];
  placeId?: string | null;
  avgDailyCostINR?: number;
}

export interface DestinationSearchInputProps {
  value: string;
  onChange: (destinationName: string, coordinates?: LocationCoordinates) => void;
  onSelectResolved?: (item: DestinationSuggestionItem) => void;
  onSelectCanonical?: (canonical: CanonicalDestination) => void;
  label?: string;
  placeholder?: string;
  id?: string;
  isDarkMode?: boolean;
  required?: boolean;
  showPopularChips?: boolean;
  showInlineChips?: boolean;
  inlineChipsLabel?: string;
  quickShortcuts?: string[];
  className?: string;
  iconColor?: string;
}

const POPULAR_SHORTCUTS = ['Nashik', 'Chhatrapati Sambhajinagar', 'Pune', 'Mumbai', 'Goa', 'Jaipur', 'Manali', 'Dubai'];

export const DestinationSearchInput: React.FC<DestinationSearchInputProps> = ({
  value,
  onChange,
  onSelectResolved,
  onSelectCanonical,
  label = 'Destination',
  placeholder = 'Search any city, tourist spot, or international destination (e.g. Nashik, Dubai)',
  id = 'destination-search-input',
  isDarkMode = false,
  required = false,
  showPopularChips = true,
  showInlineChips = false,
  inlineChipsLabel = 'Popular:',
  quickShortcuts,
  className = '',
  iconColor = 'text-sky-500'
}) => {
  const shortcutsToUse = quickShortcuts || POPULAR_SHORTCUTS;
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [suggestions, setSuggestions] = useState<DestinationSuggestionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [lastResolvedName, setLastResolvedName] = useState<string | null>(null);
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Synchronize local input if value changes from outside
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Handle outside clicks to close the suggestion dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch suggestions with debounce & cancellation
  useEffect(() => {
    const trimmed = query.trim();
    if (!isOpen || !trimmed) {
      if (!trimmed) setSuggestions([]);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setResolutionError(null);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/destinations/search?q=${encodeURIComponent(trimmed)}&limit=8`, {
          signal: controller.signal
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.destinations)) {
          setSuggestions(data.destinations);
        } else if (data.success && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        } else {
          setSuggestions([]);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Destination suggest error:', err);
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, isOpen]);

  const emitCanonical = (canonical: CanonicalDestination) => {
    const coords: LocationCoordinates = {
      lat: canonical.latitude,
      lng: canonical.longitude
    };
    setLastResolvedName(canonical.displayName || canonical.name);
    setResolutionError(null);
    onChange(canonical.name, coords);

    if (onSelectCanonical) {
      onSelectCanonical(canonical);
    }
    if (onSelectResolved) {
      onSelectResolved({
        id: canonical.id,
        name: canonical.name,
        displayName: canonical.displayName,
        city: canonical.city,
        state: canonical.state || undefined,
        country: canonical.country,
        latitude: canonical.latitude,
        longitude: canonical.longitude,
        coordinates: coords,
        isCurated: canonical.isCurated,
        heroImage: canonical.heroImage,
        tagline: canonical.tagline,
        source: canonical.source,
        alternateNames: canonical.alternateNames,
        placeId: canonical.placeId,
        avgDailyCostINR: canonical.avgDailyCostINR
      });
    }
  };

  const resolveTypedDestination = async (textToResolve: string) => {
    const trimmed = textToResolve.trim();
    if (!trimmed) return;

    setResolving(true);
    setResolutionError(null);
    try {
      const res = await fetch(`/api/destinations/resolve?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (data.success && data.destination) {
        const canonical: CanonicalDestination = data.destination;
        setQuery(canonical.name);
        emitCanonical(canonical);
      } else {
        setResolutionError(data.message || `Could not resolve "${trimmed}" to a geographic location.`);
        // Keep raw text
        onChange(trimmed);
      }
    } catch (err: any) {
      console.error('Resolution failed:', err);
      setResolutionError('Network error while resolving location.');
      onChange(trimmed);
    } finally {
      setResolving(false);
      setIsOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setIsOpen(true);
    setSelectedIndex(-1);
    setLastResolvedName(null);
    setResolutionError(null);
  };

  const handleSelectSuggestion = (item: DestinationSuggestionItem) => {
    setQuery(item.name);
    const lat = item.latitude ?? item.coordinates?.lat ?? 0;
    const lng = item.longitude ?? item.coordinates?.lng ?? 0;
    const canonical: CanonicalDestination = {
      id: item.id || `dest_${item.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: item.name,
      displayName: item.displayName || item.name,
      city: item.city || item.name,
      state: item.state || null,
      country: item.country || 'India',
      latitude: lat,
      longitude: lng,
      placeId: item.placeId || null,
      source: (item.source as any) || (item.isCurated ? 'dataset' : 'geocoding'),
      isCurated: item.isCurated,
      tagline: item.tagline,
      heroImage: item.heroImage || item.image,
      alternateNames: item.alternateNames,
      avgDailyCostINR: item.avgDailyCostINR
    };

    emitCanonical(canonical);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleShortcutClick = (destName: string) => {
    setQuery(destName);
    resolveTypedDestination(destName);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setLastResolvedName(null);
    setResolutionError(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (query.trim()) {
        resolveTypedDestination(query.trim());
      }
      return;
    }

    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      {/* Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className={`w-4 h-4 ${iconColor}`} />
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className={`w-full pl-9 pr-16 py-2.5 text-sm rounded-xl border font-medium transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 ${
            isDarkMode
              ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
          }`}
        />

        {/* Right side icons: Spinner, Resolving, Clear */}
        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
          {(loading || resolving) && <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" />}
          {query && !loading && !resolving && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Resolution status badge if resolved */}
      {lastResolvedName && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Resolved: {lastResolvedName}</span>
        </div>
      )}

      {/* Resolution error */}
      {resolutionError && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-rose-500 dark:text-rose-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{resolutionError}</span>
        </div>
      )}

      {/* Autocomplete Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 mt-1.5 rounded-2xl border shadow-xl z-50 overflow-hidden backdrop-blur-md transition-all ${
            isDarkMode
              ? 'bg-[#131E32]/98 border-slate-700/90 text-white shadow-black/60'
              : 'bg-white/98 border-slate-200 text-slate-900 shadow-slate-300/40'
          }`}
        >
          {/* Header info */}
          <div className="px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Search className="w-3 h-3 text-sky-500" />
              <span>{query.trim() ? 'Matching Locations' : 'Popular Destinations'}</span>
            </span>
            <span className="text-[10px] lowercase text-slate-500">Press Enter to resolve</span>
          </div>

          {/* Direct "Use as typed" entry */}
          {query.trim() && (
            <div
              onClick={() => resolveTypedDestination(query.trim())}
              className={`px-3.5 py-2 text-xs flex items-center justify-between border-b cursor-pointer transition-colors ${
                isDarkMode
                  ? 'border-slate-800/80 bg-sky-950/30 hover:bg-sky-900/40 text-sky-300'
                  : 'border-slate-100 bg-sky-50/70 hover:bg-sky-100/80 text-sky-700'
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <Compass className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span>Resolve & explore: <strong className="font-bold underline">{query.trim()}</strong></span>
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/20">
                Press ↵ Enter
              </span>
            </div>
          )}

          {/* Suggestions List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 no-scrollbar">
            {suggestions.length === 0 && !loading ? (
              <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                <div>No exact matches in local cache.</div>
                <button
                  type="button"
                  onClick={() => resolveTypedDestination(query.trim())}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Resolve "{query.trim()}" globally
                </button>
              </div>
            ) : (
              suggestions.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className={`w-full px-3.5 py-2.5 text-left text-xs transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold'
                        : isDarkMode
                          ? 'hover:bg-slate-800/80 text-slate-200'
                          : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        item.isCurated || item.source === 'dataset'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                      }`}>
                        {item.isCurated || item.source === 'dataset' ? (
                          <Sparkles className="w-3.5 h-3.5" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {item.displayName || `${item.state ? `${item.state}, ` : ''}${item.country || 'India'}`}
                        </div>
                      </div>
                    </div>

                    {item.source === 'dataset' ? (
                      <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Curated</span>
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>Global</span>
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Popular Destinations Quick Shortcuts Footer */}
          {showPopularChips && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Popular Recommendations:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {shortcutsToUse.map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleShortcutClick(city)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      query.toLowerCase() === city.toLowerCase()
                        ? 'bg-sky-600 text-white border-sky-600'
                        : isDarkMode
                          ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inline Quick Selection Chips beneath the input */}
      {showInlineChips && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            {inlineChipsLabel}
          </span>
          {shortcutsToUse.map(city => (
            <button
              key={city}
              type="button"
              onClick={() => handleShortcutClick(city)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                query.toLowerCase() === city.toLowerCase()
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs scale-105'
                  : isDarkMode
                    ? 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
