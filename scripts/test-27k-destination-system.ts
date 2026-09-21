// scripts/test-27k-destination-system.ts
// Comprehensive validation of the 27,000+ destination dataset & search system

import { searchDestinations, resolveDestinationDetails, getRestaurantsForDestination, DESTINATIONS_DB } from '../server.ts';

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

async function runValidation() {
  console.log('======================================================================');
  console.log('🧪 TRIPNOVA.AI: 27,000+ DESTINATION SYSTEM VERIFICATION SUITE');
  console.log('======================================================================\n');

  console.log(`📊 Database Status: Loaded ${DESTINATIONS_DB.length} destinations into searchable memory index.\n`);

  let passed = 0;
  let failed = 0;

  for (const tc of REQUIRED_TEST_CASES) {
    const results = await searchDestinations(tc.query, 5);

    if (!results || results.length === 0) {
      console.error(`❌ FAILED: Query "${tc.query}" returned 0 results.`);
      failed++;
      continue;
    }

    const top = results[0];
    const topNameMatch = top.name.toLowerCase() === tc.expectedNameOrAlias.toLowerCase() ||
                         top.displayName.toLowerCase().includes(tc.expectedNameOrAlias.toLowerCase()) ||
                         (top.alternateNames && top.alternateNames.some(a => a.toLowerCase() === tc.expectedNameOrAlias.toLowerCase()));

    if (!topNameMatch) {
      console.error(`❌ FAILED: Query "${tc.query}" expected "${tc.expectedNameOrAlias}" but got "${top.name}" (${top.displayName})`);
      failed++;
      continue;
    }

    // Verify Normalized Structure
    const hasValidCoords = typeof top.latitude === 'number' && typeof top.longitude === 'number';
    const hasSource = Boolean(top.source);

    if (!hasValidCoords || !hasSource) {
      console.error(`❌ FAILED: Query "${tc.query}" result is missing normalized coordinates or source badge!`, top);
      failed++;
      continue;
    }

    console.log(`✅ PASSED [${tc.testType.padEnd(16)}]: "${tc.query}" -> ${top.name} [${top.latitude}, ${top.longitude}] (${top.source})`);
    passed++;
  }

  // Verify Resolution endpoint behavior
  console.log('\n--- Testing resolveDestinationDetails ---');
  const resolvedSambhajinagar = await resolveDestinationDetails('Aurangabad');
  if (resolvedSambhajinagar && (resolvedSambhajinagar.name.includes('Sambhajinagar') || resolvedSambhajinagar.displayName.includes('Aurangabad'))) {
    console.log(`✅ PASSED: resolveDestinationDetails("Aurangabad") -> ${resolvedSambhajinagar.displayName} [lat: ${resolvedSambhajinagar.latitude}, lng: ${resolvedSambhajinagar.longitude}]`);
    passed++;
  } else {
    console.error('❌ FAILED: resolveDestinationDetails("Aurangabad")', resolvedSambhajinagar);
    failed++;
  }

  const resolvedNashik = await resolveDestinationDetails('Nashik, Maharashtra');
  if (resolvedNashik && resolvedNashik.name === 'Nashik') {
    console.log(`✅ PASSED: resolveDestinationDetails("Nashik, Maharashtra") -> ${resolvedNashik.displayName} [lat: ${resolvedNashik.latitude}, lng: ${resolvedNashik.longitude}]`);
    passed++;
  } else {
    console.error('❌ FAILED: resolveDestinationDetails("Nashik, Maharashtra")', resolvedNashik);
    failed++;
  }

  // Verify Indian Restaurants 27k cross-referencing
  console.log('\n--- Testing 27,657 Indian Restaurants Dataset Cross-Referencing ---');
  const puneRestaurants = await getRestaurantsForDestination('Pune');
  console.log(`📊 Found ${puneRestaurants.count} local restaurants for "Pune" in CSV dataset.`);
  if (puneRestaurants.count > 0) {
    console.log(`✅ PASSED: Sample Pune restaurant: ${puneRestaurants.results[0].name} (${puneRestaurants.results[0].category})`);
    passed++;
  } else {
    console.error('❌ FAILED: No restaurants found for Pune in CSV dataset');
    failed++;
  }

  const bangaloreRestaurants = await getRestaurantsForDestination('Bangalore');
  console.log(`📊 Found ${bangaloreRestaurants.count} local restaurants for "Bangalore" in CSV dataset.`);
  if (bangaloreRestaurants.count > 0) {
    console.log(`✅ PASSED: Sample Bangalore restaurant: ${bangaloreRestaurants.results[0].name} (${bangaloreRestaurants.results[0].category})`);
    passed++;
  } else {
    console.error('❌ FAILED: No restaurants found for Bangalore in CSV dataset');
    failed++;
  }

  console.log('\n======================================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runValidation().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
