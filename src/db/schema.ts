import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Define the 'users' table.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  avatar: text('avatar'),
  role: text('role').default('USER'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'itineraries' table.
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

// Define relationships for the 'users' table.
export const usersRelations = relations(users, ({ many }) => ({
  itineraries: many(itineraries),
}));

// Define relationships for the 'itineraries' table.
export const itinerariesRelations = relations(itineraries, ({ one }) => ({
  author: one(users, {
    fields: [itineraries.userId],
    references: [users.id],
  }),
}));
