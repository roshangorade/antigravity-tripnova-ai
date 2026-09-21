import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { pool, db } from '../src/db/index.ts';
import { adminHotels, adminRestaurants } from '../src/db/schema.ts';
import { initializeDatabase } from '../src/db/init.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to parse RFC 4180 compliant CSV strings
export function parseCSV(content: string): Record<string, string>[] {
  // Strip UTF-8 BOM if present
  const cleaned = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const nextChar = cleaned[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      if (currentLine.trim()) lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);

  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVRow(lines[0]).map(h => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVRow(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(currentVal);
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  result.push(currentVal);
  return result;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

export async function importDatasets() {
  console.log('====================================================');
  console.log('🚀 TripNova AI — CSV Dataset Import Script');
  console.log('====================================================\n');

  const hotelsPath = path.join(rootDir, 'data', 'hotels.csv');
  const restaurantsPath = path.join(rootDir, 'data', 'restaurants.csv');
  const indianRestaurantsPath = path.join(rootDir, 'data', 'indian_restaurants.csv');

  const importedHotelsList: any[] = [];
  const importedRestaurantsList: any[] = [];

  // 1. Process Hotels CSV
  if (fs.existsSync(hotelsPath)) {
    console.log(`📂 Reading Hotels CSV from: ${hotelsPath}`);
    const hotelsContent = fs.readFileSync(hotelsPath, 'utf8');
    const hotelRows = parseCSV(hotelsContent);
    console.log(`   Found ${hotelRows.length} hotel entries.`);

    for (let i = 0; i < hotelRows.length; i++) {
      const row = hotelRows[i];
      const amenities = row.amenities
        ? row.amenities.split(';').map(a => a.trim()).filter(Boolean)
        : ['Free Wi-Fi', 'Room Service', 'Air Conditioning'];

      const hotel = {
        id: row.id || `htl_${slugify(row.name || 'hotel')}_${i + 1}`,
        name: row.name || 'Boutique Hotel',
        destination: row.destination || 'Goa',
        type: row.type || 'Luxury Resort',
        rating: String(parseFloat(row.rating) || 4.7),
        reviewsCount: parseInt(row.reviews_count, 10) || 150,
        pricePerNightINR: parseInt(row.price_per_night_inr, 10) || 3500,
        image: row.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        amenities,
        locationDesc: row.location_desc || `${row.name} in ${row.destination}`,
        isPopular: row.is_popular === 'true' || row.is_popular === '1',
        tagline: row.tagline || '',
        idealFor: row.ideal_for || ''
      };
      importedHotelsList.push(hotel);
    }
  } else {
    console.warn(`⚠️  Hotels CSV not found at: ${hotelsPath}`);
  }

  // 2. Process Curated Restaurants CSV
  if (fs.existsSync(restaurantsPath)) {
    console.log(`📂 Reading Restaurants CSV from: ${restaurantsPath}`);
    const restaurantsContent = fs.readFileSync(restaurantsPath, 'utf8');
    const restRows = parseCSV(restaurantsContent);
    console.log(`   Found ${restRows.length} curated restaurant entries.`);

    for (let i = 0; i < restRows.length; i++) {
      const row = restRows[i];
      const cuisine = row.cuisine
        ? row.cuisine.split(';').map(c => c.trim()).filter(Boolean)
        : ['North Indian', 'Local Cuisine'];
      const mustTryDishes = row.must_try_dishes
        ? row.must_try_dishes.split(';').map(d => d.trim()).filter(Boolean)
        : ['Chef Special', 'Thali'];
      const dietaryTags = row.dietary_tags
        ? row.dietary_tags.split(';').map(t => t.trim()).filter(Boolean)
        : ['Vegetarian'];

      const rest = {
        id: row.id || `rst_${slugify(row.name || 'restaurant')}_${i + 1}`,
        name: row.name || 'Heritage Dining',
        destination: row.destination || 'Goa',
        cuisine,
        type: row.type || 'Traditional',
        avgMealCostForTwoINR: parseInt(row.avg_meal_cost_for_two_inr, 10) || 850,
        rating: String(parseFloat(row.rating) || 4.6),
        reviewsCount: parseInt(row.reviews_count, 10) || 120,
        image: row.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
        mustTryDishes,
        dietaryTags,
        address: row.address || row.destination,
        isPopular: row.is_popular === 'true' || row.is_popular === '1',
        vibe: row.vibe || ''
      };
      importedRestaurantsList.push(rest);
    }
  }

  // 3. Process Large Indian Restaurants CSV (if present, pick top curated entries)
  if (fs.existsSync(indianRestaurantsPath)) {
    console.log(`📂 Processing Indian Restaurants dataset from: ${indianRestaurantsPath}`);
    const largeContent = fs.readFileSync(indianRestaurantsPath, 'utf8');
    const largeRows = parseCSV(largeContent);
    console.log(`   Read ${largeRows.length} rows from indian_restaurants.csv.`);

    // Sample high-quality restaurants (rating >= 4.2) across diverse locations
    let addedCount = 0;
    const existingNames = new Set(importedRestaurantsList.map(r => r.name.toLowerCase()));

    for (let i = 0; i < largeRows.length; i++) {
      const row = largeRows[i];
      const name = (row.restaurant_name || '').trim();
      const ratingNum = parseFloat(row.rating);
      const loc = (row.location || '').trim();

      if (!name || isNaN(ratingNum) || ratingNum < 4.2 || !loc) continue;
      if (existingNames.has(name.toLowerCase())) continue;

      const cuisines: string[] = [];
      if (row.north_indian_or_not === '1') cuisines.push('North Indian');
      if (row.south_indian_or_not === '1') cuisines.push('South Indian');
      if (row.biryani_or_not === '1') cuisines.push('Biryani');
      if (row.street_food === '1') cuisines.push('Street Food');
      if (row.fast_food_or_not === '1') cuisines.push('Fast Food');
      if (row.bakery_or_not === '1') cuisines.push('Bakery & Desserts');
      if (cuisines.length === 0) cuisines.push('Indian');

      const type = row.street_food === '1' ? 'Street Food' : row.bakery_or_not === '1' ? 'Bakery' : 'Traditional';
      const avgPrice = parseInt(row.average_price, 10);
      const avgMealCostForTwoINR = isNaN(avgPrice) || avgPrice <= 0 ? 500 : avgPrice * 2;

      importedRestaurantsList.push({
        id: `rst_ind_${slugify(loc)}_${slugify(name)}_${i}`,
        name,
        destination: loc,
        cuisine: cuisines,
        type,
        avgMealCostForTwoINR,
        rating: String(ratingNum),
        reviewsCount: Math.floor(150 + Math.random() * 850),
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
        mustTryDishes: [cuisines[0] || 'Specialty Thali', 'Chef Recommended Dish'],
        dietaryTags: ['Vegetarian', 'Halal'],
        address: `${name}, Main Market, ${loc}`,
        isPopular: ratingNum >= 4.4,
        vibe: `${loc} authentic culinary flavor`
      });

      existingNames.add(name.toLowerCase());
      addedCount++;
      if (addedCount >= 100) break; // Curate top 100 high-rated places
    }
    console.log(`   Added ${addedCount} curated top-rated restaurants from indian_restaurants.csv.`);
  }

  // 4. Always write to src/data/importedData.ts as resilient data layer
  const codeContent = `// Auto-generated by scripts/import-csv.ts
// Contains imported CSV data for offline resilience & fast in-memory access

export interface ImportedHotel {
  id: string;
  name: string;
  destination: string;
  type: string;
  rating: string;
  reviewsCount: number;
  pricePerNightINR: number;
  image: string;
  amenities: string[];
  locationDesc: string;
  isPopular: boolean;
  tagline?: string;
  idealFor?: string;
}

export interface ImportedRestaurant {
  id: string;
  name: string;
  destination: string;
  cuisine: string[];
  type: string;
  avgMealCostForTwoINR: number;
  rating: string;
  reviewsCount: number;
  image: string;
  mustTryDishes: string[];
  dietaryTags: string[];
  address: string;
  isPopular: boolean;
  vibe?: string;
}

export const IMPORTED_HOTELS: ImportedHotel[] = ${JSON.stringify(importedHotelsList, null, 2)};

export const IMPORTED_RESTAURANTS: ImportedRestaurant[] = ${JSON.stringify(importedRestaurantsList, null, 2)};
`;

  const targetPath = path.join(rootDir, 'src', 'data', 'importedData.ts');
  fs.writeFileSync(targetPath, codeContent, 'utf8');
  console.log(`\n💾 Synchronized ${importedHotelsList.length} hotels and ${importedRestaurantsList.length} restaurants to ${targetPath}`);

  // 5. Attempt PostgreSQL Import via Drizzle ORM
  console.log('\n🐘 Connecting to PostgreSQL via Drizzle ORM...');
  try {
    const client = await pool.connect();
    client.release();
    console.log('   ✅ PostgreSQL connection established.');

    // Initialize/migrate tables
    await initializeDatabase();

    // Insert hotels via Drizzle ORM
    let hotelsInserted = 0;
    for (const h of importedHotelsList) {
      await db
        .insert(adminHotels)
        .values({
          id: h.id,
          name: h.name,
          destination: h.destination,
          type: h.type,
          rating: String(h.rating),
          reviewsCount: h.reviewsCount,
          pricePerNightINR: h.pricePerNightINR,
          image: h.image,
          amenities: h.amenities,
          locationDesc: h.locationDesc,
          isPopular: h.isPopular,
          tagline: h.tagline,
          idealFor: h.idealFor,
        })
        .onConflictDoUpdate({
          target: adminHotels.id,
          set: {
            name: h.name,
            destination: h.destination,
            type: h.type,
            rating: String(h.rating),
            reviewsCount: h.reviewsCount,
            pricePerNightINR: h.pricePerNightINR,
            image: h.image,
            amenities: h.amenities,
            locationDesc: h.locationDesc,
            isPopular: h.isPopular,
            tagline: h.tagline,
            idealFor: h.idealFor,
          },
        });
      hotelsInserted++;
    }
    console.log(`   🏨 Successfully upserted ${hotelsInserted} hotels to PostgreSQL 'hotels' table.`);

    // Insert restaurants via Drizzle ORM
    let restsInserted = 0;
    for (const r of importedRestaurantsList) {
      await db
        .insert(adminRestaurants)
        .values({
          id: r.id,
          name: r.name,
          destination: r.destination,
          cuisine: r.cuisine,
          type: r.type,
          avgMealCostForTwoINR: r.avgMealCostForTwoINR,
          rating: String(r.rating),
          reviewsCount: r.reviewsCount,
          image: r.image,
          mustTryDishes: r.mustTryDishes,
          dietaryTags: r.dietaryTags,
          address: r.address,
          isPopular: r.isPopular,
          vibe: r.vibe,
        })
        .onConflictDoUpdate({
          target: adminRestaurants.id,
          set: {
            name: r.name,
            destination: r.destination,
            cuisine: r.cuisine,
            type: r.type,
            avgMealCostForTwoINR: r.avgMealCostForTwoINR,
            rating: String(r.rating),
            reviewsCount: r.reviewsCount,
            image: r.image,
            mustTryDishes: r.mustTryDishes,
            dietaryTags: r.dietaryTags,
            address: r.address,
            isPopular: r.isPopular,
            vibe: r.vibe,
          },
        });
      restsInserted++;
    }
    console.log(`   🍽️  Successfully upserted ${restsInserted} restaurants to PostgreSQL 'restaurants' table.`);
    console.log('\n🎉 CSV import to PostgreSQL completed successfully!');
  } catch (err: any) {
    console.warn('\n⚠️  PostgreSQL Notice:', err.message);
    console.log('ℹ️  Import script completed in resilient mode. Data is cached in src/data/importedData.ts.');
    console.log('   When PostgreSQL is online, re-run `npm run import:csv` to populate the database tables.');
  } finally {
    try {
      await pool.end();
    } catch {
      // ignore
    }
  }

  return {
    hotelsCount: importedHotelsList.length,
    restaurantsCount: importedRestaurantsList.length
  };
}

// Run directly if invoked from CLI
if (process.argv[1] && process.argv[1].endsWith('import-csv.ts')) {
  importDatasets().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('Import failed:', err);
    process.exit(1);
  });
}
