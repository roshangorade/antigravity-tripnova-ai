import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';

// Define the 'users' table - preserved existing columns + new auth/profile columns
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or internal UID
  email: text('email').notNull().unique(),
  name: text('name'),
  avatar: text('avatar'),
  role: text('role').default('USER'), // 'USER' | 'ADMIN' | 'SUPPORT' | 'CONTENT_MANAGER' | 'FINANCE' | 'ANALYST'
  passwordHash: text('password_hash'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  username: text('username'),
  phone: text('phone'),
  city: text('city'),
  state: text('state'),
  country: text('country'),
  profileImage: text('profile_image'),
  bio: text('bio'),
  travelStats: jsonb('travel_stats'), // { visitedDestinationsCount, totalKmTraveled, badges }
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'itineraries' table - fully preserved
export const itineraries = pgTable('itineraries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  title: text('title').notNull(),
  destination: text('destination').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  totalEstimatedCostINR: integer('total_estimated_cost_inr').notNull(),
  data: jsonb('data').notNull(), // Store the full itinerary JSON
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'bookings' table
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  bookingRef: text('booking_ref').notNull().unique(), // e.g. "BK-98213"
  userId: integer('user_id').references(() => users.id),
  userEmail: text('user_email').notNull(),
  hotelId: text('hotel_id').notNull(),
  hotelName: text('hotel_name').notNull(),
  destination: text('destination').notNull(),
  checkInDate: text('check_in_date').notNull(),
  checkOutDate: text('check_out_date').notNull(),
  roomType: text('room_type').default('Standard Deluxe Room'),
  roomsCount: integer('rooms_count').default(1),
  guestsCount: integer('guests_count').default(1),
  totalAmountINR: integer('total_amount_inr').notNull(),
  status: text('status').default('PENDING'), // 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED'
  paymentStatus: text('payment_status').default('PENDING'), // 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  ticketId: text('ticket_id'), // e.g. "ET-GOA-001"
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'passengers' table (traveler details per booking)
export const passengers = pgTable('passengers', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id')
    .references(() => bookings.id)
    .notNull(),
  fullName: text('full_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  age: integer('age'),
  gender: text('gender'),
  idType: text('id_type').default('Government Photo ID'),
  idNumber: text('id_number'),
  isPrimary: boolean('is_primary').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'payments' table (test mode payments)
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  paymentRef: text('payment_ref').notNull().unique(), // e.g. "PAY-49120"
  bookingId: integer('booking_id')
    .references(() => bookings.id)
    .notNull(),
  orderId: text('order_id').notNull(), // Razorpay order_id or test order id
  amountINR: integer('amount_inr').notNull(),
  currency: text('currency').default('INR'),
  provider: text('provider').default('RAZORPAY_TEST'),
  signature: text('signature'),
  status: text('status').default('PENDING'), // 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  rawResponse: jsonb('raw_response'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'favorites' table (wishlist persistence)
export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  itemType: text('item_type').notNull(), // 'destination' | 'hotel' | 'restaurant'
  itemId: text('item_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'support_tickets' table (feedback and customer support)
export const supportTickets = pgTable('support_tickets', {
  id: serial('id').primaryKey(),
  ticketRef: text('ticket_ref').notNull().unique(), // e.g. "TK-1049"
  userId: integer('user_id').references(() => users.id),
  userEmail: text('user_email').notNull(),
  userName: text('user_name'),
  category: text('category').notNull(),
  rating: integer('rating').notNull(),
  message: text('message').notNull(),
  status: text('status').default('OPEN'), // 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED'
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define persistent Admin Content tables
export const adminDestinations = pgTable('destinations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  state: text('state').notNull(),
  country: text('country').notNull(),
  region: text('region').notNull(),
  tagline: text('tagline'),
  description: text('description'),
  heroImage: text('hero_image'),
  gallery: jsonb('gallery'),
  rating: text('rating').default('4.8'),
  reviewCount: integer('review_count').default(120),
  avgDailyCostINR: integer('avg_daily_cost_inr').default(4500),
  popularCategories: jsonb('popular_categories'),
  coordinates: jsonb('coordinates'),
  weather: jsonb('weather'),
  entryFeeDetails: text('entry_fee_details'),
  historySummary: text('history_summary'),
  culturalTips: jsonb('cultural_tips'),
  dosAndDonts: jsonb('dos_and_donts'),
  topAttractions: jsonb('top_attractions'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const adminHotels = pgTable('hotels', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  destination: text('destination').notNull(),
  type: text('type').notNull(),
  rating: text('rating').default('4.7'),
  reviewsCount: integer('reviews_count').default(150),
  pricePerNightINR: integer('price_per_night_inr').notNull(),
  image: text('image'),
  amenities: jsonb('amenities'),
  locationDesc: text('location_desc'),
  isPopular: boolean('is_popular').default(false),
  tagline: text('tagline'),
  idealFor: text('ideal_for'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const adminRestaurants = pgTable('restaurants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  destination: text('destination').notNull(),
  cuisine: jsonb('cuisine'),
  type: text('type').notNull(),
  avgMealCostForTwoINR: integer('avg_meal_cost_for_two_inr').notNull(),
  rating: text('rating').default('4.6'),
  reviewsCount: integer('reviews_count').default(100),
  image: text('image'),
  mustTryDishes: jsonb('must_try_dishes'),
  dietaryTags: jsonb('dietary_tags'),
  address: text('address'),
  isPopular: boolean('is_popular').default(false),
  vibe: text('vibe'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const adminEvents = pgTable('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  location: text('location').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  status: text('status').default('Active'),
  source: text('source'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const adminAlerts = pgTable('travel_alerts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  type: text('type').notNull(),
  severity: text('severity').notNull(),
  location: text('location').notNull(),
  date: text('date').notNull(),
  status: text('status').default('Active'),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  itineraries: many(itineraries),
  bookings: many(bookings),
  favorites: many(favorites),
  supportTickets: many(supportTickets),
}));

export const itinerariesRelations = relations(itineraries, ({ one }) => ({
  author: one(users, {
    fields: [itineraries.userId],
    references: [users.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  passengers: many(passengers),
  payments: many(payments),
}));

export const passengersRelations = relations(passengers, ({ one }) => ({
  booking: one(bookings, {
    fields: [passengers.bookingId],
    references: [bookings.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
}));

