import React, { useState, useEffect } from 'react';
import { FEATURED_RESTAURANTS } from '../data/travelData';
import { IMPORTED_RESTAURANTS } from '../data/importedData';
import { PersonalizedRecommendationsModal } from './PersonalizedRecommendationsModal';
import { Restaurant } from '../types';
import { Utensils, Star, MapPin, Search, Sparkles, Coffee, Compass, ExternalLink, Phone } from 'lucide-react';

import { CanonicalDestination } from '../types';
import { DestinationSearchInput } from './DestinationSearchInput';

interface FoodSectionProps {
  isDarkMode: boolean;
  currentDestination?: CanonicalDestination | null;
  onDestinationChange?: (destination: CanonicalDestination) => void;
}

interface LocalResultItem {
  id: string;
  title: string;
  category: string;
  address: string;
  rating: number;
  reviewsCount: number;
  priceLevel?: string;
  thumbnail?: string;
  phone?: string;
  website?: string;
  openState?: string;
  description?: string;
  isLive?: boolean;
  source?: string;
  distanceKm?: number;
  distanceLabel?: string;
}

export const FoodSection: React.FC<FoodSectionProps> = ({ 
  isDarkMode,
  currentDestination,
  onDestinationChange
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [reservingRest, setReservingRest] = useState<Restaurant | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Live Google Local / Local Dataset Search State
  const [localLocation, setLocalLocation] = useState<string>(currentDestination?.name || 'Nashik');
  const [resolvedCoords, setResolvedCoords] = useState<{ lat?: number; lng?: number }>({
    lat: currentDestination?.latitude,
    lng: currentDestination?.longitude
  });
  const [localQuery, setLocalQuery] = useState<string>('Restaurants & Street Food');
  const [localResults, setLocalResults] = useState<LocalResultItem[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState<boolean>(false);
  const [isLiveLocal, setIsLiveLocal] = useState<boolean>(false);
  const [localStatusMsg, setLocalStatusMsg] = useState<string | null>(null);

  // Race condition prevention refs
  const activeLocalRequestRef = React.useRef<AbortController | null>(null);
  const activeRequestIdRef = React.useRef<number>(0);

  // Sync if global destination changes
  useEffect(() => {
    if (currentDestination && currentDestination.name) {
      setLocalLocation(currentDestination.name);
      setResolvedCoords({ lat: currentDestination.latitude, lng: currentDestination.longitude });
      fetchLocalPlaces(currentDestination.name, localQuery, currentDestination.latitude, currentDestination.longitude);
    }
  }, [currentDestination]);

  const presets = [
    { label: 'Restaurants in Nashik', loc: 'Nashik', q: 'Restaurants' },
    { label: 'Food in Chhatrapati Sambhajinagar', loc: 'Chhatrapati Sambhajinagar', q: 'Street food' },
    { label: 'Cafes in Pune', loc: 'Pune', q: 'Best cafes' },
    { label: 'Restaurants in Mumbai', loc: 'Mumbai', q: 'Restaurants' },
    { label: 'Dining in Dubai', loc: 'Dubai', q: 'Fine dining' },
  ];

  const fetchLocalPlaces = async (loc: string, q: string, lat?: number, lng?: number) => {
    const trimmedLoc = (loc || '').trim();
    if (!trimmedLoc) return;

    if (activeLocalRequestRef.current) {
      activeLocalRequestRef.current.abort();
    }
    const controller = new AbortController();
    activeLocalRequestRef.current = controller;
    const reqId = ++activeRequestIdRef.current;

    setIsLoadingLocal(true);
    setLocalStatusMsg(null);
    try {
      const params = new URLSearchParams({
        location: trimmedLoc,
        q: q || 'Restaurants'
      });
      if (lat !== undefined && lng !== undefined) {
        params.append('lat', String(lat));
        params.append('lng', String(lng));
      }

      const res = await fetch(`/api/search/local?${params.toString()}`, {
        signal: controller.signal
      });
      const data = await res.json();

      if (reqId !== activeRequestIdRef.current) return;

      if (data.success && Array.isArray(data.results) && data.results.length > 0) {
        setLocalResults(data.results);
        setIsLiveLocal(Boolean(data.isLive));
        if (data.message) setLocalStatusMsg(data.message);
      } else {
        // STRICT: Never fall back to unrelated cities!
        setLocalResults([]);
        setIsLiveLocal(false);
        setLocalStatusMsg(`No verified dining places found in ${trimmedLoc}. Try adjusting your search keywords.`);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching local places:', err);
        setLocalResults([]);
        setLocalStatusMsg(`Unable to load recommendations for ${trimmedLoc}.`);
      }
    } finally {
      if (reqId === activeRequestIdRef.current) {
        setIsLoadingLocal(false);
      }
    }
  };

  useEffect(() => {
    const initialName = currentDestination?.name || 'Nashik';
    fetchLocalPlaces(initialName, 'Restaurants & Street Food', currentDestination?.latitude, currentDestination?.longitude);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLocalPlaces(localLocation, localQuery, resolvedCoords.lat, resolvedCoords.lng);
  };

  const handleDestinationResolved = (canonical: CanonicalDestination) => {
    setLocalLocation(canonical.name);
    setResolvedCoords({ lat: canonical.latitude, lng: canonical.longitude });
    if (onDestinationChange) {
      onDestinationChange(canonical);
    }
    fetchLocalPlaces(canonical.name, localQuery, canonical.latitude, canonical.longitude);
  };

  const handlePresetClick = (loc: string, q: string) => {
    setLocalLocation(loc);
    setLocalQuery(q);
    fetchLocalPlaces(loc, q);
  };

  const tags = ['All', 'Vegetarian', 'Fine Dining', 'Street Food', 'Traditional'];

  const filteredFeatured = FEATURED_RESTAURANTS.filter(r => {
    if (selectedTag === 'All') return true;
    if (selectedTag === 'Vegetarian') return r.dietaryTags.includes('Vegetarian');
    return r.type.toLowerCase().includes(selectedTag.toLowerCase());
  });

  return (
    <section className={`py-16 transition-colors ${isDarkMode ? 'bg-[#0E172A] text-white' : 'bg-white text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Gastronomy & Local Discovery
              </span>
              {isLiveLocal && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium border border-amber-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Live Google Local
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">
              Food, Cafes & Attractions Search
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
              Discover popular local spots, authentic street food stalls, cafes, and iconic attractions in any city.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAiModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all transform hover:scale-[1.02] cursor-pointer self-start md:self-auto"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>✨ Gemini AI Food Pairings</span>
          </button>
        </div>        {/* Live Search Panel */}
        <div className={`mb-12 p-5 sm:p-6 rounded-2xl border shadow-xs ${isDarkMode ? 'bg-[#131E32] border-slate-800' : 'bg-slate-50 border-slate-300'}`}>
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4">
              <div className="md:col-span-5">
                <DestinationSearchInput
                  id="food-dest-input"
                  label="Location / City"
                  value={localLocation}
                  onChange={(val, coords) => {
                    setLocalLocation(val);
                    if (coords) {
                      setResolvedCoords(coords);
                    }
                  }}
                  onSelectCanonical={handleDestinationResolved}
                  placeholder="e.g. Nashik, Chhatrapati Sambhajinagar, Dubai..."
                  isDarkMode={isDarkMode}
                  showPopularChips={false}
                  showInlineChips={false}
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category / Query
                </label>
                <div className="relative">
                  <Utensils className="w-4 h-4 absolute left-3 top-3 text-sky-500" />
                  <input
                    type="text"
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    placeholder="e.g. Restaurants, Cafes, Street food, Biryani..."
                    className={`w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500 placeholder:text-slate-500 ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-3 flex items-end">
                <button
                  type="submit"
                  disabled={isLoadingLocal}
                  className="w-full py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isLoadingLocal ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-sky-400 dark:text-sky-200" />
                      <span>Search Dining</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mr-1">Quick Ideas:</span>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetClick(p.loc, p.q)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-300 text-xs font-medium border border-slate-300 dark:border-slate-700 hover:border-slate-500 dark:hover:border-slate-500 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {localStatusMsg && (
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {localStatusMsg}
              </p>
            )}
          </form>

          {/* Results Grid */}
          {isLoadingLocal ? (
            <div className="py-12 text-center">
              <div className="w-7 h-7 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Searching verified local dining spots for {localLocation}...</p>
            </div>
          ) : localResults.length === 0 ? (
            <div className="mt-6 py-12 text-center border rounded-2xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 p-6">
              <Utensils className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">No verified dining spots found in {localLocation}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
                No verified restaurants found for category "{localQuery}". Try searching for broader terms like "Restaurants", "Cafes", or "Street Food".
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {localResults.map((place) => (
                <div
                  key={place.id}
                  className={`rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isDarkMode ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-300 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="relative h-44 rounded-lg overflow-hidden mb-3">
                      <img
                        src={place.thumbnail || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'}
                        alt={place.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-xs font-medium">
                        {place.category}
                      </span>
                      {place.distanceLabel && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/90 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                          {place.distanceLabel}
                        </span>
                      )}
                      {place.source && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-sky-600 text-white text-[10px] font-semibold uppercase">
                          {place.source === 'local_dataset' ? '27k+ Dataset' : place.source}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{place.title}</h4>
                      <div className="flex items-center text-xs font-medium text-amber-500 shrink-0 ml-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5" />
                        <span>{place.rating}</span>
                        <span className="text-slate-600 dark:text-slate-400 text-xs font-medium ml-0.5">({place.reviewsCount})</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{place.address}</span>
                    </p>

                    {place.description && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 line-clamp-2 italic">
                        "{place.description}"
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {place.priceLevel || place.openState || 'Open for dining'}
                    </span>

                    {place.website ? (
                      <a
                        href={place.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline text-xs"
                      >
                        <span>Visit Spot</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                        Verified Location
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Featured Restaurants Header & Grid */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Curated Regional Restaurants</h3>
          <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium overflow-x-auto whitespace-nowrap">
            {tags.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTag(t)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  selectedTag === t
                    ? 'bg-slate-900 text-white dark:bg-sky-600 shadow-xs'
                    : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-700 hover:text-slate-950 font-medium'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatured.map(rest => (
            <div
              key={rest.id}
              className={`rounded-xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col ${
                isDarkMode ? 'bg-[#131E32] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-300 hover:border-slate-400 shadow-xs'
              }`}
            >
              <div className="relative h-56">
                <img src={rest.image} alt={rest.name} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-xs font-medium">
                  {rest.type}
                </span>
                <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-amber-400 px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{rest.rating}</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {rest.destination}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{rest.name}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {rest.address}
                  </p>

                  <div className="mt-3">
                    <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Signature Must-Try:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rest.mustTryDishes.map((dish, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-800 dark:text-sky-300 font-semibold">
                          {dish}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Meal for Two</span>
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      ₹{rest.avgMealCostForTwoINR.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <button
                    onClick={() => setReservingRest(rest)}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Reserve Table
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Reservation Modal */}
      {reservingRest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl ${
            isDarkMode ? 'bg-[#131E32] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reserve Table at {reservingRest.name}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{reservingRest.destination} • {reservingRest.address}</p>

            <div className="my-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Guests</label>
                <select className={`w-full p-2 rounded-xl border font-medium ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}>
                  <option>2 Guests</option>
                  <option>4 Guests</option>
                  <option>6 Guests</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Preferred Time</label>
                <select className={`w-full p-2 rounded-xl border font-medium ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}>
                  <option>07:30 PM (Dinner)</option>
                  <option>08:30 PM (Dinner)</option>
                  <option>01:30 PM (Lunch)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setReservingRest(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Table reserved at ${reservingRest.name}! A SMS confirmation has been simulated.`);
                  setReservingRest(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Confirm Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gemini AI Personalized Recommendations Modal */}
      <PersonalizedRecommendationsModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        isDarkMode={isDarkMode}
        initialDestination={localLocation || 'Goa'}
      />
    </section>
  );
};
