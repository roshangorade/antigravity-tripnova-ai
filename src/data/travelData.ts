import { Destination, TravelCategory, Hotel, Restaurant, WeatherData, UserProfile, AdminStats } from '../types';

export const POPULAR_DESTINATIONS: Destination[] = [
  {
    id: 'goa',
    name: 'Goa',
    state: 'Goa',
    country: 'India',
    region: 'West',
    tagline: 'Sun-kissed beaches, Portuguese heritage & vibrant nightlife',
    description: 'Goa offers the perfect mix of idyllic palm-fringed beaches, energetic beach shacks, historic churches, spice plantations, and seafood gastronomy.',
    heroImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1587922546307-776227941871?q=80&w=800&auto=format&fit=crop'
    ],
    rating: 4.8,
    reviewCount: 3420,
    bestTimeToVisit: 'November to February',
    avgDailyCostINR: 3500,
    popularCategories: ['Beach', 'Nightlife', 'Food', 'Water Sports'],
    coordinates: { lat: 15.2993, lng: 74.124 },
    weather: {
      tempC: 29,
      condition: 'Sunny Coastal Breeze',
      humidity: 68,
      windKmH: 14,
      uvIndex: 7,
      aqi: 35,
      airQualityLabel: 'Good'
    },
    entryFeeDetails: 'Free access to public beaches. Fort Aguada: ₹25. Dudhsagar Falls: ₹50.',
    historySummary: 'Ruled by Portuguese for over 450 years, giving Goa its distinctive Latin architectural charm, vibrant festivals, and fusion cuisine.',
    culturalTips: ['Beachwear is allowed on shorelines, but dress respectfully when visiting places of worship.', 'Rent a scooter or car for convenient local commuting.'],
    dosAndDonts: {
      dos: ['Try Goan Fish Curry and Bebinca dessert', 'Watch sunset at Vagator or Anjuna', 'Rent a helmet-friendly scooter'],
      donts: ['Swim near red flags or under high tide warnings', 'Litter plastic on pristine beaches']
    },
    topAttractions: [
      { name: 'Baga & Calangute Beach', type: 'Beach / Water Sports', rating: 4.7, image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=400&auto=format&fit=crop', fee: 'Free' },
      { name: 'Basilica of Bom Jesus', type: 'UNESCO Heritage Site', rating: 4.9, image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=400&auto=format&fit=crop', fee: 'Free' },
      { name: 'Dudhsagar Waterfalls', type: 'Nature / Trekking', rating: 4.8, image: 'https://images.unsplash.com/photo-1587922546307-776227941871?q=80&w=400&auto=format&fit=crop', fee: '₹50' }
    ]
  },
  {
    id: 'leh-ladakh',
    name: 'Leh Ladakh',
    state: 'Ladakh',
    country: 'India',
    region: 'North',
    tagline: 'Land of High Passes, azure lakes & ancient monasteries',
    description: 'Surreal desert landscapes, crystal-clear high altitude lakes like Pangong Tso, and serene Buddhist monasteries nestled amidst snow-capped Himalayan peaks.',
    heroImage: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=800&auto=format&fit=crop'
    ],
    rating: 4.9,
    reviewCount: 2890,
    bestTimeToVisit: 'May to September',
    avgDailyCostINR: 4200,
    popularCategories: ['Mountains', 'Adventure', 'Photography', 'Road Trips'],
    coordinates: { lat: 34.1526, lng: 77.5771 },
    weather: {
      tempC: 16,
      condition: 'Clear Blue Sky',
      humidity: 32,
      windKmH: 18,
      uvIndex: 9,
      aqi: 18,
      airQualityLabel: 'Pristine'
    },
    entryFeeDetails: 'Inner Line Permit (ILP) required for Pangong & Nubra Valley (~₹500). Monastery entry: ₹30 - ₹50.',
    historySummary: 'Historic crossroads of trans-Himalayan trade routes connecting India to Tibet and Central Asia, maintaining rich Mahayana Buddhist traditions.',
    culturalTips: ['Spend at least 24-48 hours acclimatizing in Leh town to prevent High Altitude Sickness.', 'Always walk clockwise around stupas and prayer wheels.'],
    dosAndDonts: {
      dos: ['Drink plenty of water and carry Diamox if recommended', 'Carry cash as networks can be unreliable outside Leh'],
      donts: ['Rush your itinerary without rest days', 'Use single-use plastic bottles in eco-sensitive zones']
    },
    topAttractions: [
      { name: 'Pangong Tso Lake', type: 'High Altitude Lake', rating: 5.0, image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?q=80&w=400&auto=format&fit=crop', fee: 'Permit Required' },
      { name: 'Khardung La Pass', type: 'Highest Motorable Pass', rating: 4.8, image: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=400&auto=format&fit=crop', fee: 'Free' },
      { name: 'Thiksey Monastery', type: 'Buddhist Monastery', rating: 4.9, image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?q=80&w=400&auto=format&fit=crop', fee: '₹50' }
    ]
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    region: 'North',
    tagline: 'The Pink City of royal forts, palaces & vibrant bazaars',
    description: 'Immerse in royal heritage at Amer Fort, admire Hawa Mahal’s intricate honeycomb facade, and shop for hand-blocked textiles and silver jewelry in historic pink markets.',
    heroImage: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=800&auto=format&fit=crop'
    ],
    rating: 4.7,
    reviewCount: 4120,
    bestTimeToVisit: 'October to March',
    avgDailyCostINR: 3200,
    popularCategories: ['Culture', 'Photography', 'Shopping', 'Architecture'],
    coordinates: { lat: 26.9124, lng: 75.7873 },
    weather: {
      tempC: 28,
      condition: 'Pleasant & Warm',
      humidity: 45,
      windKmH: 10,
      uvIndex: 6,
      aqi: 82,
      airQualityLabel: 'Moderate'
    },
    entryFeeDetails: 'Amer Fort: ₹100 (Indians), ₹500 (Foreigners). Composite ticket available for major monuments.',
    historySummary: 'Founded in 1727 by Maharaja Sawai Jai Singh II as India’s first planned city designed according to Shilpa Shastra and Vastu Shastra principles.',
    culturalTips: ['Enjoy traditional Rajasthani Thali at Chokhi Dhani.', 'Bargain politely at Johari Bazaar and Bapu Bazaar.'],
    dosAndDonts: {
      dos: ['Catch the sunset from Nahargarh Fort overlooking the city', 'Try Pyaaz Kachori and Ghewar sweet'],
      donts: ['Hire unverified guides without official ID badges']
    },
    topAttractions: [
      { name: 'Amer Fort', type: 'Royal Fort', rating: 4.9, image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=400&auto=format&fit=crop', fee: '₹100' },
      { name: 'Hawa Mahal', type: 'Palace of Winds', rating: 4.8, image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=400&auto=format&fit=crop', fee: '₹50' },
      { name: 'City Palace', type: 'Royal Museum', rating: 4.7, image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=400&auto=format&fit=crop', fee: '₹200' }
    ]
  },
  {
    id: 'kerala',
    name: 'Kerala Backwaters',
    state: 'Kerala',
    country: 'India',
    region: 'South',
    tagline: 'God’s Own Country – houseboats, Ayurvedic retreats & tea hills',
    description: 'Cruise through tranquil palm-shaded backwaters in Alleppey, breathe fresh mountain air in Munnar’s tea estates, and savor coconut-infused coastal delicacies.',
    heroImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=800&auto=format&fit=crop'
    ],
    rating: 4.9,
    reviewCount: 3810,
    bestTimeToVisit: 'September to March',
    avgDailyCostINR: 3800,
    popularCategories: ['Nature', 'Relaxation', 'Food', 'Family'],
    coordinates: { lat: 9.4981, lng: 76.3388 },
    weather: {
      tempC: 27,
      condition: 'Tropical Sunshine',
      humidity: 75,
      windKmH: 12,
      uvIndex: 6,
      aqi: 28,
      airQualityLabel: 'Pristine'
    },
    entryFeeDetails: 'Houseboat overnight stay: ₹7,000 - ₹18,000. Eravikulam National Park: ₹200.',
    historySummary: 'A major spice trading center for ancient Greeks, Romans, Arabs, and Chinese since 3000 BCE, creating a unique cosmopolitan cultural mosaic.',
    culturalTips: ['Try an authentic Sadya meal served on a banana leaf.', 'Experience a traditional Kathakali dance performance.'],
    dosAndDonts: {
      dos: ['Book an overnight houseboat in Alleppey or Kumarakom', 'Experience Ayurvedic wellness massage'],
      donts: ['Disturb wildlife in Periyar or Silent Valley reserves']
    },
    topAttractions: [
      { name: 'Alleppey Backwaters', type: 'Houseboat Cruise', rating: 4.9, image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=400&auto=format&fit=crop', fee: 'Varies' },
      { name: 'Munnar Tea Gardens', type: 'Hill Station / Nature', rating: 4.8, image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=400&auto=format&fit=crop', fee: 'Free' }
    ]
  },
  {
    id: 'udaipur',
    name: 'Udaipur',
    state: 'Rajasthan',
    country: 'India',
    region: 'North',
    tagline: 'The Venice of the East – romantic lakes & marble palaces',
    description: 'Surrounded by the Aravalli hills, Udaipur enchants visitors with Lake Pichola boat cruises, majestic City Palace, rooftop dining, and royal heritage heritage stays.',
    heroImage: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?q=80&w=800&auto=format&fit=crop'
    ],
    rating: 4.8,
    reviewCount: 2650,
    bestTimeToVisit: 'September to March',
    avgDailyCostINR: 4000,
    popularCategories: ['Luxury', 'Culture', 'Photography', 'Couple'],
    coordinates: { lat: 24.5854, lng: 73.7125 },
    weather: {
      tempC: 26,
      condition: 'Golden Sunset Breeze',
      humidity: 50,
      windKmH: 9,
      uvIndex: 5,
      aqi: 45,
      airQualityLabel: 'Good'
    },
    entryFeeDetails: 'City Palace: ₹300. Boat Ride on Lake Pichola: ₹400 - ₹800.',
    historySummary: 'Capital of the Mewar kingdom founded in 1559 by Maharana Udai Singh II, famed for resisting foreign invasion and preserving proud Rajput traditions.',
    culturalTips: ['Watch the sunset from Ambrai Ghat or a rooftop cafe over Lake Pichola.', 'Attend Dharohar folk dance show at Bagore Ki Haveli.'],
    dosAndDonts: {
      dos: ['Take a evening boat ride around Jag Mandir', 'Dine at a lake-facing candlelit terrace'],
      donts: ['Swim in Lake Pichola']
    },
    topAttractions: [
      { name: 'Udaipur City Palace', type: 'Palace Museum', rating: 4.9, image: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?q=80&w=400&auto=format&fit=crop', fee: '₹300' },
      { name: 'Lake Pichola', type: 'Scenic Lake', rating: 4.9, image: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?q=80&w=400&auto=format&fit=crop', fee: 'Free' }
    ]
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    country: 'India',
    region: 'North',
    tagline: 'Spiritual heart of India along the sacred River Ganges',
    description: 'One of the world’s oldest continuously inhabited cities. Experience mesmerising evening Ganga Aarti at Dashashwamedh Ghat, dawn boat rides, and ancient narrow alleys.',
    heroImage: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=800&auto=format&fit=crop'
    ],
    rating: 4.8,
    reviewCount: 3100,
    bestTimeToVisit: 'October to March',
    avgDailyCostINR: 2200,
    popularCategories: ['Spiritual', 'Culture', 'Photography', 'Budget'],
    coordinates: { lat: 25.3176, lng: 82.9739 },
    weather: {
      tempC: 25,
      condition: 'Misty Morning Breeze',
      humidity: 55,
      windKmH: 8,
      uvIndex: 6,
      aqi: 95,
      airQualityLabel: 'Moderate'
    },
    entryFeeDetails: 'Ghat access is free. Morning sunrise boat ride: ₹300 - ₹800 per boat.',
    historySummary: 'Known as Kashi or Benares, Varanasi has been the spiritual focal point of Hindu philosophy, silk weaving, music, and learning for over 3,000 years.',
    culturalTips: ['Maintain respectful silence at Manikarnika Ghat.', 'Taste famous Banarasi Paan, Malaiyyo, and Kachori Sabzi.'],
    dosAndDonts: {
      dos: ['Take a sunrise wooden boat ride from Assi Ghat to Manikarnika', 'Attend the grand 7 PM Ganga Aarti'],
      donts: ['Photograph cremation ceremonies without explicit permission']
    },
    topAttractions: [
      { name: 'Dashashwamedh Ghat Aarti', type: 'Spiritual Ceremony', rating: 5.0, image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=400&auto=format&fit=crop', fee: 'Free' },
      { name: 'Kashi Vishwanath Temple', type: 'Sacred Temple', rating: 4.9, image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=400&auto=format&fit=crop', fee: 'Free' }
    ]
  },
  {
    id: 'manali',
    name: 'Manali',
    state: 'Himachal Pradesh',
    country: 'India',
    region: 'North',
    tagline: 'Valley of the Gods – alpine snows, rivers & thrill sports',
    description: 'Surrounded by pine forests and snow peaks, Manali is a premier hub for paragliding, Solang Valley snow sports, Rohtang Pass, and cozy Old Manali cafes.',
    heroImage: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=800&auto=format&fit=crop'
    ],
    rating: 4.7,
    reviewCount: 3950,
    bestTimeToVisit: 'October to June',
    avgDailyCostINR: 2800,
    popularCategories: ['Mountains', 'Adventure', 'Camping', 'Road Trips'],
    coordinates: { lat: 32.2432, lng: 77.1892 },
    weather: {
      tempC: 18,
      condition: 'Crisp Mountain Breeze',
      humidity: 48,
      windKmH: 11,
      uvIndex: 7,
      aqi: 22,
      airQualityLabel: 'Pristine'
    },
    entryFeeDetails: 'Rohtang Pass green permit: ₹550. Hadimba Temple: Free.',
    historySummary: 'Named after the sage Manu, legend says Manali was recreated as the cradle of human civilization after a deluge.',
    culturalTips: ['Try Siddu (steamed stuffed bread) with pure ghee.', 'Visit Old Manali for bohemian wood-built cafes and live music.'],
    dosAndDonts: {
      dos: ['Visit Atal Tunnel for quick access to Lahaul valley', 'Try river rafting in Beas River at Kullu'],
      donts: ['Drive without snow chains during heavy winter blizzards']
    },
    topAttractions: [
      { name: 'Solang Valley', type: 'Adventure Hub', rating: 4.8, image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=400&auto=format&fit=crop', fee: 'Free entry' },
      { name: 'Atal Tunnel & Sissu', type: 'Scenic Drive', rating: 4.9, image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=400&auto=format&fit=crop', fee: 'Free' }
    ]
  },
  {
    id: 'andaman',
    name: 'Andaman & Nicobar',
    state: 'Andaman',
    country: 'India',
    region: 'Islands',
    tagline: 'Turquoise ocean waters, coral reefs & Radhanagar Beach',
    description: 'Home to Asia’s finest beach (Radhanagar), world-class scuba diving, limestone caves in Baratang, and historic Cellular Jail in Port Blair.',
    heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop'
    ],
    rating: 4.9,
    reviewCount: 2100,
    bestTimeToVisit: 'October to May',
    avgDailyCostINR: 5000,
    popularCategories: ['Beach', 'Adventure', 'Luxury', 'Photography'],
    coordinates: { lat: 11.6234, lng: 92.7265 },
    weather: {
      tempC: 30,
      condition: 'Tropical Island Sunshine',
      humidity: 72,
      windKmH: 15,
      uvIndex: 8,
      aqi: 15,
      airQualityLabel: 'Pristine'
    },
    entryFeeDetails: 'Ferry Port Blair to Havelock: ₹1,200 - ₹2,500. Scuba trial dive: ₹3,500.',
    historySummary: 'Historic exile prison Cellular Jail stands as a monument to India’s freedom fighters amidst paradise islands.',
    culturalTips: ['Book inter-island government or Makruzz catamaran ferries in advance.'],
    dosAndDonts: {
      dos: ['Go night kayaking for bioluminescence in Havelock', 'Snorkel with sea turtles at Elephant Beach'],
      donts: ['Touch coral reefs or take shells from national marine parks']
    },
    topAttractions: [
      { name: 'Radhanagar Beach', type: 'Pristine Beach', rating: 5.0, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop', fee: 'Free' },
      { name: 'Cellular Jail', type: 'Historical Monument', rating: 4.8, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop', fee: '₹30' }
    ]
  }
];

export const TRAVEL_CATEGORIES: TravelCategory[] = [
  { id: 'beach', name: 'Beach & Coastal', iconName: 'Waves', description: 'Sun, soft sand, coral reefs & seaside shacks', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop', popularSpots: ['Goa', 'Andaman', 'Gokarna', 'Varkala', 'Puducherry'], color: 'from-cyan-500 to-blue-600' },
  { id: 'mountains', name: 'Mountains & Snow', iconName: 'Mountain', description: 'High passes, snowy trails & pine air', image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?q=80&w=600&auto=format&fit=crop', popularSpots: ['Leh Ladakh', 'Manali', 'Shimla', 'Gulmarg', 'Spiti Valley'], color: 'from-indigo-600 to-sky-500' },
  { id: 'adventure', name: 'Thrilling Adventure', iconName: 'Zap', description: 'Trekking, paragliding, scuba & white-water rafting', image: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=600&auto=format&fit=crop', popularSpots: ['Rishikesh', 'Solang Valley', 'Bir Billing', 'Dandeli', 'Zanskar'], color: 'from-amber-500 to-orange-600' },
  { id: 'food', name: 'Food & Culinary', iconName: 'Utensils', description: 'Street eats, royal thalis & coastal curries', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=600&auto=format&fit=crop', popularSpots: ['Mumbai', 'Old Delhi', 'Amritsar', 'Kolkata', 'Hyderabad'], color: 'from-emerald-500 to-teal-700' },
  { id: 'photography', name: 'Photography', iconName: 'Camera', description: 'Photogenic palaces, dramatic peaks & colorful bazaars', image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=600&auto=format&fit=crop', popularSpots: ['Jaipur', 'Udaipur', 'Varanasi', 'Hampi', 'Jodhpur'], color: 'from-purple-500 to-pink-600' },
  { id: 'nightlife', name: 'Nightlife & Parties', iconName: 'Moon', description: 'Beach parties, rooftop bars & live music lounges', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop', popularSpots: ['North Goa', 'Mumbai', 'Bengaluru', 'Delhi NCR', 'Chandigarh'], color: 'from-fuchsia-600 to-purple-800' },
  { id: 'family', name: 'Family Vacation', iconName: 'Users', description: 'Kid-friendly resorts, boat rides & theme parks', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=600&auto=format&fit=crop', popularSpots: ['Kerala', 'Ooty', 'Mysuru', 'Darjeeling', 'Coorg'], color: 'from-blue-500 to-teal-500' },
  { id: 'luxury', name: 'Royal Luxury', iconName: 'Sparkles', description: 'Palace hotels, private villas & wellness spas', image: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?q=80&w=600&auto=format&fit=crop', popularSpots: ['Udaipur', 'Jaipur', 'Kumarakom', 'Ranthambore', 'Mussoorie'], color: 'from-amber-400 to-yellow-600' },
  { id: 'budget', name: 'Backpacker Budget', iconName: 'Wallet', description: 'Hostels, local transport & budget eats', image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=600&auto=format&fit=crop', popularSpots: ['Pushkar', 'Kasol', 'Varanasi', 'McLeod Ganj', 'Pondicherry'], color: 'from-green-500 to-emerald-700' },
  { id: 'nature', name: 'Nature & Wildlife', iconName: 'Trees', description: 'National parks, tiger safaris & waterfalls', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=600&auto=format&fit=crop', popularSpots: ['Jim Corbett', 'Kaziranga', 'Kabini', 'Bandhavgarh', 'Munnar'], color: 'from-emerald-600 to-green-800' },
  { id: 'culture', name: 'Heritage & Culture', iconName: 'Landmark', description: 'UNESCO monuments, temples, forts & ruins', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=600&auto=format&fit=crop', popularSpots: ['Hampi', 'Khajuraho', 'Ajanta Ellora', 'Madurai', 'Konark'], color: 'from-orange-500 to-amber-700' },
  { id: 'spiritual', name: 'Spiritual Retreat', iconName: 'Compass', description: 'Ganga Aarti, yoga centers & ancient shrines', image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=600&auto=format&fit=crop', popularSpots: ['Varanasi', 'Rishikesh', 'Amritsar', 'Tirupati', 'Kedarnath'], color: 'from-orange-400 to-red-600' },
  { id: 'roadtrips', name: 'Epic Road Trips', iconName: 'Car', description: 'Scenic highways, coastal drives & mountain passes', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop', popularSpots: ['Manali-Leh Highway', 'ECR Chennai to Pondy', 'Mumbai to Goa', 'Guwahati to Tawang'], color: 'from-slate-600 to-slate-800' },
  { id: 'camping', name: 'Camping & Stargazing', iconName: 'Tent', description: 'Riverside tents, desert camps & clear night skies', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=600&auto=format&fit=crop', popularSpots: ['Jaisalmer Desert', 'Pawna Lake', 'Pangong Tso', 'Rishikesh'], color: 'from-teal-600 to-cyan-800' },
  { id: 'backpacking', name: 'Solo Backpacking', iconName: 'Backpack', description: 'Social hostels, meetups & self-guided trails', image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=600&auto=format&fit=crop', popularSpots: ['Gokarna', 'Hampi', 'Dharamshala', 'Goa', 'Pondicherry'], color: 'from-indigo-500 to-purple-600' }
];

export const FEATURED_HOTELS: Hotel[] = [
  {
    id: 'h1',
    name: 'Taj Lake Palace',
    destination: 'Udaipur',
    type: 'Heritage Palace',
    rating: 4.9,
    reviewsCount: 1240,
    pricePerNightINR: 38000,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop',
    amenities: ['Private Boat Transfer', 'Butler Service', 'Lake View Pool', 'Ayurvedic Spa', 'Fine Dining'],
    locationDesc: 'Floats on Lake Pichola with 360° views of City Palace and Aravalli Hills',
    coordinates: { lat: 24.575, lng: 73.68 },
    isPopular: true
  },
  {
    id: 'h2',
    name: 'Zostel Goa (Anjuna)',
    destination: 'Goa',
    type: 'Backpacker Hostel',
    rating: 4.7,
    reviewsCount: 2890,
    pricePerNightINR: 950,
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=600&auto=format&fit=crop',
    amenities: ['Free High Speed WiFi', 'Swimming Pool', 'Co-working Cafe', 'Social Events', 'Air Conditioned Dorms'],
    locationDesc: '5 mins walk from Anjuna Beach, surrounded by lively cafes and flea markets',
    coordinates: { lat: 15.58, lng: 73.74 },
    isPopular: true
  },
  {
    id: 'h3',
    name: 'Alila Diwa Resort',
    destination: 'Goa',
    type: 'Luxury Resort',
    rating: 4.8,
    reviewsCount: 980,
    pricePerNightINR: 14500,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=600&auto=format&fit=crop',
    amenities: ['Infinity Pool facing Paddy Fields', 'Private Beach Shuttle', 'Kids Club', 'Multiple Restaurants'],
    locationDesc: 'Majorda Beach, South Goa',
    coordinates: { lat: 15.31, lng: 73.91 },
    isPopular: false
  },
  {
    id: 'h4',
    name: 'Grand Hyatt Kochi Bolgatty',
    destination: 'Kerala',
    type: 'Luxury Resort',
    rating: 4.8,
    reviewsCount: 1560,
    pricePerNightINR: 11000,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=600&auto=format&fit=crop',
    amenities: ['Waterfront Marina View', 'Helipad', 'Full Spa', 'Houseboat Tours'],
    locationDesc: 'Bolgatty Island, Kochi',
    coordinates: { lat: 9.98, lng: 76.26 }
  }
];

export const FEATURED_RESTAURANTS: Restaurant[] = [
  {
    id: 'r1',
    name: 'Thalassa Greek Taverna',
    destination: 'Goa',
    cuisine: ['Greek', 'Mediterranean', 'Seafood'],
    type: 'Rooftop Cafe',
    avgMealCostForTwoINR: 2500,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop',
    mustTryDishes: ['Grilled Tiger Prawns', 'Saganaki Cheese', 'Greek Lamb Chops'],
    dietaryTags: ['Vegetarian', 'Halal'],
    address: 'Siolim Waterfront, North Goa'
  },
  {
    id: 'r2',
    name: 'Chokhi Dhani Ethnic Village',
    destination: 'Jaipur',
    cuisine: ['Rajasthani', 'Traditional'],
    type: 'Traditional',
    avgMealCostForTwoINR: 1800,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=600&auto=format&fit=crop',
    mustTryDishes: ['Dal Baati Churma', 'Gatte Ki Sabzi', 'Ker Sangri'],
    dietaryTags: ['Vegetarian', 'Jain'],
    address: '12 Miles, Tonk Road, Jaipur'
  },
  {
    id: 'r3',
    name: 'Ambrai Restaurant',
    destination: 'Udaipur',
    cuisine: ['North Indian', 'Mewari', 'Continental'],
    type: 'Fine Dining',
    avgMealCostForTwoINR: 3200,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=600&auto=format&fit=crop',
    mustTryDishes: ['Laal Maas', 'Mewari Paneer', 'Garlic Naan'],
    dietaryTags: ['Vegetarian', 'Halal'],
    address: 'Amet Haveli, Outside Chandpole, Udaipur'
  }
];

export const MOCK_USER_PROFILE: UserProfile = {
  id: "USR001",
  firstName: "Roshan",
  lastName: "Gorade",
  name: "Roshan Gorade",
  username: "roshan_g",
  email: "roshan@example.com",
  phone: "+91 9876543210",
  profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  gender: "Male",
  dateOfBirth: "2005-08-15",
  country: "India",
  state: "Maharashtra",
  city: "Chhatrapati Sambhajinagar",
  preferredLanguage: "English",
  currency: "INR",
  timeZone: "Asia/Kolkata",
  bio: "Passionate traveler exploring India and the world.",
  memberSince: "2026-01-10",
  verified: true,
  role: "USER",
  visitedDestinationsCount: 14,
  totalKmTraveled: 18450,
  savedTripsCount: 6,
  wishlistCount: 12,
  badges: ['Himalayan Explorer', 'Beach Nomad', 'Foodie Pioneer', 'Cultural Historian']
};

export const MOCK_ADMIN_STATS: AdminStats = {
  totalUsers: 48920,
  activeTripGenerationsToday: 1420,
  revenueThisMonthUSD: 24850,
  topSearchedDestinations: [
    { name: 'Goa', searches: 14200 },
    { name: 'Leh Ladakh', searches: 9800 },
    { name: 'Jaipur', searches: 8400 },
    { name: 'Udaipur', searches: 7200 },
    { name: 'Manali', searches: 6900 }
  ],
  aiModelLatencyMs: 480,
  systemStatus: 'Operational'
};
