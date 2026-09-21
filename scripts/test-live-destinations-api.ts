// scripts/test-live-destinations-api.ts
// Live HTTP end-to-end testing against the running server

interface TestCase {
  query: string;
  expectedNameOrAlias: string;
  expectedState?: string;
  expectedCountry?: string;
  testType: 'exact' | 'partial' | 'alternate' | 'case_insensitive' | 'comma_state' | 'global';
}

const REQUIRED_TEST_CASES: TestCase[] = [
  // 1. Core Maharashtra Destinations
  { query: 'Nashik', expectedNameOrAlias: 'Nashik', expectedState: 'Maharashtra', testType: 'exact' },
  { query: 'Nashik, Maharashtra', expectedNameOrAlias: 'Nashik', expectedState: 'Maharashtra', testType: 'comma_state' },
  { query: 'Aurangabad', expectedNameOrAlias: 'Chhatrapati Sambhajinagar', expectedState: 'Maharashtra', testType: 'alternate' },
  { query: 'Chhatrapati Sambhajinagar', expectedNameOrAlias: 'Chhatrapati Sambhajinagar', expectedState: 'Maharashtra', testType: 'exact' },
  { query: 'Sambhajinagar', expectedNameOrAlias: 'Chhatrapati Sambhajinagar', expectedState: 'Maharashtra', testType: 'alternate' },
  { query: 'Pune', expectedNameOrAlias: 'Pune', expectedState: 'Maharashtra', testType: 'exact' },
  { query: 'Kolhapur', expectedNameOrAlias: 'Kolhapur', expectedState: 'Maharashtra', testType: 'exact' },
  { query: 'Mahabaleshwar', expectedNameOrAlias: 'Mahabaleshwar', expectedState: 'Maharashtra', testType: 'exact' },
  { query: 'Panchgani', expectedNameOrAlias: 'Panchgani', expectedState: 'Maharashtra', testType: 'exact' },
  { query: 'Lonavala', expectedNameOrAlias: 'Lonavala', expectedState: 'Maharashtra', testType: 'exact' },
  { query: 'Alibaug', expectedNameOrAlias: 'Alibaug', expectedState: 'Maharashtra', testType: 'exact' },
  { query: 'Nagpur', expectedNameOrAlias: 'Nagpur', expectedState: 'Maharashtra', testType: 'exact' },
  { query: 'Nanded', expectedNameOrAlias: 'Nanded', expectedState: 'Maharashtra', testType: 'exact' },

  // 2. Premier Indian Metros & Travel Centers
  { query: 'Delhi', expectedNameOrAlias: 'Delhi', testType: 'exact' },
  { query: 'Bengaluru', expectedNameOrAlias: 'Bengaluru', testType: 'exact' },
  { query: 'Hyderabad', expectedNameOrAlias: 'Hyderabad', testType: 'exact' },
  { query: 'Varanasi', expectedNameOrAlias: 'Varanasi', testType: 'exact' },
  { query: 'Darjeeling', expectedNameOrAlias: 'Darjeeling', testType: 'exact' },
  { query: 'Rishikesh', expectedNameOrAlias: 'Rishikesh', testType: 'exact' },

  // 3. International Travel Hubs
  { query: 'Dubai', expectedNameOrAlias: 'Dubai', expectedCountry: 'United Arab Emirates', testType: 'global' },
  { query: 'Paris', expectedNameOrAlias: 'Paris', expectedCountry: 'France', testType: 'global' },
  { query: 'Tokyo', expectedNameOrAlias: 'Tokyo', expectedCountry: 'Japan', testType: 'global' },
  { query: 'London', expectedNameOrAlias: 'London', expectedCountry: 'United Kingdom', testType: 'global' },
  { query: 'New York', expectedNameOrAlias: 'New York', expectedCountry: 'United States', testType: 'global' },

  // 4. Prefix & Partial Searches
  { query: 'Nash', expectedNameOrAlias: 'Nashik', testType: 'partial' },
  { query: 'Auranga', expectedNameOrAlias: 'Chhatrapati Sambhajinagar', testType: 'partial' },
  { query: 'Chhatrapati', expectedNameOrAlias: 'Chhatrapati Sambhajinagar', testType: 'partial' },
  { query: 'Sambhaji', expectedNameOrAlias: 'Chhatrapati Sambhajinagar', testType: 'partial' },
  { query: 'Darjeel', expectedNameOrAlias: 'Darjeeling', testType: 'partial' },
  { query: 'Rishi', expectedNameOrAlias: 'Rishikesh', testType: 'partial' },

  // 5. Case-insensitivity & Whitespace
  { query: '   nAsHiK  ', expectedNameOrAlias: 'Nashik', testType: 'case_insensitive' },
  { query: 'pUnE', expectedNameOrAlias: 'Pune', testType: 'case_insensitive' },
  { query: 'sAmBhAjInAgAr', expectedNameOrAlias: 'Chhatrapati Sambhajinagar', testType: 'case_insensitive' },
  { query: 'dUbaI', expectedNameOrAlias: 'Dubai', testType: 'case_insensitive' }
];

const BASE_URL = 'http://127.0.0.1:3000';

async function runLiveTests() {
  console.log('======================================================================');
  console.log('🌐 TRIPNOVA.AI: LIVE HTTP ENDPOINT VALIDATION');
  console.log(`📡 Testing against: ${BASE_URL}`);
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  for (const tc of REQUIRED_TEST_CASES) {
    try {
      const res = await fetch(`${BASE_URL}/api/destinations/search?q=${encodeURIComponent(tc.query)}&limit=5`);
      if (!res.ok) {
        console.error(`❌ HTTP ERROR ${res.status} for query "${tc.query}"`);
        failed++;
        continue;
      }
      const data = await res.json();
      if (!data.success || !Array.isArray(data.destinations) || data.destinations.length === 0) {
        console.error(`❌ FAILED: Query "${tc.query}" returned 0 destinations:`, data);
        failed++;
        continue;
      }

      const top = data.destinations[0];
      const topNameMatch = top.name.toLowerCase() === tc.expectedNameOrAlias.toLowerCase() ||
                           top.displayName.toLowerCase().includes(tc.expectedNameOrAlias.toLowerCase()) ||
                           (top.alternateNames && top.alternateNames.some((a: string) => a.toLowerCase() === tc.expectedNameOrAlias.toLowerCase()));

      if (!topNameMatch) {
        console.error(`❌ FAILED: Query "${tc.query}" expected "${tc.expectedNameOrAlias}" but top result was "${top.name}" (${top.displayName})`);
        failed++;
        continue;
      }

      // Check normalized fields
      const hasCoords = typeof top.latitude === 'number' && typeof top.longitude === 'number' &&
                        top.coordinates && typeof top.coordinates.lat === 'number' && typeof top.coordinates.lng === 'number';
      const hasSource = top.source === 'dataset' || top.source === 'geocoding';

      if (!hasCoords || !hasSource) {
        console.error(`❌ FAILED: Query "${tc.query}" result is missing coordinates or source:`, top);
        failed++;
        continue;
      }

      console.log(`✅ PASSED [${tc.testType.padEnd(16)}]: "${tc.query}" -> ${top.name} (${top.displayName}) [${top.coordinates.lat}, ${top.coordinates.lng}] source: ${top.source}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ FAILED with exception for query "${tc.query}":`, err.message);
      failed++;
    }
  }

  // Test /api/destinations/resolve
  console.log('\n--- Testing /api/destinations/resolve ---');
  const resolveTests = [
    { input: 'Aurangabad', expected: 'Chhatrapati Sambhajinagar' },
    { input: 'Nashik, Maharashtra', expected: 'Nashik' },
    { input: 'Dubai', expected: 'Dubai' }
  ];

  for (const rt of resolveTests) {
    try {
      const res = await fetch(`${BASE_URL}/api/destinations/resolve?q=${encodeURIComponent(rt.input)}`);
      const data = await res.json();
      if (data.success && data.resolved && data.destination) {
        const d = data.destination;
        const matched = d.name.toLowerCase().includes(rt.expected.toLowerCase()) ||
                        d.displayName.toLowerCase().includes(rt.expected.toLowerCase()) ||
                        (d.alternateNames && d.alternateNames.some((a: string) => a.toLowerCase().includes(rt.expected.toLowerCase())));
        if (matched && d.coordinates?.lat && d.coordinates?.lng) {
          console.log(`✅ PASSED: resolve("${rt.input}") -> ${d.name} (${d.displayName}) [${d.coordinates.lat}, ${d.coordinates.lng}]`);
          passed++;
        } else {
          console.error(`❌ FAILED: resolve("${rt.input}") did not match "${rt.expected}"`, d);
          failed++;
        }
      } else {
        console.error(`❌ FAILED: resolve("${rt.input}") returned`, data);
        failed++;
      }
    } catch (err: any) {
      console.error(`❌ FAILED resolve("${rt.input}"):`, err.message);
      failed++;
    }
  }

  // Test /api/restaurants with 27,657 CSV dataset
  console.log('\n--- Testing /api/restaurants Destination Cross-Referencing ---');
  try {
    const res = await fetch(`${BASE_URL}/api/restaurants?destination=Pune`);
    const data = await res.json();
    if (data.success && Array.isArray(data.restaurants) && data.restaurants.length > 0) {
      console.log(`✅ PASSED: /api/restaurants?destination=Pune returned ${data.restaurants.length} restaurants! Sample: ${data.restaurants[0].name}`);
      passed++;
    } else {
      console.error('❌ FAILED: /api/restaurants?destination=Pune', data);
      failed++;
    }
  } catch (err: any) {
    console.error('❌ FAILED restaurant test:', err.message);
    failed++;
  }

  console.log('\n======================================================================');
  console.log(`🏁 LIVE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveTests();
