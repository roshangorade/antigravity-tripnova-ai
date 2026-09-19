import dotenv from 'dotenv';
import path from 'path';
import { 
  FlightItem, 
  FlightSegment, 
  FlightSearchResponse, 
  FlightSearchMetadata, 
  FlightPriceInsights,
  FlightLayover
} from '../types';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

// Short-lived server-side in-memory cache to prevent repeated external quota usage
interface CacheEntry {
  timestamp: number;
  data: FlightSearchResponse;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL
const flightCache = new Map<string, CacheEntry>();

function getCachedFlightSearch(cacheKey: string): FlightSearchResponse | null {
  const entry = flightCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    flightCache.delete(cacheKey);
    return null;
  }
  return { ...entry.data, cached: true };
}

function setCachedFlightSearch(cacheKey: string, data: FlightSearchResponse): void {
  flightCache.set(cacheKey, { timestamp: Date.now(), data });
}

export interface GoogleFlightsQueryParams {
  departure_id: string;
  arrival_id: string;
  outbound_date: string;
  return_date?: string;
  type?: string | number; // '1' = Round trip, '2' = One way
  currency?: string;
  adults?: number | string;
  travel_class?: number | string; // 1 = Economy, 2 = Premium economy, 3 = Business, 4 = First
  stops?: number | string; // 0 = Nonstop, 1 = 1 stop or fewer, 2 = 2 stops or fewer
  hl?: string;
  gl?: string;
}

/**
 * Formats duration minutes into human-readable string (e.g. 145 -> "2h 25m")
 */
function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return 'Direct';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

/**
 * Format price according to currency
 */
function formatPrice(amount?: number, currency: string = 'INR'): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Check Price';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toLocaleString()}`;
  }
}

/**
 * Normalizes an individual raw flight item from SerpApi into our typed FlightItem
 */
function normalizeFlightItem(
  raw: any, 
  index: number, 
  isBest: boolean, 
  currency: string,
  googleFlightsUrl?: string
): FlightItem {
  const segmentsRaw = Array.isArray(raw.flights) ? raw.flights : [];
  
  const segments: FlightSegment[] = segmentsRaw.map((seg: any) => {
    const depAirport = seg.departure_airport || {};
    const arrAirport = seg.arrival_airport || {};
    return {
      departure_airport: {
        id: depAirport.id || '',
        name: depAirport.name || depAirport.id || 'Departure Airport',
        time: depAirport.time || ''
      },
      arrival_airport: {
        id: arrAirport.id || '',
        name: arrAirport.name || arrAirport.id || 'Arrival Airport',
        time: arrAirport.time || ''
      },
      duration: Number(seg.duration) || 0,
      formatted_duration: formatDuration(Number(seg.duration)),
      airplane: seg.airplane || undefined,
      airline: seg.airline || 'Scheduled Carrier',
      airline_logo: seg.airline_logo || undefined,
      travel_class: seg.travel_class || 'Economy',
      flight_number: seg.flight_number || '',
      legroom: seg.legroom || undefined,
      extensions: Array.isArray(seg.extensions) ? seg.extensions : [],
      overnight: Boolean(seg.overnight)
    };
  });

  const firstSeg = segments[0] || {
    departure_airport: { id: '', name: '', time: '' },
    arrival_airport: { id: '', name: '', time: '' },
    duration: 0,
    formatted_duration: '',
    airline: 'Scheduled Carrier',
    flight_number: '',
    travel_class: 'Economy'
  };

  const lastSeg = segments[segments.length - 1] || firstSeg;

  // Layovers
  const layovers: FlightLayover[] = [];
  if (Array.isArray(raw.layovers)) {
    for (const lay of raw.layovers) {
      layovers.push({
        airport_id: lay.id || '',
        airport_name: lay.name || lay.id || 'Connecting Airport',
        duration: Number(lay.duration) || 0,
        formatted_duration: formatDuration(Number(lay.duration))
      });
    }
  }

  const stopsCount = Math.max(0, segments.length - 1);
  const stopsLabel: 'Non-stop' | '1 stop' | 'Multiple stops' = 
    stopsCount === 0 ? 'Non-stop' : stopsCount === 1 ? '1 stop' : 'Multiple stops';

  const totalDurationMin = Number(raw.total_duration) || segments.reduce((acc, s) => acc + s.duration, 0);

  // Flight numbers combined
  const flightNumbers = segments.map(s => s.flight_number).filter(Boolean).join(' • ') || firstSeg.flight_number;
  const primaryAirline = firstSeg.airline || raw.airline || 'Airline';
  const airlineLogo = raw.airline_logo || firstSeg.airline_logo;

  const priceNum = typeof raw.price === 'number' ? raw.price : 0;

  // Booking link: prioritize google_flights_url from SerpApi search metadata
  const bookingLink = googleFlightsUrl || 
    `https://www.google.com/travel/flights?q=Flights%20to%20${encodeURIComponent(lastSeg.arrival_airport.id)}%20from%20${encodeURIComponent(firstSeg.departure_airport.id)}`;

  return {
    id: raw.booking_token ? `flt_${raw.booking_token.slice(0, 24)}` : `flt_${isBest ? 'best' : 'reg'}_${index}_${Date.now()}`,
    airline: primaryAirline,
    airline_logo: airlineLogo,
    flight_number: flightNumbers,
    departure_airport: firstSeg.departure_airport,
    arrival_airport: lastSeg.arrival_airport,
    departure_time: firstSeg.departure_airport.time,
    arrival_time: lastSeg.arrival_airport.time,
    duration: totalDurationMin,
    formatted_duration: formatDuration(totalDurationMin),
    stops: stopsCount,
    stops_label: stopsLabel,
    layovers: layovers.length > 0 ? layovers : undefined,
    price: priceNum,
    formatted_price: formatPrice(priceNum, currency),
    currency: currency.toUpperCase(),
    travel_class: firstSeg.travel_class || 'Economy',
    airplane: firstSeg.airplane,
    booking_link: bookingLink,
    booking_token: raw.booking_token,
    carbon_emissions: raw.carbon_emissions ? {
      this_flight: raw.carbon_emissions.this_flight,
      typical_for_this_route: raw.carbon_emissions.typical_for_this_route,
      difference_percent: raw.carbon_emissions.difference_percent
    } : undefined,
    is_best_flight: isBest,
    overnight: segments.some(s => s.overnight),
    extensions: Array.isArray(raw.extensions) ? raw.extensions : firstSeg.extensions,
    segments
  };
}

/**
 * Curated fallback generator for realistic Indian and international air routes
 * Used when SerpApi key is missing, network is offline, or rate limit occurs.
 */
function getCuratedFallbackFlights(
  dep: string, 
  arr: string, 
  outboundDate: string,
  currency: string = 'INR'
): { best_flights: FlightItem[]; other_flights: FlightItem[] } {
  const depUpper = dep.toUpperCase();
  const arrUpper = arr.toUpperCase();

  const mockTemplates = [
    {
      airline: 'IndiGo',
      flightNumber: '6E 2104',
      airplane: 'Airbus A321neo',
      logo: 'https://www.gstatic.com/flights/airline_logos/70px/6E.png',
      depTime: '06:15',
      arrTime: '08:35',
      durationMin: 140,
      stops: 0,
      basePriceINR: 5490,
      overnight: false
    },
    {
      airline: 'Air India',
      flightNumber: 'AI 642',
      airplane: 'Airbus A320neo',
      logo: 'https://www.gstatic.com/flights/airline_logos/70px/AI.png',
      depTime: '09:30',
      arrTime: '11:55',
      durationMin: 145,
      stops: 0,
      basePriceINR: 5850,
      overnight: false
    },
    {
      airline: 'Vistara',
      flightNumber: 'UK 994',
      airplane: 'Boeing 737-800',
      logo: 'https://www.gstatic.com/flights/airline_logos/70px/UK.png',
      depTime: '14:20',
      arrTime: '16:45',
      durationMin: 145,
      stops: 0,
      basePriceINR: 6200,
      overnight: false
    },
    {
      airline: 'Akasa Air',
      flightNumber: 'QP 1354',
      airplane: 'Boeing 737 MAX 8',
      logo: 'https://www.gstatic.com/flights/airline_logos/70px/QP.png',
      depTime: '18:00',
      arrTime: '20:15',
      durationMin: 135,
      stops: 0,
      basePriceINR: 4999,
      overnight: false
    },
    {
      airline: 'SpiceJet',
      flightNumber: 'SG 8162',
      airplane: 'Boeing 737-700',
      logo: 'https://www.gstatic.com/flights/airline_logos/70px/SG.png',
      depTime: '21:10',
      arrTime: '23:35',
      durationMin: 145,
      stops: 0,
      basePriceINR: 4750,
      overnight: false
    },
    {
      airline: 'IndiGo (1 Stop)',
      flightNumber: '6E 521 / 6E 718',
      airplane: 'Airbus A320',
      logo: 'https://www.gstatic.com/flights/airline_logos/70px/6E.png',
      depTime: '11:00',
      arrTime: '15:45',
      durationMin: 285,
      stops: 1,
      layoverAirport: 'HYD',
      layoverDuration: 75,
      basePriceINR: 4200,
      overnight: false
    }
  ];

  const bestItems: FlightItem[] = mockTemplates.slice(0, 2).map((tpl, i) => {
    const bookingUrl = `https://www.google.com/travel/flights?q=Flights%20to%20${arrUpper}%20from%20${depUpper}%20on%20${outboundDate}`;
    return {
      id: `fb_best_${i}_${Date.now()}`,
      airline: tpl.airline,
      airline_logo: tpl.logo,
      flight_number: tpl.flightNumber,
      departure_airport: {
        id: depUpper,
        name: `${depUpper} Airport`,
        time: `${outboundDate} ${tpl.depTime}`
      },
      arrival_airport: {
        id: arrUpper,
        name: `${arrUpper} Airport`,
        time: `${outboundDate} ${tpl.arrTime}`
      },
      departure_time: `${outboundDate} ${tpl.depTime}`,
      arrival_time: `${outboundDate} ${tpl.arrTime}`,
      duration: tpl.durationMin,
      formatted_duration: formatDuration(tpl.durationMin),
      stops: tpl.stops,
      stops_label: tpl.stops === 0 ? 'Non-stop' : '1 stop',
      price: tpl.basePriceINR,
      formatted_price: formatPrice(tpl.basePriceINR, currency),
      currency: currency.toUpperCase(),
      travel_class: 'Economy',
      airplane: tpl.airplane,
      booking_link: bookingUrl,
      carbon_emissions: {
        this_flight: 95000,
        typical_for_this_route: 105000,
        difference_percent: -9
      },
      is_best_flight: true,
      overnight: tpl.overnight,
      extensions: ['Free carry-on included', 'USB in-seat power'],
      segments: [
        {
          departure_airport: { id: depUpper, name: `${depUpper} Airport`, time: `${outboundDate} ${tpl.depTime}` },
          arrival_airport: { id: arrUpper, name: `${arrUpper} Airport`, time: `${outboundDate} ${tpl.arrTime}` },
          duration: tpl.durationMin,
          formatted_duration: formatDuration(tpl.durationMin),
          airplane: tpl.airplane,
          airline: tpl.airline,
          airline_logo: tpl.logo,
          travel_class: 'Economy',
          flight_number: tpl.flightNumber
        }
      ]
    };
  });

  const otherItems: FlightItem[] = mockTemplates.slice(2).map((tpl, i) => {
    const bookingUrl = `https://www.google.com/travel/flights?q=Flights%20to%20${arrUpper}%20from%20${depUpper}%20on%20${outboundDate}`;
    return {
      id: `fb_other_${i}_${Date.now()}`,
      airline: tpl.airline,
      airline_logo: tpl.logo,
      flight_number: tpl.flightNumber,
      departure_airport: {
        id: depUpper,
        name: `${depUpper} Airport`,
        time: `${outboundDate} ${tpl.depTime}`
      },
      arrival_airport: {
        id: arrUpper,
        name: `${arrUpper} Airport`,
        time: `${outboundDate} ${tpl.arrTime}`
      },
      departure_time: `${outboundDate} ${tpl.depTime}`,
      arrival_time: `${outboundDate} ${tpl.arrTime}`,
      duration: tpl.durationMin,
      formatted_duration: formatDuration(tpl.durationMin),
      stops: tpl.stops,
      stops_label: tpl.stops === 0 ? 'Non-stop' : '1 stop',
      layovers: tpl.layoverAirport ? [{
        airport_id: tpl.layoverAirport,
        airport_name: `${tpl.layoverAirport} Airport`,
        duration: tpl.layoverDuration || 60,
        formatted_duration: formatDuration(tpl.layoverDuration || 60)
      }] : undefined,
      price: tpl.basePriceINR,
      formatted_price: formatPrice(tpl.basePriceINR, currency),
      currency: currency.toUpperCase(),
      travel_class: 'Economy',
      airplane: tpl.airplane,
      booking_link: bookingUrl,
      is_best_flight: false,
      overnight: tpl.overnight,
      segments: [
        {
          departure_airport: { id: depUpper, name: `${depUpper} Airport`, time: `${outboundDate} ${tpl.depTime}` },
          arrival_airport: { id: arrUpper, name: `${arrUpper} Airport`, time: `${outboundDate} ${tpl.arrTime}` },
          duration: tpl.durationMin,
          formatted_duration: formatDuration(tpl.durationMin),
          airplane: tpl.airplane,
          airline: tpl.airline,
          airline_logo: tpl.logo,
          travel_class: 'Economy',
          flight_number: tpl.flightNumber
        }
      ]
    };
  });

  return { best_flights: bestItems, other_flights: otherItems };
}

/**
 * Primary Google Flights search service via SerpApi
 * Engine: google_flights
 */
export async function searchGoogleFlights(
  params: GoogleFlightsQueryParams
): Promise<FlightSearchResponse> {
  const apiKey = (process.env.SERPAPI_API_KEY || '').replace(/["']/g, '').trim();

  const dep = (params.departure_id || '').trim().toUpperCase();
  const arr = (params.arrival_id || '').trim().toUpperCase();
  const outboundDate = (params.outbound_date || '').trim();
  const returnDate = params.return_date ? params.return_date.trim() : undefined;
  const currency = (params.currency || 'INR').trim().toUpperCase();
  const adults = params.adults ? Number(params.adults) || 1 : 1;

  // Determine flight type:
  // In SerpApi Google Flights: '1' = Round trip, '2' = One way
  let flightType = '2'; // default one-way
  if (params.type !== undefined && params.type !== null && params.type !== '') {
    flightType = String(params.type);
  } else if (returnDate && returnDate !== '') {
    flightType = '1';
  }

  // Build cache key
  const cacheKey = `flights:${dep}:${arr}:${outboundDate}:${returnDate || 'ow'}:${flightType}:${currency}:${adults}:${params.travel_class || '1'}:${params.stops || 'all'}`;
  const cached = getCachedFlightSearch(cacheKey);
  if (cached) {
    return cached;
  }

  // Check if API key exists
  if (!apiKey || apiKey === '' || apiKey.includes('YOUR_SERPAPI_KEY')) {
    console.warn('[SerpApi Flights] SERPAPI_API_KEY is not configured or is a placeholder. Using curated backup flights.');
    const fallback = getCuratedFallbackFlights(dep, arr, outboundDate, currency);
    return {
      success: true,
      best_flights: fallback.best_flights,
      other_flights: fallback.other_flights,
      total_count: fallback.best_flights.length + fallback.other_flights.length,
      search_metadata: {
        id: `mock_search_${Date.now()}`,
        status: 'Curated Fallback',
        created_at: new Date().toISOString(),
        google_flights_url: `https://www.google.com/travel/flights?q=Flights%20to%20${arr}%20from%20${dep}%20on%20${outboundDate}`
      },
      price_insights: {
        lowest_price: fallback.best_flights[0]?.price || 4999,
        price_level: 'typical',
        typical_price_range: [4500, 7500]
      },
      error: 'SERPAPI_API_KEY is not configured on the server. Showing curated route schedules.',
      cached: false,
      query: {
        departure_id: dep,
        arrival_id: arr,
        outbound_date: outboundDate,
        return_date: returnDate,
        type: flightType,
        currency,
        adults
      }
    };
  }

  try {
    const serpParams = new URLSearchParams({
      engine: 'google_flights',
      departure_id: dep,
      arrival_id: arr,
      outbound_date: outboundDate,
      type: flightType,
      currency: currency,
      hl: params.hl || 'en',
      gl: params.gl || 'in',
      api_key: apiKey
    });

    if (returnDate && flightType === '1') {
      serpParams.append('return_date', returnDate);
    }

    if (adults > 1) {
      serpParams.append('adults', String(adults));
    }

    if (params.travel_class) {
      serpParams.append('travel_class', String(params.travel_class));
    }

    if (params.stops !== undefined && params.stops !== null && params.stops !== '') {
      serpParams.append('stops', String(params.stops));
    }

    const url = `https://serpapi.com/search.json?${serpParams.toString()}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(18000) });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.warn(`[SerpApi Flights] HTTP ${response.status}:`, errorText.slice(0, 300));
      
      // If 400 from SerpApi, try to parse the error message
      let parsedError = `SerpApi flight search failed with status ${response.status}`;
      try {
        const errJson = JSON.parse(errorText);
        if (errJson.error) parsedError = errJson.error;
      } catch {
        // use default message
      }

      // Return graceful fallback so user can still see typical pricing and route information
      const fallback = getCuratedFallbackFlights(dep, arr, outboundDate, currency);
      return {
        success: true,
        best_flights: fallback.best_flights,
        other_flights: fallback.other_flights,
        total_count: fallback.best_flights.length + fallback.other_flights.length,
        search_metadata: {
          id: `fallback_${Date.now()}`,
          status: 'Fallback Schedule',
          created_at: new Date().toISOString(),
          google_flights_url: `https://www.google.com/travel/flights?q=Flights%20to%20${arr}%20from%20${dep}%20on%20${outboundDate}`
        },
        error: parsedError,
        cached: false,
        query: {
          departure_id: dep,
          arrival_id: arr,
          outbound_date: outboundDate,
          return_date: returnDate,
          type: flightType,
          currency,
          adults
        }
      };
    }

    const json = await response.json();

    if (json.error) {
      console.warn('[SerpApi Flights Notice]:', json.error);
      const fallback = getCuratedFallbackFlights(dep, arr, outboundDate, currency);
      return {
        success: true,
        best_flights: fallback.best_flights,
        other_flights: fallback.other_flights,
        total_count: fallback.best_flights.length + fallback.other_flights.length,
        search_metadata: {
          id: `fallback_${Date.now()}`,
          status: 'Fallback Schedule',
          created_at: new Date().toISOString(),
          google_flights_url: `https://www.google.com/travel/flights?q=Flights%20to%20${arr}%20from%20${dep}%20on%20${outboundDate}`
        },
        error: json.error,
        cached: false,
        query: {
          departure_id: dep,
          arrival_id: arr,
          outbound_date: outboundDate,
          return_date: returnDate,
          type: flightType,
          currency,
          adults
        }
      };
    }

    const googleFlightsUrl = json.search_metadata?.google_flights_url || 
      `https://www.google.com/travel/flights?q=Flights%20to%20${arr}%20from%20${dep}%20on%20${outboundDate}`;

    // Normalize best flights
    const rawBest = Array.isArray(json.best_flights) ? json.best_flights : [];
    const bestFlights: FlightItem[] = rawBest.map((f: any, idx: number) => 
      normalizeFlightItem(f, idx, true, currency, googleFlightsUrl)
    );

    // Normalize other flights
    const rawOther = Array.isArray(json.other_flights) ? json.other_flights : [];
    const otherFlights: FlightItem[] = rawOther.map((f: any, idx: number) => 
      normalizeFlightItem(f, idx, false, currency, googleFlightsUrl)
    );

    // If both arrays are empty, provide fallback
    if (bestFlights.length === 0 && otherFlights.length === 0) {
      const fallback = getCuratedFallbackFlights(dep, arr, outboundDate, currency);
      return {
        success: true,
        best_flights: fallback.best_flights,
        other_flights: fallback.other_flights,
        total_count: fallback.best_flights.length + fallback.other_flights.length,
        search_metadata: {
          id: json.search_metadata?.id || `search_${Date.now()}`,
          status: 'No live schedules found for chosen date; displaying typical scheduled routes',
          created_at: json.search_metadata?.created_at || new Date().toISOString(),
          google_flights_url: googleFlightsUrl
        },
        error: 'No direct flights available for the specified date and route. Showing standard schedules.',
        cached: false,
        query: {
          departure_id: dep,
          arrival_id: arr,
          outbound_date: outboundDate,
          return_date: returnDate,
          type: flightType,
          currency,
          adults
        }
      };
    }

    const priceInsightsRaw = json.price_insights || {};
    const priceInsights: FlightPriceInsights = {
      lowest_price: priceInsightsRaw.lowest_price,
      price_level: priceInsightsRaw.price_level,
      typical_price_range: priceInsightsRaw.typical_price_range,
      price_history: priceInsightsRaw.price_history
    };

    const searchMetadata: FlightSearchMetadata = {
      id: json.search_metadata?.id,
      status: json.search_metadata?.status || 'Success',
      created_at: json.search_metadata?.created_at,
      google_flights_url: googleFlightsUrl,
      total_time_taken: json.search_metadata?.total_time_taken
    };

    const finalResult: FlightSearchResponse = {
      success: true,
      best_flights: bestFlights,
      other_flights: otherFlights,
      total_count: bestFlights.length + otherFlights.length,
      search_metadata: searchMetadata,
      price_insights: priceInsights,
      airports: json.airports,
      error: null,
      cached: false,
      query: {
        departure_id: dep,
        arrival_id: arr,
        outbound_date: outboundDate,
        return_date: returnDate,
        type: flightType,
        currency,
        travel_class: params.travel_class ? String(params.travel_class) : undefined,
        adults,
        stops: params.stops ? String(params.stops) : undefined
      }
    };

    // Cache the successful live result
    setCachedFlightSearch(cacheKey, finalResult);

    return finalResult;
  } catch (err: any) {
    console.error('[SerpApi Flights Exception]:', err?.message || err);
    const fallback = getCuratedFallbackFlights(dep, arr, outboundDate, currency);
    return {
      success: true,
      best_flights: fallback.best_flights,
      other_flights: fallback.other_flights,
      total_count: fallback.best_flights.length + fallback.other_flights.length,
      search_metadata: {
        id: `err_fallback_${Date.now()}`,
        status: 'Curated Fallback',
        created_at: new Date().toISOString(),
        google_flights_url: `https://www.google.com/travel/flights?q=Flights%20to%20${arr}%20from%20${dep}%20on%20${outboundDate}`
      },
      error: 'Unable to reach live flight search service at this time. Displaying estimated route schedules.',
      cached: false,
      query: {
        departure_id: dep,
        arrival_id: arr,
        outbound_date: outboundDate,
        return_date: returnDate,
        type: flightType,
        currency,
        adults
      }
    };
  }
}
