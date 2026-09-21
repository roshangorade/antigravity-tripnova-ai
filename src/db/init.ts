import { pool, db } from './index.ts';
import { POPULAR_DESTINATIONS, FEATURED_HOTELS, FEATURED_RESTAURANTS } from '../data/travelData.ts';

let isDbReady = false;

export const getDbStatus = () => isDbReady;

export const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    try {
      // 1. Ensure users table exists and has all required columns
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          uid TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          name TEXT,
          avatar TEXT,
          role TEXT DEFAULT 'USER',
          password_hash TEXT,
          first_name TEXT,
          last_name TEXT,
          username TEXT,
          phone TEXT,
          city TEXT,
          state TEXT,
          country TEXT,
          profile_image TEXT,
          bio TEXT,
          travel_stats JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Safe column additions in case users table already existed without new columns
      const userColumns = [
        'password_hash TEXT',
        'first_name TEXT',
        'last_name TEXT',
        'username TEXT',
        'phone TEXT',
        'city TEXT',
        'state TEXT',
        'country TEXT',
        'profile_image TEXT',
        'bio TEXT',
        'travel_stats JSONB'
      ];
      for (const col of userColumns) {
        const colName = col.split(' ')[0];
        const colType = col.slice(colName.length);
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='${colName}') THEN
              ALTER TABLE users ADD COLUMN ${colName} ${colType};
            END IF;
          END $$;
        `);
      }

      // 2. Ensure itineraries table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS itineraries (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          destination TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          total_estimated_cost_inr INTEGER NOT NULL,
          data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // 3. Ensure bookings table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS bookings (
          id SERIAL PRIMARY KEY,
          booking_ref TEXT NOT NULL UNIQUE,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          user_email TEXT NOT NULL,
          hotel_id TEXT NOT NULL,
          hotel_name TEXT NOT NULL,
          destination TEXT NOT NULL,
          check_in_date TEXT NOT NULL,
          check_out_date TEXT NOT NULL,
          room_type TEXT DEFAULT 'Standard Deluxe Room',
          rooms_count INTEGER DEFAULT 1,
          guests_count INTEGER DEFAULT 1,
          total_amount_inr INTEGER NOT NULL,
          status TEXT DEFAULT 'PENDING',
          payment_status TEXT DEFAULT 'PENDING',
          ticket_id TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // 4. Ensure passengers table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS passengers (
          id SERIAL PRIMARY KEY,
          booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
          full_name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          age INTEGER,
          gender TEXT,
          id_type TEXT DEFAULT 'Government Photo ID',
          id_number TEXT,
          is_primary BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // 5. Ensure payments table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          payment_ref TEXT NOT NULL UNIQUE,
          booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
          order_id TEXT NOT NULL,
          amount_inr INTEGER NOT NULL,
          currency TEXT DEFAULT 'INR',
          provider TEXT DEFAULT 'RAZORPAY_TEST',
          signature TEXT,
          status TEXT DEFAULT 'PENDING',
          raw_response JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // 6. Ensure favorites table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS favorites (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          item_type TEXT NOT NULL,
          item_id TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // 7. Ensure support_tickets table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS support_tickets (
          id SERIAL PRIMARY KEY,
          ticket_ref TEXT NOT NULL UNIQUE,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          user_email TEXT NOT NULL,
          user_name TEXT,
          category TEXT NOT NULL,
          rating INTEGER NOT NULL,
          message TEXT NOT NULL,
          status TEXT DEFAULT 'OPEN',
          admin_notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // 8. Ensure admin content tables exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS destinations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          state TEXT NOT NULL,
          country TEXT NOT NULL,
          region TEXT NOT NULL,
          tagline TEXT,
          description TEXT,
          hero_image TEXT,
          gallery JSONB,
          rating TEXT DEFAULT '4.8',
          review_count INTEGER DEFAULT 120,
          avg_daily_cost_inr INTEGER DEFAULT 4500,
          popular_categories JSONB,
          coordinates JSONB,
          weather JSONB,
          entry_fee_details TEXT,
          history_summary TEXT,
          cultural_tips JSONB,
          dos_and_donts JSONB,
          top_attractions JSONB,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS hotels (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          destination TEXT NOT NULL,
          type TEXT NOT NULL,
          rating TEXT DEFAULT '4.7',
          reviews_count INTEGER DEFAULT 150,
          price_per_night_inr INTEGER NOT NULL,
          image TEXT,
          amenities JSONB,
          location_desc TEXT,
          is_popular BOOLEAN DEFAULT FALSE,
          tagline TEXT,
          ideal_for TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS restaurants (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          destination TEXT NOT NULL,
          cuisine JSONB,
          type TEXT NOT NULL,
          avg_meal_cost_for_two_inr INTEGER NOT NULL,
          rating TEXT DEFAULT '4.6',
          reviews_count INTEGER DEFAULT 100,
          image TEXT,
          must_try_dishes JSONB,
          dietary_tags JSONB,
          address TEXT,
          is_popular BOOLEAN DEFAULT FALSE,
          vibe TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          location TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          status TEXT DEFAULT 'Active',
          source TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS travel_alerts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          type TEXT NOT NULL,
          severity TEXT NOT NULL,
          location TEXT NOT NULL,
          date TEXT NOT NULL,
          status TEXT DEFAULT 'Active',
          summary TEXT,
          created_at TIMESTAMP DEFAULT NOW()
      `);

      // Safe column additions for hotels
      const hotelCols = ['tagline TEXT', 'ideal_for TEXT'];
      for (const col of hotelCols) {
        const colName = col.split(' ')[0];
        const colType = col.slice(colName.length);
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hotels' AND column_name='${colName}') THEN
              ALTER TABLE hotels ADD COLUMN ${colName} ${colType};
            END IF;
          END $$;
        `);
      }

      // Safe column additions for restaurants
      const restCols = ['reviews_count INTEGER DEFAULT 100', 'is_popular BOOLEAN DEFAULT FALSE', 'vibe TEXT'];
      for (const col of restCols) {
        const colName = col.split(' ')[0];
        const colType = col.slice(colName.length);
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='${colName}') THEN
              ALTER TABLE restaurants ADD COLUMN ${colName} ${colType};
            END IF;
          END $$;
        `);
      }

      // Seed initial destinations if empty
      const destCountRes = await client.query('SELECT COUNT(*) FROM destinations');
      if (parseInt(destCountRes.rows[0].count, 10) === 0) {
        for (const d of POPULAR_DESTINATIONS) {
          await client.query(
            `INSERT INTO destinations (id, name, state, country, region, tagline, description, hero_image, gallery, rating, review_count, avg_daily_cost_inr, popular_categories, coordinates, weather, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
             ON CONFLICT (id) DO NOTHING`,
            [
              d.id, d.name, d.state, d.country, d.region, d.tagline, d.description, d.heroImage,
              JSON.stringify(d.gallery), String(d.rating), d.reviewCount, d.avgDailyCostINR,
              JSON.stringify(d.popularCategories), JSON.stringify(d.coordinates), JSON.stringify(d.weather), true
            ]
          );
        }
      }

      // Seed initial hotels if empty
      const hotelCountRes = await client.query('SELECT COUNT(*) FROM hotels');
      if (parseInt(hotelCountRes.rows[0].count, 10) === 0) {
        for (const h of FEATURED_HOTELS) {
          await client.query(
            `INSERT INTO hotels (id, name, destination, type, rating, reviews_count, price_per_night_inr, image, amenities, location_desc, is_popular)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO NOTHING`,
            [
              h.id, h.name, h.destination, h.type, String(h.rating), h.reviewsCount,
              h.pricePerNightINR, h.image, JSON.stringify(h.amenities), h.locationDesc, Boolean(h.isPopular)
            ]
          );
        }
      }

      // Seed initial restaurants if empty
      const restCountRes = await client.query('SELECT COUNT(*) FROM restaurants');
      if (parseInt(restCountRes.rows[0].count, 10) === 0) {
        for (const r of FEATURED_RESTAURANTS) {
          await client.query(
            `INSERT INTO restaurants (id, name, destination, cuisine, type, avg_meal_cost_for_two_inr, rating, image, must_try_dishes, dietary_tags, address)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO NOTHING`,
            [
              r.id, r.name, r.destination, JSON.stringify(r.cuisine), r.type,
              r.avgMealCostForTwoINR, String(r.rating), r.image, JSON.stringify(r.mustTryDishes),
              JSON.stringify(r.dietaryTags), r.address
            ]
          );
        }
      }

      isDbReady = true;
      console.log('PostgreSQL database tables initialized and verified successfully.');
    } finally {
      client.release();
    }
  } catch (err: any) {
    isDbReady = false;
    console.warn('PostgreSQL connection notice:', err.message);
    console.warn('TripNova will operate with in-memory resilient fallback until database connectivity is configured.');
  }
};
