import React, { useState, useEffect } from 'react';
import { FEATURED_HOTELS } from '../data/travelData';
import { Hotel } from '../types';
import { Star, MapPin, Heart, Search, Calendar, Sparkles, Building2, Check, Filter } from 'lucide-react';

interface HotelsSectionProps {
  isDarkMode: boolean;
  wishlist: string[];
  onToggleWishlist: (hotelId: string) => void;
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
}

export const HotelsSection: React.FC<HotelsSectionProps> = ({ isDarkMode, wishlist, onToggleWishlist }) => {
  const [destinationInput, setDestinationInput] = useState('Goa');
  const [checkInDate, setCheckInDate] = useState('2026-08-20');
  const [checkOutDate, setCheckOutDate] = useState('2026-08-23');
  const [selectedType, setSelectedType] = useState<string>('All');

  const [hotelsList, setHotelsList] = useState<DisplayHotel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveSearch, setIsLiveSearch] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [bookingHotel, setBookingHotel] = useState<DisplayHotel | null>(null);

  const types = ['All', 'Luxury Resort', 'Heritage Palace', 'Backpacker Hostel'];

  const fetchHotels = async (dest: string, checkIn: string, checkOut: string) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const params = new URLSearchParams({
        destination: dest || 'Goa',
        checkIn: checkIn || '',
        checkOut: checkOut || ''
      });

      const res = await fetch(`/api/search/hotels?${params.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.properties) && data.properties.length > 0) {
        const mapped: DisplayHotel[] = data.properties.map((p: any) => ({
          id: p.id,
          name: p.name,
          destination: p.destination || dest,
          location: p.location || dest,
          rating: p.rating || 4.5,
          reviewsCount: p.reviewsCount || 100,
          priceDisplay: p.pricePerNight || `₹${p.priceNumber || 3500}/night`,
          priceNumber: p.priceNumber || 3500,
          image: p.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
          type: p.type || 'Resort Stay',
          amenities: p.amenities || ['Free Wi-Fi', 'Pool', 'Breakfast'],
          link: p.link,
          dealInfo: p.dealInfo,
          isLive: Boolean(data.isLive)
        }));

        setHotelsList(mapped);
        setIsLiveSearch(Boolean(data.isLive));
        if (data.message) setStatusMessage(data.message);
      } else {
        // Fallback to featured hotels
        fallbackToLocal(dest);
        setStatusMessage('Serving curated hotel stays for ' + dest);
      }
    } catch (err) {
      console.error('Error fetching hotels:', err);
      fallbackToLocal(dest);
      setStatusMessage('Unable to load hotels right now. Displaying curated stays.');
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackToLocal = (dest: string) => {
    const filtered = FEATURED_HOTELS.filter(h =>
      !dest || h.destination.toLowerCase().includes(dest.toLowerCase()) || h.name.toLowerCase().includes(dest.toLowerCase())
    );
    const mapped: DisplayHotel[] = (filtered.length > 0 ? filtered : FEATURED_HOTELS).map(h => ({
      id: h.id,
      name: h.name,
      destination: h.destination,
      location: h.locationDesc,
      rating: h.rating,
      reviewsCount: h.reviewsCount,
      priceDisplay: `₹${h.pricePerNightINR.toLocaleString('en-IN')}/night`,
      priceNumber: h.pricePerNightINR,
      image: h.image,
      type: h.type,
      amenities: h.amenities,
      isLive: false
    }));
    setHotelsList(mapped);
    setIsLiveSearch(false);
  };

  useEffect(() => {
    fetchHotels('Goa', '2026-08-20', '2026-08-23');
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHotels(destinationInput, checkInDate, checkOutDate);
  };

  const filteredHotels = hotelsList.filter(hotel => {
    if (selectedType === 'All') return true;
    return hotel.type.toLowerCase().includes(selectedType.toLowerCase());
  });

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

          <div className="flex gap-1 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 text-xs font-medium self-start md:self-auto">
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

        {/* Live Search Form Bar */}
        <form onSubmit={handleSearchSubmit} className={`mb-8 p-4 sm:p-5 rounded-2xl border shadow-xs ${
          isDarkMode ? 'bg-[#131E32] border-slate-800' : 'bg-white border-slate-300'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Destination
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-sky-500" />
                <input
                  type="text"
                  value={destinationInput}
                  onChange={(e) => setDestinationInput(e.target.value)}
                  placeholder="e.g. Goa, Mumbai, Manali..."
                  className={`w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500 placeholder:text-slate-500 ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>
            </div>

            <div>
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

            <div>
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

            <div className="flex items-end">
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
                    <span>Search Google Hotels</span>
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
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Searching live hotel rates for {destinationInput}...</p>
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="py-16 text-center border rounded-2xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700">
            <Building2 className="w-10 h-10 text-slate-500 dark:text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No hotel properties found</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Try searching for a different destination or adjusting dates.</p>
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

                    {hotel.isLive && (
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-semibold uppercase tracking-wider shadow-xs">
                        Live Google Hotel
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

      {/* Booking Simulation Modal */}
      {bookingHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl ${
            isDarkMode ? 'bg-[#131E32] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <h3 className="text-lg font-bold">Reserve {bookingHotel.name}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">{bookingHotel.destination} • {bookingHotel.type}</p>

            <div className="my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/60 text-xs space-y-1.5 text-slate-800 dark:text-slate-200">
              <div className="flex justify-between"><span>Nightly Rate:</span> <span className="font-semibold">{bookingHotel.priceDisplay}</span></div>
              <div className="flex justify-between"><span>Stay Window:</span> <span className="font-semibold">{checkInDate} to {checkOutDate}</span></div>
              <div className="flex justify-between"><span>Taxes & Fees:</span> <span className="font-semibold">Included</span></div>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold border-t border-slate-300 dark:border-slate-700 pt-1.5"><span>Instant Confirmation:</span> <span>Guaranteed</span></div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setBookingHotel(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Reservation request for ${bookingHotel.name} submitted successfully!`);
                  setBookingHotel(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
