import React, { useState } from 'react';
import { POPULAR_DESTINATIONS } from '../data/travelData';
import { Destination } from '../types';
import { Star, MapPin, Sun, Calendar, Heart, ArrowRight, Compass, Eye } from 'lucide-react';

interface PopularDestinationsProps {
  isDarkMode: boolean;
  onSelectDestination: (dest: Destination) => void;
  onPlanDestination: (destName: string) => void;
  wishlist: string[];
  onToggleWishlist: (destId: string) => void;
}

export const PopularDestinations: React.FC<PopularDestinationsProps> = ({
  isDarkMode,
  onSelectDestination,
  onPlanDestination,
  wishlist,
  onToggleWishlist
}) => {
  const [activeRegion, setActiveRegion] = useState<string>('All');

  const regions = ['All', 'North', 'West', 'South', 'Islands'];

  const filtered = activeRegion === 'All'
    ? POPULAR_DESTINATIONS
    : POPULAR_DESTINATIONS.filter(d => d.region === activeRegion);

  return (
    <section className={`py-16 transition-colors ${isDarkMode ? 'bg-[#0E172A] text-white' : 'bg-white text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Featured Indian Destinations
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">
              Trending Destinations
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
              From snow-capped Himalayan passes to pristine turquoise lagoons and royal pink palaces.
            </p>
          </div>

          {/* Region Tabs */}
          <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            {regions.map(region => (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeRegion === region
                    ? 'bg-slate-900 text-white dark:bg-sky-600 shadow-xs'
                    : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-700 hover:text-slate-950 font-medium'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Destination Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map(dest => {
            const isWishlisted = wishlist.includes(dest.id);
            return (
              <div
                key={dest.id}
                id={`destination-card-${dest.id}`}
                className={`group relative rounded-xl overflow-hidden border transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col ${
                  isDarkMode ? 'bg-[#131E32] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-300 shadow-xs hover:border-slate-400'
                }`}
              >
                {/* Hero Image Container */}
                <div className="relative h-60 sm:h-64 overflow-hidden">
                  <img
                    src={dest.heroImage}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-xs font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      {dest.state}, {dest.country}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(dest.id);
                      }}
                      className={`p-2 rounded-lg backdrop-blur-xs border transition-colors cursor-pointer ${
                        isWishlisted 
                          ? 'bg-rose-500 text-white border-rose-500' 
                          : 'bg-slate-900/60 text-white border-white/20 hover:bg-slate-900'
                      }`}
                      title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
                    </button>
                  </div>

                  {/* Rating & Weather Badge on Image */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md font-medium">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{dest.rating}</span>
                      <span className="text-slate-300">({dest.reviewCount})</span>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md font-medium text-sky-300">
                      <Sun className="w-3.5 h-3.5" />
                      <span>{dest.weather.tempC}°C</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {dest.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {dest.tagline}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-400 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                        <span className="truncate">{dest.bestTimeToVisit}</span>
                      </div>
                      <div className="text-right font-semibold text-slate-900 dark:text-slate-100">
                        ₹{dest.avgDailyCostINR.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-600 dark:text-slate-400">/ day</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => onSelectDestination(dest)}
                      className="flex-1 py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Guide & Photos</span>
                    </button>

                    <button
                      onClick={() => onPlanDestination(dest.name)}
                      className="flex-1 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Plan Trip</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
