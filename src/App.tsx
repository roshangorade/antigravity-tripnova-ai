import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { TravelCategories } from './components/TravelCategories';
import { PopularDestinations } from './components/PopularDestinations';
import { AIPlannerChat } from './components/AIPlannerChat';
import { HotelsSection } from './components/HotelsSection';
import { FlightsSection } from './components/FlightsSection';
import { FoodSection } from './components/FoodSection';
import { TransportSection } from './components/TransportSection';
import { WeatherWidget } from './components/WeatherWidget';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { DestinationModal } from './components/DestinationModal';
import { MapView } from './components/MapView';
import { AuthModal } from './components/AuthModal';
import { AboutUsModal } from './components/AboutUsModal';
import { CareersSection } from './components/CareersSection';
import { Footer } from './components/Footer';
import { LocalIntelligenceSection } from './components/LocalIntelligenceSection';
import { AIFoodDiscovery } from './components/AIFoodDiscovery';
import { SmartRouteRecommendation } from './components/SmartRouteRecommendation';
import { FeedbackForm } from './components/FeedbackForm';
import { Destination, TravelItinerary, BudgetTier, TravelStyle, UserProfile } from './types';
import { POPULAR_DESTINATIONS, MOCK_USER_PROFILE } from './data/travelData';
import { Heart, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      if (path === '/careers') {
        return 'careers';
      }
    }
    return 'home';
  });

  // URL sync & Page Title management for /careers route
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeTab === 'careers') {
        if (window.location.pathname.toLowerCase().replace(/\/+$/, '') !== '/careers') {
          window.history.pushState(null, '', '/careers');
        }
        document.title = 'Careers at TripNova.ai';
      } else {
        if (window.location.pathname.toLowerCase().replace(/\/+$/, '') === '/careers') {
          window.history.pushState(null, '', '/');
        }
        document.title = 'TripNova AI - Smart Travel Planner';
      }
    }
  }, [activeTab]);

  // Handle browser back and forward navigation
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
        if (path === '/careers') {
          setActiveTab('careers');
        } else if (activeTab === 'careers') {
          setActiveTab('home');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tripnova_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [currency, setCurrency] = useState('INR');

  // Synchronize .dark class on root HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tripnova_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tripnova_theme', 'light');
    }
  }, [isDarkMode]);

  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>(['goa', 'h1']);
  const [wishlistDrawerOpen, setWishlistDrawerOpen] = useState(false);

  // Saved generated itineraries
  const [savedItineraries, setSavedItineraries] = useState<TravelItinerary[]>([]);

  // Selected destination modal
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

  // Auth & Profile state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(MOCK_USER_PROFILE);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [aboutUsOpen, setAboutUsOpen] = useState(false);

  const toggleWishlist = (id: string) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter(item => item !== id));
    } else {
      setWishlist([...wishlist, id]);
    }
  };

  const handleGenerateTripFromHero = async (query: {
    origin: string;
    destination: string;
    durationDays: number;
    travelersCount: number;
    budgetTier: BudgetTier;
    travelStyle: TravelStyle;
    interests: string[];
    transportMode: string;
  }) => {
    setActiveTab('ai-planner');
    try {
      const res = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });
      const data = await res.json();
      if (data.success && data.itinerary) {
        setSavedItineraries(prev => [data.itinerary, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [flightSearchParams, setFlightSearchParams] = useState<{
    departure: string;
    arrival: string;
    date?: string;
  }>({
    departure: 'BOM',
    arrival: 'DEL'
  });

  const getAirportCodeForDest = (destName: string): string => {
    const lower = destName.toLowerCase();
    if (lower.includes('goa')) return 'GOI';
    if (lower.includes('delhi')) return 'DEL';
    if (lower.includes('mumbai')) return 'BOM';
    if (lower.includes('bengaluru') || lower.includes('bangalore')) return 'BLR';
    if (lower.includes('jaipur')) return 'JAI';
    if (lower.includes('kerala') || lower.includes('kochi') || lower.includes('munnar')) return 'COK';
    if (lower.includes('kashmir') || lower.includes('srinagar')) return 'SXR';
    if (lower.includes('varanasi')) return 'VNS';
    if (lower.includes('kolkata')) return 'CCU';
    if (lower.includes('hyderabad')) return 'HYD';
    if (lower.includes('pune')) return 'PNQ';
    if (lower.includes('ahmedabad')) return 'AMD';
    return 'DEL';
  };

  const handleSearchFlights = (dep = 'BOM', arr = 'DEL', date?: string) => {
    setFlightSearchParams({ departure: dep, arrival: arr, date });
    setActiveTab('flights');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlanDestinationDirect = (destName: string) => {
    handleGenerateTripFromHero({
      origin: 'Mumbai',
      destination: destName,
      durationDays: 4,
      travelersCount: 2,
      budgetTier: 'moderate',
      travelStyle: 'couple',
      interests: ['Culture', 'Food', 'Scenery'],
      transportMode: 'Flight'
    });
  };

  return (
    <div className={`${isDarkMode ? 'dark ' : ''}min-h-screen font-sans antialiased transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F8F7F4] text-slate-900'
    }`}>
      {/* Sticky Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        currency={currency}
        setCurrency={setCurrency}
        wishlistCount={wishlist.length}
        onOpenWishlist={() => setWishlistDrawerOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenAboutUs={() => setAboutUsOpen(true)}
        currentUser={currentUser}
      />

      {/* Main Tab Render Views */}
      <main className="pt-16">
        {activeTab === 'home' && (
          <>
            <HeroSection
              onGenerateTrip={handleGenerateTripFromHero}
              isDarkMode={isDarkMode}
            />
            <PopularDestinations
              isDarkMode={isDarkMode}
              onSelectDestination={(dest) => setSelectedDestination(dest)}
              onPlanDestination={handlePlanDestinationDirect}
              wishlist={wishlist}
              onToggleWishlist={toggleWishlist}
            />
            <TravelCategories
              isDarkMode={isDarkMode}
              onSelectDestination={handlePlanDestinationDirect}
            />
            
            <LocalIntelligenceSection currentUser={currentUser} />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AIFoodDiscovery />
              <SmartRouteRecommendation />
            </div>

            <WeatherWidget isDarkMode={isDarkMode} />
            
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <FeedbackForm />
            </div>
          </>
        )}

        {activeTab === 'map' && (
          <MapView
            isDarkMode={isDarkMode}
            onSelectDestination={handlePlanDestinationDirect}
            onOpenDestinationModal={(dest) => setSelectedDestination(dest)}
          />
        )}

        {activeTab === 'ai-planner' && (
          <AIPlannerChat
            isDarkMode={isDarkMode}
            savedItineraries={savedItineraries}
            onSaveItinerary={(itinerary) => {
              if (!savedItineraries.some(i => i.id === itinerary.id)) {
                setSavedItineraries([itinerary, ...savedItineraries]);
              }
            }}
          />
        )}

        {activeTab === 'categories' && (
          <TravelCategories
            isDarkMode={isDarkMode}
            onSelectDestination={handlePlanDestinationDirect}
          />
        )}

        {activeTab === 'hotels' && (
          <HotelsSection
            isDarkMode={isDarkMode}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
          />
        )}

        {activeTab === 'flights' && (
          <FlightsSection
            isDarkMode={isDarkMode}
            currency={currency}
            initialDeparture={flightSearchParams.departure}
            initialArrival={flightSearchParams.arrival}
            initialDate={flightSearchParams.date}
          />
        )}

        {activeTab === 'food' && (
          <FoodSection isDarkMode={isDarkMode} />
        )}

        {activeTab === 'transport' && (
          <TransportSection 
            isDarkMode={isDarkMode} 
            onSwitchToFlights={(from, to) => handleSearchFlights(
              from ? getAirportCodeForDest(from) : 'BOM',
              to ? getAirportCodeForDest(to) : 'DEL'
            )}
          />
        )}

        {activeTab === 'weather' && (
          <WeatherWidget isDarkMode={isDarkMode} />
        )}

        {activeTab === 'dashboard' && (
          <UserDashboard
            isDarkMode={isDarkMode}
            savedItineraries={savedItineraries}
            onOpenItinerary={(itinerary) => setActiveTab('ai-planner')}
            currentUser={currentUser}
            onUpdateProfile={(updated) => setCurrentUser(updated)}
            onLogout={() => setCurrentUser(null)}
            onOpenAuthModal={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard isDarkMode={isDarkMode} />
        )}

        {activeTab === 'careers' && (
          <CareersSection
            isDarkMode={isDarkMode}
            onNavigate={setActiveTab}
            onOpenAboutUs={() => setAboutUsOpen(true)}
          />
        )}
      </main>

      {/* Destination Modal Guide */}
      <DestinationModal
        destination={selectedDestination}
        onClose={() => setSelectedDestination(null)}
        onPlanTrip={handlePlanDestinationDirect}
        onSearchFlights={(destName) => handleSearchFlights('BOM', getAirportCodeForDest(destName))}
        isDarkMode={isDarkMode}
      />

      {/* Saved Wishlist Drawer */}
      {wishlistDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-md">
          <div className={`w-full max-w-md h-full p-6 border-l shadow-2xl flex flex-col justify-between ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <h3 className="font-extrabold text-base">Saved Wishlist ({wishlist.length})</h3>
                </div>
                <button onClick={() => setWishlistDrawerOpen(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {wishlist.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-600 dark:text-slate-400 font-medium">Your wishlist is currently empty.</div>
                ) : (
                  wishlist.map((id) => {
                    const destMatch = POPULAR_DESTINATIONS.find(d => d.id === id);
                    if (destMatch) {
                      return (
                        <div key={id} className="p-3 rounded-2xl border border-slate-300 dark:border-slate-800 flex gap-3 items-center">
                          <img src={destMatch.heroImage} alt={destMatch.name} className="w-14 h-14 rounded-xl object-cover" />
                          <div className="flex-1">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white">{destMatch.name}</h4>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{destMatch.state}</p>
                          </div>
                          <button
                            onClick={() => {
                              setWishlistDrawerOpen(false);
                              handlePlanDestinationDirect(destMatch.name);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Plan
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })
                )}
              </div>
            </div>

            <button
              onClick={() => setWishlistDrawerOpen(false)}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}

      {/* Auth / Profile Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        isDarkMode={isDarkMode}
        currentUser={currentUser}
        onLoginSuccess={(user) => setCurrentUser(user)}
        onLogout={() => setCurrentUser(null)}
      />

      {/* About Us Info Modal */}
      <AboutUsModal
        isOpen={aboutUsOpen}
        onClose={() => setAboutUsOpen(false)}
        isDarkMode={isDarkMode}
      />

      {/* Universal Footer */}
      <Footer
        isDarkMode={isDarkMode}
        onNavigate={setActiveTab}
        onOpenAboutUs={() => setAboutUsOpen(true)}
      />
    </div>
  );
}
