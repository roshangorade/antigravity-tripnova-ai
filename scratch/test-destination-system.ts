// scratch/test-destination-system.ts
// Comprehensive automated test suite for TripNova Destination Search & Resolution System

async function runTests() {
  const BASE_URL = 'http://localhost:3000';
  console.log('🚀 Starting Destination System Test Suite against:', BASE_URL);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // TEST SUITE 1: /api/destinations/suggest
  console.log('\n--- SUITE 1: Autocomplete Suggestions (/api/destinations/suggest) ---');
  {
    // Test 1.1: Local dataset prefix match
    const res = await fetch(`${BASE_URL}/api/destinations/suggest?q=Go`);
    const data = await res.json();
    assert(data.success === true, 'Suggest endpoint returns success=true for "Go"');
    assert(Array.isArray(data.suggestions) && data.suggestions.length > 0, 'Returns non-empty suggestions for "Go"');
    const hasGoa = data.suggestions.some((s: any) => s.name.toLowerCase() === 'goa');
    assert(hasGoa, 'Suggestions for "Go" include Goa');
  }

  {
    // Test 1.2: Custom destination prefix match (Mahabaleshwar)
    const res = await fetch(`${BASE_URL}/api/destinations/suggest?q=Mahabal`);
    const data = await res.json();
    assert(data.success === true, 'Suggest endpoint returns success=true for "Mahabal"');
    const hasMaha = data.suggestions.some((s: any) => s.name.toLowerCase().includes('mahabaleshwar'));
    assert(hasMaha, 'Suggestions for "Mahabal" include Mahabaleshwar via live geocoding');
  }

  {
    // Test 1.3: Empty query returns popular suggestions
    const res = await fetch(`${BASE_URL}/api/destinations/suggest?q=`);
    const data = await res.json();
    assert(data.success === true, 'Suggest endpoint returns success=true for empty query');
    assert(data.suggestions.length >= 5, 'Returns top curated suggestions for empty query');
  }

  // TEST SUITE 2: /api/destinations/resolve
  console.log('\n--- SUITE 2: Place & Coordinate Resolution (/api/destinations/resolve) ---');
  {
    // Test 2.1: Local dataset destination (Goa)
    const res = await fetch(`${BASE_URL}/api/destinations/resolve?q=Goa`);
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Resolves "Goa" with 200 OK');
    assert(data.destination.name.toLowerCase() === 'goa', 'Resolved name is Goa');
    assert(data.destination.coordinates && data.destination.coordinates.lat && data.destination.coordinates.lng, 'Coordinates present for Goa');
    assert(data.destination.isCurated === true, 'Goa marked as curated from local dataset');
  }

  {
    // Test 2.2: Case-insensitivity ("gOA", "JAIPUR")
    const resGoaMixed = await fetch(`${BASE_URL}/api/destinations/resolve?q=gOA`);
    const dataGoaMixed = await resGoaMixed.json();
    assert(dataGoaMixed.success === true && dataGoaMixed.destination.name.toLowerCase() === 'goa', 'Case-insensitive "gOA" resolves properly');

    const resJaipurUpper = await fetch(`${BASE_URL}/api/destinations/resolve?q=JAIPUR`);
    const dataJaipurUpper = await resJaipurUpper.json();
    assert(dataJaipurUpper.success === true && dataJaipurUpper.destination.name.toLowerCase() === 'jaipur', 'Case-insensitive "JAIPUR" resolves properly');
  }

  {
    // Test 2.3: Custom Indian destination NOT in dataset (Mahabaleshwar)
    const res = await fetch(`${BASE_URL}/api/destinations/resolve?q=Mahabaleshwar`);
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Resolves custom destination "Mahabaleshwar"');
    assert(data.destination.coordinates.lat > 17 && data.destination.coordinates.lat < 19, 'Coordinates for Mahabaleshwar are accurate (lat ~17.9)');
    assert(data.destination.state === 'Maharashtra', 'Resolved state for Mahabaleshwar is Maharashtra');
  }

  {
    // Test 2.4: Another custom destination (Panchgani)
    const res = await fetch(`${BASE_URL}/api/destinations/resolve?q=Panchgani`);
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Resolves custom destination "Panchgani"');
    assert(data.destination.coordinates.lat > 17 && data.destination.coordinates.lat < 19, 'Coordinates for Panchgani are accurate');
  }

  {
    // Test 2.5: International destination NOT in dataset (Dubai)
    const res = await fetch(`${BASE_URL}/api/destinations/resolve?q=Dubai`);
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Resolves international destination "Dubai"');
    assert(data.destination.coordinates.lat > 24 && data.destination.coordinates.lat < 26, 'Coordinates for Dubai are accurate (lat ~25.07)');
    assert(data.destination.country === 'United Arab Emirates', 'Resolved country for Dubai is UAE');
  }

  {
    // Test 2.6: Blank query rejection
    const res = await fetch(`${BASE_URL}/api/destinations/resolve?q=   `);
    const data = await res.json();
    assert(res.status === 400 && data.success === false, 'Blank query rejected with 400 Bad Request');
  }

  {
    // Test 2.7: Gibberish input gracefully fails with exact required error message
    const res = await fetch(`${BASE_URL}/api/destinations/resolve?q=abcdefxyz12345nonexistentplace`);
    const data = await res.json();
    assert(res.status === 404 && data.success === false, 'Gibberish returns 404');
    assert(
      data.error === "We couldn't identify this destination. Please check the spelling and try again.",
      `Exact required error message returned: "${data.error}"`
    );
    assert(!JSON.stringify(data).includes("dataset"), 'Error does NOT claim place is not in dataset');
  }

  // TEST SUITE 3: Full Downstream Flow with Custom Destination (/api/planner/generate)
  console.log('\n--- SUITE 3: Trip Generation with Custom Destination (/api/planner/generate) ---');
  {
    const tripPayload = {
      origin: 'Mumbai',
      destination: 'Mahabaleshwar',
      durationDays: 3,
      travelersCount: 2,
      budget: 15000,
      travelStyle: 'couple',
      interests: ['Nature', 'Food', 'Relaxation'],
      transportMode: 'Car'
    };

    const res = await fetch(`${BASE_URL}/api/planner/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripPayload)
    });

    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Generates trip for custom destination "Mahabaleshwar"');
    assert(data.itinerary && data.itinerary.destination.toLowerCase().includes('mahabaleshwar'), 'Generated itinerary destination is Mahabaleshwar');
    assert(Array.isArray(data.itinerary.days) && data.itinerary.days.length === 3, 'Generated 3-day itinerary');
    assert(data.itinerary.budget === 15000, `Itinerary respects the flexible budget (15,000 INR, got ${data.itinerary?.budget})`);
    console.log(`  ℹ️ Sample Activity Day 1: ${data.itinerary.days[0]?.activities?.[0]?.title || data.itinerary.days[0]?.morning?.activity || 'N/A'}`);
  }

  // TEST SUITE 4: Personalized Recommendations for Custom Destination
  console.log('\n--- SUITE 4: Personalized Recommendations for Custom Destination ---');
  {
    const recPayload = {
      destination: 'Mahabaleshwar',
      travelStyle: 'couple',
      budget: 12000,
      dietaryPreferences: ['Vegetarian'],
      interests: ['Nature', 'Food'],
      vibe: 'Scenic hill station relaxation with fresh strawberries and serene lake walks',
      nights: 2,
      guestsCount: 2
    };

    const res = await fetch(`${BASE_URL}/api/recommendations/personalized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recPayload)
    });

    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Personalized recommendations return success for "Mahabaleshwar"');
    assert(data.data && Array.isArray(data.data.recommendedHotels), 'Recommendations include stays for custom destination');
    console.log(`  ℹ️ Recommendation headline: ${data.data?.matchOverview?.slice(0, 80) || data.data?.personaTitle}...`);
  }

  console.log(`\n=============================================`);
  console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=============================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
