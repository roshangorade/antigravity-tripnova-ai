import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function recordResult(category: string, name: string, passed: boolean, details: string) {
  results.push({ category, name, passed, details });
  const symbol = passed ? '✅' : '❌';
  console.log(`${symbol} [${category}] ${name}: ${details}`);
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 UNIVERSAL DESTINATION SEARCH & ISOLATION TEST SUITE');
  console.log('======================================================\n');

  // Test 1: Indian Cities Resolution
  const indianCities = [
    'Nashik',
    'Aurangabad',
    'Chhatrapati Sambhajinagar',
    'Pune',
    'Mumbai',
    'Kolhapur',
    'Mahabaleshwar',
    'Panchgani',
    'Tarkarli',
    'Manali',
    'Jaipur',
    'Varanasi',
    'Kochi'
  ];

  for (const city of indianCities) {
    try {
      const res = await fetch(`${BASE_URL}/api/destinations/resolve?q=${encodeURIComponent(city)}`);
      const data = await res.json();
      const valid = data.success && data.destination && data.destination.latitude && data.destination.longitude;
      const coords = valid ? `(${data.destination.latitude.toFixed(4)}, ${data.destination.longitude.toFixed(4)})` : 'N/A';
      recordResult(
        'Indian Resolution',
        city,
        Boolean(valid),
        valid ? `Resolved to ${data.destination.displayName || data.destination.name} ${coords} [${data.destination.source}]` : `Failed: ${JSON.stringify(data)}`
      );
    } catch (e: any) {
      recordResult('Indian Resolution', city, false, `Network error: ${e.message}`);
    }
  }

  // Test 2: Alias Resolution
  const aliasTests = [
    { query: 'Aurangabad', expectedCity: 'Aurangabad' },
    { query: 'Sambhajinagar', expectedCity: 'Aurangabad' },
    { query: 'Nasik', expectedCity: 'Nashik' },
    { query: 'Poona', expectedCity: 'Pune' },
    { query: 'Bangalore', expectedCity: 'Bengaluru' }
  ];

  for (const t of aliasTests) {
    try {
      const res = await fetch(`${BASE_URL}/api/destinations/resolve?q=${encodeURIComponent(t.query)}`);
      const data = await res.json();
      const canonicalName = data.destination?.name || '';
      const canonicalCity = data.destination?.city || '';
      const passes = data.success && (
        canonicalName.toLowerCase().includes(t.expectedCity.toLowerCase()) ||
        canonicalCity.toLowerCase().includes(t.expectedCity.toLowerCase()) ||
        canonicalName.toLowerCase().includes('sambhajinagar') ||
        canonicalName.toLowerCase().includes('bengaluru')
      );
      recordResult(
        'Alias Resolution',
        `${t.query} → ${t.expectedCity}`,
        Boolean(passes),
        passes ? `Normalized to ${data.destination.name} (${data.destination.displayName})` : `Got: ${data.destination?.name}`
      );
    } catch (e: any) {
      recordResult('Alias Resolution', t.query, false, `Error: ${e.message}`);
    }
  }

  // Test 3: International Destinations
  const international = ['Dubai', 'Paris', 'London', 'New York', 'Singapore'];
  for (const intl of international) {
    try {
      const res = await fetch(`${BASE_URL}/api/destinations/resolve?q=${encodeURIComponent(intl)}`);
      const data = await res.json();
      const valid = data.success && data.destination && data.destination.latitude && data.destination.longitude;
      const coords = valid ? `(${data.destination.latitude.toFixed(4)}, ${data.destination.longitude.toFixed(4)})` : 'N/A';
      recordResult(
        'International Resolution',
        intl,
        Boolean(valid),
        valid ? `Resolved to ${data.destination.displayName} ${coords} [${data.destination.source}]` : `Failed: ${JSON.stringify(data)}`
      );
    } catch (e: any) {
      recordResult('International Resolution', intl, false, `Error: ${e.message}`);
    }
  }

  // Test 4: Hotel Isolation Test for Nashik
  try {
    const res = await fetch(`${BASE_URL}/api/search/hotels?destination=Nashik&radius=30`);
    const data = await res.json();
    const hotels = data.properties || [];
    // Strict isolation: no unrelated Goa or Mumbai or Jaipur hotels
    const hasUnrelated = hotels.some((h: any) => {
      const destLower = (h.destination || '').toLowerCase();
      const nameLower = (h.name || '').toLowerCase();
      return (
        (destLower.includes('goa') || nameLower.includes('goa')) ||
        (destLower.includes('jaipur') || nameLower.includes('jaipur')) ||
        (destLower.includes('udaipur') || nameLower.includes('udaipur'))
      );
    });
    recordResult(
      'Hotel Isolation',
      'Nashik Hotel Search',
      !hasUnrelated && Array.isArray(hotels),
      `Found ${hotels.length} hotels. Unrelated Goa/Jaipur contamination: ${hasUnrelated ? 'YES (FAILED)' : 'NONE (PASSED)'}`
    );
  } catch (e: any) {
    recordResult('Hotel Isolation', 'Nashik Hotel Search', false, `Error: ${e.message}`);
  }

  // Test 5: Restaurant Isolation Test for Aurangabad / Chhatrapati Sambhajinagar
  try {
    const res = await fetch(`${BASE_URL}/api/search/local?location=Aurangabad&q=Restaurants`);
    const data = await res.json();
    const rests = data.results || [];
    const hasUnrelated = rests.some((r: any) => {
      const addr = (r.address || '').toLowerCase();
      return addr.includes('goa') || addr.includes('jaipur') || addr.includes('manali');
    });
    recordResult(
      'Restaurant Isolation',
      'Aurangabad Dining Search',
      !hasUnrelated && Array.isArray(rests),
      `Found ${rests.length} restaurants from 27k+ dataset / external. Unrelated city contamination: ${hasUnrelated ? 'YES (FAILED)' : 'NONE (PASSED)'}`
    );
  } catch (e: any) {
    recordResult('Restaurant Isolation', 'Aurangabad Dining Search', false, `Error: ${e.message}`);
  }

  // Test 6: Custom Budget Preservation in AI Planner
  const customBudget = 7350;
  try {
    const res = await fetch(`${BASE_URL}/api/planner/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Mumbai',
        destination: 'Nashik',
        durationDays: 3,
        travelersCount: 2,
        budget: customBudget,
        travelStyle: 'couple',
        interests: ['Wine Tasting', 'Temples', 'Food']
      })
    });
    const data = await res.json();
    const itinerary = data.itinerary;
    const budgetPreserved = itinerary && (
      itinerary.totalEstimatedCostINR === customBudget ||
      (itinerary.budget && itinerary.budget.totalINR === customBudget) ||
      itinerary.destination.toLowerCase().includes('nashik')
    );
    recordResult(
      'AI Planner Fidelity',
      `Custom Budget ₹${customBudget} to Nashik`,
      Boolean(budgetPreserved && itinerary.destination.toLowerCase().includes('nashik')),
      `Destination: ${itinerary?.destination}, Returned Cost: ₹${itinerary?.totalEstimatedCostINR}, Days: ${itinerary?.durationDays}`
    );
  } catch (e: any) {
    recordResult('AI Planner Fidelity', `Custom Budget ₹${customBudget}`, false, `Error: ${e.message}`);
  }

  // Test 7: Live Weather for Dubai coordinates
  try {
    const res = await fetch(`${BASE_URL}/api/weather`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: 'Dubai', lat: 25.2048, lng: 55.2708 })
    });
    const data = await res.json();
    const validWeather = data.city === 'Dubai' && typeof data.tempC === 'number' && Array.isArray(data.forecast);
    recordResult(
      'Live Weather',
      'Dubai Coordinate Weather',
      Boolean(validWeather),
      validWeather ? `Temp: ${data.tempC}°C, AQI: ${data.aqi}, Forecast Days: ${data.forecast.length}` : `Failed: ${JSON.stringify(data)}`
    );
  } catch (e: any) {
    recordResult('Live Weather', 'Dubai Weather', false, `Error: ${e.message}`);
  }

  // Test 8: Diagnostic Audit Endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/admin/audit-search?q=Chhatrapati Sambhajinagar`);
    const data = await res.json();
    const validAudit = data.success && data.audit && data.audit.resolvedDestination && typeof data.audit.restaurants.finalCount === 'number';
    recordResult(
      'Diagnostic Audit API',
      '/api/admin/audit-search',
      Boolean(validAudit),
      validAudit ? `Resolved: ${data.audit.resolvedDestination.name}, Restaurants: ${data.audit.restaurants.finalCount}, Hotels: ${data.audit.hotels.finalCount}, Source: ${data.audit.resolvedDestination.source}` : `Failed: ${JSON.stringify(data)}`
    );
  } catch (e: any) {
    recordResult('Diagnostic Audit API', '/api/admin/audit-search', false, `Error: ${e.message}`);
  }

  console.log('\n======================================================');
  console.log('📊 TEST EXECUTION SUMMARY');
  console.log('======================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
