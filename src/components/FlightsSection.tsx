import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plane, 
  ArrowRight, 
  ArrowLeftRight, 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Loader2, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  ShieldCheck, 
  Filter, 
  SlidersHorizontal,
  Info,
  Leaf,
  Wifi,
  Zap,
  Luggage,
  RefreshCw
} from 'lucide-react';
import { FlightItem, FlightSearchResponse, FlightPriceInsights } from '../types';

interface FlightsSectionProps {
  isDarkMode: boolean;
  currency?: string;
  initialDeparture?: string;
  initialArrival?: string;
  initialDate?: string;
}

// Major Indian and international airports
export const POPULAR_AIRPORTS = [
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj Intl' },
  { code: 'DEL', city: 'Delhi', name: 'Indira Gandhi Intl' },
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda Intl' },
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi Intl' },
  { code: 'GOI', city: 'Goa', name: 'Dabolim / Manohar Intl' },
  { code: 'PNQ', city: 'Pune', name: 'Pune Intl' },
  { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhash Chandra Bose Intl' },
  { code: 'MAA', city: 'Chennai', name: 'Chennai Intl' },
  { code: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel Intl' },
  { code: 'NAG', city: 'Nagpur', name: 'Dr. Babasaheb Ambedkar Intl' },
  { code: 'COK', city: 'Kochi', name: 'Cochin Intl' },
  { code: 'JAI', city: 'Jaipur', name: 'Jaipur Intl' },
  { code: 'LKO', city: 'Lucknow', name: 'Chaudhary Charan Singh Intl' },
  { code: 'IXC', city: 'Chandigarh', name: 'Shaheed Bhagat Singh Intl' },
  { code: 'SXR', city: 'Srinagar', name: 'Sheikh ul-Alam Intl' },
  { code: 'DXB', city: 'Dubai', name: 'Dubai Intl' },
  { code: 'SIN', city: 'Singapore', name: 'Singapore Changi' },
  { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi Airport' },
  { code: 'LHR', city: 'London', name: 'Heathrow Airport' }
];

export const FlightsSection: React.FC<FlightsSectionProps> = ({
  isDarkMode,
  currency = 'INR',
  initialDeparture = 'BOM',
  initialArrival = 'DEL',
  initialDate
}) => {
  // Default date: 3 weeks from today or initialDate
  const getDefaultDate = () => {
    if (initialDate) return initialDate;
    const d = new Date();
    d.setDate(d.getDate() + 25);
    return d.toISOString().split('T')[0];
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Search form state
  const [departureCode, setDepartureCode] = useState<string>(initialDeparture.toUpperCase());
  const [arrivalCode, setArrivalCode] = useState<string>(initialArrival.toUpperCase());
  const [outboundDate, setOutboundDate] = useState<string>(getDefaultDate());
  const [returnDate, setReturnDate] = useState<string>('');
  const [tripType, setTripType] = useState<'2' | '1'>('2'); // '2' = one way, '1' = round trip
  const [adults, setAdults] = useState<number>(1);
  const [travelClass, setTravelClass] = useState<string>('1'); // 1 = Economy, 2 = Premium, 3 = Business, 4 = First
  const [selectedCurrency, setSelectedCurrency] = useState<string>(currency || 'INR');

  // Search execution & results
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<FlightSearchResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null);

  // Filters state
  const [sortBy, setSortBy] = useState<'best' | 'price' | 'duration'>('best');
  const [stopFilter, setStopFilter] = useState<'all' | '0' | '1'>('all');
  const [airlineFilter, setAirlineFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'night'>('all');
  const [maxPrice, setMaxPrice] = useState<number>(0);

  // Quick route chips
  const quickRoutes = [
    { from: 'BOM', to: 'DEL', label: 'Mumbai → Delhi' },
    { from: 'DEL', to: 'GOI', label: 'Delhi → Goa' },
    { from: 'BOM', to: 'BLR', label: 'Mumbai → Bengaluru' },
    { from: 'BLR', to: 'DEL', label: 'Bengaluru → Delhi' },
    { from: 'HYD', to: 'DEL', label: 'Hyderabad → Delhi' },
    { from: 'PNQ', to: 'DEL', label: 'Pune → Delhi' }
  ];

  // Search function
  const handleSearch = async (
    dep = departureCode, 
    arr = arrivalCode, 
    date = outboundDate,
    ret = returnDate,
    tType = tripType
  ) => {
    const cleanDep = dep.trim().toUpperCase();
    const cleanArr = arr.trim().toUpperCase();

    if (!cleanDep || cleanDep.length < 2) {
      setErrorMessage('Please select a valid origin airport code (e.g. BOM for Mumbai).');
      return;
    }
    if (!cleanArr || cleanArr.length < 2) {
      setErrorMessage('Please select a valid destination airport code (e.g. DEL for Delhi).');
      return;
    }
    if (cleanDep === cleanArr) {
      setErrorMessage('Origin and destination airport cannot be the same. Please choose different airports.');
      return;
    }
    if (!date) {
      setErrorMessage('Please select a departure date.');
      return;
    }
    if (tType === '1' && ret && ret < date) {
      setErrorMessage('Return date cannot be earlier than departure date.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        departure_id: cleanDep,
        arrival_id: cleanArr,
        outbound_date: date,
        type: tType,
        currency: selectedCurrency,
        adults: String(adults),
        travel_class: travelClass
      });

      if (tType === '1' && ret) {
        params.append('return_date', ret);
      }

      const res = await fetch(`/api/flights/search?${params.toString()}`);
      const data: FlightSearchResponse = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to retrieve flight data. Please try again.');
      } else {
        setResponse(data);
        if (data.error) {
          // Warning/notice from backend
          console.info('Flight search notice:', data.error);
        }
      }
    } catch (err: any) {
      setErrorMessage('Network connection error while retrieving flight results. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger initial search on load
  useEffect(() => {
    handleSearch(initialDeparture, initialArrival, outboundDate, '', '2');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap origin and destination
  const handleSwapAirports = () => {
    const temp = departureCode;
    setDepartureCode(arrivalCode);
    setArrivalCode(temp);
  };

  // Quick route selector
  const handleSelectQuickRoute = (from: string, to: string) => {
    setDepartureCode(from);
    setArrivalCode(to);
    handleSearch(from, to, outboundDate, returnDate, tripType);
  };

  // Collect unique airlines for filter
  const availableAirlines = useMemo(() => {
    if (!response) return [];
    const all = [...(response.best_flights || []), ...(response.other_flights || [])];
    const set = new Set<string>();
    all.forEach(f => {
      if (f.airline) set.add(f.airline);
    });
    return Array.from(set).sort();
  }, [response]);

  // Max price discovery
  const highestPriceFound = useMemo(() => {
    if (!response) return 50000;
    const all = [...(response.best_flights || []), ...(response.other_flights || [])];
    const prices = all.map(f => f.price).filter(p => p > 0);
    return prices.length > 0 ? Math.max(...prices) : 50000;
  }, [response]);

  // Filter and sort items
  const filterAndSort = (flights: FlightItem[]) => {
    return flights.filter(f => {
      // Stops filter
      if (stopFilter === '0' && f.stops !== 0) return false;
      if (stopFilter === '1' && f.stops > 1) return false;

      // Airline filter
      if (airlineFilter !== 'all' && f.airline !== airlineFilter) return false;

      // Max price filter
      if (maxPrice > 0 && f.price > maxPrice) return false;

      // Departure time filter
      if (timeFilter !== 'all') {
        const timeStr = f.departure_time ? f.departure_time.split(' ')[1] || f.departure_time : '';
        const hour = parseInt(timeStr.split(':')[0], 10);
        if (!isNaN(hour)) {
          if (timeFilter === 'morning' && (hour < 6 || hour >= 12)) return false;
          if (timeFilter === 'afternoon' && (hour < 12 || hour >= 18)) return false;
          if (timeFilter === 'evening' && (hour < 18 || hour >= 24)) return false;
          if (timeFilter === 'night' && (hour >= 6)) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'duration') return a.duration - b.duration;
      // 'best' keeps default Google Flights ranking
      return 0;
    });
  };

  const filteredBestFlights = useMemo(() => {
    return filterAndSort(response?.best_flights || []);
  }, [response, stopFilter, airlineFilter, maxPrice, timeFilter, sortBy]);

  const filteredOtherFlights = useMemo(() => {
    return filterAndSort(response?.other_flights || []);
  }, [response, stopFilter, airlineFilter, maxPrice, timeFilter, sortBy]);

  const totalFilteredCount = filteredBestFlights.length + filteredOtherFlights.length;

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-navy-900 dark:bg-sky-500 text-white dark:text-navy-950 flex items-center justify-center shadow-xs">
                <Plane className="w-5 h-5 transform -rotate-45" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Live Google Flights Search
              </span>
            </div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
              Flight Search & Airfares
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Real-time Google Flights search across major domestic and international airlines. Direct booking links without marked-up fees.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Official Carrier Prices
            </span>
          </div>
        </div>

        {/* Search Control Card */}
        <div className={`rounded-2xl border p-5 sm:p-6 shadow-xs transition-all ${
          isDarkMode 
            ? 'bg-slate-900 border-slate-800' 
            : 'bg-white border-slate-200/80'
        }`}>
          {/* Top Toggles: Trip Type, Class, Passengers, Currency */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800 text-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTripType('2')}
                className={`px-3 py-1.5 rounded-xl font-medium text-xs sm:text-sm transition-colors cursor-pointer ${
                  tripType === '2'
                    ? 'bg-navy-900 text-white dark:bg-sky-500 dark:text-navy-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                One way
              </button>
              <button
                type="button"
                onClick={() => setTripType('1')}
                className={`px-3 py-1.5 rounded-xl font-medium text-xs sm:text-sm transition-colors cursor-pointer ${
                  tripType === '1'
                    ? 'bg-navy-900 text-white dark:bg-sky-500 dark:text-navy-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Round trip
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Passengers */}
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <select
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2.5 py-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-sky-500 cursor-pointer font-medium"
                >
                  <option value={1}>1 Adult</option>
                  <option value={2}>2 Adults</option>
                  <option value={3}>3 Adults</option>
                  <option value={4}>4 Adults</option>
                  <option value={5}>5 Adults</option>
                  <option value={6}>6 Adults</option>
                </select>
              </div>

              {/* Travel Class */}
              <select
                value={travelClass}
                onChange={(e) => setTravelClass(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2.5 py-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="1">Economy</option>
                <option value="2">Premium Economy</option>
                <option value="3">Business</option>
                <option value="4">First Class</option>
              </select>

              {/* Currency */}
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2.5 py-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-sky-500 font-mono cursor-pointer"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="SGD">SGD ($)</option>
              </select>
            </div>
          </div>

          {/* Main Input Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-5 items-end">
            {/* Origin Airport */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                From (Origin)
              </label>
              <div className="relative">
                <select
                  value={departureCode}
                  onChange={(e) => setDepartureCode(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                    isDarkMode 
                      ? 'bg-slate-800/80 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {POPULAR_AIRPORTS.map(apt => (
                    <option key={`from-${apt.code}`} value={apt.code}>
                      {apt.city} ({apt.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex items-center justify-center pb-1">
              <button
                type="button"
                onClick={handleSwapAirports}
                title="Swap origin and destination"
                className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center justify-center shadow-xs cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Airport */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                To (Destination)
              </label>
              <div className="relative">
                <select
                  value={arrivalCode}
                  onChange={(e) => setArrivalCode(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                    isDarkMode 
                      ? 'bg-slate-800/80 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {POPULAR_AIRPORTS.map(apt => (
                    <option key={`to-${apt.code}`} value={apt.code}>
                      {apt.city} ({apt.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Outbound Date */}
            <div className={tripType === '1' ? 'md:col-span-2' : 'md:col-span-3'}>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Departure Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={getMinDate()}
                  value={outboundDate}
                  onChange={(e) => setOutboundDate(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                    isDarkMode 
                      ? 'bg-slate-800/80 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Return Date (if round trip) */}
            {tripType === '1' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Return Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min={outboundDate || getMinDate()}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                      isDarkMode 
                        ? 'bg-slate-800/80 border-slate-700 text-white' 
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Search Button */}
            <div className={tripType === '1' ? 'md:col-span-1' : 'md:col-span-2'}>
              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={isLoading}
                className="w-full h-[42px] rounded-xl bg-navy-900 hover:bg-navy-800 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-navy-950 font-semibold text-sm transition-all shadow-xs disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching</span>
                  </>
                ) : (
                  <>
                    <Plane className="w-4 h-4" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Route Pills */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">
              Popular Routes:
            </span>
            {quickRoutes.map(qr => (
              <button
                key={qr.label}
                type="button"
                onClick={() => handleSelectQuickRoute(qr.from, qr.to)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  departureCode === qr.from && arrivalCode === qr.to
                    ? 'bg-navy-900 text-white dark:bg-sky-500 dark:text-navy-950 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium border border-slate-200 dark:border-transparent'
                }`}
              >
                {qr.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error / Warning Alert */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-rose-800 dark:text-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{errorMessage}</p>
              <button
                type="button"
                onClick={() => handleSearch()}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry search
              </button>
            </div>
          </div>
        )}

        {/* Price Insights Banner (if available from SerpApi) */}
        {response?.price_insights && response.price_insights.typical_price_range && (
          <div className={`rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isDarkMode 
              ? 'bg-slate-900/80 border-slate-800' 
              : 'bg-sky-50/70 border-sky-200/80'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                {response.price_insights.price_level === 'low' ? (
                  <TrendingDown className="w-4 h-4 text-emerald-500" />
                ) : response.price_insights.price_level === 'high' ? (
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                ) : (
                  <Minus className="w-4 h-4 text-sky-500" />
                )}
              </div>
              <div>
                <div className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300">
                  Google Flights Price Insights
                </div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Prices are currently{' '}
                  <span className={`font-semibold capitalize ${
                    response.price_insights.price_level === 'low' ? 'text-emerald-600 dark:text-emerald-400' :
                    response.price_insights.price_level === 'high' ? 'text-rose-600 dark:text-rose-400' :
                    'text-sky-600 dark:text-sky-400'
                  }`}>
                    {response.price_insights.price_level || 'typical'}
                  </span>{' '}
                  for this route. Typical fares range from{' '}
                  <span className="font-semibold font-mono">
                    ₹{response.price_insights.typical_price_range[0]?.toLocaleString()} - ₹{response.price_insights.typical_price_range[1]?.toLocaleString()}
                  </span>.
                </div>
              </div>
            </div>

            {response.search_metadata.google_flights_url && (
              <a
                href={response.search_metadata.google_flights_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>View price graph on Google Flights</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Results Controls: Filters & Sorting */}
        {response && (response.best_flights.length > 0 || response.other_flights.length > 0) && (
          <div className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4 text-sm ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-300'
          }`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Sort By:
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-transparent">
                <button
                  type="button"
                  onClick={() => setSortBy('best')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    sortBy === 'best' 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' 
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 font-semibold'
                  }`}
                >
                  ⭐ Best Flights
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('price')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    sortBy === 'price' 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' 
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 font-semibold'
                  }`}
                >
                  Cheapest
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('duration')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    sortBy === 'duration' 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' 
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 font-semibold'
                  }`}
                >
                  Fastest
                </button>
              </div>

              {/* Stops Filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-transparent">
                <button
                  type="button"
                  onClick={() => setStopFilter('all')}
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    stopFilter === 'all' 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' 
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 font-semibold'
                  }`}
                >
                  All Stops
                </button>
                <button
                  type="button"
                  onClick={() => setStopFilter('0')}
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    stopFilter === '0' 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' 
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 font-semibold'
                  }`}
                >
                  Non-stop Only
                </button>
                <button
                  type="button"
                  onClick={() => setStopFilter('1')}
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    stopFilter === '1' 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' 
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 font-semibold'
                  }`}
                >
                  1 Stop Max
                </button>
              </div>

              {/* Airline Filter */}
              {availableAirlines.length > 1 && (
                <select
                  value={airlineFilter}
                  onChange={(e) => setAirlineFilter(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="all">All Airlines ({availableAirlines.length})</option>
                  {availableAirlines.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              )}

              {/* Departure Time Filter */}
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">Any Departure Time</option>
                <option value="morning">Morning (06:00 - 12:00)</option>
                <option value="afternoon">Afternoon (12:00 - 18:00)</option>
                <option value="evening">Evening (18:00 - 24:00)</option>
                <option value="night">Night (00:00 - 06:00)</option>
              </select>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
              Showing <span className="font-bold text-slate-900 dark:text-white">{totalFilteredCount}</span> of{' '}
              {response.total_count} flights
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div 
                key={n} 
                className={`rounded-2xl border p-6 animate-pulse ${
                  isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded-sm" />
                      <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded-sm" />
                    </div>
                  </div>
                  <div className="w-48 h-8 bg-slate-200 dark:bg-slate-800 rounded-sm" />
                  <div className="w-28 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && response && totalFilteredCount === 0 && (
          <div className={`rounded-2xl border p-12 text-center ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-300'
          }`}>
            <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No flights matching your filters
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto font-medium">
              Try adjusting your stop filters, selecting different airlines, or picking an alternate date.
            </p>
            <button
              type="button"
              onClick={() => {
                setStopFilter('all');
                setAirlineFilter('all');
                setTimeFilter('all');
                setMaxPrice(0);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Flight Cards List */}
        {!isLoading && response && totalFilteredCount > 0 && (
          <div className="space-y-6">

            {/* Best Flights Section */}
            {filteredBestFlights.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Top Ranked Flights (Google Flights Choice)
                  </span>
                </div>

                <div className="space-y-3">
                  {filteredBestFlights.map(flight => (
                    <FlightCard
                      key={flight.id}
                      flight={flight}
                      isDarkMode={isDarkMode}
                      isExpanded={expandedFlightId === flight.id}
                      onToggleExpand={() => setExpandedFlightId(expandedFlightId === flight.id ? null : flight.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Flights Section */}
            {filteredOtherFlights.length > 0 && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Other Scheduled Flights ({filteredOtherFlights.length})
                  </span>
                </div>

                <div className="space-y-3">
                  {filteredOtherFlights.map(flight => (
                    <FlightCard
                      key={flight.id}
                      flight={flight}
                      isDarkMode={isDarkMode}
                      isExpanded={expandedFlightId === flight.id}
                      onToggleExpand={() => setExpandedFlightId(expandedFlightId === flight.id ? null : flight.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Informational & Booking Safety Disclaimer */}
        <div className={`rounded-xl border p-4 text-xs ${
          isDarkMode 
            ? 'bg-slate-900/40 border-slate-800 text-slate-400' 
            : 'bg-slate-100/70 border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Booking Information & Transparency:
              </span>{' '}
              TripNova AI searches live airfares using Google Flights via SerpApi. Searching for a flight does not create a booking in our database or charge your payment method. Clicking &ldquo;View / Book on Google Flights&rdquo; redirects you directly to the official Google Flights portal where you can finalize tickets with your preferred certified airline or OTA.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Reusable individual flight card component
interface FlightCardProps {
  flight: FlightItem;
  isDarkMode: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const FlightCard: React.FC<FlightCardProps> = ({
  flight,
  isDarkMode,
  isExpanded,
  onToggleExpand
}) => {
  // Extract clean time string (e.g. "06:15" from "2026-10-15 06:15")
  const formatTime = (fullTime?: string) => {
    if (!fullTime) return '--:--';
    if (fullTime.includes(' ')) {
      return fullTime.split(' ')[1].slice(0, 5);
    }
    return fullTime.slice(0, 5);
  };

  const depTime = formatTime(flight.departure_time);
  const arrTime = formatTime(flight.arrival_time);

  return (
    <div className={`rounded-2xl border transition-all duration-200 hover:shadow-sm overflow-hidden ${
      flight.is_best_flight
        ? isDarkMode 
          ? 'bg-slate-900 border-sky-500/40 shadow-xs' 
          : 'bg-white border-sky-400 shadow-slate-100'
        : isDarkMode 
          ? 'bg-slate-900 border-slate-800' 
          : 'bg-white border-slate-300'
    }`}>
      {/* Best Flight Banner Tag */}
      {flight.is_best_flight && (
        <div className="px-4 py-1.5 bg-sky-500/10 dark:bg-sky-500/15 border-b border-sky-500/20 flex items-center justify-between text-[11px] font-semibold text-sky-900 dark:text-sky-300">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Best Balance of Price & Duration
          </span>
          <span className="text-[10px] text-sky-800 dark:text-sky-300 font-medium">
            Google Flights Top Recommendation
          </span>
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Airline Logo & Info */}
          <div className="flex items-center gap-3.5 min-w-[200px]">
            {flight.airline_logo ? (
              <img 
                src={flight.airline_logo} 
                alt={flight.airline}
                referrerPolicy="no-referrer"
                className="w-10 h-10 object-contain rounded-xl p-1 bg-white border border-slate-300 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-navy-900 dark:bg-sky-500 text-white dark:text-navy-950 flex items-center justify-center font-bold text-sm shrink-0">
                {flight.airline.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {flight.airline}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                <span className="font-mono font-medium">{flight.flight_number}</span>
                {flight.airplane && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[120px]">{flight.airplane}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Departure → Duration/Stops → Arrival Timeline */}
          <div className="flex-1 flex items-center justify-between sm:justify-around gap-2 max-w-xl">
            {/* Departure */}
            <div className="text-left min-w-[70px]">
              <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white">
                {depTime}
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-300">
                {flight.departure_airport.id}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate max-w-[100px] hidden sm:block">
                {flight.departure_airport.name}
              </div>
            </div>

            {/* Flight Path / Duration & Stops Graphic */}
            <div className="flex-1 px-3 sm:px-6 flex flex-col items-center">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3" /> {flight.formatted_duration}
              </span>
              
              <div className="w-full flex items-center gap-1.5 relative">
                <div className="h-2 w-2 rounded-full border-2 border-sky-500 bg-white dark:bg-slate-900 shrink-0" />
                <div className="h-0.5 flex-1 bg-slate-300 dark:bg-slate-700 relative">
                  {flight.stops > 0 && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500" title={`${flight.stops} Stop`} />
                  )}
                </div>
                <Plane className="w-3.5 h-3.5 text-sky-500 transform rotate-90 shrink-0" />
              </div>

              {/* Stops Tag */}
              <div className="mt-1 text-[11px] font-medium">
                {flight.stops === 0 ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Non-stop</span>
                ) : flight.stops === 1 ? (
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                    1 stop {flight.layovers?.[0] ? `(${flight.layovers[0].airport_id} • ${flight.layovers[0].formatted_duration})` : ''}
                  </span>
                ) : (
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">{flight.stops} stops</span>
                )}
              </div>
            </div>

            {/* Arrival */}
            <div className="text-right min-w-[70px]">
              <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white flex items-center justify-end gap-1">
                {arrTime}
                {flight.overnight && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold align-top">+1</span>
                )}
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-300">
                {flight.arrival_airport.id}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate max-w-[100px] hidden sm:block">
                {flight.arrival_airport.name}
              </div>
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="flex items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
            <div className="text-left lg:text-right">
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">
                {flight.formatted_price}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex items-center lg:justify-end gap-1.5">
                <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold">
                  {flight.travel_class}
                </span>
                <span>per traveler</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleExpand}
                className="p-2 rounded-xl text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-transparent"
                title={isExpanded ? 'Hide details' : 'Show flight details'}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {flight.booking_link && (
                <a
                  href={flight.booking_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-navy-950 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>View / Book</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

          </div>

        </div>

        {/* Badges row: Carbon, legroom, amenities */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px]">
          {flight.carbon_emissions?.difference_percent !== undefined && (
            <span className={`px-2 py-0.5 rounded-full flex items-center gap-1 font-medium ${
              flight.carbon_emissions.difference_percent < 0
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              <Leaf className="w-3 h-3 text-emerald-500" />
              {flight.carbon_emissions.difference_percent < 0 
                ? `${Math.abs(flight.carbon_emissions.difference_percent)}% less CO₂` 
                : `${flight.carbon_emissions.difference_percent}% CO₂ relative to route average`}
            </span>
          )}

          {flight.extensions && flight.extensions.length > 0 && flight.extensions.slice(0, 2).map((ext, i) => (
            <span 
              key={i} 
              className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium"
            >
              {ext}
            </span>
          ))}
        </div>

        {/* Expandable Flight Segments Drawer */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Flight Leg Details & In-Flight Information
            </h5>

            <div className="space-y-3">
              {flight.segments.map((seg, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-900 dark:text-white">
                      Leg {idx + 1}: {seg.airline} {seg.flight_number}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 font-mono">
                      {seg.formatted_duration}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-200">Departs:</span>{' '}
                      {seg.departure_airport.time} • {seg.departure_airport.name} ({seg.departure_airport.id})
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-200">Arrives:</span>{' '}
                      {seg.arrival_airport.time} • {seg.arrival_airport.name} ({seg.arrival_airport.id})
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                    {seg.airplane && <span>Aircraft: {seg.airplane}</span>}
                    {seg.legroom && <span>Legroom: {seg.legroom}</span>}
                    {seg.travel_class && <span>Class: {seg.travel_class}</span>}
                  </div>
                </div>
              ))}
            </div>

            {flight.layovers && flight.layovers.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>Layover:</strong> {flight.layovers[0].formatted_duration} layover at {flight.layovers[0].airport_name} ({flight.layovers[0].airport_id}). Baggage checked through to final destination.
                </span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
