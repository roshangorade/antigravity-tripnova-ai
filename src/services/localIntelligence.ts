import { GoogleGenAI } from '@google/genai';

// 1. Trending Public Events / Local Intelligence
export const getTrendingEvents = async (location?: string) => {
  // In a real app, integrate an Events/News API here.
  // Example: if (process.env.EVENTS_API_KEY) { ... }
  
  return [
    {
      id: 'e1',
      title: 'Food Festival',
      location: 'Pune, Maharashtra',
      description: 'A grand celebration of Maharashtrian cuisine featuring over 100 local stalls.',
      type: 'food_festival',
      date: 'This Weekend',
      source: 'Publicly reported event'
    },
    {
      id: 'e2',
      title: 'Major Music Concert',
      location: 'Mumbai, Maharashtra',
      description: 'Publicly announced performance by top indie artists.',
      type: 'concert',
      date: 'Upcoming Friday',
      source: 'Publicly reported appearance'
    },
    {
      id: 'e3',
      title: 'Kala Ghoda Arts Festival',
      location: 'Mumbai, Maharashtra',
      description: 'Annual cultural festival showcasing art, craft, and literature.',
      type: 'festival',
      date: 'February',
      source: 'Public announcement'
    }
  ];
};

// 2. Travel & Road Alerts
export const getTravelAlerts = async (location?: string) => {
  // In a real app, integrate Traffic/Weather API here.
  
  return [
    {
      id: 'a1',
      title: 'Heavy traffic reported on Mumbai-Pune Expressway',
      type: 'traffic',
      severity: 'moderate',
      message: 'TripNova recommends checking alternative routes if travelling during peak hours.',
      status: 'Demo Data'
    },
    {
      id: 'a2',
      title: 'Heavy Rainfall Warning',
      type: 'weather',
      severity: 'high',
      message: 'Coastal areas expected to receive heavy rainfall over the next 48 hours. Drive safely.',
      status: 'Static Info'
    }
  ];
};

// 3. AI Food Recommendation
export const getAIFoodRecommendation = async (prompt: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return getFallbackFoodRecommendation(prompt);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are a local food expert in India. The user will ask for food recommendations.
      Provide a highly relevant restaurant/food recommendation based on their query (cuisine, budget, location, dietary).
      Return ONLY a valid JSON object matching this schema:
      {
        "restaurantName": "String",
        "cuisine": "String",
        "estimatedPrice": "String (e.g. ₹500 for two)",
        "rating": "Number (e.g. 4.5)",
        "distance": "String (e.g. 2 km away)",
        "whyWeRecommend": "String explaining why it matches their prompt",
        "isRealAPI": false
      }`;
      
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return { ...parsed, isRealAPI: false, status: 'AI Generated (Demo Data)' };
  } catch (err) {
    console.error('AI Food error:', err);
    return getFallbackFoodRecommendation(prompt);
  }
};

const getFallbackFoodRecommendation = (prompt: string) => {
  return {
    restaurantName: "Local Spices Cafe",
    cuisine: "Maharashtrian / Thali",
    estimatedPrice: "₹400 for two",
    rating: 4.4,
    distance: "1.5 km away",
    whyWeRecommend: "Based on your request, this place offers great authentic food at a budget-friendly price. (Fallback Data)",
    isRealAPI: false,
    status: 'Demo Data'
  };
};

// 4. Smart Route Recommendation
export const getSmartRoute = async (origin: string, destination: string) => {
  // Abstracted for future Maps/Routing API integration
  return {
    recommendedRoute: 'Route B',
    routes: [
      {
        id: 'Route A',
        distance: '145 km',
        time: '3h 20m',
        traffic: 'Heavy',
        weather: 'Clear',
        safety: 'Good',
        isRecommended: false
      },
      {
        id: 'Route B',
        distance: '158 km',
        time: '3h 05m',
        traffic: 'Moderate',
        weather: 'Clear',
        safety: 'Good',
        isRecommended: true
      }
    ],
    reason: 'Route B is recommended because it is 15 minutes faster despite being slightly longer. Traffic is noticeably lighter.'
  };
};

// 5. State-Wise Food Discovery
export const getStateWiseFood = async (state: string, city: string) => {
  // In a real app, query a DB or Zomato/Yelp API
  return [
    {
      id: 'f1',
      name: 'Misal Pav Joint',
      category: 'Street food',
      budget: '₹',
      rating: 4.6,
      distance: '2 km'
    },
    {
      id: 'f2',
      name: 'Royal Maratha Thali',
      category: 'Maharashtrian',
      budget: '₹₹',
      rating: 4.3,
      distance: '5 km'
    },
    {
      id: 'f3',
      name: 'Vegan Cafe Mumbai',
      category: 'Vegan',
      budget: '₹₹₹',
      rating: 4.7,
      distance: '1.2 km'
    }
  ];
};

// 6. User Feedback Storage (In-Memory for now, to be integrated to DB later)
export const feedbackStorage: any[] = [];
export const submitFeedback = async (data: any) => {
  feedbackStorage.push({ ...data, id: Date.now(), createdAt: new Date().toISOString() });
  return { success: true, message: 'Feedback stored successfully' };
};
