import React, { useState, useEffect } from 'react';
import { FEATURED_HOTELS } from '../data/travelData';
import { IMPORTED_HOTELS } from '../data/importedData';
import { PersonalizedRecommendationsModal } from './PersonalizedRecommendationsModal';
import { Hotel } from '../types';
import { 
  Star, 
  MapPin, 
  Heart, 
  Search, 
  Calendar, 
  Sparkles, 
  Building2, 
  Check, 
  Filter,
  CheckCircle2,
  CreditCard,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Ticket,
  Printer,
  X,
  AlertCircle,
  Info
} from 'lucide-react';

import { CanonicalDestination } from '../types';
import { DestinationSearchInput } from './DestinationSearchInput';

interface HotelsSectionProps {
  isDarkMode: boolean;
  wishlist: string[];
  onToggleWishlist: (hotelId: string) => void;
  currentDestination?: CanonicalDestination | null;
  onDestinationChange?: (destination: CanonicalDestination) => void;
}

interface DisplayHotel {
  id: string;
  name: string;
  destination: string;
  location: string;
  rating: number;
  reviewsCount: number;
  priceDisplay: string;
  priceNumber: number;
  image: string;
  type: string;
  amenities: string[];
  link?: string;
  dealInfo?: string;
  isLive?: boolean;
  source?: string;
  distanceKm?: number;
  distanceLabel?: string;
}

export const HotelsSection: React.FC<HotelsSectionProps> = ({ 
  isDarkMode, 
  wishlist, 
  onToggleWishlist,
  currentDestination,
  onDestinationChange
}) => {
  const [destinationInput, setDestinationInput] = useState(currentDestination?.name || 'Nashik');
  const [resolvedCoords, setResolvedCoords] = useState<{ lat?: number; lng?: number }>({
    lat: currentDestination?.latitude,
    lng: currentDestination?.longitude
  });
  const [radiusKm, setRadiusKm] = useState<number>(30);
  const [checkInDate, setCheckInDate] = useState('2026-08-20');
  const [checkOutDate, setCheckOutDate] = useState('2026-08-23');
  const [selectedType, setSelectedType] = useState<string>('All');

  const [hotelsList, setHotelsList] = useState<DisplayHotel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveSearch, setIsLiveSearch] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  
  // Abort controller ref for race condition prevention
  const activeRequestControllerRef = React.useRef<AbortController | null>(null);
  const activeRequestIdRef = React.useRef<number>(0);

  // Sync if global destination changes
  useEffect(() => {
    if (currentDestination && currentDestination.name) {
      setDestinationInput(currentDestination.name);
      setResolvedCoords({ lat: currentDestination.latitude, lng: currentDestination.longitude });
      fetchHotels(currentDestination.name, checkInDate, checkOutDate, radiusKm, currentDestination.latitude, currentDestination.longitude);
    }
  }, [currentDestination]);

  // Multi-step Booking Modal State
  const [bookingHotel, setBookingHotel] = useState<DisplayHotel | null>(null);
  const [bookingStep, setBookingStep] = useState<'details' | 'payment' | 'confirmed'>('details');
  const [guestName, setGuestName] = useState('Roshan Gorade');
  const [guestEmail, setGuestEmail] = useState('roshan@example.com');
  const [guestPhone, setGuestPhone] = useState('+91 9876543210');
  const [guestAge, setGuestAge] = useState('25');
  const [guestGender, setGuestGender] = useState('Male');
  const [specialRequests, setSpecialRequests] = useState('');
  const [guestsCount, setGuestsCount] = useState(2);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('upi');

  // Confirmed booking details
  const [confirmedBookingData, setConfirmedBookingData] = useState<{
    id: string;
    bookingReference: string;
    ticketId: string;
    totalAmount: number;
    hotelName: string;
    destination: string;
    checkInDate: string;
    checkOutDate: string;
    guestsCount: number;
  } | null>(null);

  const calculateNights = (inDate: string, outDate: string) => {
    try {
      const d1 = new Date(inDate);
      const d2 = new Date(outDate);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return isNaN(diffDays) || diffDays < 1 ? 1 : diffDays;
    } catch {
      return 1;
    }
  };

  const types = ['All', 'Luxury Resort', 'Heritage Palace', 'Backpacker Hostel'];
  const radiusOptions = [5, 15, 30, 50];

  const fetchHotels = async (
    dest: string, 
    checkIn: string, 
    checkOut: string, 
    rad: number = 30, 
    lat?: number, 
    lng?: number
  ) => {
    const trimmed = (dest || '').trim();
    if (!trimmed) return;

    // Race condition prevention
    if (activeRequestControllerRef.current) {
      activeRequestControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeRequestControllerRef.current = controller;
    const reqId = ++activeRequestIdRef.current;

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const params = new URLSearchParams({
        destination: trimmed,
        checkIn: checkIn || '',
        checkOut: checkOut || '',
        radius: String(rad)
      });
      if (lat !== undefined && lng !== undefined) {
        params.append('lat', String(lat));
        params.append('lng', String(lng));
      }

      const res = await fetch(`/api/search/hotels?${params.toString()}`, {
        signal: controller.signal
      });
      const data = await res.json();

      // Ensure this is the most recent request
      if (reqId !== activeRequestIdRef.current) return;

      if (data.success && Array.isArray(data.properties) && data.properties.length > 0) {
        const mapped: DisplayHotel[] = data.properties.map((p: any) => ({
          id: p.id,
          name: p.name,
          destination: p.destination || trimmed,
          location: p.location || trimmed,
          rating: p.rating || 4.5,
          reviewsCount: p.reviewsCount || 100,
          priceDisplay: p.pricePerNight || `₹${p.priceNumber || 3500}/night`,
          priceNumber: p.priceNumber || 3500,
          image: p.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
          type: p.type || 'Resort Stay',
          amenities: p.amenities || ['Free Wi-Fi', 'Pool', 'Breakfast'],
          link: p.link,
          dealInfo: p.dealInfo,
          isLive: Boolean(data.isLive),
          source: p.source || 'verified',
          distanceKm: p.distanceKm,
          distanceLabel: p.distanceLabel || (p.distanceKm !== undefined ? (p.distanceKm <= 5 ? `In ${trimmed}` : `Nearby ${trimmed} — ${Math.round(p.distanceKm)} km`) : undefined)
        }));

        setHotelsList(mapped);
        setIsLiveSearch(Boolean(data.isLive));
        if (data.message) setStatusMessage(data.message);
      } else {
        // STRICT RULE: Never fall back to unrelated cities!
        setHotelsList([]);
        setIsLiveSearch(false);
        setStatusMessage(`No verified hotels found in ${trimmed} within ${rad} km. Try expanding the search radius.`);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching hotels:', err);
        setHotelsList([]);
        setStatusMessage(`Unable to load hotels for ${trimmed}. Please check your connection.`);
      }
    } finally {
      if (reqId === activeRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const initialName = currentDestination?.name || 'Nashik';
    fetchHotels(
      initialName, 
      '2026-08-20', 
      '2026-08-23', 
      radiusKm, 
      currentDestination?.latitude, 
      currentDestination?.longitude
    );
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHotels(destinationInput, checkInDate, checkOutDate, radiusKm, resolvedCoords.lat, resolvedCoords.lng);
  };

  const handleDestinationResolved = (canonical: CanonicalDestination) => {
    setDestinationInput(canonical.name);
    setResolvedCoords({ lat: canonical.latitude, lng: canonical.longitude });
    if (onDestinationChange) {
      onDestinationChange(canonical);
    }
    fetchHotels(canonical.name, checkInDate, checkOutDate, radiusKm, canonical.latitude, canonical.longitude);
  };

  const filteredHotels = hotelsList.filter(hotel => {
    if (selectedType === 'All') return true;
    return hotel.type.toLowerCase().includes(selectedType.toLowerCase());
  });

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingHotel) return;
    setIsSubmittingBooking(true);
    setBookingError(null);

    const nights = calculateNights(checkInDate, checkOutDate);
    const subtotal = bookingHotel.priceNumber * nights;
    const taxes = Math.round(subtotal * 0.12);
    const totalAmount = subtotal + taxes;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tripnova_token') : null;
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          hotelId: bookingHotel.id,
          hotelName: bookingHotel.name,
          destination: bookingHotel.destination,
          checkInDate,
          checkOutDate,
          guestsCount,
          totalAmount,
          currency: 'INR',
          notes: specialRequests,
          passengers: [
            {
              fullName: guestName,
              email: guestEmail,
              phone: guestPhone,
              age: parseInt(guestAge) || 25,
              gender: guestGender,
              isLead: true
            }
          ]
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to initialize booking.');
      }

      setConfirmedBookingData({
        id: data.booking.id,
        bookingReference: data.bookingReference || data.booking.bookingReference,
        ticketId: data.ticketId || data.booking.ticketId || ('ET-' + Math.random().toString(36).substring(2, 7).toUpperCase()),
        totalAmount,
        hotelName: bookingHotel.name,
        destination: bookingHotel.destination,
        checkInDate,
        checkOutDate,
        guestsCount
      });

      setBookingStep('payment');
    } catch (err: any) {
      console.error('Booking error:', err);
      setBookingError(err.message || 'Error creating reservation.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!confirmedBookingData) return;
    setIsSubmittingBooking(true);
    setBookingError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tripnova_token') : null;

      // 1. Create order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          amount: confirmedBookingData.totalAmount,
          currency: 'INR',
          bookingId: confirmedBookingData.id,
          bookingReference: confirmedBookingData.bookingReference
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || 'Payment service error.');
      }

      // 2. Verify payment (with mock payment ID & test signature verification)
      const mockPaymentId = 'pay_' + Math.random().toString(36).substring(2, 11);
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          razorpay_order_id: orderData.order.id,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: 'test_signature_valid',
          bookingId: confirmedBookingData.id
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || 'Payment verification failed.');
      }

      setBookingStep('confirmed');
    } catch (err: any) {
      console.error('Payment error:', err);
      setBookingError(err.message || 'Payment processing failed.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <section className={`py-16 transition-colors ${isDarkMode ? 'bg-[#0B1120] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Live Google Hotels Search
              </span>
              {isLiveSearch && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Live SerpApi
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">
              Stays & Boutique Hotels
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
              Search real-time hotel availability, rates, and amenities powered by Google Hotels.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>✨ Gemini AI Matcher</span>
            </button>

            <div className="flex gap-1 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 text-xs font-medium">
              {types.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    selectedType === t
                      ? 'bg-slate-900 text-white dark:bg-sky-600 shadow-xs'
                      : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Search Form Bar */}
        <form onSubmit={handleSearchSubmit} className={`mb-8 p-4 sm:p-5 rounded-2xl border shadow-xs ${
          isDarkMode ? 'bg-[#131E32] border-slate-800' : 'bg-white border-slate-300'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-4">
              <DestinationSearchInput
                id="hotels-dest-input"
                label="Destination City / Region"
                value={destinationInput}
                onChange={(val, coords) => {
                  setDestinationInput(val);
                  if (coords) {
                    setResolvedCoords(coords);
                  }
                }}
                onSelectCanonical={handleDestinationResolved}
                placeholder="Search any destination (e.g. Nashik, Dubai, Manali)"
                isDarkMode={isDarkMode}
                showPopularChips={false}
                showInlineChips={false}
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Radius
              </label>
              <div className="flex gap-1">
                {radiusOptions.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRadiusKm(r);
                      fetchHotels(destinationInput, checkInDate, checkOutDate, r, resolvedCoords.lat, resolvedCoords.lng);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                      radiusKm === r
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                          : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {r}km
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Check-in Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-500 dark:text-slate-400" />
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500 ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Check-out Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-500 dark:text-slate-400" />
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500 ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="lg:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 text-sky-400 dark:text-sky-200" />
                    <span>Search Stays</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {statusMessage && (
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-2.5 px-1">
              {statusMessage}
            </p>
          )}
        </form>

        {/* Hotels Grid */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Searching verified hotel rates for {destinationInput}...</p>
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="py-16 text-center border rounded-2xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 p-6">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No verified results found for this category.</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
              No verified hotel stays found in <strong className="text-sky-600 dark:text-sky-400">{destinationInput}</strong> within {radiusKm} km. Try expanding the search radius to 50 km.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setRadiusKm(50);
                  fetchHotels(destinationInput, checkInDate, checkOutDate, 50, resolvedCoords.lat, resolvedCoords.lng);
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Expand Radius to 50 km
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHotels.map(hotel => {
              const isSaved = wishlist.includes(hotel.id);
              return (
                <div
                  key={hotel.id}
                  className={`rounded-xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col ${
                    isDarkMode ? 'bg-[#131E32] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-300 hover:border-slate-400 shadow-xs'
                  }`}
                >
                  <div className="relative h-56">
                    <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
                    <button
                      onClick={() => onToggleWishlist(hotel.id)}
                      className={`absolute top-3 right-3 p-2 rounded-lg backdrop-blur-xs border transition-colors cursor-pointer ${
                        isSaved ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-900/60 text-white border-white/20 hover:bg-slate-900'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
                    </button>

                    <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-xs font-medium flex items-center gap-1">
                      {hotel.type}
                    </span>

                    {/* Distance / Location Badge */}
                    {hotel.distanceLabel && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/90 text-sky-400 text-[11px] font-bold shadow-xs border border-sky-500/30 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-sky-400" />
                        <span>{hotel.distanceLabel}</span>
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {hotel.destination}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-medium text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{hotel.rating}</span>
                          <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">({hotel.reviewsCount})</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{hotel.name}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {hotel.location}
                      </p>

                      {hotel.dealInfo && (
                        <div className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-500/20">
                          {hotel.dealInfo}
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-1">
                        {hotel.amenities.map((a, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Rate / Night</span>
                        <div className="text-base font-bold text-slate-900 dark:text-white">
                          {hotel.priceDisplay}
                        </div>
                      </div>

                      <button
                        onClick={() => setBookingHotel(hotel)}
                        className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        Reserve Stay
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Test Booking & Payment Modal (Replaces alert) */}
      {bookingHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden my-8 transition-all ${
            isDarkMode ? 'bg-[#131E32] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-bold uppercase tracking-wider border border-sky-500/20">
                    Academic MVP Booking
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    • Live Inventory Simulation
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold truncate max-w-md">
                  {bookingHotel.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setBookingHotel(null);
                  setBookingStep('details');
                  setConfirmedBookingData(null);
                  setBookingError(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="grid grid-cols-3 text-center border-b border-slate-200 dark:border-slate-800/80 text-[11px] font-bold">
              <div className={`py-2.5 border-b-2 flex items-center justify-center gap-1.5 ${
                bookingStep === 'details' 
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-sky-500/5' 
                  : 'border-transparent text-slate-500'
              }`}>
                <User className="w-3.5 h-3.5" />
                <span>1. Guest Info</span>
              </div>
              <div className={`py-2.5 border-b-2 flex items-center justify-center gap-1.5 ${
                bookingStep === 'payment' 
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-sky-500/5' 
                  : 'border-transparent text-slate-500'
              }`}>
                <CreditCard className="w-3.5 h-3.5" />
                <span>2. Test Payment</span>
              </div>
              <div className={`py-2.5 border-b-2 flex items-center justify-center gap-1.5 ${
                bookingStep === 'confirmed' 
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' 
                  : 'border-transparent text-slate-500'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>3. E-Voucher</span>
              </div>
            </div>

            {/* Error banner if any */}
            {bookingError && (
              <div className="m-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* STEP 1: GUEST DETAILS & PRICING */}
            {bookingStep === 'details' && (
              <form onSubmit={handleCreateBooking} className="p-5 space-y-4">
                {/* Academic Disclosure Tag */}
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 text-xs flex items-start gap-2.5 text-sky-900 dark:text-sky-200">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
                  <div>
                    <p className="font-semibold">Academic Prototype Booking Notice</p>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      Property data and rates are sourced from live Google Hotels queries. Checkout connects to our PostgreSQL test booking engine. No actual credit card charge occurs.
                    </p>
                  </div>
                </div>

                {/* Stay summary card */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span>Stay Duration:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {checkInDate} to {checkOutDate} ({calculateNights(checkInDate, checkOutDate)} {calculateNights(checkInDate, checkOutDate) === 1 ? 'Night' : 'Nights'})
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span>Base Nightly Rate:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{bookingHotel.priceDisplay}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span>Taxes & GST (12%):</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{Math.round(bookingHotel.priceNumber * calculateNights(checkInDate, checkOutDate) * 0.12).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 font-bold text-sm">
                    <span className="text-slate-900 dark:text-white">Total Booking Amount:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ₹{Math.round(bookingHotel.priceNumber * calculateNights(checkInDate, checkOutDate) * 1.12).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Guest Inputs */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Lead Traveler & Passenger Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Roshan Gorade"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="roshan@example.com"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Age
                        </label>
                        <input
                          type="number"
                          min="18"
                          max="100"
                          value={guestAge}
                          onChange={(e) => setGuestAge(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Gender
                        </label>
                        <select
                          value={guestGender}
                          onChange={(e) => setGuestGender(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-900 dark:text-white"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Special Requests / Preferences (Optional)
                    </label>
                    <input
                      type="text"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="e.g. Quiet room, late check-in, high floor..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-2 justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setBookingHotel(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBooking}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmittingBooking ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Proceed to Test Checkout</span>
                        <Check className="w-4 h-4 text-sky-300" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: TEST PAYMENT CHECKOUT */}
            {bookingStep === 'payment' && confirmedBookingData && (
              <div className="p-5 space-y-5">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400">Booking Reference:</span>
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm">
                      {confirmedBookingData.bookingReference}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300">Property:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{confirmedBookingData.hotelName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300">Lead Passenger:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{guestName}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-bold">
                    <span className="text-slate-900 dark:text-white">Amount Due:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ₹{confirmedBookingData.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Select Test Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        paymentMethod === 'upi'
                          ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <Sparkles className="w-4 h-4" />
                        <span>Instant UPI Simulator</span>
                      </div>
                      <p className="text-[10px] mt-1 opacity-80">Instant test approval</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <CreditCard className="w-4 h-4" />
                        <span>Test Card (Razorpay)</span>
                      </div>
                      <p className="text-[10px] mt-1 opacity-80">Simulated 3DS verification</p>
                    </button>
                  </div>
                </div>

                {/* Simulation note */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>Sandbox Environment: Server cryptographically verifies simulated HMAC signatures.</span>
                </div>

                {/* Pay Button */}
                <div className="flex gap-2 justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setBookingStep('details')}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Back to Info
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessPayment}
                    disabled={isSubmittingBooking}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmittingBooking ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Pay ₹{confirmedBookingData.totalAmount.toLocaleString('en-IN')} (Test Approval)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: E-TICKET CONFIRMATION SCREEN */}
            {bookingStep === 'confirmed' && confirmedBookingData && (
              <div className="p-6 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce-subtle">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Reservation Confirmed!</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                    Your simulated stay booking has been recorded in the PostgreSQL database.
                  </p>
                </div>

                {/* E-Ticket Display */}
                <div className="p-5 rounded-2xl border border-dashed border-sky-400/50 bg-sky-50/50 dark:bg-sky-950/20 text-left text-xs space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span className="font-bold text-slate-900 dark:text-white">TripNova Official E-Voucher</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-[10px]">
                      STATUS: CONFIRMED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Booking Reference</span>
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{confirmedBookingData.bookingReference}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">E-Ticket Identifier</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{confirmedBookingData.ticketId}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Property & Location</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{confirmedBookingData.hotelName}, {confirmedBookingData.destination}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Lead Passenger</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{guestName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Check-in / Check-out</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{confirmedBookingData.checkInDate} → {confirmedBookingData.checkOutDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Paid in Sandbox</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{confirmedBookingData.totalAmount.toLocaleString('en-IN')} (PAID)</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span>Print / Save Voucher</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingHotel(null);
                      setBookingStep('details');
                      setConfirmedBookingData(null);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold text-xs cursor-pointer shadow-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gemini AI Personalized Recommendations Modal */}
      <PersonalizedRecommendationsModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        isDarkMode={isDarkMode}
        initialDestination={destinationInput || 'Goa'}
        onSelectHotel={(h) => {
          setBookingHotel(h);
          setBookingStep('details');
        }}
      />
    </section>
  );
};
