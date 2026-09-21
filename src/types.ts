export type BudgetTier = 'backpacker' | 'moderate' | 'luxury' | 'custom';
export type TravelStyle = 'solo' | 'couple' | 'family' | 'friends' | 'business' | 'adventure';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface CanonicalDestination {
  id: string;
  name: string;
  displayName: string;
  city: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
  coordinates?: LocationCoordinates;
  placeId: string | null;
  source: 'dataset' | 'geocoding' | 'google_places' | 'serpapi' | 'osm' | string;
  isCurated?: boolean;
  tagline?: string;
  heroImage?: string;
  popularCategories?: string[];
  alternateNames?: string[];
  avgDailyCostINR?: number;
}

export interface AttractionItem {
  id: string;
  name: string;
  destination: string;
  category: string;
  rating?: number;
  reviewsCount?: number;
  image?: string;
  fee?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: LocationCoordinates;
  distanceKm?: number;
  distanceLabel?: string;
  source: 'dataset' | 'google_places' | 'serpapi' | 'osm' | string;
}

export interface SearchAuditDiagnosticData {
  searchQuery: string;
  resolvedDestination: CanonicalDestination | null;
  hotels: {
    localCount: number;
    dbCount: number;
    externalCount: number;
    finalCount: number;
    source: string;
    items: any[];
  };
  restaurants: {
    localCount: number;
    dbCount: number;
    externalCount: number;
    finalCount: number;
    source: string;
    items: any[];
  };
  attractions: {
    localCount: number;
    externalCount: number;
    finalCount: number;
    source: string;
    items: AttractionItem[];
  };
  weather: {
    source: string;
    city: string;
    tempC: number;
    condition: string;
  };
  map: {
    source: string;
    center: LocationCoordinates;
  };
  ai: {
    destination: string;
    budget: number;
  };
}


export interface Activity {
  id: string;
  time: string; // e.g. "09:00 AM"
  category: 'breakfast' | 'morning' | 'lunch' | 'afternoon' | 'evening' | 'dinner' | 'night' | 'stay' | 'transit';
  title: string;
  description: string;
  locationName: string;
  estimatedCostINR: number;
  durationHours: number;
  rating?: number;
  imageUrl?: string;
  travelTimeFromPrev?: string;
  tips?: string;
  coordinates?: LocationCoordinates;
}

export interface ItineraryDay {
  dayNumber: number;
  dateStr?: string;
  theme: string;
  summary: string;
  activities: Activity[];
  dailyBudgetEstimateINR: number;
  weatherForecast?: {
    tempC: number;
    condition: string;
    icon: string;
  };
}

export interface TripBudgetBreakdown {
  transportationINR: number;
  accommodationINR: number;
  foodINR: number;
  activitiesINR: number;
  localTravelINR: number;
  remainingBudgetINR: number;
}

export interface TravelItinerary {
  id: string;
  title: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  travelersCount: number;
  budget?: number; // User-selected or custom numeric budget in INR
  budgetTier?: BudgetTier; // Kept optional for backward compatibility
  travelStyle: TravelStyle;
  interests: string[];
  totalEstimatedCostINR: number;
  remainingBudgetINR?: number;
  budgetBreakdown?: TripBudgetBreakdown;
  currency: string;
  days: ItineraryDay[];
  packingChecklist: string[];
  localTips: string[];
  emergencyContacts: {
    police: string;
    touristHelpline: string;
    medical: string;
  };
  createdAt: string;
}

export interface Destination {
  id: string;
  name: string;
  state: string;
  country: string;
  region: 'North' | 'South' | 'West' | 'East' | 'Central' | 'Northeast' | 'Islands' | 'International';
  tagline: string;
  description: string;
  heroImage: string;
  gallery: string[];
  rating: number;
  reviewCount: number;
  bestTimeToVisit: string;
  avgDailyCostINR: number;
  popularCategories: string[];
  coordinates: LocationCoordinates;
  weather: {
    tempC: number;
    condition: string;
    humidity: number;
    windKmH: number;
    uvIndex: number;
    aqi: number;
    airQualityLabel: string;
  };
  entryFeeDetails: string;
  historySummary: string;
  culturalTips: string[];
  dosAndDonts: {
    dos: string[];
    donts: string[];
  };
  topAttractions: {
    name: string;
    type: string;
    rating: number;
    image: string;
    fee: string;
  }[];
}

export interface Hotel {
  id: string;
  name: string;
  destination: string;
  type: 'Luxury Resort' | 'Boutique Hotel' | 'Backpacker Hostel' | 'Heritage Palace' | 'Beach Villa' | 'Homestay';
  rating: number;
  reviewsCount: number;
  pricePerNightINR: number;
  image: string;
  amenities: string[];
  locationDesc: string;
  coordinates: LocationCoordinates;
  isPopular?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  destination: string;
  cuisine: string[];
  type: 'Fine Dining' | 'Street Food' | 'Rooftop Cafe' | 'Traditional' | 'Beach Shack' | 'Bakery';
  avgMealCostForTwoINR: number;
  rating: number;
  image: string;
  mustTryDishes: string[];
  dietaryTags: ('Vegetarian' | 'Vegan' | 'Halal' | 'Gluten-Free' | 'Jain')[];
  address: string;
  reviewsCount?: number;
  isPopular?: boolean;
  vibe?: string;
}

export interface TravelCategory {
  id: string;
  name: string;
  iconName: string;
  description: string;
  image: string;
  popularSpots: string[];
  color: string;
}

export interface WeatherData {
  city: string;
  tempC: number;
  condition: string;
  humidity: number;
  windKmH: number;
  uvIndex: number;
  aqi: number;
  aqiText: string;
  hourlyForecast: { time: string; tempC: number; icon: string; rainProb: number }[];
  sevenDayForecast: { day: string; highC: number; lowC: number; condition: string }[];
  rainAlert?: string;
  recommendations: string[];
}

export interface TransportOption {
  mode: 'flight' | 'train' | 'bus' | 'taxi' | 'rental_car' | 'bike';
  provider: string;
  duration: string;
  estimatedFareINR: number;
  frequency: string;
  co2EmissionsKg: number;
  comfortRating: number;
  speedRating: number;
}

export interface UserTripSummary {
  id: string;
  destination: string;
  dates: string;
  status: 'Upcoming' | 'Completed' | 'Draft';
  image: string;
  budgetTotalINR: number;
  daysCount: number;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  username: string;
  email: string;
  phone: string;
  profileImage: string;
  avatar?: string;
  gender: string;
  dateOfBirth: string;
  country: string;
  state: string;
  city: string;
  preferredLanguage: string;
  currency: string;
  timeZone: string;
  bio: string;
  memberSince: string;
  verified: boolean;
  role: 'USER' | 'ADMIN' | 'PRO Nomad Member' | string;
  visitedDestinationsCount?: number;
  totalKmTraveled?: number;
  savedTripsCount?: number;
  wishlistCount?: number;
  badges?: string[];
}

export interface AdminStats {
  totalUsers: number;
  activeTripGenerationsToday: number;
  revenueThisMonthUSD: number;
  topSearchedDestinations: { name: string; searches: number }[];
  aiModelLatencyMs: number;
  systemStatus: 'Operational' | 'Degraded' | 'Maintenance';
}

export interface FlightAirport {
  id: string;
  name: string;
  time: string;
}

export interface FlightSegment {
  departure_airport: FlightAirport;
  arrival_airport: FlightAirport;
  duration: number; // in minutes
  formatted_duration: string;
  airplane?: string;
  airline: string;
  airline_logo?: string;
  travel_class?: string;
  flight_number: string;
  legroom?: string;
  extensions?: string[];
  overnight?: boolean;
}

export interface FlightLayover {
  airport_id: string;
  airport_name: string;
  duration: number; // minutes
  formatted_duration: string;
}

export interface FlightCarbonEmissions {
  this_flight?: number;
  typical_for_this_route?: number;
  difference_percent?: number;
}

export interface FlightItem {
  id: string;
  airline: string;
  airline_logo?: string;
  flight_number: string;
  departure_airport: FlightAirport;
  arrival_airport: FlightAirport;
  departure_time: string;
  arrival_time: string;
  duration: number; // total duration in minutes
  formatted_duration: string;
  stops: number; // 0 = Non-stop, 1 = 1 stop, 2 = 2+ stops
  stops_label: 'Non-stop' | '1 stop' | 'Multiple stops';
  layovers?: FlightLayover[];
  price: number;
  formatted_price: string;
  currency: string;
  travel_class: string;
  airplane?: string;
  booking_link?: string;
  booking_token?: string;
  carbon_emissions?: FlightCarbonEmissions;
  is_best_flight?: boolean;
  overnight?: boolean;
  extensions?: string[];
  segments: FlightSegment[];
}

export interface FlightPriceInsights {
  lowest_price?: number;
  price_level?: string;
  typical_price_range?: [number, number];
  price_history?: [number, number][];
}

export interface FlightSearchMetadata {
  id?: string;
  status?: string;
  created_at?: string;
  google_flights_url?: string;
  total_time_taken?: number;
}

export interface FlightSearchResponse {
  success: boolean;
  best_flights: FlightItem[];
  other_flights: FlightItem[];
  total_count: number;
  search_metadata: FlightSearchMetadata;
  price_insights?: FlightPriceInsights;
  airports?: any[];
  error?: string | null;
  cached?: boolean;
  query?: {
    departure_id: string;
    arrival_id: string;
    outbound_date: string;
    return_date?: string;
    type: string;
    currency: string;
    travel_class?: string;
    adults?: number;
    stops?: string;
  };
}

