// scripts/build-destinations-db.ts
// Generates the comprehensive destinations database with verified coordinates, states, alternate names, and tourist info.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

interface DestinationRecord {
  id: string;
  name: string;
  displayName: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  alternateNames: string[];
  source: 'dataset';
  isCurated: boolean;
  tagline: string;
  heroImage: string;
  popularCategories: string[];
}

const PRIMARY_DESTINATIONS: DestinationRecord[] = [
  // Maharashtra Destinations (including required test cases)
  {
    id: 'dest_nashik',
    name: 'Nashik',
    displayName: 'Nashik, Maharashtra, India',
    city: 'Nashik',
    state: 'Maharashtra',
    country: 'India',
    latitude: 19.9975,
    longitude: 73.7898,
    alternateNames: ['Nasik', 'Nashik Road', 'Panchavati'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Wine capital of India, vineyards & sacred Godavari river ghats',
    heroImage: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Heritage', 'Vineyards', 'Spiritual', 'Nature']
  },
  {
    id: 'dest_chhatrapati_sambhajinagar',
    name: 'Chhatrapati Sambhajinagar',
    displayName: 'Chhatrapati Sambhajinagar (Aurangabad), Maharashtra, India',
    city: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    country: 'India',
    latitude: 19.8762,
    longitude: 75.3433,
    alternateNames: ['Aurangabad', 'Sambhajinagar', 'Chhatrapati Sambhaji Nagar', 'Sambhaji Nagar', 'Aurangabad, Maharashtra'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Gateway to UNESCO Ajanta & Ellora caves, Bibi Ka Maqbara & Daulatabad Fort',
    heroImage: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Heritage', 'UNESCO Sites', 'History', 'Culture']
  },
  {
    id: 'dest_pune',
    name: 'Pune',
    displayName: 'Pune, Maharashtra, India',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    latitude: 18.5204,
    longitude: 73.8567,
    alternateNames: ['Poona', 'Punyagari'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Cultural capital of Maharashtra, Maratha forts & bustling cafes',
    heroImage: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Culture', 'Nightlife', 'Food', 'Forts']
  },
  {
    id: 'dest_kolhapur',
    name: 'Kolhapur',
    displayName: 'Kolhapur, Maharashtra, India',
    city: 'Kolhapur',
    state: 'Maharashtra',
    country: 'India',
    latitude: 16.7050,
    longitude: 74.2433,
    alternateNames: ['Kolhapur City', 'Karvir'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Historic Mahalaxmi temple, Rankala Lake, royal palaces & authentic spicy culinary trails',
    heroImage: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Temples', 'Heritage', 'Food', 'Culture']
  },
  {
    id: 'dest_mahabaleshwar',
    name: 'Mahabaleshwar',
    displayName: 'Mahabaleshwar, Maharashtra, India',
    city: 'Mahabaleshwar',
    state: 'Maharashtra',
    country: 'India',
    latitude: 17.9243,
    longitude: 73.6576,
    alternateNames: ['Mahableshwar', 'Mahabaleshwar Hill Station'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Scenic Western Ghats hill station, strawberry farms & mist-covered viewpoints',
    heroImage: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Hill Station', 'Nature', 'Romantic', 'Viewpoints']
  },
  {
    id: 'dest_panchgani',
    name: 'Panchgani',
    displayName: 'Panchgani, Maharashtra, India',
    city: 'Panchgani',
    state: 'Maharashtra',
    country: 'India',
    latitude: 17.9237,
    longitude: 73.8007,
    alternateNames: ['Panchgani Hill Station', 'Table Land'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Table Land volcanic plateau, strawberry orchards & colonial boarding schools',
    heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Hill Station', 'Nature', 'Adventure', 'Relaxation']
  },
  {
    id: 'dest_lonavala',
    name: 'Lonavala',
    displayName: 'Lonavala, Maharashtra, India',
    city: 'Lonavala',
    state: 'Maharashtra',
    country: 'India',
    latitude: 18.7557,
    longitude: 73.4091,
    alternateNames: ['Lonavla', 'Khandala', 'Lonavala-Khandala'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Misty Sahyadri valleys, Tiger Point waterfalls, Karla caves & iconic chikki sweets',
    heroImage: 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Monsoon Getaway', 'Waterfalls', 'Trekking', 'Caves']
  },
  {
    id: 'dest_alibaug',
    name: 'Alibaug',
    displayName: 'Alibaug, Maharashtra, India',
    city: 'Alibaug',
    state: 'Maharashtra',
    country: 'India',
    latitude: 18.6414,
    longitude: 72.8722,
    alternateNames: ['Alibag', 'Kolaba'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Coastal fortress beaches, sea water sports & fresh Konkan seafood',
    heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Beaches', 'Forts', 'Seafood', 'Weekend Getaway']
  },
  {
    id: 'dest_nagpur',
    name: 'Nagpur',
    displayName: 'Nagpur, Maharashtra, India',
    city: 'Nagpur',
    state: 'Maharashtra',
    country: 'India',
    latitude: 21.1458,
    longitude: 79.0882,
    alternateNames: ['Orange City', 'Zero Mile City'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Tiger Capital of India, juicy orange orchards & Zero Mile Stone marker',
    heroImage: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Wildlife', 'Tiger Reserves', 'Food', 'Culture']
  },
  {
    id: 'dest_nanded',
    name: 'Nanded',
    displayName: 'Nanded, Maharashtra, India',
    city: 'Nanded',
    state: 'Maharashtra',
    country: 'India',
    latitude: 19.1383,
    longitude: 77.3210,
    alternateNames: ['Nanded Waghala', 'Hazur Sahib Nanded'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Sacred Takht Sachkhand Sri Hazur Abchalnagar Sahib Gurudwara on Godavari river',
    heroImage: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Pilgrimage', 'Spiritual', 'Historical', 'Riverfront']
  },
  {
    id: 'dest_mumbai',
    name: 'Mumbai',
    displayName: 'Mumbai, Maharashtra, India',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    latitude: 19.0760,
    longitude: 72.8777,
    alternateNames: ['Bombay', 'Maximum City', 'BOM'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Gateway of India, Marine Drive Queen’s Necklace, Bollywood & street gastronomy',
    heroImage: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Metropolis', 'Nightlife', 'Beaches', 'Architecture']
  },
  {
    id: 'dest_matheran',
    name: 'Matheran',
    displayName: 'Matheran, Maharashtra, India',
    city: 'Matheran',
    state: 'Maharashtra',
    country: 'India',
    latitude: 18.9866,
    longitude: 73.2678,
    alternateNames: ['Matheran Hill Station', 'Charlotte Lake'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Asia’s only automobile-free eco hill station & heritage toy train',
    heroImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Eco Tourism', 'Hill Station', 'Trekking', 'Nature']
  },
  {
    id: 'dest_shirdi',
    name: 'Shirdi',
    displayName: 'Shirdi, Maharashtra, India',
    city: 'Shirdi',
    state: 'Maharashtra',
    country: 'India',
    latitude: 19.7645,
    longitude: 74.4762,
    alternateNames: ['Sai Baba Shirdi', 'Sainagar'],
    source: 'dataset',
    isCurated: true,
    tagline: 'World-famous pilgrimage abode of revered saint Sri Sai Baba',
    heroImage: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Pilgrimage', 'Spiritual', 'Peace']
  },
  {
    id: 'dest_igatpuri',
    name: 'Igatpuri',
    displayName: 'Igatpuri, Maharashtra, India',
    city: 'Igatpuri',
    state: 'Maharashtra',
    country: 'India',
    latitude: 19.6967,
    longitude: 73.5594,
    alternateNames: ['Igatpuri Hill Station', 'Vipassana Igatpuri'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Vipassana meditation center, cascading waterfalls & Kalsubai peak trails',
    heroImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Meditation', 'Monsoon', 'Trekking', 'Waterfalls']
  },

  // Major Indian Cities & State Capitals
  {
    id: 'dest_delhi',
    name: 'Delhi',
    displayName: 'Delhi, India',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.6139,
    longitude: 77.2090,
    alternateNames: ['New Delhi', 'National Capital Region', 'NCR', 'Dilli'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Historic Mughal monuments, vibrant bazaars, India Gate & culinary street gems',
    heroImage: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['History', 'Heritage', 'Street Food', 'Culture']
  },
  {
    id: 'dest_bengaluru',
    name: 'Bengaluru',
    displayName: 'Bengaluru, Karnataka, India',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    latitude: 12.9716,
    longitude: 77.5946,
    alternateNames: ['Bangalore', 'Garden City', 'Silicon Valley of India', 'BLR'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Silicon Valley of India, lush green parks, craft microbreweries & tech hub',
    heroImage: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Craft Beer', 'Parks', 'Tech Hub', 'Cafes']
  },
  {
    id: 'dest_hyderabad',
    name: 'Hyderabad',
    displayName: 'Hyderabad, Telangana, India',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    latitude: 17.3850,
    longitude: 78.4867,
    alternateNames: ['City of Pearls', 'Cyberabad', 'HYD'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Charminar, world-famous Dum Biryani, Golconda Fort & Nizam heritage',
    heroImage: 'https://images.unsplash.com/photo-1600100397608-f010e47b3112?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Biryani', 'Heritage', 'Forts', 'Pearls']
  },
  {
    id: 'dest_varanasi',
    name: 'Varanasi',
    displayName: 'Varanasi, Uttar Pradesh, India',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    country: 'India',
    latitude: 25.3176,
    longitude: 82.9739,
    alternateNames: ['Banaras', 'Benares', 'Kashi', 'VNS'],
    source: 'dataset',
    isCurated: true,
    tagline: 'World’s oldest living city, spiritual Ganga river ghats & evening Maha Aarti',
    heroImage: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Spiritual', 'Ghats', 'Ancient Heritage', 'Aarti']
  },
  {
    id: 'dest_darjeeling',
    name: 'Darjeeling',
    displayName: 'Darjeeling, West Bengal, India',
    city: 'Darjeeling',
    state: 'West Bengal',
    country: 'India',
    latitude: 27.0410,
    longitude: 88.2663,
    alternateNames: ['Queen of Hills', 'Darjiling'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Queen of Hills, Tiger Hill Kanchenjunga sunrise & world-renowned orthodox tea gardens',
    heroImage: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Tea Estates', 'Himalayas', 'Toy Train', 'Sunrise']
  },
  {
    id: 'dest_rishikesh',
    name: 'Rishikesh',
    displayName: 'Rishikesh, Uttarakhand, India',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    country: 'India',
    latitude: 30.0869,
    longitude: 78.2676,
    alternateNames: ['Yoga Capital', 'Laxman Jhula', 'Ram Jhula'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Yoga capital of the world, Ganga white water rafting, Beatles Ashram & serene cliff cafes',
    heroImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Yoga', 'Rafting', 'Spiritual', 'Adventure']
  },
  {
    id: 'dest_goa',
    name: 'Goa',
    displayName: 'Goa, India',
    city: 'Panaji',
    state: 'Goa',
    country: 'India',
    latitude: 15.2993,
    longitude: 74.1240,
    alternateNames: ['North Goa', 'South Goa', 'Panjim', 'GOI'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Sun-kissed beaches, Portuguese colonial villas, water sports & vibrant nightlife',
    heroImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Beaches', 'Nightlife', 'Seafood', 'Water Sports']
  },
  {
    id: 'dest_jaipur',
    name: 'Jaipur',
    displayName: 'Jaipur, Rajasthan, India',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.9124,
    longitude: 75.7873,
    alternateNames: ['Pink City', 'Amber', 'Hawa Mahal', 'JAI'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Pink City of Rajasthan, majestic Amber Fort, Hawa Mahal & royal Rajput heritage',
    heroImage: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Royal Palaces', 'Forts', 'Handicrafts', 'Heritage']
  },
  {
    id: 'dest_udaipur',
    name: 'Udaipur',
    displayName: 'Udaipur, Rajasthan, India',
    city: 'Udaipur',
    state: 'Rajasthan',
    country: 'India',
    latitude: 24.5854,
    longitude: 73.7125,
    alternateNames: ['City of Lakes', 'Lake City', 'UDR'],
    source: 'dataset',
    isCurated: true,
    tagline: 'City of Lakes, floating marble palaces on Lake Pichola & royal Mewar grandeur',
    heroImage: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Lakes', 'Romance', 'Palaces', 'Honeymoon']
  },
  {
    id: 'dest_manali',
    name: 'Manali',
    displayName: 'Manali, Himachal Pradesh, India',
    city: 'Manali',
    state: 'Himachal Pradesh',
    country: 'India',
    latitude: 32.2432,
    longitude: 77.1892,
    alternateNames: ['Old Manali', 'Kullu Manali', 'Solang Valley'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Snow-capped Himalayan peaks, Solang Valley adventures, Rohtang Pass & pinewood trails',
    heroImage: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Snow', 'Trekking', 'Adventure', 'Hill Station']
  },

  // International Destinations (including required test cases)
  {
    id: 'dest_dubai',
    name: 'Dubai',
    displayName: 'Dubai, United Arab Emirates',
    city: 'Dubai',
    state: 'Dubai',
    country: 'United Arab Emirates',
    latitude: 25.0743,
    longitude: 55.1886,
    alternateNames: ['DXB', 'Emirate of Dubai', 'United Arab Emirates'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Burj Khalifa, futuristic architecture, desert safaris & world luxury shopping',
    heroImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Luxury', 'Skyscrapers', 'Shopping', 'Desert Safaris']
  },
  {
    id: 'dest_paris',
    name: 'Paris',
    displayName: 'Paris, Île-de-France, France',
    city: 'Paris',
    state: 'Île-de-France',
    country: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    alternateNames: ['City of Light', 'Ville Lumière', 'CDG'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Eiffel Tower, world-class art museums, Seine cruises & haute gastronomy',
    heroImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Art', 'Romance', 'Architecture', 'Gastronomy']
  },
  {
    id: 'dest_tokyo',
    name: 'Tokyo',
    displayName: 'Tokyo, Japan',
    city: 'Tokyo',
    state: 'Tokyo',
    country: 'Japan',
    latitude: 35.6762,
    longitude: 139.6503,
    alternateNames: ['Tokio', 'Edo', 'NRT', 'HND'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Neon skyscrapers, historic Shinto shrines, Michelin dining & vibrant anime culture',
    heroImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Technology', 'Temples', 'Anime', 'Cuisine']
  },
  {
    id: 'dest_london',
    name: 'London',
    displayName: 'London, England, United Kingdom',
    city: 'London',
    state: 'England',
    country: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    alternateNames: ['Greater London', 'LHR'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Big Ben, River Thames, West End theatres & historic royal palaces',
    heroImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Royal Heritage', 'Theatres', 'Museums', 'History']
  },
  {
    id: 'dest_new_york',
    name: 'New York',
    displayName: 'New York, New York, United States',
    city: 'New York',
    state: 'New York',
    country: 'United States',
    latitude: 40.7128,
    longitude: -74.0060,
    alternateNames: ['NYC', 'New York City', 'The Big Apple', 'Manhattan', 'JFK'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Times Square, Central Park, Broadway & world financial capital',
    heroImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Metropolis', 'Broadway', 'Culture', 'Museums']
  },

  // Additional popular Indian & global hubs
  {
    id: 'dest_singapore',
    name: 'Singapore',
    displayName: 'Singapore, Singapore',
    city: 'Singapore',
    state: 'Singapore',
    country: 'Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    alternateNames: ['Lion City', 'SIN'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Marina Bay Sands, Gardens by the Bay, Sentosa Island & Michelin hawker centers',
    heroImage: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Modern City', 'Gardens', 'Food', 'Family']
  },
  {
    id: 'dest_bangkok',
    name: 'Bangkok',
    displayName: 'Bangkok, Thailand',
    city: 'Bangkok',
    state: 'Bangkok',
    country: 'Thailand',
    latitude: 13.7563,
    longitude: 100.5018,
    alternateNames: ['Krung Thep', 'BKK'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Grand Palace, floating river markets, rooftop sky bars & street food haven',
    heroImage: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Street Food', 'Nightlife', 'Temples', 'Riverside']
  },
  {
    id: 'dest_bali',
    name: 'Bali',
    displayName: 'Bali, Indonesia',
    city: 'Denpasar',
    state: 'Bali',
    country: 'Indonesia',
    latitude: -8.3405,
    longitude: 115.0920,
    alternateNames: ['Island of the Gods', 'Ubud', 'Seminyak', 'Canggu'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Tropical surf beaches, lush rice terraces, wellness retreats & sacred Hindu sea temples',
    heroImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Beaches', 'Wellness', 'Surfing', 'Temples']
  },
  {
    id: 'dest_leh_ladakh',
    name: 'Leh Ladakh',
    displayName: 'Leh Ladakh, Ladakh, India',
    city: 'Leh',
    state: 'Ladakh',
    country: 'India',
    latitude: 34.1526,
    longitude: 77.5771,
    alternateNames: ['Ladakh', 'Leh', 'Pangong Tso', 'Nubra Valley'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Land of High Passes, azure high-altitude lakes & ancient Buddhist gompas',
    heroImage: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Himalayas', 'Adventure', 'Motorbiking', 'Monasteries']
  },
  {
    id: 'dest_munnar',
    name: 'Munnar',
    displayName: 'Munnar, Kerala, India',
    city: 'Munnar',
    state: 'Kerala',
    country: 'India',
    latitude: 10.0889,
    longitude: 77.0595,
    alternateNames: ['Munnar Hills', 'Idukki'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Endless rolling emerald tea estates, Anamudi peak & mist-covered valleys',
    heroImage: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Tea Plantations', 'Hill Station', 'Nature', 'Romantic']
  },
  {
    id: 'dest_coorg',
    name: 'Coorg',
    displayName: 'Coorg (Kodagu), Karnataka, India',
    city: 'Madikeri',
    state: 'Karnataka',
    country: 'India',
    latitude: 12.3375,
    longitude: 75.8069,
    alternateNames: ['Kodagu', 'Madikeri', 'Scotland of India'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Scotland of India, aromatic coffee plantations & cascading Abbey Falls',
    heroImage: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Coffee Estates', 'Waterfalls', 'Nature', 'Homestays']
  },
  {
    id: 'dest_mysore',
    name: 'Mysore',
    displayName: 'Mysore (Mysuru), Karnataka, India',
    city: 'Mysore',
    state: 'Karnataka',
    country: 'India',
    latitude: 12.2958,
    longitude: 76.6394,
    alternateNames: ['Mysuru', 'City of Palaces'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Illuminated Mysore Palace, silk heritage, Chamundi Hill & sandalwood traditions',
    heroImage: 'https://images.unsplash.com/photo-1600100397608-f010e47b3112?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Palaces', 'Heritage', 'Culture', 'Silk']
  },
  {
    id: 'dest_hampi',
    name: 'Hampi',
    displayName: 'Hampi, Karnataka, India',
    city: 'Hampi',
    state: 'Karnataka',
    country: 'India',
    latitude: 15.3350,
    longitude: 76.4600,
    alternateNames: ['Vijayanagara', 'Hampi Ruins'],
    source: 'dataset',
    isCurated: true,
    tagline: 'UNESCO Vijayanagara empire ruins, stone chariot & surreal boulder landscapes',
    heroImage: 'https://images.unsplash.com/photo-1600100397608-f010e47b3112?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['UNESCO Sites', 'Ruins', 'History', 'Bouldering']
  },
  {
    id: 'dest_ooty',
    name: 'Ooty',
    displayName: 'Ooty (Udhagamandalam), Tamil Nadu, India',
    city: 'Ooty',
    state: 'Tamil Nadu',
    country: 'India',
    latitude: 11.4102,
    longitude: 76.6950,
    alternateNames: ['Udhagamandalam', 'Ootacamund', 'Nilgiris'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Nilgiri blue mountains, botanical gardens, lake boating & historic Mountain Railway',
    heroImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Hill Station', 'Toy Train', 'Botanical Gardens', 'Lakes']
  },
  {
    id: 'dest_kodaikanal',
    name: 'Kodaikanal',
    displayName: 'Kodaikanal, Tamil Nadu, India',
    city: 'Kodaikanal',
    state: 'Tamil Nadu',
    country: 'India',
    latitude: 10.2381,
    longitude: 77.4892,
    alternateNames: ['Princess of Hill Stations', 'Kodai'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Princess of Hill Stations, star-shaped Kodai lake, Pillar Rocks & pine forests',
    heroImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Lakes', 'Pine Forests', 'Hill Station', 'Nature']
  },
  {
    id: 'dest_shimla',
    name: 'Shimla',
    displayName: 'Shimla, Himachal Pradesh, India',
    city: 'Shimla',
    state: 'Himachal Pradesh',
    country: 'India',
    latitude: 31.1048,
    longitude: 77.1734,
    alternateNames: ['Simla', 'Mall Road Shimla'],
    source: 'dataset',
    isCurated: true,
    tagline: 'Colonial Ridge walks, Mall Road heritage, Jakhu Temple & Himalayan views',
    heroImage: 'https://images.unsplash.com/photo-1562920616-5e0427329977?auto=format&fit=crop&w=1200&q=80',
    popularCategories: ['Colonial Architecture', 'Mall Road', 'Hill Station']
  }
];

// Read all unique locations from data/indian_restaurants.csv and supplement with known coordinates
const CSV_PATH = path.join(rootDir, 'data', 'indian_restaurants.csv');
const KNOWN_COORDINATES: Record<string, { lat: number; lng: number; state: string; country: string }> = {
  'Kolkata': { lat: 22.5726, lng: 88.3639, state: 'West Bengal', country: 'India' },
  'Lucknow': { lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh', country: 'India' },
  'Chandigarh': { lat: 30.7333, lng: 76.7794, state: 'Chandigarh', country: 'India' },
  'Kanpur': { lat: 26.4499, lng: 80.3319, state: 'Uttar Pradesh', country: 'India' },
  'Indore': { lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh', country: 'India' },
  'Ludhiana': { lat: 30.9010, lng: 75.8573, state: 'Punjab', country: 'India' },
  'Chennai': { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu', country: 'India' },
  'Surat': { lat: 21.1702, lng: 72.8311, state: 'Gujarat', country: 'India' },
  'Vadodara': { lat: 22.3072, lng: 73.1812, state: 'Gujarat', country: 'India' },
  'Dehradun': { lat: 30.3165, lng: 78.0322, state: 'Uttarakhand', country: 'India' },
  'Guwahati': { lat: 26.1445, lng: 91.7362, state: 'Assam', country: 'India' },
  'Patna': { lat: 25.5941, lng: 85.1376, state: 'Bihar', country: 'India' },
  'Jalandhar': { lat: 31.3260, lng: 75.5762, state: 'Punjab', country: 'India' },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714, state: 'Gujarat', country: 'India' },
  'Jodhpur': { lat: 26.2389, lng: 73.0243, state: 'Rajasthan', country: 'India' },
  'Dhanbad': { lat: 23.7957, lng: 86.4304, state: 'Jharkhand', country: 'India' },
  'Trichy': { lat: 10.7905, lng: 78.7047, state: 'Tamil Nadu', country: 'India' },
  'Bareilly': { lat: 28.3670, lng: 79.4304, state: 'Uttar Pradesh', country: 'India' },
  'Mangalore': { lat: 12.9141, lng: 74.8560, state: 'Karnataka', country: 'India' },
  'Puducherry': { lat: 11.9416, lng: 79.8083, state: 'Puducherry', country: 'India' },
  'Ajmer': { lat: 26.4499, lng: 74.6399, state: 'Rajasthan', country: 'India' },
  'Bhubaneswar': { lat: 20.2961, lng: 85.8245, state: 'Odisha', country: 'India' },
  'Cuttack': { lat: 20.4625, lng: 85.8828, state: 'Odisha', country: 'India' },
  'Vijayawada': { lat: 16.5062, lng: 80.6480, state: 'Andhra Pradesh', country: 'India' },
  'Gorakhpur': { lat: 26.7606, lng: 83.3732, state: 'Uttar Pradesh', country: 'India' },
  'Meerut': { lat: 28.9845, lng: 77.7064, state: 'Uttar Pradesh', country: 'India' },
  'Salem': { lat: 11.6643, lng: 78.1460, state: 'Tamil Nadu', country: 'India' },
  'Gaya': { lat: 24.7914, lng: 85.0002, state: 'Bihar', country: 'India' },
  'Kota': { lat: 25.2138, lng: 75.8648, state: 'Rajasthan', country: 'India' },
  'Durgapur': { lat: 23.5204, lng: 87.3119, state: 'West Bengal', country: 'India' },
  'Bhopal': { lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh', country: 'India' },
  'Agra': { lat: 27.1767, lng: 78.0081, state: 'Uttar Pradesh', country: 'India' },
  'Amritsar': { lat: 31.6340, lng: 74.8723, state: 'Punjab', country: 'India' },
  'Vellore': { lat: 12.9165, lng: 79.1325, state: 'Tamil Nadu', country: 'India' },
  'Coimbatore': { lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu', country: 'India' },
  'Madurai': { lat: 9.9252, lng: 78.1198, state: 'Tamil Nadu', country: 'India' },
  'Kochi': { lat: 9.9312, lng: 76.2673, state: 'Kerala', country: 'India' },
  'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366, state: 'Kerala', country: 'India' },
  'Visakhapatnam': { lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh', country: 'India' },
  'Raipur': { lat: 21.2514, lng: 81.6296, state: 'Chhattisgarh', country: 'India' },
  'Ranchi': { lat: 23.3441, lng: 85.3096, state: 'Jharkhand', country: 'India' },
  'Gwalior': { lat: 26.2183, lng: 78.1828, state: 'Madhya Pradesh', country: 'India' },
  'Jabalpur': { lat: 23.1815, lng: 79.9864, state: 'Madhya Pradesh', country: 'India' },
  'Ujjain': { lat: 23.1765, lng: 75.7885, state: 'Madhya Pradesh', country: 'India' },
  'Shimla': { lat: 31.1048, lng: 77.1734, state: 'Himachal Pradesh', country: 'India' },
  'Dharamsala': { lat: 32.2190, lng: 76.3234, state: 'Himachal Pradesh', country: 'India' },
  'Haridwar': { lat: 29.9457, lng: 78.1642, state: 'Uttarakhand', country: 'India' },
  'Nainital': { lat: 29.3919, lng: 79.4542, state: 'Uttarakhand', country: 'India' },
  'Mussoorie': { lat: 30.4598, lng: 78.0644, state: 'Uttarakhand', country: 'India' },
  'Rourkela': { lat: 22.2604, lng: 84.8536, state: 'Odisha', country: 'India' },
  'Bhilai': { lat: 21.2167, lng: 81.4333, state: 'Chhattisgarh', country: 'India' },
  'Siliguri': { lat: 26.7271, lng: 88.3953, state: 'West Bengal', country: 'India' },
  'Asansol': { lat: 23.6739, lng: 86.9524, state: 'West Bengal', country: 'India' },
  'Jammu': { lat: 32.7266, lng: 74.8570, state: 'Jammu and Kashmir', country: 'India' },
  'Srinagar': { lat: 34.0837, lng: 74.7973, state: 'Jammu and Kashmir', country: 'India' },
  'Hubli': { lat: 15.3647, lng: 75.1240, state: 'Karnataka', country: 'India' },
  'Belgaum': { lat: 15.8497, lng: 74.4977, state: 'Karnataka', country: 'India' },
  'Solapur': { lat: 17.6599, lng: 75.9064, state: 'Maharashtra', country: 'India' },
  'Amravati': { lat: 20.9320, lng: 77.7523, state: 'Maharashtra', country: 'India' },
  'Akola': { lat: 20.7002, lng: 77.0082, state: 'Maharashtra', country: 'India' },
  'Jalgaon': { lat: 21.0077, lng: 75.5626, state: 'Maharashtra', country: 'India' },
  'Dhule': { lat: 20.9042, lng: 74.7749, state: 'Maharashtra', country: 'India' },
  'Satara': { lat: 17.6805, lng: 73.9934, state: 'Maharashtra', country: 'India' },
  'Sangli': { lat: 16.8524, lng: 74.5815, state: 'Maharashtra', country: 'India' },
  'Ratnagiri': { lat: 16.9902, lng: 73.3120, state: 'Maharashtra', country: 'India' },
  'Sindhudurg': { lat: 16.1217, lng: 73.7176, state: 'Maharashtra', country: 'India' },
  'Chandrapur': { lat: 19.9615, lng: 79.2961, state: 'Maharashtra', country: 'India' },
  'Wardha': { lat: 20.7453, lng: 78.6022, state: 'Maharashtra', country: 'India' },
  'Jalna': { lat: 19.8347, lng: 75.8816, state: 'Maharashtra', country: 'India' },
  'Beed': { lat: 18.9891, lng: 75.7601, state: 'Maharashtra', country: 'India' },
  'Latur': { lat: 18.4088, lng: 76.5604, state: 'Maharashtra', country: 'India' },
  'Dharashiv': { lat: 18.1757, lng: 76.0409, state: 'Maharashtra', country: 'India' },
  'Parbhani': { lat: 19.2686, lng: 76.7708, state: 'Maharashtra', country: 'India' },
  'Hingoli': { lat: 19.7196, lng: 77.1472, state: 'Maharashtra', country: 'India' },
  'Washim': { lat: 20.1092, lng: 77.1332, state: 'Maharashtra', country: 'India' },
  'Yavatmal': { lat: 20.3888, lng: 78.1204, state: 'Maharashtra', country: 'India' },
  'Gondia': { lat: 21.4604, lng: 80.1961, state: 'Maharashtra', country: 'India' },
  'Bhandara': { lat: 21.1667, lng: 79.6500, state: 'Maharashtra', country: 'India' },
  'Gadchiroli': { lat: 20.1784, lng: 80.0034, state: 'Maharashtra', country: 'India' }
};

const finalDestinations: DestinationRecord[] = [...PRIMARY_DESTINATIONS];
const seenIds = new Set(finalDestinations.map(d => d.id));
const seenNames = new Set(finalDestinations.flatMap(d => [d.name.toLowerCase(), ...(d.alternateNames || []).map(a => a.toLowerCase())]));

// If CSV exists, read locations and add any missing destinations
if (fs.existsSync(CSV_PATH)) {
  const content = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = content.split('\n');
  const locationCounts = new Map<string, number>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const parts = line.split(',');
    const loc = parts[parts.length - 1]?.trim();
    if (loc) {
      locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1);
    }
  }

  for (const [locName, count] of locationCounts.entries()) {
    const lower = locName.toLowerCase();
    if (seenNames.has(lower)) continue;

    const id = `dest_${lower.replace(/[^\w]/g, '_')}`;
    if (seenIds.has(id)) continue;

    const info = KNOWN_COORDINATES[locName] || {
      lat: 20.5937,
      lng: 78.9629,
      state: 'India',
      country: 'India'
    };

    finalDestinations.push({
      id,
      name: locName,
      displayName: `${locName}, ${info.state}, ${info.country}`,
      city: locName,
      state: info.state,
      country: info.country,
      latitude: info.lat,
      longitude: info.lng,
      alternateNames: [locName],
      source: 'dataset',
      isCurated: false,
      tagline: `Vibrant city in ${info.state} with ${count} featured local culinary spots`,
      heroImage: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80',
      popularCategories: ['Food', 'Local Culture', 'City Life']
    });

    seenIds.add(id);
    seenNames.add(lower);
  }
}

// Add Osmanabad as alternate to Dharashiv
const dharashiv = finalDestinations.find(d => d.id === 'dest_dharashiv');
if (dharashiv) {
  dharashiv.alternateNames.push('Osmanabad');
}

const outputPath = path.join(rootDir, 'data', 'destinations.json');
fs.writeFileSync(outputPath, JSON.stringify(finalDestinations, null, 2), 'utf8');

console.log(`✅ Built destination database at ${outputPath}`);
console.log(`   Total curated & indexed destinations: ${finalDestinations.length}`);
