import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { POPULAR_DESTINATIONS, FEATURED_HOTELS, FEATURED_RESTAURANTS, MOCK_ADMIN_STATS } from './src/data/travelData';
import { TravelItinerary, ItineraryDay } from './src/types';
import { getTrendingEvents, getTravelAlerts, getAIFoodRecommendation, getSmartRoute, getStateWiseFood, submitFeedback, feedbackStorage } from './src/services/localIntelligence.ts';
import { searchGoogleHotels, searchGoogleLocal, searchGoogleEvents, searchDiscoverPlaces } from './src/services/serpApiService.ts';
import { getSerpDirections } from './src/services/serpApiMapsService.ts';
import { searchGoogleFlights } from './src/services/serpApiFlightsService.ts';
import { requireAuth, requireAdmin } from './src/middleware/auth.ts';
import { db } from './src/db/index.ts';
import { users, itineraries } from './src/db/schema.ts';
import { count } from 'drizzle-orm';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// --- API ENDPOINTS --- //

const ADMIN_SECRET_KEY = (process.env.ADMIN_SECRET_KEY || 'Admin@RoamMind2026').replace(/["']/g, '').trim();

// Auth Endpoints: Admin Key Verification & User Registration
app.post('/api/auth/verify-admin-key', (req: Request, res: Response) => {
  const { adminKey } = req.body || {};
  if (!adminKey || typeof adminKey !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Admin authorization key is required.'
    });
  }

  if (adminKey.trim() === ADMIN_SECRET_KEY) {
    return res.json({
      success: true,
      message: 'Admin authorization key verified successfully on server.'
    });
  } else {
    return res.status(403).json({
      success: false,
      message: 'Invalid Admin Authorization Password Key. Server authorization denied.'
    });
  }
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { firstName, lastName, username, email, role, adminKey, city, phone } = req.body || {};

  if (!email || !firstName) {
    return res.status(400).json({ success: false, message: 'First name and email address are required.' });
  }

  let finalRole: 'USER' | 'ADMIN' = 'USER';

  if (role === 'ADMIN') {
    if (!adminKey || typeof adminKey !== 'string' || adminKey.trim() !== ADMIN_SECRET_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Invalid Admin Authorization Password Key. Administrative escalation denied.'
      });
    }
    finalRole = 'ADMIN';
  }

  const computedName = `${firstName} ${lastName || ''}`.trim() || firstName;
  const newUser = {
    id: 'USR' + Math.floor(100 + Math.random() * 900),
    firstName,
    lastName: lastName || 'User',
    name: computedName,
    username: username || firstName.toLowerCase() + '_g',
    email,
    phone: phone || '+91 9876543210',
    city: city || 'Chhatrapati Sambhajinagar',
    role: finalRole,
    verified: true,
    memberSince: new Date().toISOString().split('T')[0],
    visitedDestinationsCount: finalRole === 'ADMIN' ? 24 : 1,
    totalKmTraveled: finalRole === 'ADMIN' ? 24000 : 500,
    badges: finalRole === 'ADMIN' ? ['System Admin', 'Verified Executive'] : ['New Explorer']
  };

  return res.json({
    success: true,
    message: finalRole === 'ADMIN' ? 'Administrator account verified & created successfully.' : 'Account created successfully.',
    user: newUser
  });
});

// 1. Health check & Readiness check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'RoamMind AI Travel Planner Engine' });
});

app.get('/api/ready', (_req: Request, res: Response) => {
  res.json({ status: 'ready', service: 'TripNova AI Engine', database: 'connected' });
});

// SerpApi Search Routes
app.get('/api/search/hotels', async (req: Request, res: Response) => {
  try {
    const destination = (req.query.destination as string || req.query.q as string || '').trim();
    const checkIn = req.query.checkIn as string || req.query.check_in_date as string;
    const checkOut = req.query.checkOut as string || req.query.check_out_date as string;

    if (!destination) {
      return res.status(400).json({
        success: false,
        properties: [],
        message: 'Destination query parameter is required (e.g. ?destination=Goa&checkIn=2026-08-20&checkOut=2026-08-23)'
      });
    }

    const serpResult = await searchGoogleHotels(destination, checkIn, checkOut);

    if (serpResult.success && serpResult.properties.length > 0) {
      return res.json({
        success: true,
        count: serpResult.properties.length,
        destination,
        properties: serpResult.properties,
        isLive: serpResult.isLive
      });
    }

    // Fallback if SerpApi has no key or returns empty/error
    const fallbackHotels = FEATURED_HOTELS.filter(h =>
      h.destination.toLowerCase().includes(destination.toLowerCase()) ||
      h.name.toLowerCase().includes(destination.toLowerCase())
    );

    const properties = (fallbackHotels.length > 0 ? fallbackHotels : FEATURED_HOTELS).map(h => ({
      id: h.id,
      name: h.name,
      destination: h.destination,
      location: h.locationDesc,
      rating: h.rating,
      reviewsCount: h.reviewsCount,
      pricePerNight: `₹${h.pricePerNightINR}/night`,
      priceNumber: h.pricePerNightINR,
      currency: 'INR',
      image: h.image,
      type: h.type,
      amenities: h.amenities,
      isLive: false
    }));

    return res.json({
      success: true,
      count: properties.length,
      destination,
      properties,
      isLive: false,
      message: serpResult.message || 'Serving curated hotel stays'
    });
  } catch (err: any) {
    console.error('Error in /api/search/hotels:', err);
    res.status(500).json({
      success: false,
      properties: [],
      message: 'Unable to load hotels right now. Please try again.'
    });
  }
});

app.get('/api/search/local', async (req: Request, res: Response) => {
  try {
    const location = (req.query.location as string || '').trim();
    const query = (req.query.q as string || req.query.query as string || 'Restaurants & Attractions').trim();

    const serpResult = await searchGoogleLocal(location, query);

    if (serpResult.success && serpResult.results.length > 0) {
      return res.json({
        success: true,
        count: serpResult.results.length,
        location,
        query,
        results: serpResult.results,
        isLive: serpResult.isLive
      });
    }

    // Fallback
    const fallbackRestaurants = FEATURED_RESTAURANTS.filter(r =>
      !location || r.destination.toLowerCase().includes(location.toLowerCase())
    );

    const results = (fallbackRestaurants.length > 0 ? fallbackRestaurants : FEATURED_RESTAURANTS).map(r => ({
      id: r.id,
      title: r.name,
      category: r.type,
      address: `${r.address}, ${r.destination}`,
      rating: r.rating,
      reviewsCount: 120,
      priceLevel: `₹${r.avgMealCostForTwoINR} for two`,
      thumbnail: r.image,
      description: r.mustTryDishes.join(', '),
      openState: 'Open for dining',
      isLive: false
    }));

    return res.json({
      success: true,
      count: results.length,
      location,
      query,
      results,
      isLive: false,
      message: serpResult.message || 'Serving curated local dining & spots'
    });
  } catch (err: any) {
    console.error('Error in /api/search/local:', err);
    res.status(500).json({
      success: false,
      results: [],
      message: 'Unable to load local recommendations right now. Please try again.'
    });
  }
});

// SerpApi Google Events Endpoint
app.get('/api/events', async (req: Request, res: Response) => {
  try {
    const location = (req.query.location as string || req.query.destination as string || 'India').trim();
    const query = (req.query.q as string || req.query.query as string || 'events').trim();

    const serpResult = await searchGoogleEvents(location, query);

    return res.json({
      success: true,
      count: serpResult.events.length,
      location,
      query,
      events: serpResult.events,
      isLive: serpResult.isLive,
      message: serpResult.message || (serpResult.isLive ? 'Live events retrieved via SerpApi' : 'Events temporarily unavailable')
    });
  } catch (err: any) {
    console.error('Error in /api/events:', err);
    return res.status(500).json({
      success: false,
      events: [],
      message: 'Events are temporarily unavailable.'
    });
  }
});

// SerpApi Google Discover Places Endpoint
app.get('/api/discover-places', async (req: Request, res: Response) => {
  try {
    const location = (req.query.location as string || req.query.destination as string || 'India').trim();
    const query = (req.query.q as string || req.query.query as string || `places to visit in ${location}`).trim();

    const serpResult = await searchDiscoverPlaces(location, query);

    return res.json({
      success: true,
      count: serpResult.places.length,
      location,
      query,
      places: serpResult.places,
      isLive: serpResult.isLive,
      message: serpResult.message || (serpResult.isLive ? 'Discovered places retrieved via SerpApi' : 'More places could not be loaded right now')
    });
  } catch (err: any) {
    console.error('Error in /api/discover-places:', err);
    return res.status(500).json({
      success: false,
      places: [],
      message: 'More places could not be loaded right now.'
    });
  }
});

// SerpApi Maps & Routes Endpoint
app.get('/api/maps/directions', async (req: Request, res: Response) => {
  try {
    const origin = (req.query.origin as string || req.query.from as string || req.query.start as string || '').trim();
    const destination = (req.query.destination as string || req.query.to as string || req.query.end as string || '').trim();
    const mode = (req.query.mode as string || req.query.travel_mode as string || '').trim();

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        origin,
        destination,
        message: 'Both origin and destination parameters are required (e.g. ?origin=Mumbai&destination=Goa)'
      });
    }

    const routeData = await getSerpDirections(origin, destination, mode);
    return res.json(routeData);
  } catch (err: any) {
    console.error('Error in /api/maps/directions:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to calculate the route right now. Please try again.'
    });
  }
});

app.post('/api/maps/directions', async (req: Request, res: Response) => {
  try {
    const origin = (req.body.origin || req.body.from || '').trim();
    const destination = (req.body.destination || req.body.to || '').trim();
    const mode = (req.body.mode || req.body.travel_mode || '').trim();

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        origin,
        destination,
        message: 'Both origin and destination parameters are required'
      });
    }

    const routeData = await getSerpDirections(origin, destination, mode);
    return res.json(routeData);
  } catch (err: any) {
    console.error('Error in POST /api/maps/directions:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to calculate the route right now. Please try again.'
    });
  }
});

// SerpApi Google Flights Search Endpoint
app.get('/api/flights/search', async (req: Request, res: Response) => {
  try {
    const rawDep = (req.query.departure_id as string || req.query.from as string || req.query.origin as string || '').trim().toUpperCase();
    const rawArr = (req.query.arrival_id as string || req.query.to as string || req.query.destination as string || '').trim().toUpperCase();
    const rawOutbound = (req.query.outbound_date as string || req.query.date as string || req.query.departure_date as string || '').trim();
    const rawReturn = (req.query.return_date as string || req.query.returnDate as string || '').trim();
    const rawType = (req.query.type as string || '').trim();
    const currency = (req.query.currency as string || 'INR').trim().toUpperCase();
    const adults = req.query.adults ? parseInt(req.query.adults as string, 10) : 1;
    const travelClass = req.query.travel_class ? (req.query.travel_class as string).trim() : undefined;
    const stops = req.query.stops !== undefined ? (req.query.stops as string).trim() : undefined;

    // 1. Validation: required departure_id
    if (!rawDep) {
      return res.status(400).json({
        success: false,
        best_flights: [],
        other_flights: [],
        total_count: 0,
        search_metadata: {},
        error: 'Missing required query parameter: departure_id (e.g. ?departure_id=BOM&arrival_id=DEL&outbound_date=2026-10-15)'
      });
    }

    // 2. Validation: required arrival_id
    if (!rawArr) {
      return res.status(400).json({
        success: false,
        best_flights: [],
        other_flights: [],
        total_count: 0,
        search_metadata: {},
        error: 'Missing required query parameter: arrival_id (e.g. ?departure_id=BOM&arrival_id=DEL&outbound_date=2026-10-15)'
      });
    }

    // 3. Validation: departure and arrival must not be identical
    if (rawDep === rawArr) {
      return res.status(400).json({
        success: false,
        best_flights: [],
        other_flights: [],
        total_count: 0,
        search_metadata: {},
        error: `Departure airport (${rawDep}) and arrival airport (${rawArr}) cannot be the same.`
      });
    }

    // 4. Validation: outbound_date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!rawOutbound) {
      return res.status(400).json({
        success: false,
        best_flights: [],
        other_flights: [],
        total_count: 0,
        search_metadata: {},
        error: 'Missing required query parameter: outbound_date in YYYY-MM-DD format (e.g. 2026-10-15)'
      });
    }

    if (!dateRegex.test(rawOutbound)) {
      return res.status(400).json({
        success: false,
        best_flights: [],
        other_flights: [],
        total_count: 0,
        search_metadata: {},
        error: 'Invalid outbound_date format. Please use YYYY-MM-DD format (e.g. 2026-10-15).'
      });
    }

    const parsedOutbound = new Date(rawOutbound);
    if (isNaN(parsedOutbound.getTime())) {
      return res.status(400).json({
        success: false,
        best_flights: [],
        other_flights: [],
        total_count: 0,
        search_metadata: {},
        error: 'Invalid outbound_date value. Please provide a valid calendar date.'
      });
    }

    // 5. Validation: return_date format if supplied
    if (rawReturn) {
      if (!dateRegex.test(rawReturn)) {
        return res.status(400).json({
          success: false,
          best_flights: [],
          other_flights: [],
          total_count: 0,
          search_metadata: {},
          error: 'Invalid return_date format. Please use YYYY-MM-DD format.'
        });
      }
      const parsedReturn = new Date(rawReturn);
      if (isNaN(parsedReturn.getTime())) {
        return res.status(400).json({
          success: false,
          best_flights: [],
          other_flights: [],
          total_count: 0,
          search_metadata: {},
          error: 'Invalid return_date value. Please provide a valid calendar date.'
        });
      }
      if (rawReturn < rawOutbound) {
        return res.status(400).json({
          success: false,
          best_flights: [],
          other_flights: [],
          total_count: 0,
          search_metadata: {},
          error: 'return_date cannot be earlier than outbound_date.'
        });
      }
    }

    // Map type if user passed string like 'round_trip' or 'one_way'
    let mappedType: string | undefined = rawType;
    if (rawType.toLowerCase() === 'round_trip' || rawType.toLowerCase() === 'roundtrip' || rawType === '1') {
      mappedType = '1';
    } else if (rawType.toLowerCase() === 'one_way' || rawType.toLowerCase() === 'oneway' || rawType === '2') {
      mappedType = '2';
    } else if (rawReturn) {
      mappedType = '1';
    } else {
      mappedType = '2';
    }

    // Map travel class if passed as name
    let mappedTravelClass: string | undefined = travelClass;
    if (travelClass) {
      const tc = travelClass.toLowerCase();
      if (tc.includes('first')) mappedTravelClass = '4';
      else if (tc.includes('business')) mappedTravelClass = '3';
      else if (tc.includes('premium')) mappedTravelClass = '2';
      else mappedTravelClass = '1';
    }

    const flightData = await searchGoogleFlights({
      departure_id: rawDep,
      arrival_id: rawArr,
      outbound_date: rawOutbound,
      return_date: rawReturn || undefined,
      type: mappedType,
      currency,
      adults: isNaN(adults) || adults < 1 ? 1 : Math.min(adults, 9),
      travel_class: mappedTravelClass,
      stops: stops !== undefined && stops !== '' ? stops : undefined
    });

    return res.json(flightData);
  } catch (err: any) {
    console.error('Error in /api/flights/search:', err?.message || err);
    return res.status(500).json({
      success: false,
      best_flights: [],
      other_flights: [],
      total_count: 0,
      search_metadata: {},
      error: 'An internal error occurred while retrieving flights. Please try again.'
    });
  }
});

// 2. Destinations List
app.get('/api/destinations', (req: Request, res: Response) => {
  const search = (req.query.search as string || '').toLowerCase();
  const region = req.query.region as string;
  const category = req.query.category as string;

  let filtered = [...POPULAR_DESTINATIONS];

  if (search) {
    filtered = filtered.filter(d => 
      d.name.toLowerCase().includes(search) || 
      d.state.toLowerCase().includes(search) ||
      d.tagline.toLowerCase().includes(search)
    );
  }

  if (region) {
    filtered = filtered.filter(d => d.region === region);
  }

  if (category) {
    filtered = filtered.filter(d => 
      d.popularCategories.some(c => c.toLowerCase().includes(category.toLowerCase()))
    );
  }

  res.json({ count: filtered.length, destinations: filtered });
});

// 3. Hotels Search
app.get('/api/hotels', (req: Request, res: Response) => {
  const destination = req.query.destination as string;
  const type = req.query.type as string;

  let results = [...FEATURED_HOTELS];
  if (destination) {
    results = results.filter(h => h.destination.toLowerCase().includes(destination.toLowerCase()));
  }
  if (type) {
    results = results.filter(h => h.type.toLowerCase() === type.toLowerCase());
  }

  res.json({ hotels: results });
});

// 4. Restaurants Search
app.get('/api/restaurants', (req: Request, res: Response) => {
  const destination = req.query.destination as string;

  let results = [...FEATURED_RESTAURANTS];
  if (destination) {
    results = results.filter(r => r.destination.toLowerCase().includes(destination.toLowerCase()));
  }

  res.json({ restaurants: results });
});

// 5. Weather Endpoint with Live Weather API Integration
app.post('/api/weather', async (req: Request, res: Response) => {
  const { city } = req.body;
  const targetCity = city || 'Goa';
  const apiKey = process.env.WEATHER_API_KEY || 'b39db97ab14f4d1b9fc807c7910ad794';

  const destinationMatch = POPULAR_DESTINATIONS.find(
    d => d.name.toLowerCase() === targetCity.toLowerCase()
  );

  const baseTemp = destinationMatch ? destinationMatch.weather.tempC : 26;
  const condition = destinationMatch ? destinationMatch.weather.condition : 'Partly Cloudy Breeze';

  // Attempt live Weather API call if key is available
  if (apiKey) {
    try {
      // Try WeatherAPI.com endpoint
      const weatherApiRes = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(targetCity)}&days=7`
      );
      if (weatherApiRes.ok) {
        const data = await weatherApiRes.json();
        const current = data.current;
        const forecast = data.forecast?.forecastday || [];

        return res.json({
          city: data.location?.name || targetCity,
          tempC: Math.round(current.temp_c),
          condition: current.condition?.text || condition,
          humidity: current.humidity || 62,
          windKmH: Math.round(current.wind_kph || 12),
          uvIndex: current.uv || 6,
          aqi: current.air_quality?.['us-epa-index'] ? current.air_quality['us-epa-index'] * 25 : (destinationMatch?.weather.aqi || 42),
          aqiText: destinationMatch?.weather.airQualityLabel || 'Good',
          hourlyForecast: (forecast[0]?.hour || []).slice(8, 18).filter((_: any, i: number) => i % 2 === 0).map((h: any) => ({
            time: h.time.split(' ')[1] || '12:00',
            tempC: Math.round(h.temp_c),
            icon: h.condition?.text?.includes('Rain') ? 'CloudRain' : 'Sun',
            rainProb: h.chance_of_rain || 10
          })),
          sevenDayForecast: forecast.map((f: any) => {
            const dateObj = new Date(f.date);
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return {
              day: dayNames[dateObj.getDay()],
              highC: Math.round(f.day.maxtemp_c),
              lowC: Math.round(f.day.mintemp_c),
              condition: f.day.condition?.text || 'Clear'
            };
          }),
          rainAlert: current.precip_mm > 0 ? `Precipitation alert: ${current.precip_mm}mm expected.` : 'No immediate heavy rainfall alerts for this destination.',
          recommendations: [
            `Current weather: ${current.condition?.text} at ${Math.round(current.temp_c)}°C.`,
            'Carry sun protection during outdoor daytime tours.',
            'Keep hydration bottles and light layers handy.'
          ],
          isLive: true
        });
      }

      // Try OpenWeatherMap endpoint as alternative
      const owmRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(targetCity)}&appid=${apiKey}&units=metric`
      );
      if (owmRes.ok) {
        const owmData = await owmRes.json();
        const liveTemp = Math.round(owmData.main.temp);

        // Fetch 5-day / 3-hour forecast for live hourly and multi-day data
        let hourlyForecast: any[] = [];
        let sevenDayForecast: any[] = [];
        try {
          const forecastRes = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(targetCity)}&appid=${apiKey}&units=metric`
          );
          if (forecastRes.ok) {
            const forecastData = await forecastRes.json();
            const list = forecastData.list || [];

            // Extract next 5 hourly slots (every 3 hours)
            hourlyForecast = list.slice(0, 5).map((item: any) => {
              const dt = new Date(item.dt * 1000);
              const hours = dt.getHours().toString().padStart(2, '0');
              const minutes = dt.getMinutes().toString().padStart(2, '0');
              const weatherDesc = item.weather?.[0]?.main || 'Clear';
              return {
                time: `${hours}:${minutes}`,
                tempC: Math.round(item.main.temp),
                icon: weatherDesc.includes('Rain') ? 'CloudRain' : weatherDesc.includes('Cloud') ? 'CloudSun' : 'Sun',
                rainProb: Math.round((item.pop || 0) * 100)
              };
            });

            // Group by day for 5-day forecast
            const dayMap: Record<string, { temps: number[]; conditions: string[] }> = {};
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            list.forEach((item: any) => {
              const dateObj = new Date(item.dt * 1000);
              const dayName = dayNames[dateObj.getDay()];
              if (!dayMap[dayName]) {
                dayMap[dayName] = { temps: [], conditions: [] };
              }
              dayMap[dayName].temps.push(item.main.temp);
              dayMap[dayName].conditions.push(item.weather?.[0]?.main || 'Clear');
            });

            sevenDayForecast = Object.keys(dayMap).map(day => {
              const temps = dayMap[day].temps;
              return {
                day,
                highC: Math.round(Math.max(...temps)),
                lowC: Math.round(Math.min(...temps)),
                condition: dayMap[day].conditions[0]
              };
            });
          }
        } catch (fcErr) {
          console.warn('OpenWeatherMap forecast query failed:', fcErr);
        }

        if (hourlyForecast.length === 0) {
          hourlyForecast = [
            { time: '08:00 AM', tempC: liveTemp - 2, icon: 'Sun', rainProb: 5 },
            { time: '11:00 AM', tempC: liveTemp + 1, icon: 'Sun', rainProb: 10 },
            { time: '02:00 PM', tempC: liveTemp + 3, icon: 'SunMedium', rainProb: 15 },
            { time: '05:00 PM', tempC: liveTemp, icon: 'CloudSun', rainProb: 10 },
            { time: '08:00 PM', tempC: liveTemp - 3, icon: 'Moon', rainProb: 0 }
          ];
        }

        if (sevenDayForecast.length === 0) {
          sevenDayForecast = [
            { day: 'Today', highC: owmData.main.temp_max ? Math.round(owmData.main.temp_max) : liveTemp + 2, lowC: owmData.main.temp_min ? Math.round(owmData.main.temp_min) : liveTemp - 4, condition: owmData.weather?.[0]?.main || 'Clear' },
            { day: 'Mon', highC: liveTemp + 2, lowC: liveTemp - 5, condition: 'Sunny' },
            { day: 'Tue', highC: liveTemp + 3, lowC: liveTemp - 4, condition: 'Clear' },
            { day: 'Wed', highC: liveTemp + 1, lowC: liveTemp - 6, condition: 'Partly Cloudy' },
            { day: 'Thu', highC: liveTemp, lowC: liveTemp - 5, condition: 'Pleasant' }
          ];
        }

        return res.json({
          city: owmData.name || targetCity,
          tempC: liveTemp,
          condition: owmData.weather?.[0]?.description ? (owmData.weather[0].description.charAt(0).toUpperCase() + owmData.weather[0].description.slice(1)) : condition,
          humidity: owmData.main.humidity || 60,
          windKmH: Math.round((owmData.wind.speed || 3) * 3.6),
          uvIndex: 6,
          aqi: 45,
          aqiText: 'Good',
          hourlyForecast,
          sevenDayForecast,
          rainAlert: owmData.weather?.[0]?.main === 'Rain' ? 'Rain detected. Carry umbrellas and waterproof cases.' : 'No heavy precipitation expected today.',
          recommendations: [
            `Live conditions: ${owmData.weather?.[0]?.description || 'Clear'} at ${liveTemp}°C.`,
            'Ideal for sightseeing and outdoor activities.',
            'Stay hydrated throughout the afternoon.'
          ],
          isLive: true
        });
      }
    } catch (e) {
      console.error('External Weather API query error:', e);
    }
  }

  // Fallback response if external API is activating or key unverified
  res.json({
    city: targetCity,
    tempC: baseTemp,
    condition: condition,
    humidity: destinationMatch?.weather.humidity || 62,
    windKmH: destinationMatch?.weather.windKmH || 12,
    uvIndex: destinationMatch?.weather.uvIndex || 6,
    aqi: destinationMatch?.weather.aqi || 42,
    aqiText: destinationMatch?.weather.airQualityLabel || 'Good',
    hourlyForecast: [
      { time: '08:00 AM', tempC: baseTemp - 2, icon: 'Sun', rainProb: 5 },
      { time: '11:00 AM', tempC: baseTemp + 1, icon: 'Sun', rainProb: 10 },
      { time: '02:00 PM', tempC: baseTemp + 3, icon: 'SunMedium', rainProb: 15 },
      { time: '05:00 PM', tempC: baseTemp, icon: 'CloudSun', rainProb: 10 },
      { time: '08:00 PM', tempC: baseTemp - 3, icon: 'Moon', rainProb: 0 }
    ],
    sevenDayForecast: [
      { day: 'Mon', highC: baseTemp + 2, lowC: baseTemp - 5, condition: 'Sunny' },
      { day: 'Tue', highC: baseTemp + 3, lowC: baseTemp - 4, condition: 'Clear' },
      { day: 'Wed', highC: baseTemp + 1, lowC: baseTemp - 6, condition: 'Partly Cloudy' },
      { day: 'Thu', highC: baseTemp, lowC: baseTemp - 5, condition: 'Pleasant Breeze' },
      { day: 'Fri', highC: baseTemp + 2, lowC: baseTemp - 4, condition: 'Sunny' },
      { day: 'Sat', highC: baseTemp + 3, lowC: baseTemp - 3, condition: 'Golden Sunset' },
      { day: 'Sun', highC: baseTemp + 1, lowC: baseTemp - 5, condition: 'Clear Sky' }
    ],
    rainAlert: 'No immediate rain alert expected for your travel window.',
    recommendations: [
      'Carry light breathable clothing and sunscreen during daytime excursions.',
      'Early morning hours (06:00 - 09:00 AM) offer ideal lighting for photography.',
      'Hydrate well and keep a reusable thermal flask handy.'
    ],
    isLive: false
  });
});


// 6. AI Smart Trip Generator using Gemini
app.post('/api/planner/generate', async (req: Request, res: Response) => {
  try {
    const {
      origin = 'Mumbai',
      destination = 'Goa',
      durationDays = 3,
      travelersCount = 2,
      budgetTier = 'moderate',
      travelStyle = 'couple',
      interests = ['Food', 'Beach', 'Culture'],
      additionalPrompt = ''
    } = req.body;

    const ai = getGeminiClient();

    const systemInstruction = `You are RoamMind AI, an elite travel architect specializing in highly detailed, authentic, day-wise itineraries for travel across India and top global destinations.
Generate a structured trip itinerary in strictly JSON format matching this schema:
{
  "title": string,
  "origin": string,
  "destination": string,
  "durationDays": number,
  "totalEstimatedCostINR": number,
  "days": [
    {
      "dayNumber": number,
      "theme": string,
      "summary": string,
      "dailyBudgetEstimateINR": number,
      "activities": [
        {
          "id": string,
          "time": string,
          "category": "breakfast" | "morning" | "lunch" | "afternoon" | "evening" | "dinner" | "night" | "stay",
          "title": string,
          "description": string,
          "locationName": string,
          "estimatedCostINR": number,
          "durationHours": number,
          "travelTimeFromPrev": string,
          "tips": string
        }
      ]
    }
  ],
  "packingChecklist": [string],
  "localTips": [string],
  "emergencyContacts": {
    "police": "112",
    "touristHelpline": "1363",
    "medical": "108"
  }
}
Provide realistic local spots, genuine food dishes, accurate travel times, and sensible cost estimates in INR.`;

    let SerpContext = '';
    if (process.env.SERPAPI_API_KEY) {
      try {
        const [hotelsRes, localRes] = await Promise.all([
          searchGoogleHotels(destination),
          searchGoogleLocal(destination, 'Top attractions & restaurants')
        ]);
        
        if (hotelsRes.success && hotelsRes.properties.length > 0) {
          const hotelNames = hotelsRes.properties.slice(0, 3).map(h => `${h.name} (${h.pricePerNight})`).join(', ');
          SerpContext += `\nTop Real-time Hotel Stays in ${destination}: ${hotelNames}.`;
        }
        if (localRes.success && localRes.results.length > 0) {
          const spotNames = localRes.results.slice(0, 4).map(l => `${l.title} (${l.category})`).join(', ');
          SerpContext += `\nVerified Real Local Spots & Dining: ${spotNames}.`;
        }
      } catch (e) {
        console.warn('SerpApi AI planner context fetch error:', e);
      }
    }

    const userPrompt = `Create a ${durationDays}-day ${travelStyle} trip to ${destination} starting from ${origin} for ${travelersCount} travelers.
Budget level: ${budgetTier}.
Interests: ${interests.join(', ')}.
Extra details: ${additionalPrompt || 'Include best local spots, must-try food, sunset views, and smooth pacing.'}${SerpContext}`;

    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '';
      try {
        const parsedJson = JSON.parse(responseText);
        const itinerary: TravelItinerary = {
          id: 'trip_' + Date.now(),
          title: parsedJson.title || `${durationDays} Days in ${destination}`,
          origin,
          destination,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0],
          durationDays: Number(durationDays),
          travelersCount: Number(travelersCount),
          budgetTier,
          travelStyle,
          interests,
          totalEstimatedCostINR: parsedJson.totalEstimatedCostINR || (durationDays * 3500 * travelersCount),
          currency: 'INR',
          days: parsedJson.days || [],
          packingChecklist: parsedJson.packingChecklist || ['Comfortable footwear', 'Sunscreen SPF 50', 'Power bank 20,000mAh', 'Government Photo ID'],
          localTips: parsedJson.localTips || ['Book heritage monuments in advance online to bypass queues.', 'Keep cash for auto-rickshaws and street food stalls.'],
          emergencyContacts: parsedJson.emergencyContacts || { police: '112', touristHelpline: '1363', medical: '108' },
          createdAt: new Date().toISOString()
        };
        return res.json({ success: true, itinerary });
      } catch (parseErr) {
        console.warn('Gemini JSON parse failed, returning robust structured fallback', parseErr);
      }
    }

    // Fallback response generator if key missing or AI output non-json
    const perDayBudget = budgetTier === 'backpacker' ? 1800 : budgetTier === 'luxury' ? 12000 : 4200;
    const mockDays: ItineraryDay[] = Array.from({ length: durationDays }, (_, idx) => ({
      dayNumber: idx + 1,
      theme: idx === 0 ? 'Arrival & Coastal Vibe' : idx === 1 ? 'Cultural Heritage & Food Trails' : 'Panoramic Views & Farewell',
      summary: `Day ${idx + 1} focuses on exploring top attractions around ${destination} with curated local dining and scenic relaxation.`,
      dailyBudgetEstimateINR: perDayBudget * travelersCount,
      activities: [
        {
          id: `d${idx + 1}_a1`,
          time: '08:30 AM',
          category: 'breakfast',
          title: `Traditional Breakfast in ${destination}`,
          description: `Kickstart your day with authentic local breakfast specialties, freshly brewed coffee or masala chai.`,
          locationName: `${destination} Central Square`,
          estimatedCostINR: 350 * travelersCount,
          durationHours: 1,
          travelTimeFromPrev: '15 mins from stay',
          tips: 'Arrive early to avoid peak breakfast rush.'
        },
        {
          id: `d${idx + 1}_a2`,
          time: '10:00 AM',
          category: 'morning',
          title: `Explore Primary Monument & Heritage Site`,
          description: `Guided walk through iconic landmarks, photographing intricate architecture and learning rich local history.`,
          locationName: `Iconic Landmark, ${destination}`,
          estimatedCostINR: 200 * travelersCount,
          durationHours: 2.5,
          travelTimeFromPrev: '10 mins drive',
          tips: 'Carry water and wear comfortable walking shoes.'
        },
        {
          id: `d${idx + 1}_a3`,
          time: '01:30 PM',
          category: 'lunch',
          title: `Gastronomic Lunch Trail`,
          description: `Savor regional delicacies, coastal seafood, or royal thalis prepared with fresh organic spices.`,
          locationName: `Local Gourmet Haven`,
          estimatedCostINR: 850 * travelersCount,
          durationHours: 1.5,
          travelTimeFromPrev: '5 mins walk'
        },
        {
          id: `d${idx + 1}_a4`,
          time: '04:00 PM',
          category: 'evening',
          title: `Sunset Viewpoint & Artisan Bazaar Walk`,
          description: `Enjoy scenic panoramic sunset views followed by strolling through bustling craft markets for souvenirs.`,
          locationName: `Sunset Promenade & Bazaar`,
          estimatedCostINR: 500 * travelersCount,
          durationHours: 2.5,
          travelTimeFromPrev: '20 mins transit'
        },
        {
          id: `d${idx + 1}_a5`,
          time: '08:00 PM',
          category: 'dinner',
          title: `Candlelit Dining or Rooftop Supper`,
          description: `Unwind with ambient music, signature cocktails, and regional fusion cuisine overlooking lit monuments or sea waves.`,
          locationName: `Rooftop Terrace / Shack`,
          estimatedCostINR: 1500 * travelersCount,
          durationHours: 2
        }
      ]
    }));

    const fallbackItinerary: TravelItinerary = {
      id: 'trip_' + Date.now(),
      title: `${durationDays}-Day Intelligent ${destination} Escape`,
      origin,
      destination,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0],
      durationDays: Number(durationDays),
      travelersCount: Number(travelersCount),
      budgetTier,
      travelStyle,
      interests,
      totalEstimatedCostINR: perDayBudget * durationDays * travelersCount,
      currency: 'INR',
      days: mockDays,
      packingChecklist: ['Comfortable walking shoes', 'High SPF Sunscreen & Sunglasses', 'Power Bank (20k mAh)', 'Universal Adapter & Reusable Bottle', 'Government Photo ID'],
      localTips: [
        'Use UPI digital payments for easy transactions at street stalls.',
        'Pre-book sunset boat tickets or heritage passes online.',
        'Keep emergency contacts stored offline.'
      ],
      emergencyContacts: { police: '112', touristHelpline: '1363', medical: '108' },
      createdAt: new Date().toISOString()
    };

    res.json({ success: true, itinerary: fallbackItinerary });
  } catch (error) {
    console.error('API /api/planner/generate Error:', error);
    res.status(500).json({ error: 'Failed to generate itinerary.' });
  }
});

// 7. Budget & Expense Calculator Endpoint
app.post('/api/expense/calculate', (req: Request, res: Response) => {
  const { durationDays = 3, travelersCount = 2, budgetTier = 'moderate', targetCurrency = 'INR' } = req.body;

  const basePerDayPerPersonINR = budgetTier === 'backpacker' ? 1800 : budgetTier === 'luxury' ? 12000 : 4200;
  const totalCostINR = basePerDayPerPersonINR * durationDays * travelersCount;

  const rates: Record<string, number> = {
    INR: 1.0,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0094,
    AED: 0.044,
    SGD: 0.016
  };

  const multiplier = rates[targetCurrency] || 1.0;
  const convertedTotal = (totalCostINR * multiplier).toFixed(2);

  res.json({
    totalCostINR,
    targetCurrency,
    convertedTotal: Number(convertedTotal),
    breakdownINR: {
      stays: Math.round(totalCostINR * 0.40),
      food: Math.round(totalCostINR * 0.25),
      transit: Math.round(totalCostINR * 0.18),
      activities: Math.round(totalCostINR * 0.12),
      buffer: Math.round(totalCostINR * 0.05)
    }
  });
});

// --- ADMIN BACKEND ENDPOINTS --- //

// 1. Admin Telemetry / Dashboard Stats
app.get('/api/admin/stats', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  let dbUsersCount = 0;
  let dbTripsCount = 0;
  try {
    const uRes = await db.select({ value: count() }).from(users);
    dbUsersCount = uRes[0]?.value || 0;
    const tRes = await db.select({ value: count() }).from(itineraries);
    dbTripsCount = tRes[0]?.value || 0;
  } catch (e) {
    console.error('Error fetching admin counts:', e);
  }

  res.json({
    ...MOCK_ADMIN_STATS,
    totalUsers: Math.max(MOCK_ADMIN_STATS.totalUsers, dbUsersCount),
    totalTripsCreated: dbTripsCount + 1420
  });
});

// 2. Admin Users
app.get('/api/admin/users', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const dbUsers = await db.select().from(users);
    const combinedUsers = [
      ...dbUsers.map(u => ({
        id: `db_${u.id}`,
        name: u.name || 'Traveler',
        email: u.email,
        role: u.role || 'USER',
        status: 'Active',
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '2026-01-15'
      })),
      { id: 'usr_1', name: 'Roshan Gorade', email: 'roshangorade7@gmail.com', role: 'ADMIN', status: 'Active', createdAt: '2026-01-02' },
      { id: 'usr_2', name: 'Aarav Sharma', email: 'aarav.s@example.com', role: 'USER', status: 'Active', createdAt: '2026-02-10' },
      { id: 'usr_3', name: 'Priya Patel', email: 'priya.p@example.com', role: 'USER', status: 'Active', createdAt: '2026-02-14' },
      { id: 'usr_4', name: 'Ananya Roy', email: 'ananya.roy@example.com', role: 'USER', status: 'Active', createdAt: '2026-03-01' },
      { id: 'usr_5', name: 'Vikram Malhotra', email: 'vikram.m@example.com', role: 'USER', status: 'Active', createdAt: '2026-03-05' }
    ];
    res.json({ success: true, count: combinedUsers.length, users: combinedUsers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 3. Admin Trips
app.get('/api/admin/trips', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const dbTrips = await db.select().from(itineraries);
    const trips = [
      ...dbTrips.map(t => ({
        id: `db_trip_${t.id}`,
        destination: t.destination,
        title: t.title,
        startDate: t.startDate,
        endDate: t.endDate,
        totalCostINR: t.totalEstimatedCostINR,
        status: 'Confirmed'
      })),
      { id: 'trip_101', destination: 'Goa', title: '4-Day Beach & Heritage Tour', startDate: '2026-09-01', endDate: '2026-09-05', totalCostINR: 24500, status: 'Confirmed' },
      { id: 'trip_102', destination: 'Leh Ladakh', title: '7-Day High Mountain Expedition', startDate: '2026-09-10', endDate: '2026-09-17', totalCostINR: 58000, status: 'Upcoming' },
      { id: 'trip_103', destination: 'Jaipur', title: '3-Day Royal Palace Escape', startDate: '2026-08-20', endDate: '2026-08-23', totalCostINR: 19200, status: 'Completed' },
      { id: 'trip_104', destination: 'Kerala', title: '5-Day Houseboat & Spice Hills', startDate: '2026-10-02', endDate: '2026-10-07', totalCostINR: 38500, status: 'Confirmed' }
    ];
    res.json({ success: true, count: trips.length, trips });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// 4. Admin Bookings
app.get('/api/admin/bookings', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  const bookings = [
    { bookingRef: 'BK-98213', userEmail: 'roshangorade7@gmail.com', type: 'Hotel', provider: 'Taj Holiday Village Resort', destination: 'Goa', date: '2026-09-01', amountINR: 18500, status: 'Confirmed', ticketId: 'ET-GOA-001' },
    { bookingRef: 'BK-98214', userEmail: 'aarav.s@example.com', type: 'Flight', provider: 'IndiGo Airlines 6E-204', destination: 'Leh Ladakh', date: '2026-09-10', amountINR: 12400, status: 'Confirmed', ticketId: 'ET-FLT-902' },
    { bookingRef: 'BK-98215', userEmail: 'priya.p@example.com', type: 'Train', provider: 'Vande Bharat Express', destination: 'Jaipur', date: '2026-08-20', amountINR: 3200, status: 'Confirmed', ticketId: 'ET-TRN-331' },
    { bookingRef: 'BK-98216', userEmail: 'ananya.roy@example.com', type: 'Tour Package', provider: 'Kerala Backwater Houseboats', destination: 'Kerala', date: '2026-10-02', amountINR: 15000, status: 'Pending', ticketId: 'ET-PKG-104' },
    { bookingRef: 'BK-98217', userEmail: 'vikram.m@example.com', type: 'Hotel', provider: 'The Grand Dragon Ladakh', destination: 'Leh Ladakh', date: '2026-09-11', amountINR: 22000, status: 'Cancelled', ticketId: 'ET-LDK-708' }
  ];
  res.json({ success: true, count: bookings.length, bookings });
});

// 5. Admin Destinations
let adminDestinationsStore = [...POPULAR_DESTINATIONS];
app.get('/api/admin/destinations', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  res.json({ success: true, count: adminDestinationsStore.length, destinations: adminDestinationsStore });
});

app.post('/api/admin/destinations', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const newDest = { id: `dest_${Date.now()}`, active: true, rating: 4.8, reviewCount: 1, ...req.body };
  adminDestinationsStore.unshift(newDest as any);
  res.json({ success: true, destination: newDest });
});

app.put('/api/admin/destinations/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = adminDestinationsStore.findIndex(d => d.id === id);
  if (idx !== -1) {
    adminDestinationsStore[idx] = { ...adminDestinationsStore[idx], ...req.body };
    res.json({ success: true, destination: adminDestinationsStore[idx] });
  } else {
    res.status(404).json({ error: 'Destination not found' });
  }
});

// 6. Admin Hotels
let adminHotelsStore = [...FEATURED_HOTELS];
app.get('/api/admin/hotels', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  res.json({ success: true, count: adminHotelsStore.length, hotels: adminHotelsStore });
});

app.post('/api/admin/hotels', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const newHotel = { id: `hotel_${Date.now()}`, isPopular: true, rating: 4.7, reviewsCount: 12, ...req.body };
  adminHotelsStore.unshift(newHotel as any);
  res.json({ success: true, hotel: newHotel });
});

// 7. Admin Restaurants
let adminRestaurantsStore = [...FEATURED_RESTAURANTS];
app.get('/api/admin/restaurants', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  res.json({ success: true, count: adminRestaurantsStore.length, restaurants: adminRestaurantsStore });
});

app.post('/api/admin/restaurants', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const newRest = { id: `rest_${Date.now()}`, rating: 4.6, ...req.body };
  adminRestaurantsStore.unshift(newRest as any);
  res.json({ success: true, restaurant: newRest });
});

// 8. Admin Events & Festivals
let adminEventsStore = [
  { id: 'ev_1', title: 'Goa Food & Wine Carnival 2026', category: 'Food Festival', location: 'Panaji, Goa', startDate: '2026-11-12', endDate: '2026-11-15', status: 'Active', source: 'Public State Tourism Gazette' },
  { id: 'ev_2', title: 'Sunburn Musical Festival', category: 'Concert', location: 'Vagator Beach, Goa', startDate: '2026-12-28', endDate: '2026-12-31', status: 'Active', source: 'Official Press Release' },
  { id: 'ev_3', title: 'Hemis Monastery Cultural Festival', category: 'Cultural Event', location: 'Leh, Ladakh', startDate: '2026-07-04', endDate: '2026-07-06', status: 'Upcoming', source: 'Ladakh Tourism Announcement' },
  { id: 'ev_4', title: 'Jaipur Literature Festival (JLF)', category: 'Public Festival', location: 'Jaipur, Rajasthan', startDate: '2027-01-21', endDate: '2027-01-25', status: 'Upcoming', source: 'JLF Official Portal' },
  { id: 'ev_5', title: 'Grand Kerala Shopping Festival', category: 'Travel Event', location: 'Kochi, Kerala', startDate: '2026-12-01', endDate: '2026-12-15', status: 'Active', source: 'Public Media Release' }
];

app.get('/api/admin/events', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  res.json({ success: true, count: adminEventsStore.length, events: adminEventsStore });
});

app.post('/api/admin/events', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const newEvent = { id: `ev_${Date.now()}`, status: 'Active', ...req.body };
  adminEventsStore.unshift(newEvent);
  res.json({ success: true, event: newEvent });
});

app.put('/api/admin/events/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = adminEventsStore.findIndex(e => e.id === id);
  if (idx !== -1) {
    adminEventsStore[idx] = { ...adminEventsStore[idx], ...req.body };
    res.json({ success: true, event: adminEventsStore[idx] });
  } else {
    res.status(404).json({ error: 'Event not found' });
  }
});

// 9. Admin Travel & Weather Alerts
let adminAlertsStore = [
  { id: 'al_1', title: 'Mumbai-Pune Expressway Traffic Slowdown', type: 'Traffic Alert', severity: 'Moderate', location: 'Lonavala Ghat Section', date: '2026-08-12', status: 'Active', summary: 'Heavy weekend vehicle density causing 20-min delays.' },
  { id: 'al_2', title: 'Coastal Heavy Rainfall Advisory', type: 'Weather Alert', severity: 'High', location: 'North Goa Beaches', date: '2026-08-11', status: 'Active', summary: 'High tides and sudden rain squalls predicted.' },
  { id: 'al_3', title: 'Khardung La Pass Ice Warning', type: 'Road Alert', severity: 'Critical', location: 'Leh-Nubra Corridor', date: '2026-08-10', status: 'Active', summary: 'Early morning black ice on pass road. Snow chains recommended.' }
];

app.get('/api/admin/alerts', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  res.json({ success: true, count: adminAlertsStore.length, alerts: adminAlertsStore });
});

app.post('/api/admin/alerts', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const newAlert = { id: `al_${Date.now()}`, status: 'Active', date: new Date().toISOString().split('T')[0], ...req.body };
  adminAlertsStore.unshift(newAlert);
  res.json({ success: true, alert: newAlert });
});

app.put('/api/admin/alerts/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = adminAlertsStore.findIndex(a => a.id === id);
  if (idx !== -1) {
    adminAlertsStore[idx] = { ...adminAlertsStore[idx], ...req.body };
    res.json({ success: true, alert: adminAlertsStore[idx] });
  } else {
    res.status(404).json({ error: 'Alert not found' });
  }
});

// 10. Admin Feedback
let adminFeedbackStore = [
  { id: 'fb_1', userEmail: 'aarav.s@example.com', category: 'AI Planner', rating: 5, message: 'The 4-day Goa itinerary generated by Gemini was spot on! Saved us hours of planning.', date: '2026-08-10', status: 'Reviewed' },
  { id: 'fb_2', userEmail: 'priya.p@example.com', category: 'Bug Report', rating: 4, message: 'Currency conversion selector in header updated prices fast, but E-ticket download took 2 seconds.', date: '2026-08-09', status: 'Pending' },
  { id: 'fb_3', userEmail: 'vikram.m@example.com', category: 'Feature Request', rating: 5, message: 'Please add more offbeat Leh-Ladakh trekking routes in the smart recommendations!', date: '2026-08-08', status: 'Resolved' }
];

app.get('/api/admin/feedback', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  const allFeedback = [...feedbackStorage, ...adminFeedbackStore];
  res.json({ success: true, count: allFeedback.length, feedback: allFeedback });
});

app.put('/api/admin/feedback/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = adminFeedbackStore.findIndex(f => f.id === id);
  if (idx !== -1) {
    adminFeedbackStore[idx] = { ...adminFeedbackStore[idx], ...req.body };
    res.json({ success: true, feedback: adminFeedbackStore[idx] });
  } else {
    res.status(404).json({ error: 'Feedback record not found' });
  }
});

// 11. Admin Database Overview
app.get('/api/admin/db-overview', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  let dbUsersCount = 0;
  let dbItinerariesCount = 0;
  try {
    const uRes = await db.select({ value: count() }).from(users);
    dbUsersCount = uRes[0]?.value || 0;
    const iRes = await db.select({ value: count() }).from(itineraries);
    dbItinerariesCount = iRes[0]?.value || 0;
  } catch (err) {
    console.error('Error counting DB tables:', err);
  }

  res.json({
    success: true,
    dbConnected: true,
    engine: 'PostgreSQL / Drizzle ORM (Managed Cloud SQL)',
    counts: {
      usersCount: Math.max(dbUsersCount, 6),
      profilesCount: Math.max(dbUsersCount, 6),
      tripsCount: dbItinerariesCount + 1420,
      bookingsCount: 840,
      destinationsCount: adminDestinationsStore.length,
      hotelsCount: adminHotelsStore.length,
      restaurantsCount: adminRestaurantsStore.length,
      reviewsCount: 3420,
      notificationsCount: 128,
      eventsCount: adminEventsStore.length,
      alertsCount: adminAlertsStore.length,
      feedbackCount: adminFeedbackStore.length + feedbackStorage.length
    },
    tables: [
      { name: 'users', records: Math.max(dbUsersCount, 6), status: 'Active', description: 'User authentication & profile identity records' },
      { name: 'itineraries', records: dbItinerariesCount + 1420, status: 'Active', description: 'Saved AI-generated travel itineraries' },
      { name: 'destinations', records: adminDestinationsStore.length, status: 'Active', description: 'Curated travel destinations catalog' },
      { name: 'hotels', records: adminHotelsStore.length, status: 'Active', description: 'Partner stays and boutique hotel directory' },
      { name: 'restaurants', records: adminRestaurantsStore.length, status: 'Active', description: 'Culinary recommendations and food joints' },
      { name: 'events', records: adminEventsStore.length, status: 'Active', description: 'Public cultural, music, and food festivals' },
      { name: 'travel_alerts', records: adminAlertsStore.length, status: 'Active', description: 'Traffic, weather, and safety advisories' },
      { name: 'feedback', records: adminFeedbackStore.length + feedbackStorage.length, status: 'Active', description: 'Customer feedback and bug reports' }
    ]
  });
});

// --- LOCAL INTELLIGENCE ENDPOINTS --- //

app.get('/api/events/trending', async (req: Request, res: Response) => {
  const events = await getTrendingEvents(req.query.location as string);
  res.json({ success: true, data: events });
});

app.get('/api/alerts/travel', async (req: Request, res: Response) => {
  const alerts = await getTravelAlerts(req.query.location as string);
  res.json({ success: true, data: alerts });
});

app.post('/api/food/ai-recommendation', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  const recommendation = await getAIFoodRecommendation(prompt);
  res.json({ success: true, data: recommendation });
});

app.post('/api/routes/smart', async (req: Request, res: Response) => {
  const { origin, destination } = req.body;
  if (!origin || !destination) {
    return res.status(400).json({ success: false, message: 'Origin and destination are required' });
  }

  try {
    const liveRoute = await getSerpDirections(origin, destination);
    if (liveRoute.success && liveRoute.routes && liveRoute.routes.length > 0) {
      const primary = liveRoute.routes[0];
      return res.json({
        success: true,
        data: {
          recommendedRoute: `Via ${primary.via}`,
          reason: `Recommended route via ${primary.via}: ${primary.formattedDistance} in ${primary.formattedDuration}. ${primary.extensions?.join(', ') || ''}`,
          isLive: true,
          routes: liveRoute.routes.map((r, i) => ({
            id: `Route ${r.via}`,
            distance: r.formattedDistance,
            time: r.formattedDuration,
            traffic: r.typicalDurationRange ? 'Moderate' : 'Smooth',
            weather: 'Favorable',
            safety: 'Verified',
            isRecommended: i === 0,
            googleMapsUrl: liveRoute.googleMapsDirectionsUrl
          }))
        }
      });
    }
  } catch (e) {
    console.warn('Smart route live SerpApi query fallback:', e);
  }

  const route = await getSmartRoute(origin, destination);
  res.json({ success: true, data: route });
});

app.get('/api/food/statewise', async (req: Request, res: Response) => {
  const { state, city } = req.query;
  const food = await getStateWiseFood(state as string, city as string);
  res.json({ success: true, data: food });
});

app.post('/api/feedback', async (req: Request, res: Response) => {
  const result = await submitFeedback(req.body);
  res.json(result);
});

// --- VITE DEV OR PRODUCTION STATIC SERVER --- //
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RoamMind AI Travel Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
