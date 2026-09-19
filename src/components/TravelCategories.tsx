import React, { useState } from 'react';
import { TRAVEL_CATEGORIES, POPULAR_DESTINATIONS, FEATURED_HOTELS, FEATURED_RESTAURANTS } from '../data/travelData';
import { TravelCategory } from '../types';
import { Waves, Mountain, Zap, Utensils, Camera, Moon, Users, Sparkles, Wallet, Trees, Landmark, Compass, Car, Tent, Backpack, ArrowRight, X, Star } from 'lucide-react';

interface TravelCategoriesProps {
  isDarkMode: boolean;
  onSelectDestination: (destName: string) => void;
}

const ICON_MAP: Record<string, any> = {
  Waves, Mountain, Zap, Utensils, Camera, Moon, Users, Sparkles, Wallet, Trees, Landmark, Compass, Car, Tent, Backpack
};

export const TravelCategories: React.FC<TravelCategoriesProps> = ({ isDarkMode, onSelectDestination }) => {
  const [activeCategory, setActiveCategory] = useState<TravelCategory | null>(null);

  return (
    <section className={`py-16 transition-colors ${isDarkMode ? 'bg-[#0B1120] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Curated Experiences
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">
              Explore By Travel Category
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Select your preferred travel mood to unlock tailor-made recommendations for stays, dining, late-night haunts, and secret trails.
            </p>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {TRAVEL_CATEGORIES.map((cat) => {
            const IconComponent = ICON_MAP[cat.iconName] || Compass;
            return (
              <div
                key={cat.id}
                id={`category-card-${cat.id}`}
                onClick={() => setActiveCategory(cat)}
                className={`group relative rounded-xl overflow-hidden cursor-pointer border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  isDarkMode 
                    ? 'bg-[#131E32] border-slate-800 hover:border-slate-700' 
                    : 'bg-white border-slate-300 hover:border-slate-400 shadow-xs'
                }`}
              >
                {/* Image background with gradient overlay */}
                <div className="h-32 sm:h-36 overflow-hidden relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
                  
                  {/* Category Badge Icon */}
                  <div className="absolute top-3 left-3 p-2 rounded-lg bg-slate-900/80 backdrop-blur-xs text-sky-300 shadow-xs">
                    <IconComponent className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3.5">
                  <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {cat.description}
                  </p>
                  
                  <div className="mt-2.5 flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400">
                    <span>{cat.popularSpots.length} Destinations</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Recommendation Modal */}
      {activeCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className={`relative w-full max-w-3xl rounded-2xl p-6 sm:p-7 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto border ${
            isDarkMode ? 'bg-[#131E32] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setActiveCategory(null)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-slate-900 text-sky-400 dark:bg-sky-600 dark:text-white">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Category Recommendations
                </span>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{activeCategory.name} Guide</h3>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              {activeCategory.description}. Curated specifically for travelers looking for top-tier experiences.
            </p>

            {/* Recommended Destinations */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
                Top Destinations for {activeCategory.name}
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeCategory.popularSpots.map(spot => (
                  <button
                    key={spot}
                    onClick={() => {
                      onSelectDestination(spot);
                      setActiveCategory(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-sky-600 hover:text-white hover:border-sky-600' 
                        : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-900 hover:text-white hover:border-slate-900'
                    }`}
                  >
                    <span>{spot}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>

            {/* Recommended Stays & Food */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5">
                  Featured Stays
                </h4>
                {FEATURED_HOTELS.slice(0, 2).map(hotel => (
                  <div key={hotel.id} className="p-3 rounded-xl border border-slate-300 dark:border-slate-800 mb-2 flex gap-3 items-center bg-slate-50 dark:bg-slate-800/40">
                    <img src={hotel.image} alt={hotel.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">{hotel.name}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">{hotel.type} • ₹{hotel.pricePerNightINR.toLocaleString('en-IN')}/night</div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5">
                  Top Dining & Night Spots
                </h4>
                {FEATURED_RESTAURANTS.slice(0, 2).map(rest => (
                  <div key={rest.id} className="p-3 rounded-xl border border-slate-300 dark:border-slate-800 mb-2 flex gap-3 items-center bg-slate-50 dark:bg-slate-800/40">
                    <img src={rest.image} alt={rest.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">{rest.name}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">{rest.type} • ⭐ {rest.rating}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveCategory(null)}
                className="px-5 py-2 rounded-lg bg-slate-900 dark:bg-sky-600 text-white font-semibold text-xs hover:bg-slate-800 dark:hover:bg-sky-500 transition-colors cursor-pointer"
              >
                Done Exploring
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
