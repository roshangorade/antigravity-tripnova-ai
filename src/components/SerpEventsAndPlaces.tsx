import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Search, ExternalLink, Ticket, Sparkles, Compass, Star, RefreshCw, AlertCircle, Info } from 'lucide-react';

export interface SerpEventItem {
  id: string;
  title: string;
  date: {
    startDate?: string;
    when?: string;
  };
  address: string[];
  location: string;
  link?: string;
  thumbnail?: string;
  description?: string;
  venue?: {
    name?: string;
    rating?: number;
    reviews?: number;
    link?: string;
  };
  ticketInfo?: Array<{
    source?: string;
    link?: string;
  }>;
  isLive?: boolean;
}

export interface SerpPlaceItem {
  id: string;
  title: string;
  snippet?: string;
  link?: string;
  image?: string;
  rating?: number;
  reviews?: number;
  category?: string;
  isLive?: boolean;
}

interface SerpEventsAndPlacesProps {
  initialLocation?: string;
  isDarkMode?: boolean;
  compact?: boolean;
  onSelectEvent?: (event: SerpEventItem) => void;
  onSelectPlace?: (place: SerpPlaceItem) => void;
}

export const SerpEventsAndPlaces: React.FC<SerpEventsAndPlacesProps> = ({
  initialLocation = 'Goa',
  isDarkMode = false,
  compact = false,
  onSelectEvent,
  onSelectPlace
}) => {
  const [activeTab, setActiveTab] = useState<'events' | 'places'>('events');
  const [location, setLocation] = useState(initialLocation);
  const [searchInput, setSearchInput] = useState(initialLocation);
  const [eventCategoryFilter, setEventCategoryFilter] = useState('all');

  // Events State
  const [events, setEvents] = useState<SerpEventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);
  const [eventsIsLive, setEventsIsLive] = useState<boolean>(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Places State
  const [places, setPlaces] = useState<SerpPlaceItem[]>([]);
  const [placesLoading, setPlacesLoading] = useState<boolean>(false);
  const [placesIsLive, setPlacesIsLive] = useState<boolean>(false);
  const [placesError, setPlacesError] = useState<string | null>(null);

  // Fetch Events
  const fetchEvents = async (targetLoc: string, category: string = 'events') => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const qParam = category !== 'all' && category !== 'events' ? category : 'events';
      const res = await fetch(`/api/events?location=${encodeURIComponent(targetLoc)}&q=${encodeURIComponent(qParam)}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.events)) {
        setEvents(data.events);
        setEventsIsLive(Boolean(data.isLive));
      } else {
        setEvents([]);
        setEventsError(data.message || 'Events are temporarily unavailable.');
      }
    } catch (err: any) {
      console.error('Failed to load events:', err);
      setEventsError('Events are temporarily unavailable.');
    } finally {
      setEventsLoading(false);
    }
  };

  // Fetch Discover Places
  const fetchPlaces = async (targetLoc: string) => {
    setPlacesLoading(true);
    setPlacesError(null);
    try {
      const res = await fetch(`/api/discover-places?location=${encodeURIComponent(targetLoc)}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.places)) {
        setPlaces(data.places);
        setPlacesIsLive(Boolean(data.isLive));
      } else {
        setPlaces([]);
        setPlacesError(data.message || 'More places could not be loaded right now.');
      }
    } catch (err: any) {
      console.error('Failed to load discover places:', err);
      setPlacesError('More places could not be loaded right now.');
    } finally {
      setPlacesLoading(false);
    }
  };

  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
      setSearchInput(initialLocation);
      fetchEvents(initialLocation, eventCategoryFilter);
      fetchPlaces(initialLocation);
    }
  }, [initialLocation]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const clean = searchInput.trim();
    setLocation(clean);
    if (activeTab === 'events') {
      fetchEvents(clean, eventCategoryFilter);
    } else {
      fetchPlaces(clean);
    }
  };

  const handleCategoryChange = (cat: string) => {
    setEventCategoryFilter(cat);
    fetchEvents(location, cat);
  };

  // Filtered local events based on search tag
  const filteredEvents = events.filter(evt => {
    if (eventCategoryFilter === 'all' || eventCategoryFilter === 'events') return true;
    const text = `${evt.title} ${evt.description} ${evt.location}`.toLowerCase();
    return text.includes(eventCategoryFilter.toLowerCase());
  });

  return (
    <div className={`rounded-3xl border shadow-lg overflow-hidden transition-all ${
      isDarkMode 
        ? 'bg-slate-900 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Header & Tabs */}
      <div className={`p-5 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
        isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/60'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-md">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg tracking-tight">SerpApi Intelligence Discovery</h3>
              {(activeTab === 'events' ? eventsIsLive : placesIsLive) ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live SerpApi
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Curated Backup
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Live Google Events & Discovered Hidden Attractions for <strong className="text-indigo-600 dark:text-indigo-400">{location}</strong>
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-200 dark:bg-slate-800 self-start md:self-auto border border-slate-300 dark:border-slate-700">
          <button
            onClick={() => {
              setActiveTab('events');
              if (events.length === 0) fetchEvents(location, eventCategoryFilter);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'events'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Events & Festivals</span>
            {events.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 text-[10px] font-extrabold">
                {events.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('places');
              if (places.length === 0) fetchPlaces(location);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'places'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover More Places</span>
            {places.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 text-[10px] font-extrabold">
                {places.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search & Filter Subbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/20">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search location (e.g. Goa, Mumbai, Manali, Jaipur)..."
            className={`w-full pl-9 pr-24 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500'
            }`}
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Search className="w-3 h-3" />
            <span>Search</span>
          </button>
        </form>

        {/* Category Filters for Events Tab */}
        {activeTab === 'events' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-[11px]">
            {[
              { id: 'all', label: 'All' },
              { id: 'festivals', label: 'Festivals' },
              { id: 'concerts', label: 'Music & Concerts' },
              { id: 'food', label: 'Food & Drinks' },
              { id: 'cultural', label: 'Arts & Culture' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3 py-1 rounded-lg whitespace-nowrap font-semibold transition-all cursor-pointer ${
                  eventCategoryFilter === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content View */}
      <div className="p-5">
        {/* TAB 1: EVENTS */}
        {activeTab === 'events' && (
          <div>
            {eventsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`p-4 rounded-2xl animate-pulse flex gap-4 ${
                    isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100/80'
                  }`}>
                    <div className="w-24 h-24 rounded-xl bg-slate-300 dark:bg-slate-700 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-3/4" />
                      <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2" />
                      <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : eventsError && filteredEvents.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <h4 className="font-bold text-sm">Events Notice</h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1 max-w-md mx-auto">{eventsError}</p>
                <button
                  onClick={() => fetchEvents(location, eventCategoryFilter)}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-indigo-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Search</span>
                </button>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <Info className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                <h4 className="font-bold text-sm">No Events Found</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Try searching for popular destinations like Goa, Mumbai, Pune, or Manali.</p>
              </div>
            ) : (
              <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                {filteredEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => onSelectEvent?.(evt)}
                    className={`group relative p-4 rounded-2xl border transition-all hover:shadow-xl flex flex-col sm:flex-row gap-4 cursor-pointer ${
                      isDarkMode
                        ? 'bg-slate-800/60 border-slate-700/80 hover:border-indigo-500/50'
                        : 'bg-white border-slate-300 hover:border-indigo-500/50 shadow-xs'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-full sm:w-28 h-32 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-900">
                      <img
                        src={evt.thumbnail}
                        alt={evt.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        <span>{evt.date.startDate || 'Upcoming'}</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                            {evt.title}
                          </h4>
                          {evt.venue?.rating && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-0.5 shrink-0">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {evt.venue.rating}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1 flex items-center gap-1 line-clamp-1">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>{evt.location || evt.venue?.name || location}</span>
                        </p>

                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 line-clamp-2 leading-snug">
                          {evt.description}
                        </p>
                      </div>

                      {/* Ticket / Action Bar */}
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">
                          {evt.date.when || 'Live Event'}
                        </span>

                        {evt.link && evt.link !== '#' ? (
                          <a
                            href={evt.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-[11px] font-bold flex items-center gap-1 transition-all"
                          >
                            <Ticket className="w-3 h-3" />
                            <span>Tickets / Details</span>
                            <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Venue Event</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DISCOVER MORE PLACES */}
        {activeTab === 'places' && (
          <div>
            {placesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`p-4 rounded-2xl animate-pulse space-y-3 ${
                    isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100/80'
                  }`}>
                    <div className="w-full h-36 rounded-xl bg-slate-300 dark:bg-slate-700" />
                    <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : placesError && places.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <h4 className="font-bold text-sm">Places Notice</h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1 max-w-md mx-auto">{placesError}</p>
                <button
                  onClick={() => fetchPlaces(location)}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-indigo-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Search</span>
                </button>
              </div>
            ) : places.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <Compass className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                <h4 className="font-bold text-sm">No Places Found</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Search for another destination like Manali, Goa, or Jaipur.</p>
              </div>
            ) : (
              <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'} gap-4`}>
                {places.map((plc) => (
                  <div
                    key={plc.id}
                    onClick={() => onSelectPlace?.(plc)}
                    className={`group relative p-4 rounded-2xl border transition-all hover:shadow-xl flex flex-col justify-between cursor-pointer ${
                      isDarkMode
                        ? 'bg-slate-800/60 border-slate-700/80 hover:border-indigo-500/50'
                        : 'bg-white border-slate-300 hover:border-indigo-500/50 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Image */}
                      <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 mb-3">
                        <img
                          src={plc.image}
                          alt={plc.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                        <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold">
                          {plc.category || 'Sight / Attraction'}
                        </div>
                        {plc.rating && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center gap-0.5 shadow-md">
                            <Star className="w-3 h-3 fill-slate-950" />
                            {plc.rating} ({plc.reviews || 100})
                          </div>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {plc.title}
                      </h4>

                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 line-clamp-3 leading-relaxed">
                        {plc.snippet}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400">
                        {location} Highlight
                      </span>

                      {plc.link && plc.link !== '#' && (
                        <a
                          href={plc.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors shadow-sm"
                        >
                          <span>Explore Spot</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
