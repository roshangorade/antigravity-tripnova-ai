import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Users, DollarSign, Compass, ArrowRight, MapPin, Bus, Plane, Train, Car } from 'lucide-react';
import { BudgetTier, TravelStyle } from '../types';
import { BudgetInputSelector } from './BudgetInputSelector';
import { DestinationSearchInput } from './DestinationSearchInput';

interface HeroSectionProps {
  onGenerateTrip: (query: {
    origin: string;
    destination: string;
    durationDays: number;
    travelersCount: number;
    budget: number;
    budgetTier?: BudgetTier;
    travelStyle: TravelStyle;
    interests: string[];
    transportMode: string;
  }) => void;
  isDarkMode: boolean;
}

const HERO_IMAGES = [
  { name: 'Leh Ladakh', url: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?q=80&w=1600&auto=format&fit=crop', state: 'Himalayas, India' },
  { name: 'Goa Coast', url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1600&auto=format&fit=crop', state: 'Goa, India' },
  { name: 'Jaipur Pink City', url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=1600&auto=format&fit=crop', state: 'Rajasthan, India' },
  { name: 'Udaipur Palace', url: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?q=80&w=1600&auto=format&fit=crop', state: 'Rajasthan, India' },
  { name: 'Kerala Backwaters', url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1600&auto=format&fit=crop', state: 'Kerala, India' }
];

const INTEREST_TAGS = ['Beaches', 'Mountains', 'Food', 'Culture', 'Photography', 'Nightlife', 'Spiritual', 'Wildlife', 'Shopping', 'Adventure'];

export const HeroSection: React.FC<HeroSectionProps> = ({ onGenerateTrip, isDarkMode }) => {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  // Form State
  const [origin, setOrigin] = useState('Mumbai');
  const [destination, setDestination] = useState('Goa');
  const [durationDays, setDurationDays] = useState(4);
  const [travelersCount, setTravelersCount] = useState(2);
  const [budget, setBudget] = useState<number>(10000);
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('couple');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Beaches', 'Food', 'Nightlife']);
  const [transportMode, setTransportMode] = useState('Flight');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImgIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budget || isNaN(budget) || budget <= 0) {
      alert('Please enter a valid trip budget greater than ₹0.');
      return;
    }
    onGenerateTrip({
      origin,
      destination,
      durationDays,
      travelersCount,
      budget,
      travelStyle,
      interests: selectedInterests,
      transportMode
    });
  };

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center pt-8 pb-16 overflow-hidden">
      {/* Background Image Carousel with Overlay */}
      {HERO_IMAGES.map((img, idx) => (
        <div
          key={img.name}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentImgIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
          }`}
          style={{
            backgroundImage: `url('${img.url}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className={`absolute inset-0 ${
            isDarkMode 
              ? 'bg-gradient-to-b from-slate-950/80 via-slate-900/85 to-slate-950' 
              : 'bg-gradient-to-b from-slate-900/60 via-slate-900/70 to-slate-950/90'
          }`} />
        </div>
      ))}

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        {/* Top Tagline */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium mb-5 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-sky-300" />
          <span>Intelligent Travel Planner & Itinerary Engine</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight max-w-4xl mx-auto mb-4 drop-shadow-sm">
          Plan Your Next Journey Easily with <span className="text-sky-300">TripNova AI</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-200 max-w-2xl mx-auto mb-8 font-normal leading-relaxed drop-shadow-xs">
          Intelligent day-wise itineraries, verified local stays, live flight comparisons, and curated food trails tailored to your style and budget.
        </p>

        {/* Intelligent Travel Planner Card */}
        <div className={`max-w-4xl mx-auto rounded-2xl p-6 sm:p-8 border shadow-xl text-left transition-all ${
          isDarkMode 
            ? 'bg-[#131E32]/95 border-slate-800 text-white shadow-black/40' 
            : 'bg-white/98 border-slate-200/90 text-slate-900 shadow-xl shadow-slate-200/50'
        }`}>
          <div className="flex items-center justify-between mb-5 border-b pb-3 border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Smart AI Trip Generator
              </h2>
            </div>
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Gemini 3.6 Flash Active
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: From & Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <DestinationSearchInput
                  id="hero-origin-input"
                  label="Starting From (City)"
                  value={origin}
                  onChange={(val) => setOrigin(val)}
                  placeholder="e.g. Mumbai, Delhi, Bengaluru, Pune"
                  isDarkMode={isDarkMode}
                  iconColor="text-slate-500 dark:text-slate-400"
                  showPopularChips={true}
                  showInlineChips={false}
                  required
                />
              </div>

              <div>
                <DestinationSearchInput
                  id="hero-destination-input"
                  label="Destination"
                  value={destination}
                  onChange={(val) => setDestination(val)}
                  placeholder="Search any destination (e.g. Mahabaleshwar, Dubai, Goa, Paris)..."
                  isDarkMode={isDarkMode}
                  iconColor="text-sky-500"
                  showPopularChips={true}
                  showInlineChips={true}
                  inlineChipsLabel="Popular:"
                  quickShortcuts={['Goa', 'Jaipur', 'Udaipur', 'Manali', 'Mumbai', 'Kerala']}
                  required
                />
              </div>
            </div>

            {/* Row 2: Duration, Travelers, Travel Style */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  Duration (Days)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-500 dark:text-slate-400" />
                  <input
                    id="hero-duration-input"
                    type="number"
                    min={1}
                    max={15}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500 font-medium ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  Travelers
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3 top-3 text-slate-500 dark:text-slate-400" />
                  <input
                    id="hero-travelers-input"
                    type="number"
                    min={1}
                    max={10}
                    value={travelersCount}
                    onChange={(e) => setTravelersCount(Number(e.target.value))}
                    className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500 font-medium ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  Travel Style
                </label>
                <select
                  id="hero-style-select"
                  value={travelStyle}
                  onChange={(e) => setTravelStyle(e.target.value as TravelStyle)}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500 font-medium cursor-pointer ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="couple">Couple</option>
                  <option value="solo">Solo</option>
                  <option value="family">Family</option>
                  <option value="friends">Friends Group</option>
                  <option value="adventure">Thrill Seekers</option>
                </select>
              </div>
            </div>

            {/* Row 3: Your Trip Budget */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-750/80 shadow-inner' 
                : 'bg-slate-50/90 border-slate-200/90 shadow-xs'
            }`}>
              <BudgetInputSelector
                idPrefix="hero"
                value={budget}
                onChange={setBudget}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Row 3: Transport Preference & Interests */}
            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Interests & Travel Vibe
              </label>
              <div className="flex flex-wrap gap-1.5">
                {INTEREST_TAGS.map(tag => {
                  const isSelected = selectedInterests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white dark:bg-sky-600 shadow-xs'
                          : isDarkMode
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 4: Generate Action Button */}
            <div className="pt-2">
              <button
                id="hero-generate-trip-button"
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-sky-400 dark:text-sky-200" />
                <span>Generate Smart Day-Wise Itinerary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Suggestions underneath */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Popular Itineraries:</span>
            <button
              onClick={() => {
                setOrigin('Mumbai');
                setDestination('Goa');
                setDurationDays(3);
                setBudget(10000);
              }}
              className="text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white underline font-medium cursor-pointer"
            >
              3-Day Goa Coastal Escape
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setOrigin('Delhi');
                setDestination('Leh Ladakh');
                setDurationDays(6);
                setBudget(25000);
              }}
              className="text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white underline font-medium cursor-pointer"
            >
              6-Day Ladakh High Pass
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setOrigin('Bengaluru');
                setDestination('Udaipur');
                setDurationDays(4);
                setBudget(50000);
              }}
              className="text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white underline font-medium cursor-pointer"
            >
              4-Day Udaipur Palace Stay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
