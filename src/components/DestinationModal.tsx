import React from 'react';
import { Destination } from '../types';
import { X, Star, MapPin, Calendar, Check, AlertTriangle, ShieldCheck, Phone, ArrowRight, Sun, Plane } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { OpenStreetMapLeaflet } from './OpenStreetMapLeaflet';
import { SerpEventsAndPlaces } from './SerpEventsAndPlaces';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface DestinationModalProps {
  destination: Destination | null;
  onClose: () => void;
  onPlanTrip: (destName: string) => void;
  onSearchFlights?: (destName: string) => void;
  isDarkMode: boolean;
}

export const DestinationModal: React.FC<DestinationModalProps> = ({
  destination,
  onClose,
  onPlanTrip,
  onSearchFlights,
  isDarkMode
}) => {
  if (!destination) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className={`relative w-full max-w-4xl rounded-3xl overflow-hidden border shadow-2xl my-8 ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white text-slate-900'
      }`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Gallery Banner */}
        <div className="relative h-72 sm:h-96">
          <img
            src={destination.heroImage}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          <div className="absolute bottom-6 left-6 right-6 text-white">
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
              {destination.state}, {destination.country}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black mt-2 tracking-tight">{destination.name}</h2>
            <p className="text-sm text-slate-200 mt-1 max-w-2xl line-clamp-2">{destination.tagline}</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8 max-h-[60vh] overflow-y-auto">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase">Best Time</span>
              <div className="font-bold flex items-center gap-1 mt-0.5"><Calendar className="w-3.5 h-3.5 text-blue-500" /> {destination.bestTimeToVisit}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase">Daily Budget</span>
              <div className="font-bold mt-0.5">₹{destination.avgDailyCostINR.toLocaleString('en-IN')}/day</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase">Rating</span>
              <div className="font-bold flex items-center gap-1 mt-0.5 text-amber-500"><Star className="w-3.5 h-3.5 fill-amber-400" /> {destination.rating} ({destination.reviewCount})</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase">Climate</span>
              <div className="font-bold flex items-center gap-1 mt-0.5 text-emerald-500"><Sun className="w-3.5 h-3.5" /> {destination.weather.tempC}°C Sunny</div>
            </div>
          </div>

          {/* About & History */}
          <div>
            <h3 className="text-lg font-bold mb-2">About & History</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {destination.description}
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 italic leading-relaxed font-medium">
              {destination.historySummary}
            </p>
          </div>

          {/* Interactive Google Map Location */}
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-500" />
              <span>Location & Surroundings</span>
            </h3>
            <div className="w-full h-56 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-slate-100 dark:bg-slate-800">
              {hasValidKey ? (
                <APIProvider apiKey={API_KEY} version="weekly">
                  <Map
                    defaultCenter={destination.coordinates}
                    defaultZoom={10}
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <AdvancedMarker position={destination.coordinates} title={destination.name}>
                      <Pin background="#E11D48" borderColor="#FFFFFF" glyphColor="#FFFFFF" />
                    </AdvancedMarker>
                  </Map>
                </APIProvider>
              ) : (
                <OpenStreetMapLeaflet
                  center={destination.coordinates}
                  zoom={10}
                  markers={[
                    {
                      id: destination.id,
                      name: destination.name,
                      position: destination.coordinates,
                      type: 'destination',
                      rating: destination.rating,
                      image: destination.heroImage,
                      subtitle: `${destination.state}, ${destination.country}`,
                      price: destination.avgDailyCostINR,
                    },
                  ]}
                  onPlanTrip={(name) => {
                    onPlanTrip(name);
                    onClose();
                  }}
                />
              )}
            </div>
          </div>

          {/* Photo Gallery Grid */}
          <div>
            <h3 className="text-lg font-bold mb-3">Photo Gallery</h3>
            <div className="grid grid-cols-3 gap-3">
              {destination.gallery.map((img, i) => (
                <img key={i} src={img} alt="Gallery" className="w-full h-28 sm:h-36 object-cover rounded-2xl shadow-md" />
              ))}
            </div>
          </div>

          {/* Top Attractions */}
          <div>
            <h3 className="text-lg font-bold mb-3">Must-Visit Attractions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {destination.topAttractions.map((att, i) => (
                <div key={i} className="p-3 rounded-2xl border border-slate-300 dark:border-slate-800 flex gap-3 items-center">
                  <img src={att.image} alt={att.name} className="w-16 h-16 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-xs">{att.name}</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">{att.type} • Entry: {att.fee}</p>
                    <span className="text-[10px] font-bold text-amber-500">⭐ {att.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SerpApi Live Events & Discovered Spots */}
          <div className="pt-2">
            <SerpEventsAndPlaces initialLocation={destination.name} isDarkMode={isDarkMode} />
          </div>

          {/* Local Customs & Do's & Don'ts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs">
              <h4 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                <Check className="w-4 h-4" /> Recommended Do's
              </h4>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                {destination.dosAndDonts.dos.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs">
              <h4 className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4" /> Cultural Don'ts
              </h4>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                {destination.dosAndDonts.donts.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Entry & Permit Info: {destination.entryFeeDetails}</span>
          <div className="flex items-center gap-2.5">
            {onSearchFlights && (
              <button
                onClick={() => {
                  onClose();
                  onSearchFlights(destination.name);
                }}
                className="px-4 py-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plane className="w-3.5 h-3.5" />
                <span>Search Flights</span>
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onPlanTrip(destination.name);
              }}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xl cursor-pointer"
            >
              <span>Plan AI Trip to {destination.name}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
