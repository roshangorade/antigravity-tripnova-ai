import React, { useState, useEffect } from 'react';
import { FEATURED_RESTAURANTS } from '../data/travelData';
import { Restaurant } from '../types';
import { Utensils, Star, MapPin, Search, Sparkles, Coffee, Compass, ExternalLink, Phone } from 'lucide-react';

interface FoodSectionProps {
  isDarkMode: boolean;
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
}

export const FoodSection: React.FC<FoodSectionProps> = ({ isDarkMode }) => {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [reservingRest, setReservingRest] = useState<Restaurant | null>(null);

  // Live SerpApi Google Local Search State
  const [localLocation, setLocalLocation] = useState<string>('Goa');
  const [localQuery, setLocalQuery] = useState<string>('Restaurants & Street Food');
  const [localResults, setLocalResults] = useState<LocalResultItem[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState<boolean>(false);
  const [isLiveLocal, setIsLiveLocal] = useState<boolean>(false);
  const [localStatusMsg, setLocalStatusMsg] = useState<string | null>(null);

  const presets = [
    { label: 'Restaurants in Goa', loc: 'Goa', q: 'Restaurants' },
    { label: 'Street food in Mumbai', loc: 'Mumbai', q: 'Street food' },
    { label: 'Best cafes in Manali', loc: 'Manali', q: 'Best cafes' },
    { label: 'Tourist attractions in Jaipur', loc: 'Jaipur', q: 'Tourist attractions' },
    { label: 'Things to do in Delhi', loc: 'Delhi', q: 'Things to do' },
  ];

  const fetchLocalPlaces = async (loc: string, q: string) => {
    setIsLoadingLocal(true);
    setLocalStatusMsg(null);
    try {
      const params = new URLSearchParams({
        location: loc || 'Goa',
        q: q || 'Restaurants'
      });

      const res = await fetch(`/api/search/local?${params.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.results) && data.results.length > 0) {
        setLocalResults(data.results);
        setIsLiveLocal(Boolean(data.isLive));
        if (data.message) setLocalStatusMsg(data.message);
      } else {
        fallbackLocal(loc);
        setLocalStatusMsg('Serving curated local dining spots.');
      }
    } catch (err) {
      console.error('Error fetching local places:', err);
      fallbackLocal(loc);
      setLocalStatusMsg('Unable to load local recommendations right now. Displaying curated options.');
    } finally {
      setIsLoadingLocal(false);
    }
  };

  const fallbackLocal = (loc: string) => {
    const filtered = FEATURED_RESTAURANTS.filter(r =>
      !loc || r.destination.toLowerCase().includes(loc.toLowerCase())
    );
    const mapped: LocalResultItem[] = (filtered.length > 0 ? filtered : FEATURED_RESTAURANTS).map(r => ({
      id: r.id,
      title: r.name,
      category: r.type,
      address: `${r.address}, ${r.destination}`,
      rating: r.rating,
      reviewsCount: 120,
      priceLevel: `₹${r.avgMealCostForTwoINR} for two`,
      thumbnail: r.image,
      description: r.mustTryDishes.join(', '),
      openState: 'Open for dining',
      isLive: false
    }));
    setLocalResults(mapped);
    setIsLiveLocal(false);
  };

  useEffect(() => {
    fetchLocalPlaces('Goa', 'Restaurants & Street Food');
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLocalPlaces(localLocation, localQuery);
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
        </div>

        {/* Live Search Panel */}
        <div className={`mb-12 p-5 sm:p-6 rounded-2xl border shadow-xs ${isDarkMode ? 'bg-[#131E32] border-slate-800' : 'bg-slate-50 border-slate-300'}`}>
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Location / City
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-sky-500" />
                  <input
                    type="text"
                    value={localLocation}
                    onChange={(e) => setLocalLocation(e.target.value)}
                    placeholder="e.g. Goa, Mumbai, Jaipur..."
                    className={`w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500 placeholder:text-slate-500 ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  What are you looking for?
                </label>
                <div className="relative">
                  <Utensils className="w-4 h-4 absolute left-3 top-3 text-sky-500" />
                  <input
                    type="text"
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    placeholder="e.g. Restaurants, Cafes, Street food, Tourist attractions..."
                    className={`w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500 placeholder:text-slate-500 ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="flex items-end">
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
                      <span>Search Google Local</span>
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
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Searching live local spots for {localLocation}...</p>
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
                      {place.isLive && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-sky-600 text-white text-[10px] font-semibold uppercase">
                          Google Local
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
                      {place.priceLevel || place.openState || 'Open for visitors'}
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
    </section>
  );
};
