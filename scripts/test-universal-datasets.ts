// scripts/test-universal-datasets.ts
// Tests generic dynamic dataset search across multiple real destinations and verifies zero contamination on non-existent destinations.

process.env.NODE_ENV = 'test';
process.env.DISABLE_SERVER_LISTEN = 'true';

import { getHotelsForDestination, getRestaurantsForDestination } from '../server.ts';

const ALIAS_MAP: Record<string, string[]> = {
  'pune': ['pune', 'poona'],
  'nashik': ['nashik', 'nasik', 'nashik road', 'panchavati'],
  'aurangabad': ['aurangabad', 'chhatrapati sambhajinagar', 'sambhajinagar'],
  'chhatrapati sambhajinagar': ['aurangabad', 'chhatrapati sambhajinagar', 'sambhajinagar'],
  'mumbai': ['mumbai', 'bombay'],
  'jaipur': ['jaipur'],
  'kolhapur': ['kolhapur'],
  'mahabaleshwar': ['mahabaleshwar'],
  'panchgani': ['panchgani'],
  'tarkarli': ['tarkarli', 'malvan'],
  'delhi': ['delhi', 'new delhi', 'ncr'],
  'bengaluru': ['bengaluru', 'bangalore'],
  'agra': ['agra']
};

function getAliases(name: string): string[] {
  const norm = name.toLowerCase().trim();
  return ALIAS_MAP[norm] || [norm];
}

async function runUniversalDatasetTests() {
  console.log('================================================================');
  console.log('🧪 UNIVERSAL DYNAMIC DATASET SEARCH & INTEGRITY VERIFICATION');
  console.log('================================================================\n');

  const testDestinations = [
    { name: 'Pune', expectHotels: true, expectRest: true },
    { name: 'Nashik', expectHotels: true, expectRest: true },
    { name: 'Aurangabad', expectHotels: true, expectRest: true },
    { name: 'Chhatrapati Sambhajinagar', expectHotels: true, expectRest: true },
    { name: 'Mumbai', expectHotels: true, expectRest: true },
    { name: 'Jaipur', expectHotels: true, expectRest: true },
    { name: 'Kolhapur', expectHotels: true, expectRest: true },
    { name: 'Mahabaleshwar', expectHotels: true, expectRest: true },
    { name: 'Panchgani', expectHotels: true, expectRest: true },
    { name: 'Tarkarli', expectHotels: true, expectRest: true },
    { name: 'Delhi', expectHotels: true, expectRest: true },
    { name: 'Bengaluru', expectHotels: true, expectRest: true },
    { name: 'Agra', expectHotels: true, expectRest: true },
    // Negative test: destination not in dataset
    { name: 'AtlantisCity999', expectHotels: false, expectRest: false }
  ];

  let passed = 0;
  let total = 0;

  for (const test of testDestinations) {
    total += 2;
    console.log(`\n🔍 Testing Destination: "${test.name}"`);
    const validAliases = getAliases(test.name);

    // 1. Hotel Search
    const hotelResult = await getHotelsForDestination(test.name);
    console.log(`  🏨 Hotels Found: ${hotelResult.count} (Source: ${hotelResult.source})`);

    // Verify isolation: ensure no other city's hotel is returned
    const invalidHotels = hotelResult.properties.filter(h => {
      const dest = (h.destination || '').toLowerCase();
      const loc = (h.location || '').toLowerCase();
      const name = (h.name || '').toLowerCase();
      return !validAliases.some(a => dest.includes(a) || a.includes(dest) || loc.includes(a) || name.includes(a));
    });

    if (test.expectHotels) {
      if (hotelResult.count > 0 && invalidHotels.length === 0) {
        console.log(`  ✅ Hotels Test PASSED: Found ${hotelResult.count} hotels for ${test.name}`);
        passed++;
      } else {
        console.error(`  ❌ Hotels Test FAILED: Found ${hotelResult.count} hotels, ${invalidHotels.length} contaminated`);
      }
    } else {
      if (hotelResult.count === 0) {
        console.log(`  ✅ Hotels Negative Isolation Test PASSED: 0 hotels for non-existent ${test.name}`);
        passed++;
      } else {
        console.error(`  ❌ Hotels Negative Isolation Test FAILED: Unexpectedly found ${hotelResult.count} hotels`);
      }
    }

    // 2. Restaurant Search
    const restResult = await getRestaurantsForDestination(test.name);
    console.log(`  🍽️ Restaurants Found: ${restResult.count} (Source: ${restResult.source})`);

    const invalidRest = restResult.results.filter(r => {
      const dest = (r.destination || '').toLowerCase();
      const addr = (r.address || '').toLowerCase();
      const name = (r.name || '').toLowerCase();
      return !validAliases.some(a => dest.includes(a) || a.includes(dest) || addr.includes(a) || name.includes(a));
    });

    if (test.expectRest) {
      if (restResult.count > 0 && invalidRest.length === 0) {
        console.log(`  ✅ Restaurant Test PASSED: Found ${restResult.count} restaurants for ${test.name}`);
        passed++;
      } else {
        console.error(`  ❌ Restaurant Test FAILED: Found ${restResult.count} restaurants, ${invalidRest.length} contaminated`);
      }
    } else {
      if (restResult.count === 0) {
        console.log(`  ✅ Restaurant Negative Isolation Test PASSED: 0 restaurants for non-existent ${test.name}`);
        passed++;
      } else {
        console.error(`  ❌ Restaurant Negative Isolation Test FAILED: Unexpectedly found ${restResult.count} restaurants`);
      }
    }
  }

  console.log('\n================================================================');
  console.log(`📊 TEST RESULTS: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runUniversalDatasetTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
