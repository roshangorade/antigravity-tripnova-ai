import React, { useState, useEffect, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { OpenStreetMapLeaflet, MapMarkerItem } from './OpenStreetMapLeaflet';
import { POPULAR_DESTINATIONS, FEATURED_HOTELS, FEATURED_RESTAURANTS } from '../data/travelData';
import { Destination, Hotel, Restaurant } from '../types';
import {
  MapPin,
  Hotel as HotelIcon,
  Utensils,
  Navigation,
  Sparkles,
  Compass,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  Car,
  Footprints,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';

interface MapViewProps {
  isDarkMode: boolean;
  onSelectDestination: (name: string) => void;
  onOpenDestinationModal?: (destination: Destination) => void;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Route Calculation Component using Google Maps Routes API (computeRoutes)
function RouteCalculator({
  origin,
  destination,
  travelMode,
  onRouteComputed,
}: {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  travelMode: 'DRIVING' | 'WALKING';
  onRouteComputed: (info: { distance: string; duration: string } | null) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map || !origin || !destination) return;

    // Clear previous polylines
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    routesLib.Route.computeRoutes({
      origin,
      destination,
      travelMode: travelMode === 'WALKING' ? 'WALKING' : 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    })
      .then(({ routes }) => {
        if (routes && routes[0]) {
          const route = routes[0];
          const polylines = route.createPolylines();
          polylines.forEach((p) => p.setMap(map));
          polylinesRef.current = polylines;

          if (route.viewport) {
            map.fitBounds(route.viewport);
          }

          const km = (route.distanceMeters / 1000).toFixed(1);
          const mins = Math.round(route.durationMillis / 60000);
          const hours = Math.floor(mins / 60);
          const remMins = mins % 60;
          const durationStr = hours > 0 ? `${hours}h ${remMins}m` : `${remMins} mins`;

          onRouteComputed({
            distance: `${km} km`,
            duration: durationStr,
          });
        }
      })
      .catch((err) => {
        console.error('Error computing routes:', err);
        onRouteComputed(null);
      });

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, origin, destination, travelMode]);

  return null;
}

// Marker item wrapper with InfoWindow anchor
function InteractiveMarkerItem({
  item,
  type,
  isSelected,
  onSelect,
  onClose,
  onPlanTrip,
  onOpenDetails,
}: {
  key?: string;
  item: Destination | Hotel | Restaurant;
  type: 'destination' | 'hotel' | 'restaurant';
  isSelected: boolean;
  onSelect: () => void;
  onClose: () => void;
  onPlanTrip: (name: string) => void;
  onOpenDetails?: () => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  let position: google.maps.LatLngLiteral = { lat: 20.5937, lng: 78.9629 };
  let title = '';
  let bg = '#1E3A8A';
  let glyph = '📍';

  if (type === 'destination') {
    const dest = item as Destination;
    position = dest.coordinates;
    title = dest.name;
    bg = '#E11D48'; // Rose red
    glyph = '🏝️';
  } else if (type === 'hotel') {
    const hotel = item as Hotel;
    position = hotel.coordinates;
    title = hotel.name;
    bg = '#2563EB'; // Blue
    glyph = '🏨';
  } else {
    const rest = item as Restaurant;
    position = { lat: 15.58, lng: 73.74 }; // Default fallback coordinates if needed
    title = rest.name;
    bg = '#D97706'; // Amber
    glyph = '🍽️';
  }

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={position}
        title={title}
        onClick={onSelect}
      >
        <Pin background={bg} borderColor="#FFFFFF" glyphColor="#FFFFFF">
          <span className="text-xs">{glyph}</span>
        </Pin>
      </AdvancedMarker>

      {isSelected && (
        <InfoWindow anchor={marker} onCloseClick={onClose}>
          <div className="max-w-xs p-1 text-slate-900 font-sans">
            {type === 'destination' && (
              <>
                <img
                  src={(item as Destination).heroImage}
                  alt={title}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-slate-900">{(item as Destination).name}</h4>
                  <span className="text-xs font-bold text-amber-500">
                    ⭐ {(item as Destination).rating}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 line-clamp-2 mb-2">
                  {(item as Destination).tagline}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-700 font-medium mb-2">
                  <span>{(item as Destination).state}, {(item as Destination).country}</span>
                  <span className="font-bold text-slate-900">₹{(item as Destination).avgDailyCostINR}/day</span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => onPlanTrip((item as Destination).name)}
                    className="flex-1 py-1 px-2 rounded-md bg-[#1E3A8A] text-white text-[11px] font-semibold hover:bg-blue-900 flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Plan AI Trip</span>
                  </button>
                  {onOpenDetails && (
                    <button
                      onClick={onOpenDetails}
                      className="py-1 px-2 rounded-md border border-slate-300 text-slate-700 text-[11px] font-medium hover:bg-slate-100 flex items-center gap-1"
                    >
                      <span>Guide</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </>
            )}

            {type === 'hotel' && (
              <>
                <img
                  src={(item as Hotel).image}
                  alt={title}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-slate-900">{(item as Hotel).name}</h4>
                  <span className="text-xs font-bold text-amber-500">
                    ⭐ {(item as Hotel).rating}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mb-1">
                  {(item as Hotel).locationDesc}
                </p>
                <p className="text-xs font-bold text-blue-700 mb-2">
                  ₹{(item as Hotel).pricePerNightINR.toLocaleString('en-IN')} / night
                </p>
                <button
                  onClick={() => onPlanTrip(`Stay at ${(item as Hotel).name} in ${(item as Hotel).destination}`)}
                  className="w-full py-1.5 rounded-md bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 flex items-center justify-center gap-1"
                >
                  <HotelIcon className="w-3 h-3" />
                  <span>Book & Plan Trip</span>
                </button>
              </>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export const MapView: React.FC<MapViewProps> = ({
  isDarkMode,
  onSelectDestination,
  onOpenDestinationModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'destinations' | 'hotels'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: 'destination' | 'hotel' } | null>(null);

  // Route Planning State
  const [routeModeActive, setRouteModeActive] = useState(false);
  const [originDestId, setOriginDestId] = useState<string>('jaipur');
  const [targetDestId, setTargetDestId] = useState<string>('udaipur');
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'WALKING'>('DRIVING');
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  // Filter destinations
  const filteredDestinations = POPULAR_DESTINATIONS.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const originDest = POPULAR_DESTINATIONS.find(d => d.id === originDestId);
  const targetDest = POPULAR_DESTINATIONS.find(d => d.id === targetDestId);

  // Markers for OpenStreetMap Leaflet Fallback
  const leafletMarkers: MapMarkerItem[] = [
    ...(selectedCategory === 'all' || selectedCategory === 'destinations'
      ? filteredDestinations.map((d) => ({
          id: d.id,
          name: d.name,
          position: d.coordinates,
          type: 'destination' as const,
          rating: d.rating,
          image: d.heroImage,
          subtitle: `${d.state}, ${d.country}`,
          price: d.avgDailyCostINR,
        }))
      : []),
    ...(selectedCategory === 'all' || selectedCategory === 'hotels'
      ? FEATURED_HOTELS.map((h) => ({
          id: h.id,
          name: h.name,
          position: h.coordinates,
          type: 'hotel' as const,
          rating: h.rating,
          image: h.image,
          subtitle: h.locationDesc,
          price: h.pricePerNightINR,
        }))
      : []),
  ];

  // Route calculation for OpenStreetMap mode
  useEffect(() => {
    if (!hasValidKey && routeModeActive && originDest && targetDest) {
      const R = 6371; // km
      const dLat = ((targetDest.coordinates.lat - originDest.coordinates.lat) * Math.PI) / 180;
      const dLon = ((targetDest.coordinates.lng - originDest.coordinates.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((originDest.coordinates.lat * Math.PI) / 180) *
          Math.cos((targetDest.coordinates.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distKm = Math.round(R * c);
      const approxMins = travelMode === 'DRIVING' ? Math.round(distKm * 1.2) : Math.round(distKm * 12);
      const hours = Math.floor(approxMins / 60);
      const mins = approxMins % 60;
      const durStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

      setRouteInfo({
        distance: `${distKm} km`,
        duration: durStr,
      });
    }
  }, [hasValidKey, routeModeActive, originDest, targetDest, travelMode]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Top Header Controls Bar */}
      <div className={`p-4 rounded-2xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-emerald-400 flex items-center justify-center shadow-xs">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-serif-editorial">Interactive Google Map</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Explore destinations, stays, & live route calculations</p>
          </div>
        </div>

        {/* Filter Badges & Route Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filters */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium border border-slate-200 dark:border-transparent">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 font-semibold'
              }`}
            >
              All Spots
            </button>
            <button
              onClick={() => setSelectedCategory('destinations')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedCategory === 'destinations'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 font-semibold'
              }`}
            >
              Destinations
            </button>
            <button
              onClick={() => setSelectedCategory('hotels')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedCategory === 'hotels'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 font-semibold'
              }`}
            >
              Hotels & Stays
            </button>
          </div>

          {/* Route Planner Toggle Button */}
          <button
            onClick={() => setRouteModeActive(!routeModeActive)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              routeModeActive
                ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                : isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                  : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{routeModeActive ? 'Close Route Calculator' : 'Route Calculator'}</span>
          </button>
        </div>
      </div>

      {/* Route Calculator Panel if active */}
      {routeModeActive && (
        <div className={`p-4 rounded-2xl border bg-gradient-to-r from-blue-900 to-indigo-950 text-white space-y-3 animate-fade-in`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Navigation className="w-4 h-4" />
              <span>Google Maps Routes API (Live Distance & ETA)</span>
            </div>
            <button onClick={() => setRouteModeActive(false)} className="text-slate-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] text-slate-300 font-semibold mb-1">Starting Origin</label>
              <select
                value={originDestId}
                onChange={(e) => setOriginDestId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white cursor-pointer"
              >
                {POPULAR_DESTINATIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 font-semibold mb-1">Destination</label>
              <select
                value={targetDestId}
                onChange={(e) => setTargetDestId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white cursor-pointer"
              >
                {POPULAR_DESTINATIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 font-semibold mb-1">Travel Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTravelMode('DRIVING')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border ${
                    travelMode === 'DRIVING'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" /> Driving
                </button>
                <button
                  onClick={() => setTravelMode('WALKING')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border ${
                    travelMode === 'WALKING'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <Footprints className="w-3.5 h-3.5" /> Walking
                </button>
              </div>
            </div>
          </div>

          {routeInfo && (
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-300">Route Summary:</span>
                <span>{originDest?.name} ➔ {targetDest?.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold flex items-center gap-1 text-emerald-400">
                  <Navigation className="w-3.5 h-3.5" /> {routeInfo.distance}
                </span>
                <span className="font-bold flex items-center gap-1 text-blue-300">
                  <Clock className="w-3.5 h-3.5" /> {routeInfo.duration}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map Key Notice Bar if running on OpenStreetMap */}
      {!hasValidKey && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex flex-wrap items-center justify-between text-xs text-blue-900 dark:text-blue-200 gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              <strong>OpenStreetMap Mode Active:</strong> Add your <code>GOOGLE_MAPS_PLATFORM_KEY</code> in AI Studio Secrets to unlock 3D Satellite views & Google Routes API.
            </span>
          </div>
        </div>
      )}

      {/* Main Map Canvas Area */}
      <div className="relative w-full h-[600px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
        {hasValidKey ? (
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              defaultCenter={{ lat: 20.5937, lng: 78.9629 }}
              defaultZoom={5}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Render Destinations Markers */}
              {(selectedCategory === 'all' || selectedCategory === 'destinations') &&
                filteredDestinations.map((dest) => (
                  <InteractiveMarkerItem
                    key={dest.id}
                    item={dest}
                    type="destination"
                    isSelected={selectedItem?.id === dest.id}
                    onSelect={() => setSelectedItem({ id: dest.id, type: 'destination' })}
                    onClose={() => setSelectedItem(null)}
                    onPlanTrip={onSelectDestination}
                    onOpenDetails={() => onOpenDestinationModal && onOpenDestinationModal(dest)}
                  />
                ))}

              {/* Render Hotels Markers */}
              {(selectedCategory === 'all' || selectedCategory === 'hotels') &&
                FEATURED_HOTELS.map((hotel) => (
                  <InteractiveMarkerItem
                    key={hotel.id}
                    item={hotel}
                    type="hotel"
                    isSelected={selectedItem?.id === hotel.id}
                    onSelect={() => setSelectedItem({ id: hotel.id, type: 'hotel' })}
                    onClose={() => setSelectedItem(null)}
                    onPlanTrip={onSelectDestination}
                  />
                ))}

              {/* Route Calculator live polylines rendering */}
              {routeModeActive && originDest && targetDest && (
                <RouteCalculator
                  origin={originDest.coordinates}
                  destination={targetDest.coordinates}
                  travelMode={travelMode}
                  onRouteComputed={(info) => setRouteInfo(info)}
                />
              )}
            </Map>
          </APIProvider>
        ) : (
          <OpenStreetMapLeaflet
            center={{ lat: 20.5937, lng: 78.9629 }}
            zoom={5}
            markers={leafletMarkers}
            routeLine={
              routeModeActive && originDest && targetDest
                ? {
                    origin: originDest.coordinates,
                    destination: targetDest.coordinates,
                  }
                : null
            }
            onPlanTrip={onSelectDestination}
          />
        )}
      </div>
    </div>
  );
};
