import React, { useState, useEffect } from 'react';
import { 
  Plane, 
  Train, 
  Bus, 
  Car, 
  Bike, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Leaf, 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Footprints, 
  Compass, 
  Sparkles 
} from 'lucide-react';
import { TransportOption } from '../types';

interface TransportSectionProps {
  isDarkMode: boolean;
  onSwitchToFlights?: (from?: string, to?: string) => void;
}

interface SerpRouteStep {
  title: string;
  action?: string;
  distance?: number;
  duration?: number;
  formattedDistance?: string;
  formattedDuration?: string;
  photo?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  notes?: string[];
  icon?: string;
}

interface SerpRouteTrip {
  travelMode: string;
  title?: string;
  distance?: number;
  duration?: number;
  formattedDistance?: string;
  formattedDuration?: string;
  steps: SerpRouteStep[];
}

interface SerpRoute {
  via: string;
  travelMode: string;
  distanceMeters?: number;
  durationSeconds?: number;
  typicalDurationRange?: string;
  formattedDistance: string;
  formattedDuration: string;
  extensions?: string[];
  icon?: string;
  trips?: SerpRouteTrip[];
}

interface SerpTravelModeOption {
  travelMode: string;
  durationSeconds?: number;
  formattedDuration: string;
}

interface SerpPlaceLocation {
  address: string;
  dataId?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface SerpDirectionsResponse {
  success: boolean;
  isLive: boolean;
  message?: string;
  origin: string;
  destination: string;
  travelModeRequested?: string;
  placesInfo?: SerpPlaceLocation[];
  availableModes?: SerpTravelModeOption[];
  routes?: SerpRoute[];
  googleMapsDirectionsUrl?: string;
}

export const TransportSection: React.FC<TransportSectionProps> = ({ isDarkMode, onSwitchToFlights }) => {
  const [fromCity, setFromCity] = useState('Mumbai');
  const [toCity, setToCity] = useState('Goa');
  const [selectedMode, setSelectedMode] = useState('0'); // '0' = Driving
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<SerpDirectionsResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  const presets = [
    { from: 'Mumbai', to: 'Goa', label: 'Mumbai → Goa' },
    { from: 'Pune', to: 'Mumbai', label: 'Pune → Mumbai' },
    { from: 'Delhi', to: 'Jaipur', label: 'Delhi → Jaipur' },
    { from: 'Manali', to: 'Shimla', label: 'Manali → Shimla' },
    { from: 'Chhatrapati Shivaji Maharaj International Airport Mumbai', to: 'Taj Mahal Palace Hotel Mumbai', label: 'Airport → Taj Hotel' },
    { from: 'Taj Mahal Palace Hotel Mumbai', to: 'Gateway of India Mumbai', label: 'Hotel → Attraction' }
  ];

  const travelModes = [
    { id: '0', key: 'Driving', label: 'Driving', icon: Car },
    { id: '3', key: 'Transit', label: 'Transit', icon: Bus },
    { id: '1', key: 'Two-wheeler', label: '2-Wheeler', icon: Bike },
    { id: '4', key: 'Walking', label: 'Walking', icon: Footprints },
    { id: '2', key: 'Bicycling', label: 'Bicycling', icon: Bike },
    { id: '5', key: 'Flight', label: 'Flight', icon: Plane }
  ];

  const fetchRoute = async (fromVal: string, toVal: string, modeVal: string) => {
    if (!fromVal.trim() || !toVal.trim()) {
      setErrorMessage('Please enter both Origin and Destination locations.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/maps/directions?origin=${encodeURIComponent(fromVal.trim())}&destination=${encodeURIComponent(toVal.trim())}&mode=${modeVal}`);
      const data: SerpDirectionsResponse = await res.json();

      if (data.success && data.routes && data.routes.length > 0) {
        setRouteResult(data);
      } else {
        setRouteResult(data);
        setErrorMessage(data.message || 'Unable to calculate the route right now. Please try again.');
      }
    } catch (err) {
      console.error('Failed to fetch route:', err);
      setErrorMessage('Unable to calculate the route right now. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoute('Mumbai', 'Goa', '0');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRoute(fromCity, toCity, selectedMode);
  };

  const handlePresetSelect = (pFrom: string, pTo: string) => {
    setFromCity(pFrom);
    setToCity(pTo);
    fetchRoute(pFrom, pTo, selectedMode);
  };

  const handleModeChange = (modeId: string) => {
    setSelectedMode(modeId);
    if (fromCity && toCity) {
      fetchRoute(fromCity, toCity, modeId);
    }
  };

  const currentRoute = routeResult?.routes?.[0];

  const staticOptions: TransportOption[] = [
    { mode: 'flight', provider: 'IndiGo / Vistara', duration: routeResult?.availableModes?.find(m => m.travelMode === 'Flight')?.formattedDuration || '1h 15m', estimatedFareINR: 3400, frequency: 'Daily non-stop flights', co2EmissionsKg: 85, comfortRating: 4.8, speedRating: 5.0 },
    { mode: 'train', provider: 'Vande Bharat Express', duration: '7h 45m', estimatedFareINR: 1550, frequency: 'Daily express trains', co2EmissionsKg: 18, comfortRating: 4.7, speedRating: 3.8 },
    { mode: 'bus', provider: 'IntrCity Volvo Sleeper', duration: routeResult?.availableModes?.find(m => m.travelMode === 'Transit')?.formattedDuration || '11h 30m', estimatedFareINR: 1100, frequency: 'Overnight Volvo buses', co2EmissionsKg: 28, comfortRating: 4.2, speedRating: 3.0 },
    { mode: 'rental_car', provider: 'Self-Drive SUV', duration: currentRoute?.formattedDuration || '9h 20m', estimatedFareINR: 4500, frequency: 'On demand 24/7', co2EmissionsKg: 62, comfortRating: 4.5, speedRating: 3.5 }
  ];

  return (
    <section className={`py-12 sm:py-16 transition-colors ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-[#F8F7F4] text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Commute & Route Optimization
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live SerpApi Maps Engine
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold font-serif-editorial tracking-tight">
            Route Finder & Transportation Matrix
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Calculate live distances, travel times, turn-by-turn directions, and multi-modal transit options powered by SerpApi Google Maps.
          </p>
        </div>

        {/* Preset Chips */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-400 shrink-0">Popular Routes:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetSelect(p.from, p.to)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                fromCity === p.from && toCity === p.to
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Route Input Form */}
        <div className={`p-5 rounded-3xl border shadow-sm mb-8 ${
          isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-300'
        }`}>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-5">
                <label className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-400 mb-1 block">
                  Origin (From)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    value={fromCity}
                    onChange={(e) => setFromCity(e.target.value)}
                    placeholder="e.g. Mumbai, Airport, or Hotel"
                    className={`w-full pl-9 pr-4 py-2.5 text-sm font-semibold rounded-2xl border outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500 ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="hidden lg:flex lg:col-span-1 justify-center pb-2">
                <ArrowRight className="w-5 h-5 text-blue-500" />
              </div>

              <div className="lg:col-span-4">
                <label className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-400 mb-1 block">
                  Destination (To)
                </label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-3 text-emerald-600 dark:text-emerald-400 w-4 h-4" />
                  <input
                    type="text"
                    value={toCity}
                    onChange={(e) => setToCity(e.target.value)}
                    placeholder="e.g. Goa, Taj Mahal, or Jaipur"
                    className={`w-full pl-9 pr-4 py-2.5 text-sm font-semibold rounded-2xl border outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500 ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <button
                  type="submit"
                  disabled={loading || !fromCity.trim() || !toCity.trim()}
                  className="w-full py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Calculating...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      <span>Find Route</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Travel Mode Pills */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-400 shrink-0 mr-1">Travel Mode:</span>
              {travelModes.map((mode) => {
                const IconComp = mode.icon;
                const matchedAvail = routeResult?.availableModes?.find(m => 
                  m.travelMode.toLowerCase().includes(mode.key.toLowerCase()) ||
                  (mode.key === 'Driving' && m.travelMode === 'Driving')
                );
                const isSelected = selectedMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleModeChange(mode.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : isDarkMode
                          ? 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-700'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span>{mode.label}</span>
                    {matchedAvail?.formattedDuration && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent font-medium'
                      }`}>
                        {matchedAvail.formattedDuration}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Live Google Flights Search Integration Callout */}
            {onSwitchToFlights && (selectedMode === '5' || routeResult?.routes?.some(r => r.travelMode.toLowerCase().includes('flight'))) && (
              <div className="mt-3 p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Plane className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    Looking for live airfares and commercial flight schedules for <strong>{fromCity} → {toCity}</strong>?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onSwitchToFlights(fromCity, toCity)}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Search Google Flights</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live Route Summary Card */}
        {routeResult && routeResult.success && currentRoute && (
          <div className="space-y-6 mb-10 animate-in fade-in duration-300">
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-md relative overflow-hidden ${
              isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-700 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> SerpApi Calculated Route
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold">
                      Via {currentRoute.via}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {routeResult.origin} <span className="text-blue-500">→</span> {routeResult.destination}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  {routeResult.googleMapsDirectionsUrl && (
                    <a
                      href={routeResult.googleMapsDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open in Google Maps</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Main Distance & Duration Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 block mb-1">Estimated Distance</span>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {currentRoute.formattedDistance}
                  </div>
                  {currentRoute.distanceMeters && (
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">({currentRoute.distanceMeters.toLocaleString()} meters)</span>
                  )}
                </div>

                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 block mb-1">Estimated Travel Time</span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {currentRoute.formattedDuration}
                  </div>
                  {currentRoute.typicalDurationRange && (
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium block truncate" title={currentRoute.typicalDurationRange}>
                      Range: {currentRoute.typicalDurationRange}
                    </span>
                  )}
                </div>

                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 block mb-1">Recommended Highway / Route</span>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-200 truncate">
                    {currentRoute.via}
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Mode: {currentRoute.travelMode}</span>
                </div>

                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 block mb-1">Route Advisories</span>
                  {currentRoute.extensions && currentRoute.extensions.length > 0 ? (
                    <div className="space-y-1">
                      {currentRoute.extensions.map((ext, idx) => (
                        <span key={idx} className="block text-xs font-semibold text-amber-600 dark:text-amber-400 truncate" title={ext}>
                          • {ext}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Optimal traffic flow</span>
                  )}
                </div>
              </div>

              {/* Location Coordinates Card */}
              {routeResult.placesInfo && routeResult.placesInfo.length > 0 && (
                <div className={`p-4 rounded-2xl border mb-6 ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-3">
                    Geographic Coordinates & Verified Locations
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {routeResult.placesInfo.map((p, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${idx === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-200">{p.address}</div>
                          {p.gpsCoordinates && (
                            <div className="text-slate-600 dark:text-slate-400 font-mono text-[11px] mt-0.5 font-medium">
                              GPS: {p.gpsCoordinates.latitude.toFixed(4)}, {p.gpsCoordinates.longitude.toFixed(4)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Turn-by-Turn Steps Accordion */}
              {currentRoute.trips && currentRoute.trips.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowSteps(!showSteps)}
                    className="w-full py-3 px-4 rounded-2xl bg-blue-600/10 text-blue-700 dark:text-blue-300 hover:bg-blue-600/20 font-bold text-xs transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>
                        {showSteps ? 'Hide' : 'View'} Turn-by-Turn Maneuvers ({currentRoute.trips.reduce((acc, t) => acc + t.steps.length, 0)} Steps)
                      </span>
                    </span>
                    {showSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showSteps && (
                    <div className="mt-4 space-y-3 pt-2 animate-in fade-in duration-200">
                      {currentRoute.trips.map((trip, tIdx) => (
                        <div key={tIdx} className="space-y-2">
                          {trip.title && (
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                              {trip.title}
                            </h4>
                          )}
                          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                            {trip.steps.map((step, sIdx) => (
                              <div
                                key={sIdx}
                                className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                                  isDarkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-slate-50 border-slate-300'
                                }`}
                              >
                                {step.photo ? (
                                  <img
                                    src={step.photo}
                                    alt={step.title}
                                    className="w-12 h-12 object-cover rounded-lg shrink-0 border border-slate-300"
                                  />
                                ) : (
                                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                                    <Navigation className="w-4 h-4" />
                                  </div>
                                )}

                                <div className="flex-1">
                                  <div className="font-bold text-slate-900 dark:text-slate-200 leading-snug">
                                    {step.title}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                                    {step.formattedDistance && <span>{step.formattedDistance}</span>}
                                    {step.formattedDuration && <span>• {step.formattedDuration}</span>}
                                  </div>
                                  {step.notes && step.notes.length > 0 && (
                                    <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                                      {step.notes.join(' • ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transportation Matrix Comparison Cards */}
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-4 font-serif-editorial text-slate-900 dark:text-white">
            Transportation Mode Comparison ({fromCity} → {toCity})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {staticOptions.map((opt, i) => {
              const Icon = opt.mode === 'flight' ? Plane : opt.mode === 'train' ? Train : opt.mode === 'bus' ? Bus : Car;
              return (
                <div
                  key={i}
                  className={`p-5 rounded-2xl border transition-all hover:shadow-xl ${
                    isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {opt.duration}
                    </span>
                  </div>

                  <h3 className="font-bold text-base capitalize text-slate-900 dark:text-white">{opt.mode.replace('_', ' ')}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{opt.provider}</p>

                  <div className="my-4 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Frequency:</span>
                      <span className="font-semibold truncate max-w-[120px] text-slate-800 dark:text-slate-200">{opt.frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1"><Leaf className="w-3 h-3 text-emerald-500" /> Carbon:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{opt.co2EmissionsKg} kg CO₂</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase">Estimated Fare</span>
                      <div className="text-base font-black text-slate-900 dark:text-white">
                        ₹{opt.estimatedFareINR.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <button
                      onClick={() => alert(`Redirecting to ${opt.provider} booking portal...`)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                    >
                      Check Tickets
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
