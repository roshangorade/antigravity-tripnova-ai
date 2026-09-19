import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

// Simple in-memory cache to stay within SerpApi usage limits
interface CacheEntry {
  timestamp: number;
  data: any;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache
const routeCache = new Map<string, CacheEntry>();

function getCachedData(key: string): any | null {
  const entry = routeCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    routeCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedData(key: string, data: any): void {
  routeCache.set(key, { timestamp: Date.now(), data });
}

export interface SerpDirectionsStep {
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

export interface SerpDirectionsTrip {
  travelMode: string;
  title?: string;
  distance?: number;
  duration?: number;
  formattedDistance?: string;
  formattedDuration?: string;
  steps: SerpDirectionsStep[];
}

export interface SerpRouteResult {
  via: string;
  travelMode: string;
  distanceMeters?: number;
  durationSeconds?: number;
  typicalDurationRange?: string;
  formattedDistance: string;
  formattedDuration: string;
  extensions?: string[];
  icon?: string;
  trips?: SerpDirectionsTrip[];
}

export interface SerpTravelModeOption {
  travelMode: string;
  durationSeconds?: number;
  formattedDuration: string;
}

export interface SerpPlaceLocation {
  address: string;
  dataId?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface SerpDirectionsResponse {
  success: boolean;
  isLive: boolean;
  message?: string;
  origin: string;
  destination: string;
  travelModeRequested?: string;
  placesInfo?: SerpPlaceLocation[];
  availableModes?: SerpTravelModeOption[];
  routes?: SerpRouteResult[];
  googleMapsDirectionsUrl?: string;
}

/**
 * Convert user travel mode string to SerpApi numeric travel_mode parameter
 * 0 = Driving, 1 = Two-wheeler, 2 = Bicycling, 3 = Transit, 4 = Walking, 5 = Flight
 */
function parseTravelModeParam(mode?: string): string | undefined {
  if (!mode) return undefined;
  const m = mode.trim().toLowerCase();
  if (m === 'driving' || m === 'car' || m === 'drive' || m === '0') return '0';
  if (m === 'two-wheeler' || m === 'two_wheeler' || m === 'bike' || m === 'motorcycle' || m === '1') return '1';
  if (m === 'bicycling' || m === 'bicycle' || m === 'cycling' || m === '2') return '2';
  if (m === 'transit' || m === 'bus' || m === 'train' || m === 'public_transport' || m === '3') return '3';
  if (m === 'walking' || m === 'walk' || m === '4') return '4';
  if (m === 'flight' || m === 'fly' || m === 'plane' || m === '5') return '5';
  return undefined;
}

/**
 * Fetch Google Maps directions and route data via SerpApi
 */
export async function getSerpDirections(
  origin: string,
  destination: string,
  travelMode?: string
): Promise<SerpDirectionsResponse> {
  const apiKey = (process.env.SERPAPI_API_KEY || '').replace(/["']/g, '').trim();

  if (!origin || origin.trim().length === 0) {
    return {
      success: false,
      isLive: false,
      origin: '',
      destination: destination || '',
      message: 'Origin location parameter is required'
    };
  }

  if (!destination || destination.trim().length === 0) {
    return {
      success: false,
      isLive: false,
      origin: origin || '',
      destination: '',
      message: 'Destination location parameter is required'
    };
  }

  const cleanOrigin = origin.trim();
  const cleanDest = destination.trim();
  const numericMode = parseTravelModeParam(travelMode);

  const cacheKey = `directions:${cleanOrigin.toLowerCase()}:${cleanDest.toLowerCase()}:${numericMode || 'default'}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return { ...cached, isLive: true };
  }

  if (!apiKey || apiKey === '' || apiKey.includes('YOUR_SERPAPI_KEY')) {
    return {
      success: false,
      isLive: false,
      origin: cleanOrigin,
      destination: cleanDest,
      message: 'SERPAPI_API_KEY is not configured or is a placeholder'
    };
  }

  try {
    const params = new URLSearchParams({
      engine: 'google_maps_directions',
      start_addr: cleanOrigin,
      end_addr: cleanDest,
      hl: 'en',
      api_key: apiKey
    });

    if (numericMode) {
      params.append('travel_mode', numericMode);
    }

    const url = `https://serpapi.com/search.json?${params.toString()}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(12000) });

    if (!response.ok) {
      const errText = await response.text();
      let msg = `SerpApi directions search failed with status ${response.status}`;
      if (response.status === 401) {
        msg = 'Invalid or unauthorized SERPAPI_API_KEY. Please verify key in Settings.';
      } else if (response.status === 429) {
        msg = 'SerpApi rate limit exceeded. Please try again shortly.';
      }
      console.warn(`[SerpApi Maps] HTTP ${response.status}:`, msg, errText.slice(0, 200));
      return {
        success: false,
        isLive: false,
        origin: cleanOrigin,
        destination: cleanDest,
        message: msg
      };
    }

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        isLive: false,
        origin: cleanOrigin,
        destination: cleanDest,
        message: data.error || 'Unable to calculate route for the given locations.'
      };
    }

    // Extract places_info
    const placesInfo: SerpPlaceLocation[] = (data.places_info || []).map((p: any) => ({
      address: p.address || '',
      dataId: p.data_id,
      gpsCoordinates: p.gps_coordinates ? {
        latitude: p.gps_coordinates.latitude,
        longitude: p.gps_coordinates.longitude
      } : undefined
    }));

    // Extract available modes from durations
    const availableModes: SerpTravelModeOption[] = (data.durations || []).map((d: any) => ({
      travelMode: d.travel_mode || 'Driving',
      durationSeconds: d.duration,
      formattedDuration: d.formatted_duration || ''
    }));

    // Extract directions / routes
    const rawDirections = data.directions || data.routes || [];
    const routes: SerpRouteResult[] = rawDirections.map((r: any) => {
      const trips: SerpDirectionsTrip[] = (r.trips || []).map((trip: any) => ({
        travelMode: trip.travel_mode || r.travel_mode || 'Driving',
        title: trip.title,
        distance: trip.distance,
        duration: trip.duration,
        formattedDistance: trip.formatted_distance || '',
        formattedDuration: trip.formatted_duration || '',
        steps: (trip.details || []).map((step: any) => ({
          title: step.title || '',
          action: step.action,
          distance: step.distance,
          duration: step.duration,
          formattedDistance: step.formatted_distance,
          formattedDuration: step.formatted_duration,
          photo: step.geo_photo,
          gpsCoordinates: step.gps_coordinates ? {
            latitude: step.gps_coordinates.latitude,
            longitude: step.gps_coordinates.longitude
          } : undefined,
          notes: step.extensions || [],
          icon: step.icon
        }))
      }));

      return {
        via: r.via || 'Recommended Route',
        travelMode: r.travel_mode || 'Driving',
        distanceMeters: r.distance,
        durationSeconds: r.duration,
        typicalDurationRange: r.typical_duration_range,
        formattedDistance: r.formatted_distance || (r.distance ? `${Math.round(r.distance / 1000)} km` : 'N/A'),
        formattedDuration: r.formatted_duration || (r.duration ? `${Math.round(r.duration / 60)} mins` : 'N/A'),
        extensions: r.extensions || [],
        icon: r.icon,
        trips
      };
    });

    const resultResponse: SerpDirectionsResponse = {
      success: true,
      isLive: true,
      origin: cleanOrigin,
      destination: cleanDest,
      travelModeRequested: travelMode || 'Driving',
      placesInfo,
      availableModes,
      routes,
      googleMapsDirectionsUrl: data.search_metadata?.google_maps_directions_url || `https://www.google.com/maps/dir/${encodeURIComponent(cleanOrigin)}/${encodeURIComponent(cleanDest)}`
    };

    if (routes.length > 0) {
      setCachedData(cacheKey, resultResponse);
    }

    return resultResponse;
  } catch (err: any) {
    console.error('[SerpApi Directions Exception]:', err);
    return {
      success: false,
      isLive: false,
      origin: cleanOrigin,
      destination: cleanDest,
      message: 'Unable to calculate the route right now. Please try again.'
    };
  }
}
