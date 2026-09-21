import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  MapPin, 
  Star, 
  Utensils, 
  Hotel, 
  Check, 
  Compass, 
  Calendar, 
  ArrowRight, 
  Loader2, 
  Clock, 
  Users,
  Award,
  Flame,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { BudgetInputSelector } from './BudgetInputSelector';
import { DestinationSearchInput } from './DestinationSearchInput';

interface PersonalizedRecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  initialDestination?: string;
  onSelectHotel?: (hotel: any) => void;
}

export const PersonalizedRecommendationsModal: React.FC<PersonalizedRecommendationsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  initialDestination = 'Goa',
  onSelectHotel
}) => {
  const [destination, setDestination] = useState(initialDestination);
  const [travelStyle, setTravelStyle] = useState('couple');
  const [budget, setBudget] = useState<number>(10000);
  const [budgetTier, setBudgetTier] = useState('moderate');
  const [dietary, setDietary] = useState<string[]>(['Vegetarian']);
  const [vibe, setVibe] = useState('');
  const [interests, setInterests] = useState<string[]>(['Beach', 'Food', 'Culture']);

  const [loading, setLoading] = useState(false);
  const [recommendationResult, setRecommendationResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'stays' | 'dining' | 'dayplan' | 'tips'>('stays');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const destinationOptions = ['Goa', 'Jaipur', 'Udaipur', 'Manali', 'Kerala', 'Varanasi', 'Mumbai', 'Andaman', 'Leh Ladakh'];

  const travelStyles = [
    { id: 'couple', label: 'Couple & Romantic', emoji: '🥂' },
    { id: 'solo', label: 'Solo Nomad', emoji: '🎒' },
    { id: 'family', label: 'Family Vacation', emoji: '👨‍👩‍👧‍👦' },
    { id: 'friends', label: 'Friends & Nightlife', emoji: '🎉' },
    { id: 'luxury', label: 'Luxury Connoisseur', emoji: '👑' },
    { id: 'foodie', label: 'Foodie Explorer', emoji: '🍜' },
  ];

  const budgetTiers = [
    { id: 'backpacker', label: 'Budget Friendly', desc: 'Hostels, local diners & street eats' },
    { id: 'moderate', label: 'Comfort & Heritage', desc: 'Boutique stays & curated dining' },
    { id: 'luxury', label: 'Royal & 5-Star Luxury', desc: 'Palaces, fine dining & private villas' },
  ];

  const dietaryOptions = ['Vegetarian', 'Vegan', 'Halal', 'Jain', 'Gluten-Free'];

  const vibePresets = [
    'Sunset ocean cocktails with fresh coastal seafood',
    'Royal heritage palace dinner with classical music',
    'Riverside bohemian cafe with acoustic live music',
    'Hidden street food gems and ancient bazaar walks',
    'Serene wellness spa resort with organic cuisine'
  ];

  const toggleDietary = (item: string) => {
    if (dietary.includes(item)) {
      setDietary(dietary.filter(d => d !== item));
    } else {
      setDietary([...dietary, item]);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/recommendations/personalized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          travelStyle,
          budget,
          budgetTier,
          dietaryPreferences: dietary,
          interests,
          vibe: vibe || 'Curated authentic travel and culinary experience',
          nights: 3,
          guestsCount: travelStyle === 'solo' ? 1 : 2,
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setRecommendationResult(data.data);
        setActiveTab('stays');
      }
    } catch (err) {
      console.error('Failed to get personalized recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-md transition-all animate-fadeIn">
      <div 
        className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden ${
          isDarkMode 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-100 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-6 sm:p-8 flex items-center justify-between border-b ${
          isDarkMode ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-gradient-to-r from-orange-50/70 via-rose-50/40 to-amber-50/60'
        }`}>
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-bold font-serif-editorial">Gemini AI Personalized Recommendations</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  Powered by Gemini 2.5
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Matches verified PostgreSQL hotel stays & culinary dining to your exact traveler persona.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* Persona Configuration Form */}
          {!recommendationResult ? (
            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Destination Search & Suggestions */}
              <div>
                <DestinationSearchInput
                  id="modal-destination-input"
                  label="Select or Search Destination"
                  value={destination}
                  onChange={(val) => setDestination(val)}
                  placeholder="Search any destination (e.g. Mahabaleshwar, Dubai, Goa, Paris)..."
                  isDarkMode={isDarkMode}
                  iconColor="text-orange-500"
                  showPopularChips={true}
                  showInlineChips={true}
                  inlineChipsLabel="Suggestions:"
                  quickShortcuts={destinationOptions}
                  required
                />
              </div>

              {/* Travel Style */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Travel Persona & Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {travelStyles.map(style => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setTravelStyle(style.id)}
                      className={`p-3 rounded-2xl text-left border transition-all flex items-center space-x-2.5 ${
                        travelStyle === style.id
                          ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-2 ring-orange-500/30 font-semibold'
                          : isDarkMode
                            ? 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="text-xl">{style.emoji}</span>
                      <span className="text-sm font-medium">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Your Trip Budget */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isDarkMode 
                  ? 'bg-slate-800/40 border-slate-750 shadow-inner' 
                  : 'bg-slate-50/90 border-slate-200/90 shadow-xs'
              }`}>
                <BudgetInputSelector
                  idPrefix="modal"
                  value={budget}
                  onChange={(val) => {
                    setBudget(val);
                    if (val <= 3000) setBudgetTier('backpacker');
                    else if (val <= 20000) setBudgetTier('moderate');
                    else setBudgetTier('luxury');
                  }}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Dietary Preferences */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Dietary Preferences
                </label>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map(opt => {
                    const isSelected = dietary.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleDietary(opt)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                            : isDarkMode
                              ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                              : 'bg-slate-100 text-slate-600 hover:text-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Vibe / Dream Atmosphere */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Custom Wish / Vibe (Optional)
                </label>
                <input
                  type="text"
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  placeholder="e.g. Sunset sea view with live acoustic music and authentic Goan crab"
                  className={`w-full px-4 py-3 rounded-2xl border outline-none text-sm transition-all focus:ring-2 focus:ring-orange-500 ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {vibePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setVibe(preset)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 hover:from-orange-600 hover:via-rose-600 hover:to-amber-600 text-white font-bold text-base shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Gemini AI Analyzing PostgreSQL Stays & Menus...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Generate Personalized Recommendations</span>
                      <ArrowRight className="w-5 h-5 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Results View */
            <div className="space-y-6 animate-fadeIn">
              {/* Persona Banner */}
              <div className={`p-6 rounded-3xl border relative overflow-hidden ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-orange-950/40 via-slate-900 to-amber-950/30 border-orange-500/30' 
                  : 'bg-gradient-to-r from-orange-50 via-rose-50/50 to-amber-50 border-orange-200/80'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500 text-white shadow-sm">
                        Persona Match
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-orange-500" />
                        {recommendationResult.destination}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-serif-editorial mt-2">
                      {recommendationResult.personaTitle || `${destination} Curators`}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                      {recommendationResult.matchOverview}
                    </p>
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <button
                      onClick={() => setRecommendationResult(null)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Refine Preferences
                    </button>
                    <button
                      onClick={handleShare}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 hover:bg-orange-200 transition-colors flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {copiedLink ? 'Link Copied!' : 'Share Recommendations'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setActiveTab('stays')}
                  className={`pb-3 px-4 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
                    activeTab === 'stays'
                      ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Hotel className="w-4 h-4" />
                  <span>Curated Stays ({recommendationResult.recommendedHotels?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('dining')}
                  className={`pb-3 px-4 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
                    activeTab === 'dining'
                      ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  <span>Curated Dining ({recommendationResult.recommendedRestaurants?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('dayplan')}
                  className={`pb-3 px-4 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
                    activeTab === 'dayplan'
                      ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>Perfect Day Blueprint</span>
                </button>

                <button
                  onClick={() => setActiveTab('tips')}
                  className={`pb-3 px-4 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
                    activeTab === 'tips'
                      ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>Insider Tips</span>
                </button>
              </div>

              {/* Tab 1: Recommended Stays */}
              {activeTab === 'stays' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {recommendationResult.recommendedHotels?.map((hotel: any) => (
                    <div
                      key={hotel.id}
                      className={`rounded-3xl border overflow-hidden transition-all hover:shadow-xl group flex flex-col ${
                        isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="relative h-48 w-full overflow-hidden">
                        <img
                          src={hotel.image}
                          alt={hotel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow">
                          <Flame className="w-3.5 h-3.5 text-orange-400 fill-current" />
                          <span>{hotel.matchScore}% Match</span>
                        </div>
                        <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-white px-3 py-1 rounded-xl text-sm font-bold shadow">
                          {hotel.priceDisplay}
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400">
                              {hotel.type}
                            </span>
                            <div className="flex items-center text-amber-500 text-xs font-bold">
                              <Star className="w-3.5 h-3.5 fill-current mr-1" />
                              {hotel.rating}
                            </div>
                          </div>

                          <h4 className="text-lg font-bold mt-2 text-slate-900 dark:text-white font-serif-editorial">
                            {hotel.name}
                          </h4>

                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-1">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {hotel.locationDesc || hotel.destination}
                          </p>

                          {/* Gemini AI Personalized Rationale */}
                          <div className={`mt-3.5 p-3 rounded-2xl text-xs italic leading-relaxed border ${
                            isDarkMode ? 'bg-slate-900/60 border-slate-700 text-slate-300' : 'bg-orange-50/60 border-orange-100 text-slate-700'
                          }`}>
                            <span className="font-semibold not-italic text-orange-600 dark:text-orange-400 mr-1">
                              Why Gemini picked this:
                            </span>
                            "{hotel.whyGeminiPickedThis}"
                          </div>

                          {hotel.recommendedRoomTip && (
                            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span><strong>Room Tip:</strong> {hotel.recommendedRoomTip}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {hotel.reviewsCount} reviews
                          </span>
                          <button
                            onClick={() => {
                              if (onSelectHotel) {
                                onSelectHotel(hotel);
                              }
                              onClose();
                            }}
                            className="px-4 py-2 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-colors shadow-sm flex items-center gap-1"
                          >
                            <span>Reserve Stay</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Recommended Dining */}
              {activeTab === 'dining' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {recommendationResult.recommendedRestaurants?.map((restaurant: any) => (
                    <div
                      key={restaurant.id}
                      className={`rounded-3xl border overflow-hidden transition-all hover:shadow-xl group flex flex-col ${
                        isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="relative h-48 w-full overflow-hidden">
                        <img
                          src={restaurant.image}
                          alt={restaurant.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow">
                          <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
                          <span>{restaurant.matchScore}% Match</span>
                        </div>
                        <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-white px-3 py-1 rounded-xl text-sm font-bold shadow">
                          {restaurant.costDisplay}
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {(restaurant.cuisine || ['Local Flavors']).slice(0, 2).map((c: string) => (
                                <span key={c} className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                                  {c}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center text-amber-500 text-xs font-bold">
                              <Star className="w-3.5 h-3.5 fill-current mr-1" />
                              {restaurant.rating}
                            </div>
                          </div>

                          <h4 className="text-lg font-bold mt-2 text-slate-900 dark:text-white font-serif-editorial">
                            {restaurant.name}
                          </h4>

                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-1">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {restaurant.address || restaurant.destination}
                          </p>

                          {/* Gemini AI Personalized Rationale */}
                          <div className={`mt-3.5 p-3 rounded-2xl text-xs italic leading-relaxed border ${
                            isDarkMode ? 'bg-slate-900/60 border-slate-700 text-slate-300' : 'bg-rose-50/60 border-rose-100 text-slate-700'
                          }`}>
                            <span className="font-semibold not-italic text-rose-600 dark:text-rose-400 mr-1">
                              Why Gemini picked this:
                            </span>
                            "{restaurant.whyGeminiPickedThis}"
                          </div>

                          {/* Must-try dishes tags */}
                          {restaurant.mustTryForYou && restaurant.mustTryForYou.length > 0 && (
                            <div className="mt-3">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                Must-Order for You:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {restaurant.mustTryForYou.map((dish: string) => (
                                  <span
                                    key={dish}
                                    className="px-2.5 py-1 rounded-lg text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium border border-amber-500/20"
                                  >
                                    🍽️ {dish}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {restaurant.bestTimeToVisit && (
                            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                              <span><strong>Best Time:</strong> {restaurant.bestTimeToVisit}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                          <div className="flex gap-1">
                            {(restaurant.dietaryTags || []).map((tag: string) => (
                              <span key={tag} className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            Verified Spot
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Curated Day Blueprint */}
              {activeTab === 'dayplan' && (
                <div className="space-y-4">
                  <div className={`p-5 rounded-3xl border ${
                    isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-500" />
                      <span>Cohesive 24-Hour Stay & Culinary Harmony</span>
                    </h4>

                    <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-orange-300 dark:before:bg-orange-800">
                      <div className="relative">
                        <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-orange-500 ring-4 ring-orange-100 dark:ring-orange-950" />
                        <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                          Morning Stay & Awakening
                        </span>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
                          {recommendationResult.curatedDayPairing?.morningStay}
                        </p>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-950" />
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                          Midday Culinary Feast
                        </span>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
                          {recommendationResult.curatedDayPairing?.lunchSpot}
                        </p>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-950" />
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          Late Afternoon & Sunset Vibe
                        </span>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
                          {recommendationResult.curatedDayPairing?.eveningExperience}
                        </p>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Exquisite Dinner Celebration
                        </span>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
                          {recommendationResult.curatedDayPairing?.dinnerSpot}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Insider Tips */}
              {activeTab === 'tips' && (
                <div className="space-y-3">
                  {(recommendationResult.aiInsiderTips || []).map((tip: string, idx: number) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border flex items-start space-x-3 ${
                        isDarkMode ? 'bg-slate-800/60 border-slate-700 text-slate-200' : 'bg-orange-50/50 border-orange-100 text-slate-800'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
