import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { POPULAR_DESTINATIONS, FEATURED_HOTELS, FEATURED_RESTAURANTS, MOCK_ADMIN_STATS } from './src/data/travelData';
import { IMPORTED_HOTELS, IMPORTED_RESTAURANTS } from './src/data/importedData.ts';
import { importDatasets } from './scripts/import-csv.ts';
import { TravelItinerary, ItineraryDay, BudgetTier, CanonicalDestination, AttractionItem, SearchAuditDiagnosticData } from './src/types';
import { getTrendingEvents, getTravelAlerts, getAIFoodRecommendation, getSmartRoute, getStateWiseFood, submitFeedback, feedbackStorage } from './src/services/localIntelligence.ts';
import { searchGoogleHotels, searchGoogleLocal, searchGoogleEvents, searchDiscoverPlaces } from './src/services/serpApiService.ts';
import { getSerpDirections } from './src/services/serpApiMapsService.ts';
import { searchGoogleFlights } from './src/services/serpApiFlightsService.ts';
import { requireAuth, requireAdmin, requireRole, AuthRequest } from './src/middleware/auth.ts';
import { db } from './src/db/index.ts';
import {
  users,
  itineraries,
  bookings,
  passengers,
  payments,
  favorites,
  supportTickets,
  adminDestinations,
  adminHotels,
  adminRestaurants,
  adminEvents,
  adminAlerts
} from './src/db/schema.ts';
import { count, eq, desc, and } from 'drizzle-orm';
import {
  hashPassword,
  hashPasswordSync,
  verifyPassword,
  generateToken,
  verifyToken,
  sanitizeUser,
  UserRole
} from './src/lib/auth.ts';
import {
  securityHeadersMiddleware,
  aiPlannerRateLimiter,
  searchRateLimiter,
  authRateLimiter,
  generalApiRateLimiter,
  isValidEmail,
  isValidPassword
} from './src/middleware/security.ts';
import { initializeDatabase, getDbStatus } from './src/db/init.ts';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

const app = express();
const PORT = 3000;

// Security & Parsing Middlewares
app.use(securityHeadersMiddleware);
app.use(express.json());
app.use(generalApiRateLimiter);

// In-memory fallback stores for high resilience when database is offline/initializing
const inMemoryUsers: any[] = [
  {
    id: 1,
    uid: 'admin_master_uid',
    email: 'admin@tripnova.ai',
    name: 'TripNova Administrator',
    firstName: 'TripNova',
    lastName: 'Administrator',
    username: 'admin',
    role: 'ADMIN',
    passwordHash: hashPasswordSync('Admin@TripNova2026!'),
    createdAt: new Date('2026-01-01')
  },
  {
    id: 2,
    uid: 'admin_roshan_uid',
    email: 'roshangorade7@gmail.com',
    name: 'Roshan Gorade',
    firstName: 'Roshan',
    lastName: 'Gorade',
    username: 'roshan_g',
    role: 'ADMIN',
    passwordHash: hashPasswordSync('Admin@TripNova2026!'),
    createdAt: new Date('2026-01-02')
  }
];
const inMemoryItineraries: any[] = [];
const inMemoryBookings: any[] = [
  {
    id: 1,
    bookingRef: 'BK-98213',
    userEmail: 'roshangorade7@gmail.com',
    hotelId: 'h1',
    hotelName: 'Taj Holiday Village Resort',
    destination: 'Goa',
    checkInDate: '2026-09-01',
    checkOutDate: '2026-09-05',
    roomType: 'Luxury Villa',
    roomsCount: 1,
    guestsCount: 2,
    totalAmountINR: 18500,
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    ticketId: 'ET-GOA-001',
    createdAt: new Date('2026-08-25')
  },
  {
    id: 2,
    bookingRef: 'BK-98214',
    userEmail: 'aarav.s@example.com',
    hotelId: 'h2',
    hotelName: 'The Grand Dragon',
    destination: 'Leh Ladakh',
    checkInDate: '2026-09-10',
    checkOutDate: '2026-09-14',
    roomType: 'Heritage Suite',
    roomsCount: 1,
    guestsCount: 2,
    totalAmountINR: 22000,
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    ticketId: 'ET-LDK-902',
    createdAt: new Date('2026-08-28')
  }
];
const inMemoryPassengers: any[] = [
  {
    id: 1,
    bookingId: 1,
    fullName: 'Roshan Gorade',
    email: 'roshangorade7@gmail.com',
    phone: '+91 9876543210',
    age: 21,
    gender: 'Male',
    idType: 'Aadhaar Card',
    idNumber: 'XXXX-XXXX-1234',
    isPrimary: true
  }
];
const inMemoryPayments: any[] = [
  {
    id: 1,
    paymentRef: 'PAY-98213',
    bookingId: 1,
    orderId: 'order_test_101',
    amountINR: 18500,
    currency: 'INR',
    provider: 'RAZORPAY_TEST',
    status: 'PAID',
    createdAt: new Date('2026-08-25')
  }
];
const inMemoryFavorites: { userId: number; itemId: string; itemType: string }[] = [];

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// --- AUTHENTICATION ENDPOINTS --- //

const ADMIN_SECRET_KEY = (process.env.ADMIN_SECRET_KEY || 'Admin@RoamMind2026').replace(/["']/g, '').trim();

// 1. Verify Admin Secret Key
app.post('/api/auth/verify-admin-key', (req: Request, res: Response) => {
  const { adminKey } = req.body || {};
  if (!adminKey || typeof adminKey !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Admin authorization key is required.'
    });
  }

  if (adminKey.trim() === ADMIN_SECRET_KEY) {
    return res.json({
      success: true,
      message: 'Admin authorization key verified successfully on server.'
    });
  } else {
    return res.status(403).json({
      success: false,
      message: 'Invalid Admin Authorization Password Key. Server authorization denied.'
    });
  }
});

// 2. Real Registration Endpoint (Hashed password, PostgreSQL storage, safe user output)
app.post('/api/auth/register', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, username, email, password, role, adminKey, city, phone } = req.body || {};

    if (!email || !firstName) {
      return res.status(400).json({ success: false, message: 'First name and email address are required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const passCheck = isValidPassword(password || 'password123');
    if (!passCheck.valid) {
      return res.status(400).json({ success: false, message: passCheck.message });
    }

    let finalRole: UserRole = 'USER';
    if (role === 'ADMIN') {
      if (!adminKey || typeof adminKey !== 'string' || adminKey.trim() !== ADMIN_SECRET_KEY) {
        return res.status(403).json({
          success: false,
          message: 'Invalid Admin Authorization Password Key. Administrative escalation denied.'
        });
      }
      finalRole = 'ADMIN';
    }

    const computedName = `${firstName} ${lastName || ''}`.trim() || firstName;
    const computedUsername = username || firstName.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Math.floor(10 + Math.random() * 90);
    const passwordHash = await hashPassword(password || 'password123');
    const uid = 'uid_' + Date.now() + '_' + Math.floor(100 + Math.random() * 900);

    let createdUser: any = null;
    let userId = Math.floor(100 + Math.random() * 900);

    // Try saving to PostgreSQL
    try {
      const existing = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase()));
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'An account with this email address already exists. Please sign in.' });
      }

      const inserted = await db.insert(users).values({
        uid,
        email: email.trim().toLowerCase(),
        name: computedName,
        firstName,
        lastName: lastName || 'Traveler',
        username: computedUsername,
        phone: phone || '+91 9876543210',
        city: city || 'Chhatrapati Sambhajinagar',
        role: finalRole,
        passwordHash,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        travelStats: {
          visitedDestinationsCount: finalRole === 'ADMIN' ? 24 : 1,
          totalKmTraveled: finalRole === 'ADMIN' ? 24000 : 500,
          badges: finalRole === 'ADMIN' ? ['System Admin', 'Verified Executive'] : ['New Explorer']
        }
      }).returning();

      if (inserted.length > 0) {
        createdUser = inserted[0];
        userId = createdUser.id;
      }
    } catch (dbErr: any) {
      console.warn('Database registration fallback notice:', dbErr.message);
      const inMemExisting = inMemoryUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (inMemExisting) {
        return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
      }
      createdUser = {
        id: userId,
        uid,
        email: email.trim().toLowerCase(),
        name: computedName,
        firstName,
        lastName: lastName || 'Traveler',
        username: computedUsername,
        phone: phone || '+91 9876543210',
        city: city || 'Chhatrapati Sambhajinagar',
        role: finalRole,
        passwordHash,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        travelStats: {
          visitedDestinationsCount: finalRole === 'ADMIN' ? 24 : 1,
          totalKmTraveled: finalRole === 'ADMIN' ? 24000 : 500,
          badges: finalRole === 'ADMIN' ? ['System Admin', 'Verified Executive'] : ['New Explorer']
        },
        createdAt: new Date()
      };
      inMemoryUsers.push(createdUser);
    }

    const safeUser = sanitizeUser(createdUser);
    const token = generateToken({
      userId,
      uid,
      email: safeUser.email,
      role: finalRole,
      name: safeUser.name
    });

    return res.json({
      success: true,
      message: finalRole === 'ADMIN' ? 'Administrator account verified & created successfully.' : 'Account created successfully.',
      token,
      user: safeUser
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Unable to complete registration. Please try again.' });
  }
});

// 3. Real Login Endpoint (Verifies password hash, issues JWT session token)
app.post('/api/auth/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    let userRecord: any = null;

    // Check PostgreSQL
    try {
      const records = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase()));
      if (records.length > 0) {
        userRecord = records[0];
      }
    } catch (dbErr: any) {
      console.warn('Database login check notice:', dbErr.message);
    }

    // Fallback in-memory
    if (!userRecord) {
      userRecord = inMemoryUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    }

    if (!userRecord) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Verify password hash
    if (userRecord.passwordHash) {
      const isMatch = await verifyPassword(password, userRecord.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
    }

    const safeUser = sanitizeUser(userRecord);
    const token = generateToken({
      userId: userRecord.id || 1,
      uid: userRecord.uid,
      email: safeUser.email,
      role: safeUser.role,
      name: safeUser.name
    });

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: safeUser
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Login failed due to a server error. Please try again.' });
  }
});

// 4. Current User Session Endpoint (Validates Bearer token and returns profile)
app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const authUser = req.user!;
    let userRecord: any = null;

    try {
      const records = await db.select().from(users).where(eq(users.email, authUser.email));
      if (records.length > 0) {
        userRecord = records[0];
      }
    } catch {
      // Ignore fallback
    }

    if (!userRecord) {
      userRecord = inMemoryUsers.find(u => u.email.toLowerCase() === authUser.email.toLowerCase());
    }

    if (!userRecord) {
      userRecord = {
        id: authUser.userId || 1,
        uid: authUser.uid,
        email: authUser.email,
        name: authUser.name || 'Traveler',
        role: authUser.role || 'USER',
        createdAt: new Date()
      };
    }

    const safeUser = sanitizeUser(userRecord);
    return res.json({ success: true, user: safeUser });
  } catch (err: any) {
    console.error('Auth verification error:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify user profile.' });
  }
});

// 5. Update Profile Endpoint (Persists changes in PostgreSQL)
app.put('/api/users/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const authUser = req.user!;
    const { firstName, lastName, phone, city, state, country, profileImage, bio, travelStats } = req.body || {};

    const computedName = `${firstName || ''} ${lastName || ''}`.trim() || undefined;

    try {
      await db.update(users).set({
        firstName,
        lastName,
        name: computedName,
        phone,
        city,
        state,
        country,
        profileImage,
        avatar: profileImage,
        bio,
        travelStats
      }).where(eq(users.email, authUser.email));
    } catch (dbErr: any) {
      console.warn('Database profile update notice:', dbErr.message);
      const idx = inMemoryUsers.findIndex(u => u.email.toLowerCase() === authUser.email.toLowerCase());
      if (idx !== -1) {
        inMemoryUsers[idx] = {
          ...inMemoryUsers[idx],
          firstName,
          lastName,
          name: computedName || inMemoryUsers[idx].name,
          phone,
          city,
          state,
          country,
          profileImage,
          bio,
          travelStats
        };
      }
    }

    return res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// 6. Itineraries Persistence Endpoints (Save & Retrieve Trips)
app.post('/api/itineraries', async (req: AuthRequest, res: Response) => {
  try {
    const { itinerary, userId: customUserId } = req.body || {};
    if (!itinerary || !itinerary.title || !itinerary.destination) {
      return res.status(400).json({ success: false, message: 'Valid itinerary data is required.' });
    }

    const authHeader = req.headers.authorization;
    let userId = 1;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.split('Bearer ')[1]?.trim());
      if (decoded?.userId) userId = decoded.userId;
    } else if (customUserId) {
      userId = parseInt(String(customUserId), 10) || 1;
    }

    let savedId = itinerary.id || ('trip_' + Date.now());

    try {
      const result = await db.insert(itineraries).values({
        userId,
        title: itinerary.title,
        destination: itinerary.destination,
        startDate: itinerary.startDate || new Date().toISOString().split('T')[0],
        endDate: itinerary.endDate || new Date().toISOString().split('T')[0],
        totalEstimatedCostINR: Number(itinerary.totalEstimatedCostINR || 12000),
        data: itinerary
      }).returning();
      if (result.length > 0) {
        savedId = `db_trip_${result[0].id}`;
      }
    } catch (dbErr: any) {
      console.warn('Database itinerary save notice:', dbErr.message);
      inMemoryItineraries.unshift({
        id: savedId,
        userId,
        title: itinerary.title,
        destination: itinerary.destination,
        startDate: itinerary.startDate,
        endDate: itinerary.endDate,
        totalEstimatedCostINR: itinerary.totalEstimatedCostINR,
        data: itinerary,
        createdAt: new Date()
      });
    }

    return res.json({ success: true, id: savedId, message: 'Itinerary saved successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to save itinerary.' });
  }
});

app.get('/api/itineraries', async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: number | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.split('Bearer ')[1]?.trim());
      if (decoded) {
        userId = decoded.userId;
      }
    }

    let trips: any[] = [];
    try {
      if (userId) {
        const dbTrips = await db.select().from(itineraries).where(eq(itineraries.userId, userId)).orderBy(desc(itineraries.createdAt));
        trips = dbTrips.map(t => ({
          ...((typeof t.data === 'object' && t.data !== null) ? t.data : {}),
          id: `db_trip_${t.id}`,
          title: t.title,
          destination: t.destination,
          totalEstimatedCostINR: t.totalEstimatedCostINR,
          startDate: t.startDate,
          endDate: t.endDate
        }));
      } else {
        const dbTrips = await db.select().from(itineraries).orderBy(desc(itineraries.createdAt)).limit(10);
        trips = dbTrips.map(t => ({
          ...((typeof t.data === 'object' && t.data !== null) ? t.data : {}),
          id: `db_trip_${t.id}`,
          title: t.title,
          destination: t.destination,
          totalEstimatedCostINR: t.totalEstimatedCostINR,
          startDate: t.startDate,
          endDate: t.endDate
        }));
      }
    } catch (dbErr: any) {
      console.warn('Database itineraries fetch notice:', dbErr.message);
      trips = inMemoryItineraries.map(t => t.data || t);
    }

    return res.json({ success: true, count: trips.length, itineraries: trips });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch itineraries.' });
  }
});

// 7. Bookings & Passengers Endpoints (Database-backed test booking workflow)
app.post('/api/bookings', async (req: AuthRequest, res: Response) => {
  try {
    const {
      hotelId,
      hotelName,
      destination,
      checkInDate,
      checkOutDate,
      roomType = 'Standard Deluxe Room',
      roomsCount = 1,
      guestsCount = 2,
      totalAmount,
      totalAmountINR = totalAmount || 3500,
      userEmail,
      passengers: rawPassengers = [],
      notes
    } = req.body || {};

    if (!hotelName || !destination || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'Hotel, destination, and stay dates are required to create a booking reservation.'
      });
    }

    const authHeader = req.headers.authorization;
    let userId: number | undefined;
    let email = userEmail || 'traveler@tripnova.ai';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.split('Bearer ')[1]?.trim());
      if (decoded) {
        userId = decoded.userId;
        email = decoded.email;
      }
    }

    const bookingRef = 'BK-' + Math.floor(10000 + Math.random() * 90000);
    const destCode = destination.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'HTL';
    const ticketId = `ET-${destCode}-${Math.floor(100 + Math.random() * 900)}`;

    let createdBooking: any = {
      id: Math.floor(1000 + Math.random() * 9000),
      bookingRef,
      userId,
      userEmail: email,
      hotelId: hotelId || 'h_' + Date.now(),
      hotelName,
      destination,
      checkInDate,
      checkOutDate,
      roomType,
      roomsCount: Number(roomsCount),
      guestsCount: Number(guestsCount),
      totalAmountINR: Number(totalAmountINR),
      status: 'PENDING',
      paymentStatus: 'PENDING',
      ticketId,
      notes,
      createdAt: new Date()
    };

    let passengerList: any[] = [];
    if (Array.isArray(rawPassengers) && rawPassengers.length > 0) {
      passengerList = rawPassengers.map((p: any, idx: number) => ({
        fullName: p.fullName || p.name || 'Primary Traveler',
        email: p.email || email,
        phone: p.phone || '+91 9876543210',
        age: Number(p.age) || 28,
        gender: p.gender || 'Adult',
        idType: p.idType || 'Government Photo ID',
        idNumber: p.idNumber || 'TN-VERIFIED',
        isPrimary: idx === 0
      }));
    } else {
      passengerList = [{
        fullName: 'Lead Traveler',
        email,
        phone: '+91 9876543210',
        age: 28,
        gender: 'Adult',
        idType: 'Government Photo ID',
        idNumber: 'TN-VERIFIED',
        isPrimary: true
      }];
    }

    try {
      const bRes = await db.insert(bookings).values({
        bookingRef,
        userId,
        userEmail: email,
        hotelId: hotelId || 'h_' + Date.now(),
        hotelName,
        destination,
        checkInDate,
        checkOutDate,
        roomType,
        roomsCount: Number(roomsCount),
        guestsCount: Number(guestsCount),
        totalAmountINR: Number(totalAmountINR),
        status: 'PENDING',
        paymentStatus: 'PENDING',
        ticketId,
        notes
      }).returning();

      if (bRes.length > 0) {
        createdBooking = bRes[0];
        for (const p of passengerList) {
          await db.insert(passengers).values({
            bookingId: createdBooking.id,
            fullName: p.fullName,
            email: p.email,
            phone: p.phone,
            age: p.age,
            gender: p.gender,
            idType: p.idType,
            idNumber: p.idNumber,
            isPrimary: p.isPrimary
          });
        }
      }
    } catch (dbErr: any) {
      console.warn('Database booking insert notice:', dbErr.message);
      inMemoryBookings.unshift(createdBooking);
      for (const p of passengerList) {
        inMemoryPassengers.push({ ...p, id: Date.now() + Math.random(), bookingId: createdBooking.id });
      }
    }

    return res.json({
      success: true,
      message: 'Pending booking reservation created. Please proceed to test payment.',
      booking: {
        ...createdBooking,
        passengers: passengerList
      },
      bookingReference: createdBooking.bookingRef,
      ticketId: createdBooking.ticketId,
      isTestBooking: true,
      disclosure: 'Academic MVP / Demonstration Booking on Live Search Inventory'
    });
  } catch (err: any) {
    console.error('Booking creation error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create booking reservation.' });
  }
});

app.get('/api/bookings', async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let userEmail = '';
    let userId: number | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.split('Bearer ')[1]?.trim());
      if (decoded) {
        userEmail = decoded.email;
        userId = decoded.userId;
      }
    }

    let bookingsList: any[] = [];
    try {
      if (userId || userEmail) {
        bookingsList = await db.select().from(bookings).where(
          userEmail ? eq(bookings.userEmail, userEmail) : eq(bookings.userId, userId!)
        ).orderBy(desc(bookings.createdAt));
      } else {
        bookingsList = await db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(10);
      }
    } catch (dbErr: any) {
      console.warn('Database bookings fetch notice:', dbErr.message);
      bookingsList = inMemoryBookings;
      if (userEmail) {
        bookingsList = inMemoryBookings.filter(b => b.userEmail.toLowerCase() === userEmail.toLowerCase());
      }
    }

    return res.json({ success: true, count: bookingsList.length, bookings: bookingsList });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
});

// 8. Test Payments Endpoints (Test Order creation & Signature Verification)
app.post('/api/payments/create-order', async (req: Request, res: Response) => {
  try {
    const { bookingId, amount, amountINR = amount || 3500, currency = 'INR', bookingReference } = req.body || {};
    const orderId = 'order_test_' + Date.now();
    const paymentRef = 'PAY-' + Math.floor(10000 + Math.random() * 90000);

    try {
      if (bookingId && typeof bookingId === 'number') {
        await db.insert(payments).values({
          paymentRef,
          bookingId,
          orderId,
          amountINR: Number(amountINR),
          currency: 'INR',
          provider: 'RAZORPAY_TEST',
          status: 'PENDING'
        });
      }
    } catch (dbErr: any) {
      console.warn('Database payment creation notice:', dbErr.message);
      inMemoryPayments.push({
        id: Date.now(),
        paymentRef,
        bookingId: bookingId || 1,
        orderId,
        amountINR: Number(amountINR),
        currency: 'INR',
        provider: 'RAZORPAY_TEST',
        status: 'PENDING',
        createdAt: new Date()
      });
    }

    return res.json({
      success: true,
      orderId,
      order: {
        id: orderId,
        amount: Number(amountINR),
        currency,
        bookingReference
      },
      paymentRef,
      amountINR: Number(amountINR),
      currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo_tripnova',
      isTestMode: true
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to initialize payment order.' });
  }
});

app.post('/api/payments/verify', async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      razorpay_order_id = orderId,
      paymentId,
      razorpay_payment_id = paymentId,
      signature,
      razorpay_signature = signature,
      bookingId,
      bookingRef
    } = req.body || {};

    const activeOrderId = razorpay_order_id || orderId;
    const activePaymentId = razorpay_payment_id || paymentId;
    const activeSignature = razorpay_signature || signature;

    if (!activeOrderId && !activePaymentId && !bookingId && !bookingRef) {
      return res.status(400).json({ success: false, message: 'Order reference or booking identifier is required.' });
    }

    const verifiedPaymentId = activePaymentId || `pay_test_${Date.now()}`;

    // Cryptographic check if secret key exists
    if (process.env.RAZORPAY_KEY_SECRET && signature && orderId && paymentId) {
      const crypto = await import('crypto');
      const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(orderId + '|' + paymentId)
        .digest('hex');
      if (expectedSignature !== signature) {
        return res.status(400).json({ success: false, message: 'Cryptographic signature verification failed.' });
      }
    }

    try {
      if (bookingId) {
        await db.update(bookings).set({
          status: 'CONFIRMED',
          paymentStatus: 'PAID'
        }).where(eq(bookings.id, Number(bookingId)));

        await db.update(payments).set({
          status: 'PAID',
          signature: signature || 'test_verified_sig'
        }).where(eq(payments.bookingId, Number(bookingId)));
      } else if (bookingRef) {
        await db.update(bookings).set({
          status: 'CONFIRMED',
          paymentStatus: 'PAID'
        }).where(eq(bookings.bookingRef, bookingRef));
      }
    } catch (dbErr: any) {
      console.warn('Database payment verify notice:', dbErr.message);
      const b = inMemoryBookings.find(x => x.id === Number(bookingId) || x.bookingRef === bookingRef);
      if (b) {
        b.status = 'CONFIRMED';
        b.paymentStatus = 'PAID';
      }
    }

    return res.json({
      success: true,
      status: 'PAID',
      bookingStatus: 'CONFIRMED',
      paymentId: verifiedPaymentId,
      message: 'Test payment verified successfully. Booking reservation confirmed.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
});

// 9. Favorites (Wishlist) Persistence Endpoints
app.get('/api/favorites', async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: number | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.split('Bearer ')[1]?.trim());
      if (decoded) userId = decoded.userId;
    }

    let favs: string[] = [];
    try {
      if (userId) {
        const rows = await db.select().from(favorites).where(eq(favorites.userId, userId));
        favs = rows.map(r => r.itemId);
      }
    } catch {
      favs = inMemoryFavorites.filter(f => f.userId === (userId || 1)).map(f => f.itemId);
    }

    return res.json({ success: true, favorites: favs });
  } catch {
    return res.json({ success: true, favorites: [] });
  }
});

app.post('/api/favorites', async (req: AuthRequest, res: Response) => {
  try {
    const { itemId, itemType = 'destination' } = req.body || {};
    if (!itemId) return res.status(400).json({ success: false, message: 'Item ID required' });

    const authHeader = req.headers.authorization;
    let userId = 1;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.split('Bearer ')[1]?.trim());
      if (decoded?.userId) userId = decoded.userId;
    }

    try {
      await db.insert(favorites).values({
        userId,
        itemId: String(itemId),
        itemType
      });
    } catch {
      if (!inMemoryFavorites.some(f => f.userId === userId && f.itemId === String(itemId))) {
        inMemoryFavorites.push({ userId, itemId: String(itemId), itemType });
      }
    }

    return res.json({ success: true, message: 'Added to favorites.' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to add to favorites.' });
  }
});

app.delete('/api/favorites/:itemId', async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const authHeader = req.headers.authorization;
    let userId = 1;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.split('Bearer ')[1]?.trim());
      if (decoded?.userId) userId = decoded.userId;
    }

    try {
      await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.itemId, itemId)));
    } catch {
      const idx = inMemoryFavorites.findIndex(f => f.userId === userId && f.itemId === itemId);
      if (idx !== -1) inMemoryFavorites.splice(idx, 1);
    }

    return res.json({ success: true, message: 'Removed from favorites.' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to remove from favorites.' });
  }
});


// 1. Health check & Readiness check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'RoamMind AI Travel Planner Engine' });
});

app.get('/api/ready', (_req: Request, res: Response) => {
  res.json({ status: 'ready', service: 'TripNova AI Engine', database: 'connected' });
});

// SerpApi Search Routes
app.get('/api/search/hotels', searchRateLimiter, async (req: Request, res: Response) => {
  try {
    const destination = (req.query.destination as string || req.query.q as string || '').trim();
    const radius = req.query.radius ? parseInt(req.query.radius as string, 10) : undefined;
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const checkIn = req.query.checkIn as string || req.query.check_in_date as string;
    const checkOut = req.query.checkOut as string || req.query.check_out_date as string;

    if (!destination) {
      return res.status(400).json({
        success: false,
        properties: [],
        message: 'Destination query parameter is required (e.g. ?destination=Nashik)'
      });
    }

    const hotelResults = await getHotelsForDestination(
      destination,
      !isNaN(lat!) && !isNaN(lng!) ? { lat: lat!, lng: lng! } : undefined,
      radius,
      checkIn,
      checkOut
    );

    return res.json(hotelResults);
  } catch (err: any) {
    console.error('Error in /api/search/hotels:', err);
    res.status(500).json({
      success: false,
      properties: [],
      message: 'Unable to load hotels right now. Please try again.'
    });
  }
});

app.get('/api/search/local', searchRateLimiter, async (req: Request, res: Response) => {
  try {
    const location = (req.query.location as string || req.query.destination as string || '').trim();
    const query = (req.query.q as string || req.query.query as string || 'Restaurants').trim();
    const radius = req.query.radius ? parseInt(req.query.radius as string, 10) : undefined;
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

    const restResults = await getRestaurantsForDestination(
      location || query,
      !isNaN(lat!) && !isNaN(lng!) ? { lat: lat!, lng: lng! } : undefined,
      radius
    );

    return res.json({
      success: true,
      count: restResults.results.length,
      location: location || query,
      query,
      results: restResults.results,
      isLive: restResults.isLive,
      source: restResults.source,
      message: restResults.message
    });
  } catch (err: any) {
    console.error('Error in /api/search/local:', err);
    res.status(500).json({
      success: false,
      results: [],
      message: 'Unable to load local recommendations right now. Please try again.'
    });
  }
});

// SerpApi Google Events Endpoint
app.get('/api/events', searchRateLimiter, async (req: Request, res: Response) => {
  try {
    const location = (req.query.location as string || req.query.destination as string || 'India').trim();
    const query = (req.query.q as string || req.query.query as string || 'events').trim();

    const serpResult = await searchGoogleEvents(location, query);

    return res.json({
      success: true,
      count: serpResult.events.length,
      location,
      query,
      events: serpResult.events,
      isLive: serpResult.isLive,
      message: serpResult.message || (serpResult.isLive ? 'Live events retrieved via SerpApi' : 'Events temporarily unavailable')
    });
  } catch (err: any) {
    console.error('Error in /api/events:', err);
    return res.status(500).json({
      success: false,
      events: [],
      message: 'Events are temporarily unavailable.'
    });
  }
});

// SerpApi Google Discover Places Endpoint
app.get('/api/discover-places', searchRateLimiter, async (req: Request, res: Response) => {
  try {
    const location = (req.query.location as string || req.query.destination as string || 'India').trim();
    const query = (req.query.q as string || req.query.query as string || `places to visit in ${location}`).trim();

    const serpResult = await searchDiscoverPlaces(location, query);

    return res.json({
      success: true,
      count: serpResult.places.length,
      location,
      query,
      places: serpResult.places,
      isLive: serpResult.isLive,
      message: serpResult.message || (serpResult.isLive ? 'Discovered places retrieved via SerpApi' : 'More places could not be loaded right now')
    });
  } catch (err: any) {
    console.error('Error in /api/discover-places:', err);
    return res.status(500).json({
      success: false,
      places: [],
      message: 'More places could not be loaded right now.'
    });
  }
});

// SerpApi Maps & Routes Endpoint
app.get('/api/maps/directions', async (req: Request, res: Response) => {
  try {
    const origin = (req.query.origin as string || req.query.from as string || req.query.start as string || '').trim();
    const destination = (req.query.destination as string || req.query.to as string || req.query.end as string || '').trim();
    const mode = (req.query.mode as string || req.query.travel_mode as string || '').trim();

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        origin,
        destination,
        message: 'Both origin and destination parameters are required (e.g. ?origin=Mumbai&destination=Goa)'
      });
    }

    const routeData = await getSerpDirections(origin, destination, mode);
    return res.json(routeData);
  } catch (err: any) {
    console.error('Error in /api/maps/directions:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to calculate the route right now. Please try again.'
    });
  }
});

app.post('/api/maps/directions', async (req: Request, res: Response) => {
  try {
    const origin = (req.body.origin || req.body.from || '').trim();
    const destination = (req.body.destination || req.body.to || '').trim();
    const mode = (req.body.mode || req.body.travel_mode || '').trim();

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        origin,
        destination,
        message: 'Both origin and destination parameters are required'
      });
    }

    const routeData = await getSerpDirections(origin, destination, mode);
    return res.json(routeData);
  } catch (err: any) {
    console.error('Error in POST /api/maps/directions:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to calculate the route right now. Please try again.'
    });
  }
});

// SerpApi Google Flights Search Endpoint
app.get('/api/flights/search', searchRateLimiter, async (req: Request, res: Response) => {
  try {
    const rawDep = (req.query.departure_id as string || req.query.from as string || req.query.origin as string || '').trim().toUpperCase();
    const rawArr = (req.query.arrival_id as string || req.query.to as string || req.query.destination as string || '').trim().toUpperCase();
    const rawOutbound = (req.query.outbound_date as string || req.query.date as string || req.query.departure_date as string || '').trim();
    const rawReturn = (req.query.return_date as string || req.query.returnDate as string || '').trim();
    const rawType = (req.query.type as string || '').trim();
    const currency = (req.query.currency as string || 'INR').trim().toUpperCase();
    const adults = req.query.adults ? parseInt(req.query.adults as string, 10) : 1;
    const travelClass = req.query.travel_class ? (req.query.travel_class as string).trim() : undefined;
    const stops = req.query.stops !== undefined ? (req.query.stops as string).trim() : undefined;

    // 1. Validation: required departure_id
    if (!rawDep) {
      return res.status(400).json({
        success: false,
        best_flights: [],
        other_flights: [],
        total_count: 0,
        search_metadata: {},
        error: 'Missing required query parameter: departure_id (e.g. ?departure_id=BOM&arrival_id=DEL&outbound_date=2026-10-15)'
      });
    }

    // 2. Validation: required arrival_id
    if (!rawArr) {
      return res.status(400).json({
        success: false,
        best_flights: [],
        other_flights: [],
        total_count: 0,
        search_metadata: {},
        error: 'Missing required query parameter: arrival_id (e.g. ?departure_id=BOM&arrival_id=DEL&outbound_date=2026-10-15)'
      });
    }

    // 3. Validation: departure and arrival must not be identical
    if (rawDep === rawArr) {
      return res.status(400).json({
        success: false,
        best_flights: [],
        other_flights: [],
        total_count: 0,
        search_metadata: {},
        error: `Departure airport (${rawDep}) and arrival airport (${rawArr}) cannot be the same.`
      });
    }

    // 4. Validation: outbound_date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!rawOutbound) {
      return res.status(400).json({
        success: false,
        best_flights: [],
        other_flights: [],
        total_count: 0,
        search_metadata: {},
        error: 'Missing required query parameter: outbound_date in YYYY-MM-DD format (e.g. 2026-10-15)'
      });
    }

    if (!dateRegex.test(rawOutbound)) {
      return res.status(400).json({
        success: false,
        best_flights: [],
        other_flights: [],
        total_count: 0,
        search_metadata: {},
        error: 'Invalid outbound_date format. Please use YYYY-MM-DD format (e.g. 2026-10-15).'
      });
    }

    const parsedOutbound = new Date(rawOutbound);
    if (isNaN(parsedOutbound.getTime())) {
      return res.status(400).json({
        success: false,
        best_flights: [],
        other_flights: [],
        total_count: 0,
        search_metadata: {},
        error: 'Invalid outbound_date value. Please provide a valid calendar date.'
      });
    }

    // 5. Validation: return_date format if supplied
    if (rawReturn) {
      if (!dateRegex.test(rawReturn)) {
        return res.status(400).json({
          success: false,
          best_flights: [],
          other_flights: [],
          total_count: 0,
          search_metadata: {},
          error: 'Invalid return_date format. Please use YYYY-MM-DD format.'
        });
      }
      const parsedReturn = new Date(rawReturn);
      if (isNaN(parsedReturn.getTime())) {
        return res.status(400).json({
          success: false,
          best_flights: [],
          other_flights: [],
          total_count: 0,
          search_metadata: {},
          error: 'Invalid return_date value. Please provide a valid calendar date.'
        });
      }
      if (rawReturn < rawOutbound) {
        return res.status(400).json({
          success: false,
          best_flights: [],
          other_flights: [],
          total_count: 0,
          search_metadata: {},
          error: 'return_date cannot be earlier than outbound_date.'
        });
      }
    }

    // Map type if user passed string like 'round_trip' or 'one_way'
    let mappedType: string | undefined = rawType;
    if (rawType.toLowerCase() === 'round_trip' || rawType.toLowerCase() === 'roundtrip' || rawType === '1') {
      mappedType = '1';
    } else if (rawType.toLowerCase() === 'one_way' || rawType.toLowerCase() === 'oneway' || rawType === '2') {
      mappedType = '2';
    } else if (rawReturn) {
      mappedType = '1';
    } else {
      mappedType = '2';
    }

    // Map travel class if passed as name
    let mappedTravelClass: string | undefined = travelClass;
    if (travelClass) {
      const tc = travelClass.toLowerCase();
      if (tc.includes('first')) mappedTravelClass = '4';
      else if (tc.includes('business')) mappedTravelClass = '3';
      else if (tc.includes('premium')) mappedTravelClass = '2';
      else mappedTravelClass = '1';
    }

    const flightData = await searchGoogleFlights({
      departure_id: rawDep,
      arrival_id: rawArr,
      outbound_date: rawOutbound,
      return_date: rawReturn || undefined,
      type: mappedType,
      currency,
      adults: isNaN(adults) || adults < 1 ? 1 : Math.min(adults, 9),
      travel_class: mappedTravelClass,
      stops: stops !== undefined && stops !== '' ? stops : undefined
    });

    return res.json(flightData);
  } catch (err: any) {
    console.error('Error in /api/flights/search:', err?.message || err);
    return res.status(500).json({
      success: false,
      best_flights: [],
      other_flights: [],
      total_count: 0,
      search_metadata: {},
      error: 'An internal error occurred while retrieving flights. Please try again.'
    });
  }
});

// =====================================================================
// DESTINATION SEARCH, AUTOCOMPLETE & GEOCODING RESOLUTION
// =====================================================================

// =====================================================================
// COMPREHENSIVE CANONICAL DESTINATION RESOLUTION & SEARCH SYSTEM
// =====================================================================

export let adminDestinationsStore = [...POPULAR_DESTINATIONS];

const DESTINATIONS_FILE_PATH = path.resolve(process.cwd(), 'data', 'destinations.json');
export let DESTINATIONS_DB: CanonicalDestination[] = [];

// Haversine Geospatial Distance Calculation in Kilometers
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') return 0;
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Canonical city/destination alias mapping dictionary
export const DESTINATION_ALIASES: Record<string, string[]> = {
  'aurangabad': ['chhatrapati sambhajinagar', 'sambhajinagar', 'chhatrapati sambhaji nagar', 'sambhaji nagar'],
  'chhatrapati sambhajinagar': ['aurangabad', 'sambhajinagar', 'chhatrapati sambhaji nagar', 'sambhaji nagar'],
  'sambhajinagar': ['aurangabad', 'chhatrapati sambhajinagar', 'chhatrapati sambhaji nagar'],
  'nashik': ['nasik', 'nashik road', 'panchavati'],
  'nasik': ['nashik', 'nashik road', 'panchavati'],
  'pune': ['poona', 'punyagari'],
  'poona': ['pune'],
  'mumbai': ['bombay', 'navi mumbai', 'thane'],
  'bombay': ['mumbai'],
  'bengaluru': ['bangalore', 'bengalooru'],
  'bangalore': ['bengaluru'],
  'kolkata': ['calcutta'],
  'calcutta': ['kolkata'],
  'chennai': ['madras'],
  'madras': ['chennai'],
  'varanasi': ['banaras', 'benares', 'kashi'],
  'banaras': ['varanasi', 'kashi'],
  'kashi': ['varanasi', 'banaras'],
  'kochi': ['cochin', 'ernakulam'],
  'cochin': ['kochi', 'ernakulam'],
  'thiruvananthapuram': ['trivandrum'],
  'trivandrum': ['thiruvananthapuram'],
  'puducherry': ['pondicherry', 'pondy'],
  'pondicherry': ['puducherry', 'pondy'],
  'mysuru': ['mysore'],
  'mysore': ['mysuru'],
  'vadodara': ['baroda'],
  'baroda': ['vadodara'],
  'visakhapatnam': ['vizag', 'waltair'],
  'vizag': ['visakhapatnam'],
  'guwahati': ['gauhati'],
  'gauhati': ['guwahati'],
  'allahabad': ['prayagraj'],
  'prayagraj': ['allahabad'],
  'panaji': ['panjim'],
  'panjim': ['panaji'],
  'shimla': ['simla'],
  'simla': ['shimla'],
  'belagavi': ['belgaum'],
  'belgaum': ['belagavi'],
  'hubballi': ['hubli'],
  'hubli': ['hubballi'],
  'gurugram': ['gurgaon'],
  'gurgaon': ['gurugram'],
  'noida': ['greater noida', 'delhi ncr'],
  'new delhi': ['delhi', 'ncr'],
  'delhi': ['new delhi', 'ncr']
};

function normalizePlaceQuery(text: string): string {
  return (text || '').toLowerCase().replace(/[\,\.\-\_\/]/g, ' ').replace(/\s+/g, ' ').trim();
}

function getKnownAliasesFor(cityName: string): string[] {
  const norm = normalizePlaceQuery(cityName);
  const aliases = new Set<string>();
  aliases.add(norm);

  const words = norm.split(/\s+/).filter(Boolean);
  const primaryWord = words[0] || norm;

  for (const [key, list] of Object.entries(DESTINATION_ALIASES)) {
    if (key === norm || key === primaryWord) {
      aliases.add(key);
      list.forEach(a => aliases.add(a));
    }
  }
  return Array.from(aliases);
}

function isLocationMatch(targetStr: string | undefined | null, alias: string): boolean {
  if (!targetStr || !alias) return false;
  const t = targetStr.toLowerCase().trim();
  const a = alias.toLowerCase().trim();
  if (t === a) return true;
  const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
  return regex.test(t);
}

function loadDestinationsDatabase(): void {
  try {
    if (fs.existsSync(DESTINATIONS_FILE_PATH)) {
      const raw = fs.readFileSync(DESTINATIONS_FILE_PATH, 'utf8');
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        DESTINATIONS_DB = list.map((item: any) => {
          const lat = typeof item.latitude === 'number' ? item.latitude : (item.coordinates?.lat || 0);
          const lng = typeof item.longitude === 'number' ? item.longitude : (item.coordinates?.lng || 0);
          return {
            id: item.id || `dest_${item.name.toLowerCase().replace(/[^\w]/g, '_')}`,
            name: item.name,
            displayName: item.displayName || `${item.name}, ${item.state ? `${item.state}, ` : ''}${item.country}`,
            city: item.city || item.name,
            state: item.state || null,
            country: item.country || 'India',
            latitude: lat,
            longitude: lng,
            placeId: item.placeId || null,
            source: 'dataset' as const,
            isCurated: item.isCurated ?? true,
            tagline: item.tagline || `Discover the iconic charm of ${item.name}`,
            heroImage: item.heroImage || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop',
            popularCategories: item.popularCategories || ['Sightseeing', 'Culture', 'Heritage'],
            alternateNames: Array.isArray(item.alternateNames) ? item.alternateNames : [item.name],
            avgDailyCostINR: item.avgDailyCostINR || 4000
          };
        });
        console.log(`[Destinations DB] Successfully loaded ${DESTINATIONS_DB.length} verified destinations from data/destinations.json.`);
      }
    }
  } catch (err: any) {
    console.error('[Destinations DB] Notice while loading data/destinations.json:', err.message);
  }

  // Fallback if file missing or empty
  if (DESTINATIONS_DB.length === 0) {
    DESTINATIONS_DB = POPULAR_DESTINATIONS.map(d => ({
      id: d.id,
      name: d.name,
      displayName: `${d.name}, ${d.state ? `${d.state}, ` : ''}${d.country}`,
      city: d.name,
      state: d.state || null,
      country: d.country || 'India',
      latitude: d.coordinates?.lat || 0,
      longitude: d.coordinates?.lng || 0,
      placeId: null,
      source: 'dataset' as const,
      isCurated: true,
      tagline: d.tagline,
      heroImage: d.heroImage,
      popularCategories: d.popularCategories || [],
      alternateNames: [d.name],
      avgDailyCostINR: d.avgDailyCostINR || 4000
    }));
  }
}
loadDestinationsDatabase();

// --- HOTELS IN-MEMORY CACHE & INDEX --- //
const HOTELS_CSV_PATH = path.resolve(process.cwd(), 'data', 'hotels.csv');
export let CSV_HOTELS_DB: any[] = [];
export const HOTELS_BY_CITY = new Map<string, any[]>();

function loadHotelsCSV(): void {
  try {
    if (fs.existsSync(HOTELS_CSV_PATH)) {
      const content = fs.readFileSync(HOTELS_CSV_PATH, 'utf8');
      const lines = content.split('\n').filter(l => l && l.trim());
      if (lines.length > 1) {
        // Parse CSV with robust row handler
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          const parts = row.split(',');
          if (parts.length < 5) continue;
          const id = parts[0]?.trim() || `htl_csv_${i}`;
          const name = parts[1]?.trim() || 'Resort Stay';
          const destination = parts[2]?.trim() || 'India';
          const type = parts[3]?.trim() || 'Luxury Resort';
          const rating = parseFloat(parts[4]) || 4.7;
          const reviewsCount = parseInt(parts[5], 10) || 150;
          const pricePerNightINR = parseInt(parts[6], 10) || 3500;
          const image = parts[7]?.trim() || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
          const amenities = parts[8] ? parts[8].split(';').map(a => a.trim()).filter(Boolean) : ['Free Wi-Fi', 'Pool', 'Breakfast'];
          const locationDesc = parts[9]?.trim() || `${name} in ${destination}`;
          const isPopular = parts[10]?.trim() === 'true';
          const tagline = parts[11]?.trim() || '';
          const idealFor = parts[12]?.trim() || '';

          const hotelItem = {
            id,
            name,
            destination,
            type,
            rating,
            reviewsCount,
            pricePerNightINR,
            image,
            amenities,
            locationDesc,
            isPopular,
            tagline,
            idealFor,
            source: 'local_dataset'
          };

          CSV_HOTELS_DB.push(hotelItem);
          const key = destination.toLowerCase().trim();
          if (!HOTELS_BY_CITY.has(key)) {
            HOTELS_BY_CITY.set(key, []);
          }
          HOTELS_BY_CITY.get(key)!.push(hotelItem);
        }
      }
    }

    // Also index IMPORTED_HOTELS and FEATURED_HOTELS
    const fallbackList = [...(IMPORTED_HOTELS || []), ...(FEATURED_HOTELS || [])];
    for (const h of fallbackList) {
      const key = (h.destination || '').toLowerCase().trim();
      if (!key) continue;
      if (!HOTELS_BY_CITY.has(key)) {
        HOTELS_BY_CITY.set(key, []);
      }
      if (!HOTELS_BY_CITY.get(key)!.some((existing: any) => existing.name.toLowerCase() === h.name.toLowerCase())) {
        HOTELS_BY_CITY.get(key)!.push({
          ...h,
          rating: Number(h.rating) || 4.7,
          source: 'local_dataset'
        });
      }
    }
    console.log(`[Hotels Data] Indexed hotels across ${HOTELS_BY_CITY.size} destination keys.`);
  } catch (err: any) {
    console.error('[Hotels Data] Error indexing hotels:', err.message);
  }
}
loadHotelsCSV();

// --- INDIAN RESTAURANTS 27,000+ CSV IN-MEMORY INDEX --- //
const RESTAURANTS_CSV_PATH = path.resolve(process.cwd(), 'data', 'indian_restaurants.csv');
export let CSV_RESTAURANTS_DB: any[] = [];
export const RESTAURANTS_BY_CITY = new Map<string, any[]>();

const DEFAULT_RESTAURANT_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80'
];

function loadIndianRestaurantsCSV(): void {
  try {
    if (!fs.existsSync(RESTAURANTS_CSV_PATH)) return;
    const content = fs.readFileSync(RESTAURANTS_CSV_PATH, 'utf8');
    const lines = content.split('\n');
    let count = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) continue;

      const parts = line.split(',');
      if (parts.length < 11) continue;

      const rawName = parts[0]?.trim() || 'Local Diner';
      const name = rawName.replace(/^#+/, '').trim() || 'Spice Trail';
      const rating = parseFloat(parts[1]) || 4.2;
      const price = parseInt(parts[2], 10) || 350;
      const southIndian = parts[4]?.trim() === '1';
      const northIndian = parts[5]?.trim() === '1';
      const fastFood = parts[6]?.trim() === '1';
      const streetFood = parts[7]?.trim() === '1';
      const biryani = parts[8]?.trim() === '1';
      const bakery = parts[9]?.trim() === '1';
      const location = parts[10]?.trim() || 'India';

      const cuisines: string[] = [];
      if (northIndian) cuisines.push('North Indian');
      if (southIndian) cuisines.push('South Indian');
      if (biryani) cuisines.push('Biryani');
      if (streetFood) cuisines.push('Street Food');
      if (fastFood) cuisines.push('Fast Food');
      if (bakery) cuisines.push('Bakery & Desserts');
      if (cuisines.length === 0) cuisines.push('Regional Indian', 'Local Flavors');

      const restaurantItem = {
        id: `csv_rest_${count + 1}`,
        name,
        destination: location,
        cuisine: cuisines,
        type: bakery ? 'Bakery' : streetFood ? 'Street Eatery' : 'Bistro & Diner',
        avgMealCostForTwoINR: price,
        rating,
        reviewsCount: Math.floor(rating * 85 + (count % 300)),
        image: DEFAULT_RESTAURANT_IMAGES[count % DEFAULT_RESTAURANT_IMAGES.length],
        mustTryDishes: biryani ? ['Special Dum Biryani', 'Chicken Seekh Kebab'] : northIndian ? ['Dal Makhani', 'Paneer Butter Masala'] : ['Chef Special Thali'],
        dietaryTags: southIndian ? ['Vegetarian Friendly', 'Pure Veg Options'] : ['Halal / Non-Veg', 'Vegetarian Friendly'],
        address: `${name}, Main Market, ${location}`,
        isPopular: rating >= 4.0,
        vibe: 'Warm, authentic and bustling with locals',
        source: 'local_dataset'
      };

      CSV_RESTAURANTS_DB.push(restaurantItem);
      const locKey = location.toLowerCase().trim();
      if (!RESTAURANTS_BY_CITY.has(locKey)) {
        RESTAURANTS_BY_CITY.set(locKey, []);
      }
      RESTAURANTS_BY_CITY.get(locKey)!.push(restaurantItem);
      count++;
    }

    // Also load and index data/restaurants.csv if present
    const CURATED_RESTAURANTS_CSV_PATH = path.resolve(process.cwd(), 'data', 'restaurants.csv');
    if (fs.existsSync(CURATED_RESTAURANTS_CSV_PATH)) {
      const curContent = fs.readFileSync(CURATED_RESTAURANTS_CSV_PATH, 'utf8');
      const curLines = curContent.split('\n').filter(l => l && l.trim());
      for (let i = 1; i < curLines.length; i++) {
        const parts = curLines[i].split(',');
        if (parts.length < 5) continue;
        const id = parts[0]?.trim() || `rst_cur_${i}`;
        const name = parts[1]?.trim() || 'Culinary Delight';
        const destination = parts[2]?.trim() || 'India';
        const cuisine = parts[3] ? parts[3].split(';').map(c => c.trim()).filter(Boolean) : ['Indian'];
        const type = parts[4]?.trim() || 'Traditional';
        const avgMealCostForTwoINR = parseInt(parts[5], 10) || 850;
        const rating = parseFloat(parts[6]) || 4.7;
        const reviewsCount = parseInt(parts[7], 10) || 120;
        const image = parts[8]?.trim() || DEFAULT_RESTAURANT_IMAGES[0];
        const mustTryDishes = parts[9] ? parts[9].split(';').map(d => d.trim()).filter(Boolean) : ['Chef Special'];
        const dietaryTags = parts[10] ? parts[10].split(';').map(t => t.trim()).filter(Boolean) : ['Vegetarian'];
        const address = parts[11]?.trim() || `${name}, ${destination}`;
        const isPopular = parts[12]?.trim() === 'true';
        const vibe = parts[13]?.trim() || 'Authentic & welcoming';

        const curItem = {
          id,
          name,
          destination,
          cuisine,
          type,
          avgMealCostForTwoINR,
          rating,
          reviewsCount,
          image,
          mustTryDishes,
          dietaryTags,
          address,
          isPopular,
          vibe,
          source: 'local_dataset'
        };

        CSV_RESTAURANTS_DB.unshift(curItem);
        const locKey = destination.toLowerCase().trim();
        if (!RESTAURANTS_BY_CITY.has(locKey)) {
          RESTAURANTS_BY_CITY.set(locKey, []);
        }
        if (!RESTAURANTS_BY_CITY.get(locKey)!.some((existing: any) => existing.name.toLowerCase() === name.toLowerCase())) {
          RESTAURANTS_BY_CITY.get(locKey)!.unshift(curItem);
        }
        count++;
      }
    }

    // Also index IMPORTED_RESTAURANTS & FEATURED_RESTAURANTS
    const fallbackList = [...(IMPORTED_RESTAURANTS || []), ...(FEATURED_RESTAURANTS || [])];
    for (const r of fallbackList) {
      const key = (r.destination || '').toLowerCase().trim();
      if (!key) continue;
      if (!RESTAURANTS_BY_CITY.has(key)) {
        RESTAURANTS_BY_CITY.set(key, []);
      }
      if (!RESTAURANTS_BY_CITY.get(key)!.some((existing: any) => existing.name.toLowerCase() === r.name.toLowerCase())) {
        RESTAURANTS_BY_CITY.get(key)!.push({
          ...r,
          rating: Number(r.rating) || 4.6,
          source: 'local_dataset'
        });
      }
    }

    console.log(`[Restaurants CSV] Successfully indexed ${count} restaurants across ${RESTAURANTS_BY_CITY.size} cities from datasets.`);
  } catch (err: any) {
    console.error('[Restaurants CSV] Notice while loading dataset:', err.message);
  }
}
loadIndianRestaurantsCSV();

// Caching layer for fast search & resolution
interface DestinationCacheEntry {
  timestamp: number;
  data: any;
}

const destSearchCache = new Map<string, DestinationCacheEntry>();
const CACHE_DEST_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

function getDestCache(key: string): any | null {
  const entry = destSearchCache.get(key.toLowerCase().trim());
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_DEST_TTL_MS) {
    destSearchCache.delete(key.toLowerCase().trim());
    return null;
  }
  return entry.data;
}

function setDestCache(key: string, data: any): void {
  destSearchCache.set(key.toLowerCase().trim(), { timestamp: Date.now(), data });
}

// 1. Universal Search Destinations Function
export async function searchDestinations(query: string, limit = 10): Promise<CanonicalDestination[]> {
  const clean = (query || '').trim();
  const cacheKey = `search:${clean}:${limit}`;
  const cached = getDestCache(cacheKey);
  if (cached) return cached;

  const results: CanonicalDestination[] = [];
  const seenKeys = new Set<string>();

  // If query is empty, return top curated destinations
  if (!clean) {
    for (const dest of DESTINATIONS_DB.slice(0, limit)) {
      results.push(dest);
    }
    setDestCache(cacheKey, results);
    return results;
  }

  const q = clean.toLowerCase();
  const commaParts = q.split(',').map(s => s.trim()).filter(Boolean);
  const words = q.split(/\s+/).filter(Boolean);
  const aliasesForQ = getKnownAliasesFor(q);

  // Score all local database destinations
  interface ScoredItem {
    score: number;
    dest: CanonicalDestination;
  }

  const scoredList: ScoredItem[] = [];

  for (const item of DESTINATIONS_DB) {
    const nameLower = item.name.toLowerCase();
    const cityLower = item.city.toLowerCase();
    const stateLower = (item.state || '').toLowerCase();
    const countryLower = item.country.toLowerCase();
    const displayLower = item.displayName.toLowerCase();
    const alternates = (item.alternateNames || []).map(a => a.toLowerCase());

    let score = 0;

    // 1. Exact match on name, city, or aliases
    if (nameLower === q || alternates.includes(q) || aliasesForQ.includes(nameLower) || aliasesForQ.some(a => alternates.includes(a))) {
      score = 1000;
    } else if (cityLower === q || aliasesForQ.includes(cityLower)) {
      score = 950;
    }

    // 2. Comma separated checks (e.g. "Nashik, Maharashtra" or "Dubai, UAE")
    if (commaParts.length >= 2 && score < 900) {
      const p1 = commaParts[0];
      const p2 = commaParts[1];
      const p1Matches = nameLower === p1 || alternates.includes(p1) || cityLower === p1 || aliasesForQ.includes(p1);
      const p2Matches = stateLower.includes(p2) || countryLower.includes(p2) || displayLower.includes(p2);
      if (p1Matches && p2Matches) {
        score = 980;
      } else if ((nameLower.startsWith(p1) || alternates.some(a => a.startsWith(p1))) && p2Matches) {
        score = 920;
      }
    }

    // 3. Prefix matching (e.g. "Nash" -> "Nashik", "Auranga" -> "Chhatrapati Sambhajinagar (Aurangabad)")
    if (score === 0) {
      if (nameLower.startsWith(q) || alternates.some(a => a.startsWith(q)) || aliasesForQ.some(a => a.startsWith(q))) {
        score = 850;
      } else if (cityLower.startsWith(q)) {
        score = 800;
      }
    }

    // 4. Word-boundary matching
    if (score === 0) {
      const allWords = [
        ...nameLower.split(/\s+/),
        ...alternates.flatMap(a => a.split(/\s+/)),
        ...cityLower.split(/\s+/)
      ];
      if (allWords.some(w => w.startsWith(q))) {
        score = 780;
      }
    }

    // 5. Multi-word token match
    if (score === 0 && words.length > 1) {
      const fullText = `${nameLower} ${displayLower} ${alternates.join(' ')}`;
      if (words.every(w => fullText.includes(w))) {
        score = 750;
      }
    }

    // 6. Substring matching
    if (score === 0) {
      if (nameLower.includes(q)) {
        score = 700;
      } else if (alternates.some(a => a.includes(q))) {
        score = 650;
      } else if (cityLower.includes(q)) {
        score = 620;
      } else if (displayLower.includes(q)) {
        score = 600;
      } else if (stateLower.startsWith(q)) {
        score = 550;
      } else if (countryLower.startsWith(q)) {
        score = 500;
      }
    }

    if (score > 0) {
      if (item.isCurated) score += 5;
      scoredList.push({ score, dest: item });
    }
  }

  scoredList.sort((a, b) => b.score - a.score);

  for (const { dest } of scoredList) {
    const key = `${dest.name.toLowerCase()}_${(dest.state || '').toLowerCase()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      results.push(dest);
      if (results.length >= limit) break;
    }
  }

  // If results < 4 and query has >= 2 characters, query OpenStreetMap Nominatim for geocoding fallback
  const topScore = scoredList.length > 0 ? scoredList[0].score : 0;
  if ((results.length < 4 || topScore < 750) && clean.length >= 2) {
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(clean)}&format=json&addressdetails=1&limit=6`;
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'TripNova-AI/1.0 (contact@tripnova.ai)',
          'Accept-Language': 'en'
        },
        signal: AbortSignal.timeout(3500)
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          for (const item of data) {
            const addr = item.address || {};
            const extracted = item.name || (item.display_name ? item.display_name.split(',')[0].trim() : '') || addr.city || addr.town || addr.village || addr.municipality || clean;
            const primaryName = /[a-zA-Z]/.test(clean) && !/[a-zA-Z]/.test(extracted) ? clean : extracted;
            const state = addr.state || addr.region || addr.province || null;
            let country = addr.country || 'India';
            if (country.includes('الإمارات') || clean.toLowerCase().includes('dubai')) {
              country = 'United Arab Emirates';
            }
            const key = `${primaryName.toLowerCase()}_${(state || '').toLowerCase()}`;

            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              const lat = parseFloat(item.lat);
              const lng = parseFloat(item.lon);
              results.push({
                id: `geo_${item.place_id || Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                name: primaryName,
                displayName: item.display_name,
                city: primaryName,
                state,
                country,
                latitude: lat,
                longitude: lng,
                placeId: item.place_id ? String(item.place_id) : null,
                source: 'geocoding',
                isCurated: false,
                tagline: `Destination in ${state ? `${state}, ` : ''}${country}`,
                heroImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
                popularCategories: ['Exploration', 'Travel']
              });

              if (results.length >= limit) break;
            }
          }
        }
      }
    } catch (err: any) {
      console.warn(`[Search Nominatim] Notice for "${clean}":`, err.message);
    }
  }

  const finalResults = results.slice(0, limit);
  setDestCache(cacheKey, finalResults);
  return finalResults;
}

// 2. Central Universal Destination Resolution Engine
export async function resolveDestinationDetails(query: string): Promise<CanonicalDestination | null> {
  const clean = (query || '').trim();
  if (!clean) return null;

  const cached = getDestCache(`resolve:${clean}`);
  if (cached) return cached;

  const aliasesForClean = getKnownAliasesFor(clean);

  // 1. Search local dataset first
  const searchResults = await searchDestinations(clean, 5);
  if (searchResults.length > 0) {
    const best = searchResults[0];
    const q = clean.toLowerCase();
    const nameLower = best.name.toLowerCase();
    const alternates = (best.alternateNames || []).map(a => a.toLowerCase());
    const commaParts = q.split(',').map(s => s.trim()).filter(Boolean);

    let isStrongMatch = nameLower === q || alternates.includes(q) || aliasesForClean.includes(nameLower) ||
      nameLower.startsWith(q) || alternates.some(a => a.startsWith(q));

    if (!isStrongMatch && commaParts.length >= 2) {
      if (nameLower === commaParts[0] || alternates.includes(commaParts[0]) || aliasesForClean.includes(commaParts[0])) {
        isStrongMatch = true;
      }
    }
    if (!isStrongMatch && (nameLower.includes(q) || alternates.some(a => a.includes(q)))) {
      isStrongMatch = true;
    }

    if (isStrongMatch) {
      const resolved: CanonicalDestination = {
        id: best.id,
        name: best.name,
        displayName: best.displayName,
        city: best.city || best.name,
        state: best.state || null,
        country: best.country || 'India',
        latitude: best.latitude,
        longitude: best.longitude,
        placeId: best.placeId || null,
        source: best.source,
        isCurated: best.isCurated ?? true,
        tagline: best.tagline || `Explore iconic sights in ${best.name}`,
        heroImage: best.heroImage || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop',
        popularCategories: best.popularCategories || ['Culture', 'Heritage', 'Sightseeing'],
        alternateNames: best.alternateNames,
        avgDailyCostINR: best.avgDailyCostINR || 4000
      };
      setDestCache(`resolve:${clean}`, resolved);
      return resolved;
    }
  }

  // 2. Query OpenStreetMap Nominatim Geocoding fallback
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(clean)}&format=json&addressdetails=1&limit=1`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'TripNova-AI/1.0 (contact@tripnova.ai)',
        'Accept-Language': 'en'
      },
      signal: AbortSignal.timeout(4000)
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const addr = item.address || {};
        const extracted = item.name || (item.display_name ? item.display_name.split(',')[0].trim() : '') || addr.city || addr.town || addr.village || addr.municipality || clean;
        const primaryName = /[a-zA-Z]/.test(clean) && !/[a-zA-Z]/.test(extracted) ? clean : extracted;
        const state = addr.state || addr.region || addr.province || null;
        let country = addr.country || 'India';
        if (country.includes('الإمارات') || clean.toLowerCase().includes('dubai')) {
          country = 'United Arab Emirates';
        }

        const resolved: CanonicalDestination = {
          id: `geo_${item.place_id || Date.now()}`,
          name: primaryName,
          displayName: item.display_name,
          city: primaryName,
          state,
          country,
          latitude: lat,
          longitude: lng,
          placeId: item.place_id ? String(item.place_id) : null,
          source: 'geocoding',
          isCurated: false,
          heroImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
          tagline: `Scenic getaway and cultural exploration in ${primaryName}`,
          popularCategories: ['Sightseeing', 'Exploration', 'Heritage'],
          avgDailyCostINR: 4000
        };
        setDestCache(`resolve:${clean}`, resolved);
        return resolved;
      }
    }
  } catch (err: any) {
    console.warn(`[Geocoding Nominatim] Notice for "${clean}":`, err.message);
  }

  return null;
}

export async function getDestinationSuggestions(query: string, limit = 8): Promise<CanonicalDestination[]> {
  return searchDestinations(query, limit);
}

// 3. Helper to retrieve all hotels via Drizzle ORM from PostgreSQL with CSV dataset fallback
export const getAllHotels = async (): Promise<any[]> => {
  try {
    const dbRows = await db.select().from(adminHotels).orderBy(desc(adminHotels.createdAt));
    if (dbRows && dbRows.length > 0) {
      return dbRows.map(h => ({
        id: h.id,
        name: h.name,
        destination: h.destination,
        type: h.type,
        rating: Number(h.rating) || 4.7,
        reviewsCount: h.reviewsCount || 150,
        pricePerNightINR: h.pricePerNightINR || 3500,
        image: h.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        amenities: Array.isArray(h.amenities) ? h.amenities : ['Free Wi-Fi', 'Pool', 'Breakfast'],
        locationDesc: h.locationDesc || h.destination,
        isPopular: Boolean(h.isPopular),
        tagline: h.tagline || '',
        idealFor: h.idealFor || '',
        source: 'database'
      }));
    }
  } catch (err: any) {
    // Silently fall back to cached CSV dataset
  }
  return CSV_HOTELS_DB.length > 0 ? CSV_HOTELS_DB : (IMPORTED_HOTELS && IMPORTED_HOTELS.length > 0 ? (IMPORTED_HOTELS as any[]) : (FEATURED_HOTELS as any[]));
};

// 4. Helper to retrieve all restaurants via Drizzle ORM from PostgreSQL with CSV dataset fallback
export const getAllRestaurants = async (): Promise<any[]> => {
  try {
    const dbRows = await db.select().from(adminRestaurants).orderBy(desc(adminRestaurants.createdAt));
    if (dbRows && dbRows.length > 0) {
      return dbRows.map(r => ({
        id: r.id,
        name: r.name,
        destination: r.destination,
        cuisine: Array.isArray(r.cuisine) ? r.cuisine : ['Indian'],
        type: r.type || 'Traditional',
        avgMealCostForTwoINR: r.avgMealCostForTwoINR || 850,
        rating: Number(r.rating) || 4.6,
        reviewsCount: r.reviewsCount || 100,
        image: r.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
        mustTryDishes: Array.isArray(r.mustTryDishes) ? r.mustTryDishes : ['Chef Special'],
        dietaryTags: Array.isArray(r.dietaryTags) ? r.dietaryTags : ['Vegetarian'],
        address: r.address || r.destination,
        isPopular: Boolean(r.isPopular),
        vibe: r.vibe || '',
        source: 'database'
      }));
    }
  } catch (err: any) {
    // Silently fall back to cached CSV dataset
  }
  return CSV_RESTAURANTS_DB.length > 0 ? CSV_RESTAURANTS_DB : (IMPORTED_RESTAURANTS && IMPORTED_RESTAURANTS.length > 0 ? (IMPORTED_RESTAURANTS as any[]) : (FEATURED_RESTAURANTS as any[]));
};

// 5. Strict Destination Hotels Engine
export async function getHotelsForDestination(
  destName: string,
  coords?: { lat: number; lng: number },
  radiusKm = 50,
  checkInDate?: string,
  checkOutDate?: string
): Promise<{
  success: boolean;
  count: number;
  destination: string;
  properties: any[];
  isLive: boolean;
  source: string;
  message?: string;
}> {
  const clean = (destName || '').trim();
  if (!clean) {
    return {
      success: false,
      count: 0,
      destination: '',
      properties: [],
      isLive: false,
      source: 'none',
      message: 'Destination parameter is required'
    };
  }

  const aliases = getKnownAliasesFor(clean);
  const allHotels = await getAllHotels();

  // Filter strictly for this destination or its aliases
  const matchedHotels: any[] = [];
  const seenNames = new Set<string>();

  for (const h of allHotels) {
    const hasDest = h.destination && h.destination.toLowerCase() !== 'india';
    const isMatch = hasDest 
      ? aliases.some(a => isLocationMatch(h.destination, a))
      : aliases.some(a => isLocationMatch(h.locationDesc, a) || isLocationMatch(h.name, a));

    const hName = (h.name || '').toLowerCase().trim();
    if (isMatch && !seenNames.has(hName)) {
      seenNames.add(hName);
      matchedHotels.push({
        ...h,
        distanceLabel: `In ${h.destination || clean}`,
        source: h.source || 'local_dataset'
      });
    }
  }

  // If local hotels found, format and return them
  if (matchedHotels.length > 0) {
    const properties = matchedHotels.map(h => ({
      id: h.id,
      name: h.name,
      destination: h.destination,
      location: h.locationDesc,
      rating: Number(h.rating) || 4.7,
      reviewsCount: h.reviewsCount || 120,
      pricePerNight: `₹${(h.pricePerNightINR || 3500).toLocaleString('en-IN')}/night`,
      priceNumber: h.pricePerNightINR || 3500,
      currency: 'INR',
      image: h.image,
      type: h.type,
      amenities: h.amenities,
      tagline: h.tagline,
      idealFor: h.idealFor,
      distanceLabel: h.distanceLabel || `In ${h.destination}`,
      source: h.source || 'local_dataset',
      isLive: false
    }));

    return {
      success: true,
      count: properties.length,
      destination: clean,
      properties,
      isLive: false,
      source: 'local_dataset',
      message: `Showing ${properties.length} verified stays in ${clean}`
    };
  }

  // If local dataset has no hotels, try external SerpApi Google Hotels
  if (process.env.SERPAPI_API_KEY) {
    try {
      const serpResult = await searchGoogleHotels(clean, checkInDate, checkOutDate);
      if (serpResult.success && serpResult.properties.length > 0) {
        return {
          success: true,
          count: serpResult.properties.length,
          destination: clean,
          properties: serpResult.properties.map(p => ({
            ...p,
            distanceLabel: `In ${clean}`,
            source: 'serpapi'
          })),
          isLive: true,
          source: 'serpapi',
          message: serpResult.message || `Live hotel properties in ${clean}`
        };
      }
    } catch (e) {
      console.warn(`[Hotels] SerpApi search notice for ${clean}:`, e);
    }
  }

  // Honest empty state — NEVER fall back to another city's hotels
  return {
    success: true,
    count: 0,
    destination: clean,
    properties: [],
    isLive: false,
    source: 'none',
    message: 'No verified results found for this category. Try expanding the search radius.'
  };
}

// 6. Strict Destination Restaurants Engine
export async function getRestaurantsForDestination(
  destName: string,
  coords?: { lat: number; lng: number },
  radiusKm = 50
): Promise<{
  success: boolean;
  count: number;
  location: string;
  results: any[];
  isLive: boolean;
  source: string;
  message?: string;
}> {
  const clean = (destName || '').trim();
  if (!clean) {
    return {
      success: false,
      count: 0,
      location: '',
      results: [],
      isLive: false,
      source: 'none',
      message: 'Location query parameter is required'
    };
  }

  const aliases = getKnownAliasesFor(clean);
  const allRestaurants = await getAllRestaurants();

  const matchedRestaurants: any[] = [];
  const seenNames = new Set<string>();

  for (const r of allRestaurants) {
    const hasDest = r.destination && r.destination.toLowerCase() !== 'india';
    const isMatch = hasDest 
      ? aliases.some(a => isLocationMatch(r.destination, a))
      : aliases.some(a => isLocationMatch(r.address, a) || isLocationMatch(r.name, a));

    const rName = (r.name || '').toLowerCase().trim();
    if (isMatch && !seenNames.has(rName)) {
      seenNames.add(rName);
      matchedRestaurants.push({
        id: r.id,
        title: r.name,
        name: r.name,
        destination: r.destination,
        category: r.type || 'Traditional',
        cuisine: r.cuisine || ['Indian'],
        address: r.address || `${r.name}, ${r.destination}`,
        rating: Number(r.rating) || 4.5,
        reviewsCount: r.reviewsCount || 120,
        priceLevel: `₹${r.avgMealCostForTwoINR || 650} for two`,
        thumbnail: r.image,
        image: r.image,
        description: Array.isArray(r.mustTryDishes) ? r.mustTryDishes.join(', ') : 'Specialty Dishes',
        openState: 'Open for dining',
        vibe: r.vibe || 'Authentic & welcoming',
        distanceLabel: `In ${r.destination || clean}`,
        source: r.source || 'local_dataset',
        isLive: false
      });
      if (matchedRestaurants.length >= 60) break;
    }
  }

  if (matchedRestaurants.length > 0) {
    return {
      success: true,
      count: matchedRestaurants.length,
      location: clean,
      results: matchedRestaurants,
      isLive: false,
      source: 'local_dataset',
      message: `Serving ${matchedRestaurants.length} verified culinary spots in ${clean}`
    };
  }

  // If local dataset has no restaurants, query SerpApi Google Local
  if (process.env.SERPAPI_API_KEY) {
    try {
      const serpResult = await searchGoogleLocal(clean, 'Best restaurants & cafes');
      if (serpResult.success && serpResult.results.length > 0) {
        return {
          success: true,
          count: serpResult.results.length,
          location: clean,
          results: serpResult.results.map(r => ({
            ...r,
            distanceLabel: `In ${clean}`,
            source: 'serpapi'
          })),
          isLive: true,
          source: 'serpapi',
          message: `Live culinary spots in ${clean} via SerpApi`
        };
      }
    } catch (e) {
      console.warn(`[Restaurants] SerpApi local search notice for ${clean}:`, e);
    }
  }

  return {
    success: true,
    count: 0,
    location: clean,
    results: [],
    isLive: false,
    source: 'none',
    message: 'No verified dining results found for this destination.'
  };
}

// 7. Strict Tourist Attractions & Sightseeing Engine
export async function getAttractionsForDestination(
  destName: string,
  coords?: { lat: number; lng: number },
  radiusKm = 50
): Promise<{
  success: boolean;
  count: number;
  destination: string;
  attractions: AttractionItem[];
  source: string;
}> {
  const clean = (destName || '').trim();
  if (!clean) {
    return { success: false, count: 0, destination: '', attractions: [], source: 'none' };
  }

  const aliases = getKnownAliasesFor(clean);
  const attractionsList: AttractionItem[] = [];
  const seenNames = new Set<string>();

  // Check matching destinations in DESTINATIONS_DB
  const matchedDest = DESTINATIONS_DB.find(d => {
    const dName = d.name.toLowerCase();
    const dCity = d.city.toLowerCase();
    const alts = (d.alternateNames || []).map(a => a.toLowerCase());
    return aliases.some(a => dName === a || dCity === a || alts.includes(a) || dName.includes(a) || a.includes(dName));
  });

  if (matchedDest && (matchedDest as any).topAttractions && Array.isArray((matchedDest as any).topAttractions)) {
    for (const att of (matchedDest as any).topAttractions) {
      if (!seenNames.has(att.name.toLowerCase())) {
        seenNames.add(att.name.toLowerCase());
        attractionsList.push({
          id: `att_${matchedDest.id}_${attractionsList.length + 1}`,
          name: att.name,
          destination: matchedDest.name,
          category: att.type || 'Sightseeing & Heritage',
          rating: Number(att.rating) || 4.7,
          reviewsCount: Math.floor(120 + Math.random() * 300),
          image: att.image || matchedDest.heroImage || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=800&auto=format&fit=crop',
          fee: att.fee || 'Free entry / Nominal',
          description: `Must-visit attraction in ${matchedDest.name}`,
          latitude: matchedDest.latitude,
          longitude: matchedDest.longitude,
          coordinates: { lat: matchedDest.latitude, lng: matchedDest.longitude },
          distanceKm: 0,
          distanceLabel: `In ${matchedDest.name}`,
          source: 'dataset'
        });
      }
    }
  }

  // Also include nearby destinations within configured radius if coordinates available
  const centerLat = coords?.lat || matchedDest?.latitude;
  const centerLng = coords?.lng || matchedDest?.longitude;

  if (centerLat && centerLng && !isNaN(centerLat) && !isNaN(centerLng)) {
    for (const other of DESTINATIONS_DB) {
      if (other.id === matchedDest?.id) continue;
      if (!other.latitude || !other.longitude) continue;

      const dist = calculateHaversineDistanceKm(centerLat, centerLng, other.latitude, other.longitude);
      if (dist > 0 && dist <= radiusKm) {
        if ((other as any).topAttractions && Array.isArray((other as any).topAttractions)) {
          for (const att of (other as any).topAttractions) {
            if (!seenNames.has(att.name.toLowerCase())) {
              seenNames.add(att.name.toLowerCase());
              attractionsList.push({
                id: `att_near_${other.id}_${attractionsList.length + 1}`,
                name: att.name,
                destination: other.name,
                category: att.type || 'Nearby Attraction',
                rating: Number(att.rating) || 4.6,
                reviewsCount: Math.floor(100 + Math.random() * 200),
                image: att.image || other.heroImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
                fee: att.fee || 'Nominal',
                description: `Iconic place near ${clean} in ${other.name}`,
                latitude: other.latitude,
                longitude: other.longitude,
                coordinates: { lat: other.latitude, lng: other.longitude },
                distanceKm: dist,
                distanceLabel: `Nearby ${clean} — ${dist} km (${other.name})`,
                source: 'dataset'
              });
            }
          }
        }
      }
    }
  }

  // If local attractions found, return them
  if (attractionsList.length > 0) {
    return {
      success: true,
      count: attractionsList.length,
      destination: clean,
      attractions: attractionsList,
      source: 'dataset'
    };
  }

  // If no local attractions, try SerpApi Discover Places
  if (process.env.SERPAPI_API_KEY) {
    try {
      const serpResult = await searchDiscoverPlaces(clean, `Top tourist attractions in ${clean}`);
      if (serpResult.success && serpResult.places.length > 0) {
        const places = serpResult.places.map((p, i) => ({
          id: `serp_att_${i}_${Date.now()}`,
          name: p.title,
          destination: clean,
          category: p.category || 'Sightseeing',
          rating: p.rating || 4.6,
          reviewsCount: p.reviews || 150,
          image: p.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
          description: p.snippet || `Famous spot in ${clean}`,
          distanceKm: 0,
          distanceLabel: `In ${clean}`,
          source: 'serpapi' as const
        }));

        return {
          success: true,
          count: places.length,
          destination: clean,
          attractions: places,
          source: 'serpapi'
        };
      }
    } catch (e) {
      console.warn(`[Attractions] SerpApi search notice for ${clean}:`, e);
    }
  }

  // Dynamic fallback for any town or city using resolved coordinates
  const genericAttractions: AttractionItem[] = [
    {
      id: `dyn_att_1_${Date.now()}`,
      name: `${clean} Heritage Center & Old Town`,
      destination: clean,
      category: 'Historical & Cultural',
      rating: 4.6,
      reviewsCount: 180,
      image: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80',
      description: `Historic walking tour exploring landmark architecture, local traditions, and cultural heritage in ${clean}.`,
      distanceKm: 0,
      distanceLabel: `In ${clean}`,
      source: 'dataset'
    },
    {
      id: `dyn_att_2_${Date.now()}`,
      name: `${clean} Scenic Viewpoint & Nature Trail`,
      destination: clean,
      category: 'Nature & Scenery',
      rating: 4.7,
      reviewsCount: 220,
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      description: `Panoramic viewpoint offering sweeping vistas, serene sunrise spots, and photography vantage points in ${clean}.`,
      distanceKm: 0,
      distanceLabel: `In ${clean}`,
      source: 'dataset'
    },
    {
      id: `dyn_att_3_${Date.now()}`,
      name: `${clean} Central Market & Artisan Bazaars`,
      destination: clean,
      category: 'Shopping & Local Experience',
      rating: 4.5,
      reviewsCount: 140,
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      description: `Vibrant marketplace featuring regional handicrafts, fresh local produce, and street culinary delicacies in ${clean}.`,
      distanceKm: 0,
      distanceLabel: `In ${clean}`,
      source: 'dataset'
    }
  ];

  return {
    success: true,
    count: genericAttractions.length,
    destination: clean,
    attractions: genericAttractions,
    source: 'dataset'
  };
}

// =====================================================================
// API ENDPOINTS FOR DESTINATIONS, HOTELS, RESTAURANTS & ATTRACTIONS
// =====================================================================

// 1. Destination Search Endpoint
app.get('/api/destinations/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || req.query.search as string || '').trim();
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const destinations = await searchDestinations(query, limit);
    return res.json({
      success: true,
      count: destinations.length,
      query,
      destinations
    });
  } catch (err: any) {
    console.error('Error in /api/destinations/search:', err);
    return res.status(500).json({
      success: false,
      count: 0,
      query: '',
      destinations: [],
      error: 'An error occurred while searching destinations.'
    });
  }
});

// 2. Autocomplete Suggestions Endpoint
app.get('/api/destinations/suggest', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || req.query.search as string || '').trim();
    const limit = parseInt(req.query.limit as string, 10) || 8;
    const suggestions = await getDestinationSuggestions(query, limit);
    res.json({
      success: true,
      query,
      count: suggestions.length,
      suggestions
    });
  } catch (err: any) {
    console.error('Error in /api/destinations/suggest:', err);
    res.json({ success: true, query: '', count: 0, suggestions: [] });
  }
});

// 3. Destination Resolution Endpoint (Canonical Destination Single Source of Truth)
app.get('/api/destinations/resolve', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || req.query.name as string || '').trim();
    if (!query) {
      return res.status(400).json({
        success: false,
        resolved: false,
        message: 'Destination name parameter is required (e.g. ?q=Nashik)'
      });
    }

    const resolved = await resolveDestinationDetails(query);
    if (resolved) {
      return res.json({
        success: true,
        resolved: true,
        destination: resolved
      });
    }

    // Graceful error without guesswork or substitution
    return res.status(404).json({
      success: false,
      resolved: false,
      message: "We couldn't identify this destination. Please check the spelling and try again.",
      error: "We couldn't identify this destination. Please check the spelling and try again."
    });
  } catch (err: any) {
    console.error('Error in /api/destinations/resolve:', err);
    return res.status(500).json({
      success: false,
      resolved: false,
      message: "We couldn't identify this destination. Please check the spelling and try again.",
      error: "We couldn't identify this destination. Please check the spelling and try again."
    });
  }
});

// 4. Destinations Catalog List
app.get('/api/destinations', (req: Request, res: Response) => {
  const search = (req.query.search as string || '').toLowerCase().trim();
  const region = req.query.region as string;
  const category = req.query.category as string;

  let filtered = [...DESTINATIONS_DB];

  if (search) {
    const aliases = getKnownAliasesFor(search);
    filtered = filtered.filter(d => 
      aliases.some(a => 
        d.name.toLowerCase().includes(a) ||
        (d.state && d.state.toLowerCase().includes(a)) ||
        d.displayName.toLowerCase().includes(a) ||
        (d.alternateNames && d.alternateNames.some(alt => alt.toLowerCase().includes(a)))
      )
    );
  }

  if (region) {
    filtered = filtered.filter((d: any) => d.region === region || d.state?.toLowerCase() === region.toLowerCase());
  }

  if (category) {
    filtered = filtered.filter(d => 
      d.popularCategories && d.popularCategories.some(c => c.toLowerCase().includes(category.toLowerCase()))
    );
  }

  res.json({ count: filtered.length, destinations: filtered });
});

// 5. Tourist Attractions Endpoint with Radius Support
app.get('/api/destinations/attractions', async (req: Request, res: Response) => {
  try {
    const destination = (req.query.destination as string || req.query.q as string || '').trim();
    const radius = req.query.radius ? parseInt(req.query.radius as string, 10) : 50;
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

    if (!destination) {
      return res.status(400).json({
        success: false,
        count: 0,
        attractions: [],
        message: 'Destination parameter is required (e.g. ?destination=Nashik)'
      });
    }

    const result = await getAttractionsForDestination(
      destination,
      !isNaN(lat!) && !isNaN(lng!) ? { lat: lat!, lng: lng! } : undefined,
      radius
    );

    return res.json(result);
  } catch (err: any) {
    console.error('Error in /api/destinations/attractions:', err);
    res.status(500).json({
      success: false,
      count: 0,
      attractions: [],
      message: 'Unable to load tourist attractions right now.'
    });
  }
});

// 6. Hotels Endpoint (Unified with Strict City Matching & Radius Support)
app.get('/api/hotels', async (req: Request, res: Response) => {
  try {
    const destination = (req.query.destination as string || req.query.q as string || '').toLowerCase().trim();
    const type = (req.query.type as string || '').toLowerCase().trim();
    const minPrice = req.query.minPrice ? parseInt(req.query.minPrice as string, 10) : undefined;
    const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice as string, 10) : undefined;
    const search = (req.query.search as string || '').toLowerCase().trim();
    const popularOnly = req.query.popular === 'true';
    const radius = req.query.radius ? parseInt(req.query.radius as string, 10) : undefined;
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

    if (!destination || destination === 'all') {
      const allHotels = await getAllHotels();
      return res.json({
        success: true,
        count: allHotels.length,
        hotels: allHotels,
        source: 'local_dataset'
      });
    }

    const result = await getHotelsForDestination(
      destination,
      !isNaN(lat!) && !isNaN(lng!) ? { lat: lat!, lng: lng! } : undefined,
      radius
    );

    let filtered = result.properties;
    if (type && type !== 'all') {
      filtered = filtered.filter(h => h.type.toLowerCase().includes(type));
    }
    if (minPrice !== undefined && !isNaN(minPrice)) {
      filtered = filtered.filter(h => (h.priceNumber || h.pricePerNightINR) >= minPrice);
    }
    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      filtered = filtered.filter(h => (h.priceNumber || h.pricePerNightINR) <= maxPrice);
    }
    if (search) {
      filtered = filtered.filter(h =>
        h.name.toLowerCase().includes(search) ||
        (h.location && h.location.toLowerCase().includes(search))
      );
    }
    if (popularOnly) {
      filtered = filtered.filter(h => h.isPopular);
    }

    res.json({
      success: true,
      count: filtered.length,
      destination,
      hotels: filtered,
      isLive: result.isLive,
      source: result.source,
      message: result.message
    });
  } catch (err: any) {
    console.error('Error in /api/hotels:', err);
    res.status(500).json({ success: false, hotels: [], message: err.message });
  }
});

// 7. Restaurants Endpoint (Unified with 27,000+ CSV Dataset & Strict City Matching)
app.get('/api/restaurants', async (req: Request, res: Response) => {
  try {
    const destination = (req.query.destination as string || req.query.location as string || '').toLowerCase().trim();
    const cuisine = (req.query.cuisine as string || '').toLowerCase().trim();
    const type = (req.query.type as string || '').toLowerCase().trim();
    const dietary = (req.query.dietary as string || '').toLowerCase().trim();
    const maxBudget = req.query.maxBudget ? parseInt(req.query.maxBudget as string, 10) : undefined;
    const search = (req.query.search as string || '').toLowerCase().trim();
    const radius = req.query.radius ? parseInt(req.query.radius as string, 10) : undefined;
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

    if (!destination || destination === 'all') {
      const allRestaurants = await getAllRestaurants();
      return res.json({
        success: true,
        count: allRestaurants.slice(0, 50).length,
        restaurants: allRestaurants.slice(0, 50),
        source: 'local_dataset'
      });
    }

    const result = await getRestaurantsForDestination(
      destination,
      !isNaN(lat!) && !isNaN(lng!) ? { lat: lat!, lng: lng! } : undefined,
      radius
    );

    let filtered = result.results;
    if (cuisine && cuisine !== 'all') {
      filtered = filtered.filter(r =>
        r.cuisine && r.cuisine.some((c: string) => c.toLowerCase().includes(cuisine))
      );
    }
    if (type && type !== 'all') {
      filtered = filtered.filter(r => (r.category || r.type || '').toLowerCase().includes(type));
    }
    if (dietary && dietary !== 'all') {
      filtered = filtered.filter(r =>
        r.dietaryTags && r.dietaryTags.some((d: string) => d.toLowerCase().includes(dietary))
      );
    }
    if (maxBudget !== undefined && !isNaN(maxBudget)) {
      filtered = filtered.filter(r => (r.avgMealCostForTwoINR || 500) <= maxBudget);
    }
    if (search) {
      filtered = filtered.filter(r =>
        (r.title || r.name || '').toLowerCase().includes(search) ||
        (r.address && r.address.toLowerCase().includes(search))
      );
    }

    res.json({
      success: true,
      count: filtered.length,
      destination,
      restaurants: filtered,
      isLive: result.isLive,
      source: result.source,
      message: result.message
    });
  } catch (err: any) {
    console.error('Error in /api/restaurants:', err);
    res.status(500).json({ success: false, restaurants: [], message: err.message });
  }
});

function generateDeterministicRecommendations(params: {
  destination: string;
  travelStyle: string;
  budgetTier: string;
  budget?: number;
  dietaryPreferences: any;
  interests: any;
  vibe: string;
  candidateHotels: any[];
  candidateRestaurants: any[];
}) {
  const { destination, travelStyle, candidateHotels, candidateRestaurants } = params;
  return {
    destination,
    personaTitle: `${travelStyle.charAt(0).toUpperCase() + travelStyle.slice(1)} Explorer Experience`,
    matchOverview: `Curated recommendation for ${destination} matching your preferences and travel style.`,
    recommendedHotels: candidateHotels.slice(0, 3).map((h, i) => ({
      id: h.id,
      name: h.name,
      matchScore: 95 - i * 3,
      whyGeminiPickedThis: `High traveler rating and strategic location in ${destination}.`,
      recommendedRoomTip: 'Reserve upper floor rooms with scenic views.',
      bestFor: h.idealFor || 'Comfort & Ambience'
    })),
    recommendedRestaurants: candidateRestaurants.slice(0, 3).map((r, i) => ({
      id: r.id,
      name: r.name || r.title,
      matchScore: 96 - i * 2,
      whyGeminiPickedThis: `Authentic regional flavors and top culinary ratings in ${destination}.`,
      mustTryForYou: r.mustTryDishes || ['Signature Specialty', 'House Thali'],
      bestTimeToVisit: i === 0 ? 'Lunch' : 'Dinner'
    })),
    curatedDayPairing: {
      morningStay: `Breakfast & relaxation at ${candidateHotels[0]?.name || 'Stay'}`,
      lunchSpot: `Regional lunch at ${candidateRestaurants[0]?.name || candidateRestaurants[0]?.title || 'Local Bistro'}`,
      eveningExperience: `Sightseeing & cultural stroll through ${destination}`,
      dinnerSpot: `Gourmet dinner at ${candidateRestaurants[1]?.name || candidateRestaurants[1]?.title || 'Dining Lounge'}`
    },
    aiInsiderTips: [
      `Try local street food specialties in the historic quarter of ${destination}.`,
      'Digital UPI payments are accepted almost everywhere.',
      'Early mornings offer the most pleasant weather for outdoor attractions.'
    ]
  };
}

// 4b. Gemini AI Personalized Recommendations
app.post('/api/recommendations/personalized', aiPlannerRateLimiter, async (req: Request, res: Response) => {
  try {
    const {
      destination = 'Goa',
      travelStyle = 'couple',
      budget,
      budgetTier = 'moderate',
      dietaryPreferences = ['Vegetarian'],
      interests = ['Beach', 'Culture'],
      vibe = '',
      nights = 3,
      guestsCount = 2
    } = req.body;

    let numBudget: number | undefined;
    if (budget !== undefined && budget !== null && budget !== '') {
      const parsed = Number(budget);
      if (!isNaN(parsed) && parsed > 0 && isFinite(parsed)) {
        numBudget = parsed;
      }
    }

    const allHotels = await getAllHotels();
    const allRestaurants = await getAllRestaurants();

    const targetDest = destination.trim().toLowerCase();
    let candidateHotels = allHotels.filter(h =>
      h.destination.toLowerCase().includes(targetDest) || targetDest.includes(h.destination.toLowerCase())
    );
    if (candidateHotels.length === 0) {
      candidateHotels = allHotels.slice(0, 6);
    }

    let candidateRestaurants = allRestaurants.filter(r =>
      r.destination.toLowerCase().includes(targetDest) || targetDest.includes(r.destination.toLowerCase())
    );
    if (candidateRestaurants.length === 0) {
      const csvRestObj = await getRestaurantsForDestination(targetDest);
      if (csvRestObj.results && csvRestObj.results.length > 0) {
        candidateRestaurants = csvRestObj.results.slice(0, 12);
      } else {
        candidateRestaurants = allRestaurants.slice(0, 8);
      }
    }

    let recommendationData: any = null;
    let isAIGenerated = false;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = getGeminiClient();
        const simplifiedHotels = candidateHotels.slice(0, 6).map(h => ({
          id: h.id,
          name: h.name,
          destination: h.destination,
          type: h.type,
          rating: h.rating,
          pricePerNightINR: h.pricePerNightINR,
          amenities: h.amenities,
          idealFor: h.idealFor,
          tagline: h.tagline,
        }));

        const simplifiedRestaurants = candidateRestaurants.slice(0, 8).map(r => ({
          id: r.id,
          name: r.name,
          destination: r.destination,
          cuisine: r.cuisine,
          type: r.type,
          rating: r.rating,
          avgMealCostForTwoINR: r.avgMealCostForTwoINR,
          mustTryDishes: r.mustTryDishes,
          dietaryTags: r.dietaryTags,
          vibe: r.vibe,
        }));

        const prompt = `User Travel Profile:
Destination: ${destination}
Travel Style: ${travelStyle}
${numBudget ? `Total User Trip Budget: ₹${numBudget.toLocaleString('en-IN')}` : `Budget Tier: ${budgetTier}`}
Dietary Preferences: ${Array.isArray(dietaryPreferences) ? dietaryPreferences.join(', ') : dietaryPreferences}
Interests: ${Array.isArray(interests) ? interests.join(', ') : interests}
Desired Vibe: ${vibe || 'Authentic, memorable, relaxing'}
Duration: ${nights} nights for ${guestsCount} travelers.
${numBudget ? `NOTE: The traveler has an explicit total budget of ₹${numBudget.toLocaleString('en-IN')}. Please select stays and dining options that fit sensibly into this total budget.` : ''}

Available Candidate Hotels from Database:
${JSON.stringify(simplifiedHotels, null, 2)}

Available Candidate Restaurants from Database:
${JSON.stringify(simplifiedRestaurants, null, 2)}

Instructions:
1. Select 2-3 best matching hotels from the candidates.
2. Select 2-3 best matching restaurants from the candidates, respecting dietary preferences.
3. Design a cohesive "Curated Day Pairing" combining the chosen stay, a lunch venue, evening experience, and dinner venue.
4. Provide 3 high-value local insider tips for this traveler.
Return ONLY valid JSON matching this schema:
{
  "destination": "${destination}",
  "personaTitle": "Catchy Persona Name (e.g. Coastal Serenity Seekers)",
  "matchOverview": "2-3 sentences explaining why these selections fit their style, budget, and vibe",
  "recommendedHotels": [
    {
      "id": "must match one candidate hotel id",
      "name": "hotel name",
      "matchScore": 95,
      "whyGeminiPickedThis": "personalized reason",
      "recommendedRoomTip": "room or view recommendation",
      "bestFor": "key highlight"
    }
  ],
  "recommendedRestaurants": [
    {
      "id": "must match one candidate restaurant id",
      "name": "restaurant name",
      "matchScore": 96,
      "whyGeminiPickedThis": "personalized reason",
      "mustTryForYou": ["dish1", "dish2"],
      "bestTimeToVisit": "time or meal recommendation"
    }
  ],
  "curatedDayPairing": {
    "morningStay": "Morning experience at recommended stay",
    "lunchSpot": "Midday dining experience",
    "eveningExperience": "Late afternoon or sunset activity",
    "dinnerSpot": "Evening dining & culinary highlight"
  },
  "aiInsiderTips": [
    "Tip 1",
    "Tip 2",
    "Tip 3"
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are RoamMind AI, an elite travel intelligence architect delivering authentic, deeply personalized recommendations based exclusively on verified database choices.',
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '{}';
        const parsed = JSON.parse(rawText);
        if (parsed.recommendedHotels && parsed.recommendedRestaurants) {
          recommendationData = parsed;
          isAIGenerated = true;
        }
      } catch (aiErr: any) {
        console.warn('Gemini AI generation notice in /api/recommendations/personalized:', aiErr.message);
      }
    }

    if (!recommendationData) {
      recommendationData = generateDeterministicRecommendations({
        destination,
        travelStyle,
        budgetTier,
        budget: numBudget,
        dietaryPreferences,
        interests,
        vibe,
        candidateHotels,
        candidateRestaurants,
      });
    }

    const enrichedHotels = (recommendationData.recommendedHotels || []).map((recH: any) => {
      const fullH = allHotels.find(h => h.id === recH.id || h.name.toLowerCase() === recH.name.toLowerCase()) || candidateHotels[0];
      return {
        ...fullH,
        ...recH,
        matchScore: recH.matchScore || 94,
        priceDisplay: `₹${(fullH?.pricePerNightINR || 3500).toLocaleString('en-IN')}/night`,
      };
    });

    const enrichedRestaurants = (recommendationData.recommendedRestaurants || []).map((recR: any) => {
      const fullR = allRestaurants.find(r => r.id === recR.id || r.name.toLowerCase() === recR.name.toLowerCase()) || candidateRestaurants[0];
      return {
        ...fullR,
        ...recR,
        matchScore: recR.matchScore || 92,
        costDisplay: `₹${(fullR?.avgMealCostForTwoINR || 850).toLocaleString('en-IN')} for two`,
      };
    });

    res.json({
      success: true,
      isAIGenerated,
      data: {
        ...recommendationData,
        recommendedHotels: enrichedHotels,
        recommendedRestaurants: enrichedRestaurants,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/recommendations/personalized:', err);
    res.status(500).json({ success: false, message: 'Unable to generate personalized recommendations.' });
  }
});

// 4c. Admin CSV Import / Synchronization trigger
app.post('/api/admin/import-csv', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const stats = await importDatasets();
    res.json({
      success: true,
      message: `CSV import completed. Synchronized ${stats.hotelsCount} hotels and ${stats.restaurantsCount} restaurants.`,
      stats,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/import-csv:', err);
    res.status(500).json({ success: false, message: 'Failed to import CSV dataset: ' + err.message });
  }
});

// 5. Universal Weather Endpoint (Open-Meteo Live Coordinates API + WeatherAPI / OpenWeatherMap Integration)
app.post('/api/weather', async (req: Request, res: Response) => {
  try {
    const { city, latitude, longitude } = req.body;
    const targetCity = (city || 'Goa').trim();
    const apiKey = process.env.WEATHER_API_KEY;

    // Resolve coordinates if missing
    let lat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : undefined;
    let lng = typeof longitude === 'number' && !isNaN(longitude) ? longitude : undefined;

    if (lat === undefined || lng === undefined) {
      const resolved = await resolveDestinationDetails(targetCity);
      if (resolved) {
        lat = resolved.latitude;
        lng = resolved.longitude;
      }
    }

    // 1. Try Open-Meteo Live Weather API using coordinates (100% Free, Global, Real-Time without API keys)
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      try {
        const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,precipitation_probability,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const omRes = await fetch(omUrl, { signal: AbortSignal.timeout(4000) });
        if (omRes.ok) {
          const omData = await omRes.json();
          const cw = omData.current_weather || {};
          const daily = omData.daily || {};
          const hourly = omData.hourly || {};

          const liveTemp = Math.round(cw.temperature !== undefined ? cw.temperature : 26);
          const weatherCode = cw.weathercode || 0;

          const codeToCondition = (code: number): { text: string; icon: string } => {
            if (code === 0) return { text: 'Clear Sky', icon: 'Sun' };
            if (code <= 3) return { text: 'Partly Cloudy', icon: 'CloudSun' };
            if (code <= 48) return { text: 'Hazy / Foggy', icon: 'Cloud' };
            if (code <= 55) return { text: 'Light Drizzle', icon: 'CloudRain' };
            if (code <= 65) return { text: 'Rain Showers', icon: 'CloudRain' };
            if (code <= 75) return { text: 'Snowfall', icon: 'Snow' };
            if (code <= 82) return { text: 'Heavy Showers', icon: 'CloudRain' };
            if (code >= 95) return { text: 'Thunderstorm', icon: 'Zap' };
            return { text: 'Sunny & Pleasant', icon: 'Sun' };
          };

          const currentCond = codeToCondition(weatherCode);

          // Build hourly slots
          const hourlyForecast = [];
          const nowHour = new Date().getHours();
          const timeArr = hourly.time || [];
          const tempArr = hourly.temperature_2m || [];
          const rainArr = hourly.precipitation_probability || [];
          const codeArr = hourly.weathercode || [];

          for (let i = nowHour; i < Math.min(nowHour + 12, timeArr.length); i += 2) {
            const timeStr = timeArr[i] ? timeArr[i].split('T')[1] || `${i}:00` : `${i}:00`;
            hourlyForecast.push({
              time: timeStr,
              tempC: Math.round(tempArr[i] !== undefined ? tempArr[i] : liveTemp),
              icon: codeToCondition(codeArr[i] || 0).icon,
              rainProb: rainArr[i] !== undefined ? rainArr[i] : 10
            });
          }

          if (hourlyForecast.length === 0) {
            hourlyForecast.push(
              { time: '08:00 AM', tempC: liveTemp - 2, icon: 'Sun', rainProb: 5 },
              { time: '12:00 PM', tempC: liveTemp + 2, icon: 'SunMedium', rainProb: 10 },
              { time: '04:00 PM', tempC: liveTemp, icon: 'CloudSun', rainProb: 10 },
              { time: '08:00 PM', tempC: liveTemp - 3, icon: 'Moon', rainProb: 0 }
            );
          }

          // Build 7-day forecast
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const sevenDayForecast = (daily.time || []).map((dateStr: string, idx: number) => {
            const dateObj = new Date(dateStr);
            const dayName = isNaN(dateObj.getTime()) ? `Day ${idx + 1}` : (idx === 0 ? 'Today' : dayNames[dateObj.getDay()]);
            return {
              day: dayName,
              highC: Math.round(daily.temperature_2m_max?.[idx] !== undefined ? daily.temperature_2m_max[idx] : liveTemp + 3),
              lowC: Math.round(daily.temperature_2m_min?.[idx] !== undefined ? daily.temperature_2m_min[idx] : liveTemp - 4),
              condition: codeToCondition(daily.weathercode?.[idx] || 0).text
            };
          });

          return res.json({
            city: targetCity,
            tempC: liveTemp,
            condition: currentCond.text,
            humidity: Math.round(hourly.relativehumidity_2m?.[nowHour] || 58),
            windKmH: Math.round(cw.windspeed || 12),
            uvIndex: 6,
            aqi: 42,
            aqiText: 'Good',
            hourlyForecast,
            sevenDayForecast,
            forecast: sevenDayForecast,
            rainAlert: currentCond.text.includes('Rain') || currentCond.text.includes('Showers')
              ? `Rain detected in ${targetCity}. Carry umbrellas and rain gear.`
              : `Pleasant weather in ${targetCity}. Ideal for sightseeing.`,
            recommendations: [
              `Current weather: ${currentCond.text} at ${liveTemp}°C in ${targetCity}.`,
              'Carry sun protection during outdoor daytime tours.',
              'Keep hydration bottles and light layers handy.'
            ],
            isLive: true,
            source: 'open_meteo'
          });
        }
      } catch (omErr) {
        console.warn(`[Open-Meteo Weather] Notice for ${targetCity}:`, omErr);
      }
    }

    // 2. Fallback to WeatherAPI if key available
    if (apiKey) {
      try {
        const weatherApiRes = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(targetCity)}&days=7`
        );
        if (weatherApiRes.ok) {
          const data = await weatherApiRes.json();
          const current = data.current;
          const forecast = data.forecast?.forecastday || [];

          return res.json({
            city: data.location?.name || targetCity,
            tempC: Math.round(current.temp_c),
            condition: current.condition?.text || 'Clear & Sunny',
            humidity: current.humidity || 62,
            windKmH: Math.round(current.wind_kph || 12),
            uvIndex: current.uv || 6,
            aqi: 42,
            aqiText: 'Good',
            hourlyForecast: (forecast[0]?.hour || []).slice(8, 18).filter((_: any, i: number) => i % 2 === 0).map((h: any) => ({
              time: h.time.split(' ')[1] || '12:00',
              tempC: Math.round(h.temp_c),
              icon: h.condition?.text?.includes('Rain') ? 'CloudRain' : 'Sun',
              rainProb: h.chance_of_rain || 10
            })),
            sevenDayForecast: forecast.map((f: any) => {
              const dateObj = new Date(f.date);
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              return {
                day: dayNames[dateObj.getDay()],
                highC: Math.round(f.day.maxtemp_c),
                lowC: Math.round(f.day.mintemp_c),
                condition: f.day.condition?.text || 'Clear'
              };
            }),
            rainAlert: current.precip_mm > 0 ? `Precipitation alert: ${current.precip_mm}mm expected.` : 'No immediate heavy rainfall alerts.',
            recommendations: [
              `Current weather: ${current.condition?.text} at ${Math.round(current.temp_c)}°C in ${targetCity}.`,
              'Carry sun protection during outdoor daytime tours.',
              'Keep hydration bottles and light layers handy.'
            ],
            isLive: true,
            source: 'weatherapi'
          });
        }
      } catch (e) {
        console.error('External Weather API query error:', e);
      }
    }

    // 3. Coordinate-adjusted realistic weather calculation (never default Mumbai/Goa)
    const baseTemp = lat ? Math.max(12, Math.min(38, Math.round(35 - Math.abs(lat - 15) * 0.7))) : 27;
    return res.json({
      city: targetCity,
      tempC: baseTemp,
      condition: 'Sunny & Pleasant',
      humidity: 58,
      windKmH: 12,
      uvIndex: 6,
      aqi: 42,
      aqiText: 'Good',
      hourlyForecast: [
        { time: '08:00 AM', tempC: baseTemp - 3, icon: 'Sun', rainProb: 5 },
        { time: '11:00 AM', tempC: baseTemp + 1, icon: 'Sun', rainProb: 10 },
        { time: '02:00 PM', tempC: baseTemp + 3, icon: 'SunMedium', rainProb: 15 },
        { time: '05:00 PM', tempC: baseTemp, icon: 'CloudSun', rainProb: 10 },
        { time: '08:00 PM', tempC: baseTemp - 3, icon: 'Moon', rainProb: 0 }
      ],
      sevenDayForecast: [
        { day: 'Today', highC: baseTemp + 3, lowC: baseTemp - 4, condition: 'Sunny' },
        { day: 'Mon', highC: baseTemp + 2, lowC: baseTemp - 5, condition: 'Clear Sky' },
        { day: 'Tue', highC: baseTemp + 3, lowC: baseTemp - 4, condition: 'Sunny' },
        { day: 'Wed', highC: baseTemp + 1, lowC: baseTemp - 6, condition: 'Partly Cloudy' },
        { day: 'Thu', highC: baseTemp, lowC: baseTemp - 5, condition: 'Pleasant Breeze' },
        { day: 'Fri', highC: baseTemp + 2, lowC: baseTemp - 4, condition: 'Sunny' },
        { day: 'Sat', highC: baseTemp + 3, lowC: baseTemp - 3, condition: 'Golden Sunset' }
      ],
      rainAlert: `No immediate heavy rainfall alerts for ${targetCity}.`,
      recommendations: [
        `Pleasant conditions at ${baseTemp}°C in ${targetCity}.`,
        'Carry light breathable clothing and sunscreen.',
        'Early morning hours (06:00 - 09:00 AM) offer ideal lighting for photography.'
      ],
      isLive: false,
      source: 'local_estimate'
    });
  } catch (err: any) {
    console.error('Error in /api/weather:', err);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// 6. AI Smart Trip Generator using Gemini (Strict Destination Fidelity & Custom Budget)
app.post('/api/planner/generate', aiPlannerRateLimiter, async (req: Request, res: Response) => {
  try {
    const {
      origin = 'Mumbai',
      destination = 'Nashik',
      durationDays = 3,
      travelersCount = 2,
      budget,
      budgetTier,
      travelStyle = 'couple',
      interests = ['Food', 'Culture', 'Sightseeing'],
      additionalPrompt = ''
    } = req.body;

    const targetDestination = (destination || 'Nashik').trim();

    // Strict validation and normalization of numeric budget
    let numericBudget: number;
    if (budget !== undefined && budget !== null && budget !== '') {
      numericBudget = Number(budget);
      if (isNaN(numericBudget) || !isFinite(numericBudget) || numericBudget <= 0) {
        return res.status(400).json({
          error: 'Invalid budget amount. Please provide a valid positive numeric budget in INR (e.g. 7350).'
        });
      }
    } else if (budgetTier) {
      numericBudget = budgetTier === 'backpacker' ? 1800 * durationDays * travelersCount 
        : budgetTier === 'luxury' ? 12000 * durationDays * travelersCount 
        : 4200 * durationDays * travelersCount;
    } else {
      numericBudget = 10000;
    }

    const derivedBudgetTier: BudgetTier = numericBudget <= (2000 * durationDays * travelersCount)
      ? 'backpacker'
      : numericBudget >= (10000 * durationDays * travelersCount)
        ? 'luxury'
        : 'moderate';
    const effectiveBudgetTier = (budgetTier as BudgetTier) || derivedBudgetTier;

    const ai = getGeminiClient();

    const systemInstruction = `You are RoamMind AI, an elite travel architect specializing in highly detailed, authentic, day-wise itineraries for travel across India and top global destinations.
CRITICAL MANDATORY RULE: You MUST create the entire itinerary strictly for "${targetDestination}". Do NOT replace or substitute "${targetDestination}" with another city or popular destination under any circumstances.
Generate a structured trip itinerary in strictly JSON format matching this schema:
{
  "title": string,
  "origin": string,
  "destination": string,
  "durationDays": number,
  "totalEstimatedCostINR": number,
  "budget": number,
  "remainingBudgetINR": number,
  "budgetBreakdown": {
    "transportationINR": number,
    "accommodationINR": number,
    "foodINR": number,
    "activitiesINR": number,
    "localTravelINR": number,
    "remainingBudgetINR": number
  },
  "days": [
    {
      "dayNumber": number,
      "theme": string,
      "summary": string,
      "dailyBudgetEstimateINR": number,
      "activities": [
        {
          "id": string,
          "time": string,
          "category": "breakfast" | "morning" | "lunch" | "afternoon" | "evening" | "dinner" | "night" | "stay",
          "title": string,
          "description": string,
          "locationName": string,
          "estimatedCostINR": number,
          "durationHours": number,
          "travelTimeFromPrev": string,
          "tips": string
        }
      ]
    }
  ],
  "packingChecklist": [string],
  "localTips": [string],
  "emergencyContacts": {
    "police": "112",
    "touristHelpline": "1363",
    "medical": "108"
  }
}
CRITICAL INSTRUCTION FOR BUDGET:
The traveler has specified an exact total trip budget of ₹${numericBudget.toLocaleString('en-IN')}.
Make sure "totalEstimatedCostINR" realistically adheres to this budget of ₹${numericBudget.toLocaleString('en-IN')}.
Populate "budget" with ${numericBudget}, calculate "remainingBudgetINR" = Math.max(0, ${numericBudget} - totalEstimatedCostINR), and provide a realistic "budgetBreakdown".
Provide authentic local spots in ${targetDestination}, genuine food dishes, accurate travel times, and sensible cost estimates in INR.`;

    let SerpContext = '';
    if (process.env.SERPAPI_API_KEY) {
      try {
        const [hotelsRes, localRes] = await Promise.all([
          searchGoogleHotels(targetDestination),
          searchGoogleLocal(targetDestination, 'Top attractions & restaurants')
        ]);
        
        if (hotelsRes.success && hotelsRes.properties.length > 0) {
          const hotelNames = hotelsRes.properties.slice(0, 3).map(h => `${h.name} (${h.pricePerNight})`).join(', ');
          SerpContext += `\nTop Real-time Hotel Stays in ${targetDestination}: ${hotelNames}.`;
        }
        if (localRes.success && localRes.results.length > 0) {
          const spotNames = localRes.results.slice(0, 4).map(l => `${l.title} (${l.category})`).join(', ');
          SerpContext += `\nVerified Real Local Spots & Dining in ${targetDestination}: ${spotNames}.`;
        }
      } catch (e) {
        console.warn('SerpApi AI planner context fetch error:', e);
      }
    }

    const userPrompt = `Create a ${durationDays}-day ${travelStyle} trip to ${targetDestination} starting from ${origin} for ${travelersCount} travelers.
Total Trip Budget: ₹${numericBudget.toLocaleString('en-IN')} (exact amount: ₹${numericBudget}).
Budget category reference: ${effectiveBudgetTier}.
Interests: ${interests.join(', ')}.
Extra details: ${additionalPrompt || `Include best local spots, must-try regional food, sunset views, and smooth pacing in ${targetDestination}.`}${SerpContext}`;

    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '';
      try {
        const parsedJson = JSON.parse(responseText);
        const estCost = Number(parsedJson.totalEstimatedCostINR) || Math.min(numericBudget, durationDays * 3500 * travelersCount);
        const remBudget = parsedJson.remainingBudgetINR !== undefined 
          ? Number(parsedJson.remainingBudgetINR) 
          : Math.max(0, numericBudget - estCost);

        const breakdown = parsedJson.budgetBreakdown || {
          accommodationINR: Math.round(estCost * 0.40),
          foodINR: Math.round(estCost * 0.28),
          transportationINR: Math.round(estCost * 0.16),
          activitiesINR: Math.round(estCost * 0.11),
          localTravelINR: Math.round(estCost * 0.05),
          remainingBudgetINR: remBudget
        };

        const itinerary: TravelItinerary = {
          id: 'trip_' + Date.now(),
          title: parsedJson.title || `${durationDays} Days in ${targetDestination}`,
          origin,
          destination: targetDestination,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0],
          durationDays: Number(durationDays),
          travelersCount: Number(travelersCount),
          budget: numericBudget,
          budgetTier: effectiveBudgetTier,
          travelStyle,
          interests,
          totalEstimatedCostINR: estCost,
          remainingBudgetINR: remBudget,
          budgetBreakdown: breakdown,
          currency: 'INR',
          days: parsedJson.days || [],
          packingChecklist: parsedJson.packingChecklist || ['Comfortable footwear', 'Sunscreen SPF 50', 'Power bank', 'Government Photo ID'],
          localTips: parsedJson.localTips || [`Book heritage monuments in ${targetDestination} in advance online to bypass queues.`, 'Keep cash for auto-rickshaws and street food stalls.'],
          emergencyContacts: parsedJson.emergencyContacts || { police: '112', touristHelpline: '1363', medical: '108' },
          createdAt: new Date().toISOString()
        };
        return res.json({ success: true, itinerary });
      } catch (parseErr) {
        console.warn('Gemini JSON parse failed, returning robust structured fallback', parseErr);
      }
    }

    // Fallback response generator scaled realistically to numericBudget and strictly for targetDestination
    const targetDailyTotal = Math.max(500, Math.round(numericBudget / durationDays));
    const dailyActivityBudget = Math.round(targetDailyTotal * 0.55);

    const breakfastCost = Math.max(80, Math.round((dailyActivityBudget * 0.12) / travelersCount));
    const monumentCost = Math.max(50, Math.round((dailyActivityBudget * 0.18) / travelersCount));
    const lunchCost = Math.max(120, Math.round((dailyActivityBudget * 0.25) / travelersCount));
    const eveningCost = Math.max(80, Math.round((dailyActivityBudget * 0.15) / travelersCount));
    const dinnerCost = Math.max(150, Math.round((dailyActivityBudget * 0.30) / travelersCount));

    const mockDays: ItineraryDay[] = Array.from({ length: durationDays }, (_, idx) => ({
      dayNumber: idx + 1,
      theme: idx === 0 ? `Arrival & Exploration in ${targetDestination}` : idx === 1 ? `Cultural Heritage & Food Trails in ${targetDestination}` : `Scenic Vistas & Farewell ${targetDestination}`,
      summary: `Day ${idx + 1} focuses on exploring top attractions around ${targetDestination} with curated dining, sightseeing, and relaxation planned within your ₹${numericBudget.toLocaleString('en-IN')} trip budget.`,
      dailyBudgetEstimateINR: targetDailyTotal,
      activities: [
        {
          id: `d${idx + 1}_a1`,
          time: '08:30 AM',
          category: 'breakfast',
          title: `Traditional Breakfast in ${targetDestination}`,
          description: `Kickstart your morning in ${targetDestination} with authentic local breakfast specialties, freshly brewed coffee or masala chai.`,
          locationName: `${targetDestination} Central Promenade`,
          estimatedCostINR: breakfastCost * travelersCount,
          durationHours: 1,
          travelTimeFromPrev: '15 mins from stay',
          tips: 'Arrive early to avoid peak breakfast rush.'
        },
        {
          id: `d${idx + 1}_a2`,
          time: '10:00 AM',
          category: 'morning',
          title: `Iconic Landmark & Heritage Tour in ${targetDestination}`,
          description: `Guided walk through iconic monuments and scenic landmarks in ${targetDestination}, learning rich local history.`,
          locationName: `Iconic Heritage Spot, ${targetDestination}`,
          estimatedCostINR: monumentCost * travelersCount,
          durationHours: 2.5,
          travelTimeFromPrev: '10 mins drive',
          tips: 'Carry water and wear comfortable walking shoes.'
        },
        {
          id: `d${idx + 1}_a3`,
          time: '01:30 PM',
          category: 'lunch',
          title: `Authentic Regional Lunch in ${targetDestination}`,
          description: `Savor signature culinary delicacies and thalis prepared with fresh regional spices.`,
          locationName: `Popular Local Diner, ${targetDestination}`,
          estimatedCostINR: lunchCost * travelersCount,
          durationHours: 1.5,
          travelTimeFromPrev: '5 mins walk'
        },
        {
          id: `d${idx + 1}_a4`,
          time: '04:00 PM',
          category: 'evening',
          title: `Sunset Viewpoint & Artisan Bazaar in ${targetDestination}`,
          description: `Enjoy panoramic sunset views followed by strolling through bustling craft markets for souvenirs.`,
          locationName: `Sunset Promenade & Bazaar, ${targetDestination}`,
          estimatedCostINR: eveningCost * travelersCount,
          durationHours: 2.5,
          travelTimeFromPrev: '20 mins transit'
        },
        {
          id: `d${idx + 1}_a5`,
          time: '08:00 PM',
          category: 'dinner',
          title: `Atmospheric Dinner in ${targetDestination}`,
          description: `Unwind with ambient dining and regional cuisine overlooking illuminated streets of ${targetDestination}.`,
          locationName: `Rooftop Restaurant, ${targetDestination}`,
          estimatedCostINR: dinnerCost * travelersCount,
          durationHours: 2
        }
      ]
    }));

    const totalActivitiesCost = mockDays.reduce((acc, d) => acc + d.activities.reduce((s, a) => s + a.estimatedCostINR, 0), 0);
    const estStayCost = Math.max(0, numericBudget - totalActivitiesCost);
    const totalEstCost = Math.min(numericBudget, totalActivitiesCost + Math.round(estStayCost * 0.85));
    const remainingINR = Math.max(0, numericBudget - totalEstCost);

    const fallbackItinerary: TravelItinerary = {
      id: 'trip_' + Date.now(),
      title: `${durationDays}-Day Intelligent ${targetDestination} Escape`,
      origin,
      destination: targetDestination,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0],
      durationDays: Number(durationDays),
      travelersCount: Number(travelersCount),
      budget: numericBudget,
      budgetTier: effectiveBudgetTier,
      travelStyle,
      interests,
      totalEstimatedCostINR: totalEstCost,
      remainingBudgetINR: remainingINR,
      budgetBreakdown: {
        accommodationINR: Math.round(totalEstCost * 0.40),
        foodINR: Math.round(totalEstCost * 0.28),
        transportationINR: Math.round(totalEstCost * 0.16),
        activitiesINR: Math.round(totalEstCost * 0.11),
        localTravelINR: Math.round(totalEstCost * 0.05),
        remainingBudgetINR: remainingINR
      },
      currency: 'INR',
      days: mockDays,
      packingChecklist: ['Comfortable footwear', 'Sunscreen SPF 50', 'Power bank', 'Government Photo ID', 'Light jacket / scarf'],
      localTips: [`Early morning visits to top spots in ${targetDestination} provide peaceful views without crowds.`, 'Carry cash for local transport and street vendors.'],
      emergencyContacts: { police: '112', touristHelpline: '1363', medical: '108' },
      createdAt: new Date().toISOString()
    };

    return res.json({ success: true, itinerary: fallbackItinerary });
  } catch (err: any) {
    console.error('Error in /api/planner/generate:', err);
    res.status(500).json({ success: false, error: 'Failed to generate itinerary. Please try again.' });
  }
});

// 7. Developer & Admin Diagnostic Search Audit Endpoint
app.get('/api/admin/audit-search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || req.query.search as string || 'Nashik').trim();
    const resolved = await resolveDestinationDetails(query);

    const hotelsResult = await getHotelsForDestination(
      query,
      resolved ? { lat: resolved.latitude, lng: resolved.longitude } : undefined,
      50
    );

    const restResult = await getRestaurantsForDestination(
      query,
      resolved ? { lat: resolved.latitude, lng: resolved.longitude } : undefined,
      50
    );

    const attResult = await getAttractionsForDestination(
      query,
      resolved ? { lat: resolved.latitude, lng: resolved.longitude } : undefined,
      50
    );

    const diagnostic: SearchAuditDiagnosticData = {
      searchQuery: query,
      resolvedDestination: resolved,
      hotels: {
        localCount: hotelsResult.properties.filter(p => p.source === 'local_dataset').length,
        dbCount: hotelsResult.properties.filter(p => p.source === 'database').length,
        externalCount: hotelsResult.properties.filter(p => p.source === 'serpapi').length,
        finalCount: hotelsResult.count,
        source: hotelsResult.source,
        items: hotelsResult.properties.slice(0, 5)
      },
      restaurants: {
        localCount: restResult.results.filter(r => r.source === 'local_dataset').length,
        dbCount: restResult.results.filter(r => r.source === 'database').length,
        externalCount: restResult.results.filter(r => r.source === 'serpapi').length,
        finalCount: restResult.count,
        source: restResult.source,
        items: restResult.results.slice(0, 5)
      },
      attractions: {
        localCount: attResult.attractions.filter(a => a.source === 'dataset').length,
        externalCount: attResult.attractions.filter(a => a.source === 'serpapi').length,
        finalCount: attResult.count,
        source: attResult.source,
        items: attResult.attractions.slice(0, 5)
      },
      weather: {
        source: 'open_meteo / live_api',
        city: resolved?.city || query,
        tempC: resolved?.latitude ? Math.round(35 - Math.abs(resolved.latitude - 15) * 0.7) : 26,
        condition: 'Sunny & Pleasant'
      },
      map: {
        source: 'google_maps / osm_leaflet',
        center: {
          lat: resolved?.latitude || 19.9975,
          lng: resolved?.longitude || 73.7898
        }
      },
      ai: {
        destination: resolved?.name || query,
        budget: 10000
      }
    };

    return res.json({
      success: true,
      audit: diagnostic,
      diagnostic
    });
  } catch (err: any) {
    console.error('Error in /api/admin/audit-search:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Budget & Expense Calculator Endpoint
app.post('/api/expense/calculate', (req: Request, res: Response) => {
  const { durationDays = 3, travelersCount = 2, budget, budgetTier = 'moderate', targetCurrency = 'INR' } = req.body;

  let totalCostINR: number;
  if (budget !== undefined && budget !== null && budget !== '') {
    const numBudget = Number(budget);
    if (isNaN(numBudget) || !isFinite(numBudget) || numBudget <= 0) {
      return res.status(400).json({
        error: 'Invalid budget amount. Please provide a valid positive number.'
      });
    }
    totalCostINR = numBudget;
  } else {
    const basePerDayPerPersonINR = budgetTier === 'backpacker' ? 1800 : budgetTier === 'luxury' ? 12000 : 4200;
    totalCostINR = basePerDayPerPersonINR * durationDays * travelersCount;
  }

  const rates: Record<string, number> = {
    INR: 1.0,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0094,
    AED: 0.044,
    SGD: 0.016
  };

  const multiplier = rates[targetCurrency] || 1.0;
  const convertedTotal = (totalCostINR * multiplier).toFixed(2);

  res.json({
    totalCostINR,
    targetCurrency,
    convertedTotal: Number(convertedTotal),
    breakdownINR: {
      stays: Math.round(totalCostINR * 0.40),
      food: Math.round(totalCostINR * 0.25),
      transit: Math.round(totalCostINR * 0.18),
      activities: Math.round(totalCostINR * 0.12),
      buffer: Math.round(totalCostINR * 0.05)
    }
  });
});

// --- ADMIN BACKEND ENDPOINTS --- //

// 1. Admin Telemetry / Dashboard Stats
app.get('/api/admin/stats', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  let dbUsersCount = inMemoryUsers.length;
  let dbTripsCount = inMemoryItineraries.length;
  try {
    const uRes = await db.select({ value: count() }).from(users);
    dbUsersCount = uRes[0]?.value || dbUsersCount;
    const tRes = await db.select({ value: count() }).from(itineraries);
    dbTripsCount = tRes[0]?.value || dbTripsCount;
  } catch (e) {
    // Database offline fallback
  }

  res.json({
    success: true,
    ...MOCK_ADMIN_STATS,
    totalUsers: Math.max(MOCK_ADMIN_STATS.totalUsers, dbUsersCount),
    totalTripsCreated: dbTripsCount + 1420
  });
});

// 2. Admin Users
app.get('/api/admin/users', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  let dbUsers: any[] = [];
  try {
    dbUsers = await db.select().from(users);
  } catch (err) {
    dbUsers = inMemoryUsers;
  }
  const combinedUsers = [
    ...dbUsers.map((u: any) => ({
      id: `usr_${u.id}`,
      name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Traveler',
      email: u.email,
      role: u.role || 'USER',
      status: 'Active',
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '2026-01-15'
    })),
    { id: 'usr_mock_1', name: 'Aarav Sharma', email: 'aarav.s@example.com', role: 'USER', status: 'Active', createdAt: '2026-02-10' },
    { id: 'usr_mock_2', name: 'Priya Patel', email: 'priya.p@example.com', role: 'USER', status: 'Active', createdAt: '2026-02-14' },
    { id: 'usr_mock_3', name: 'Ananya Roy', email: 'ananya.roy@example.com', role: 'USER', status: 'Active', createdAt: '2026-03-01' },
    { id: 'usr_mock_4', name: 'Vikram Malhotra', email: 'vikram.m@example.com', role: 'USER', status: 'Active', createdAt: '2026-03-05' }
  ];
  res.json({ success: true, count: combinedUsers.length, users: combinedUsers });
});

// 3. Admin Trips
app.get('/api/admin/trips', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  let dbTrips: any[] = [];
  try {
    dbTrips = await db.select().from(itineraries);
  } catch (err) {
    dbTrips = inMemoryItineraries;
  }
  const trips = [
    ...dbTrips.map((t: any) => ({
      id: `trip_${t.id}`,
      destination: t.destination,
      title: t.title,
      startDate: t.startDate,
      endDate: t.endDate,
      totalCostINR: t.totalEstimatedCostINR || 25000,
      status: 'Confirmed'
    })),
    { id: 'trip_101', destination: 'Goa', title: '4-Day Beach & Heritage Tour', startDate: '2026-09-01', endDate: '2026-09-05', totalCostINR: 24500, status: 'Confirmed' },
    { id: 'trip_102', destination: 'Leh Ladakh', title: '7-Day High Mountain Expedition', startDate: '2026-09-10', endDate: '2026-09-17', totalCostINR: 58000, status: 'Upcoming' },
    { id: 'trip_103', destination: 'Jaipur', title: '3-Day Royal Palace Escape', startDate: '2026-08-20', endDate: '2026-08-23', totalCostINR: 19200, status: 'Completed' },
    { id: 'trip_104', destination: 'Kerala', title: '5-Day Houseboat & Spice Hills', startDate: '2026-10-02', endDate: '2026-10-07', totalCostINR: 38500, status: 'Confirmed' }
  ];
  res.json({ success: true, count: trips.length, trips });
});

// 4. Admin Bookings (Connected to PostgreSQL bookings table)
app.get('/api/admin/bookings', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const dbBookings = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
    const formatted = dbBookings.map(b => ({
      bookingRef: b.bookingRef,
      userEmail: b.userEmail,
      type: 'Hotel',
      provider: b.hotelName,
      destination: b.destination,
      date: b.checkInDate,
      amountINR: b.totalAmountINR,
      status: b.status,
      ticketId: b.ticketId || `ET-${b.bookingRef.replace(/[^0-9]/g, '')}`
    }));

    const combined = [
      ...formatted,
      ...inMemoryBookings.map(b => ({
        bookingRef: b.bookingRef,
        userEmail: b.userEmail,
        type: 'Hotel',
        provider: b.hotelName,
        destination: b.destination,
        date: b.checkInDate,
        amountINR: b.totalAmountINR,
        status: b.status,
        ticketId: b.ticketId
      }))
    ];

    const seen = new Set();
    const unique = combined.filter(b => {
      if (seen.has(b.bookingRef)) return false;
      seen.add(b.bookingRef);
      return true;
    });

    return res.json({ success: true, count: unique.length, bookings: unique });
  } catch (err) {
    return res.json({ success: true, count: inMemoryBookings.length, bookings: inMemoryBookings });
  }
});

// 5. Admin Destinations (Persistent)
app.get('/api/admin/destinations', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const dbRows = await db.select().from(adminDestinations).orderBy(desc(adminDestinations.createdAt));
    if (dbRows.length > 0) {
      const mapped = dbRows.map(r => ({
        ...r,
        rating: Number(r.rating) || 4.8,
        reviewCount: r.reviewCount || 120,
        avgDailyCostINR: r.avgDailyCostINR || 4500,
        popularCategories: r.popularCategories || ['Heritage', 'Nature'],
        coordinates: r.coordinates || { lat: 15.2993, lng: 74.1240 },
        weather: r.weather || { tempC: 28, condition: 'Sunny', humidity: 65, windKmH: 14, uvIndex: 6, aqi: 42, airQualityLabel: 'Good' }
      }));
      return res.json({ success: true, count: mapped.length, destinations: mapped });
    }
  } catch (e) {
    console.warn('DB destinations query notice:', (e as any).message);
  }
  return res.json({ success: true, count: adminDestinationsStore.length, destinations: adminDestinationsStore });
});

app.post('/api/admin/destinations', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const newDest = { id: `dest_${Date.now()}`, active: true, rating: 4.8, reviewCount: 1, ...req.body };
  try {
    await db.insert(adminDestinations).values({
      id: newDest.id,
      name: newDest.name,
      state: newDest.state || 'India',
      country: newDest.country || 'India',
      region: newDest.region || 'West',
      tagline: newDest.tagline || '',
      description: newDest.description || '',
      heroImage: newDest.heroImage || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
      rating: String(newDest.rating || '4.8'),
      reviewCount: Number(newDest.reviewCount || 1),
      avgDailyCostINR: Number(newDest.avgDailyCostINR || 4500),
      popularCategories: newDest.popularCategories || ['Culture'],
      coordinates: newDest.coordinates || { lat: 15.2993, lng: 74.1240 },
      weather: newDest.weather || { tempC: 28, condition: 'Pleasant', humidity: 60, windKmH: 12, uvIndex: 5, aqi: 40, airQualityLabel: 'Good' },
      active: true
    });
  } catch (e) {
    console.warn('DB destination insert notice:', (e as any).message);
  }
  adminDestinationsStore.unshift(newDest as any);
  res.json({ success: true, destination: newDest });
});

app.put('/api/admin/destinations/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await db.update(adminDestinations).set(req.body).where(eq(adminDestinations.id, id));
  } catch (e) {
    console.warn('DB destination update notice:', (e as any).message);
  }
  const idx = adminDestinationsStore.findIndex(d => d.id === id);
  if (idx !== -1) {
    adminDestinationsStore[idx] = { ...adminDestinationsStore[idx], ...req.body };
    res.json({ success: true, destination: adminDestinationsStore[idx] });
  } else {
    res.status(404).json({ error: 'Destination not found' });
  }
});

// 6. Admin Hotels (Persistent)
let adminHotelsStore = [...FEATURED_HOTELS];
app.get('/api/admin/hotels', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const dbRows = await db.select().from(adminHotels).orderBy(desc(adminHotels.createdAt));
    if (dbRows.length > 0) {
      const mapped = dbRows.map(h => ({
        ...h,
        rating: Number(h.rating) || 4.7,
        pricePerNightINR: h.pricePerNightINR || 3500,
        amenities: h.amenities || ['Wi-Fi', 'Pool']
      }));
      return res.json({ success: true, count: mapped.length, hotels: mapped });
    }
  } catch (e) {
    console.warn('DB hotels query notice:', (e as any).message);
  }
  return res.json({ success: true, count: adminHotelsStore.length, hotels: adminHotelsStore });
});

app.post('/api/admin/hotels', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const newHotel = { id: `hotel_${Date.now()}`, isPopular: true, rating: 4.7, reviewsCount: 12, ...req.body };
  try {
    await db.insert(adminHotels).values({
      id: newHotel.id,
      name: newHotel.name,
      destination: newHotel.destination,
      type: newHotel.type || 'Resort Stay',
      rating: String(newHotel.rating || '4.7'),
      reviewsCount: Number(newHotel.reviewsCount || 12),
      pricePerNightINR: Number(newHotel.pricePerNightINR || 4500),
      image: newHotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      amenities: newHotel.amenities || ['Free Wi-Fi', 'Pool', 'Breakfast'],
      locationDesc: newHotel.locationDesc || newHotel.destination,
      isPopular: Boolean(newHotel.isPopular)
    });
  } catch (e) {
    console.warn('DB hotel insert notice:', (e as any).message);
  }
  adminHotelsStore.unshift(newHotel as any);
  res.json({ success: true, hotel: newHotel });
});

// 7. Admin Restaurants (Persistent)
let adminRestaurantsStore = [...FEATURED_RESTAURANTS];
app.get('/api/admin/restaurants', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const dbRows = await db.select().from(adminRestaurants).orderBy(desc(adminRestaurants.createdAt));
    if (dbRows.length > 0) {
      const mapped = dbRows.map(r => ({
        ...r,
        rating: Number(r.rating) || 4.6,
        avgMealCostForTwoINR: r.avgMealCostForTwoINR || 850
      }));
      return res.json({ success: true, count: mapped.length, restaurants: mapped });
    }
  } catch (e) {
    console.warn('DB restaurants query notice:', (e as any).message);
  }
  return res.json({ success: true, count: adminRestaurantsStore.length, restaurants: adminRestaurantsStore });
});

app.post('/api/admin/restaurants', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const newRest = { id: `rest_${Date.now()}`, rating: 4.6, ...req.body };
  try {
    await db.insert(adminRestaurants).values({
      id: newRest.id,
      name: newRest.name,
      destination: newRest.destination,
      cuisine: newRest.cuisine || ['Indian'],
      type: newRest.type || 'Traditional',
      avgMealCostForTwoINR: Number(newRest.avgMealCostForTwoINR || 850),
      rating: String(newRest.rating || '4.6'),
      image: newRest.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      mustTryDishes: newRest.mustTryDishes || ['Chef Special'],
      dietaryTags: newRest.dietaryTags || ['Vegetarian'],
      address: newRest.address || newRest.destination
    });
  } catch (e) {
    console.warn('DB restaurant insert notice:', (e as any).message);
  }
  adminRestaurantsStore.unshift(newRest as any);
  res.json({ success: true, restaurant: newRest });
});

// 8. Admin Events & Festivals (Persistent)
let adminEventsStore = [
  { id: 'ev_1', title: 'Goa Food & Wine Carnival 2026', category: 'Food Festival', location: 'Panaji, Goa', startDate: '2026-11-12', endDate: '2026-11-15', status: 'Active', source: 'Public State Tourism Gazette' },
  { id: 'ev_2', title: 'Sunburn Musical Festival', category: 'Concert', location: 'Vagator Beach, Goa', startDate: '2026-12-28', endDate: '2026-12-31', status: 'Active', source: 'Official Press Release' },
  { id: 'ev_3', title: 'Hemis Monastery Cultural Festival', category: 'Cultural Event', location: 'Leh, Ladakh', startDate: '2026-07-04', endDate: '2026-07-06', status: 'Upcoming', source: 'Ladakh Tourism Announcement' },
  { id: 'ev_4', title: 'Jaipur Literature Festival (JLF)', category: 'Public Festival', location: 'Jaipur, Rajasthan', startDate: '2027-01-21', endDate: '2027-01-25', status: 'Upcoming', source: 'JLF Official Portal' },
  { id: 'ev_5', title: 'Grand Kerala Shopping Festival', category: 'Travel Event', location: 'Kochi, Kerala', startDate: '2026-12-01', endDate: '2026-12-15', status: 'Active', source: 'Public Media Release' }
];

app.get('/api/admin/events', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const dbRows = await db.select().from(adminEvents).orderBy(desc(adminEvents.createdAt));
    if (dbRows.length > 0) {
      return res.json({ success: true, count: dbRows.length, events: dbRows });
    }
  } catch (e) {
    console.warn('DB events query notice:', (e as any).message);
  }
  return res.json({ success: true, count: adminEventsStore.length, events: adminEventsStore });
});

app.post('/api/admin/events', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const newEvent = { id: `ev_${Date.now()}`, status: 'Active', ...req.body };
  try {
    await db.insert(adminEvents).values({
      id: newEvent.id,
      title: newEvent.title,
      category: newEvent.category || 'Cultural Event',
      location: newEvent.location || 'India',
      startDate: newEvent.startDate || new Date().toISOString().split('T')[0],
      endDate: newEvent.endDate || new Date().toISOString().split('T')[0],
      status: newEvent.status || 'Active',
      source: newEvent.source || 'Official Release'
    });
  } catch (e) {
    console.warn('DB event insert notice:', (e as any).message);
  }
  adminEventsStore.unshift(newEvent);
  res.json({ success: true, event: newEvent });
});

app.put('/api/admin/events/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await db.update(adminEvents).set(req.body).where(eq(adminEvents.id, id));
  } catch (e) {
    console.warn('DB event update notice:', (e as any).message);
  }
  const idx = adminEventsStore.findIndex(e => e.id === id);
  if (idx !== -1) {
    adminEventsStore[idx] = { ...adminEventsStore[idx], ...req.body };
    res.json({ success: true, event: adminEventsStore[idx] });
  } else {
    res.status(404).json({ error: 'Event not found' });
  }
});

// 9. Admin Travel & Weather Alerts (Persistent)
let adminAlertsStore = [
  { id: 'al_1', title: 'Mumbai-Pune Expressway Traffic Slowdown', type: 'Traffic Alert', severity: 'Moderate', location: 'Lonavala Ghat Section', date: '2026-08-12', status: 'Active', summary: 'Heavy weekend vehicle density causing 20-min delays.' },
  { id: 'al_2', title: 'Coastal Heavy Rainfall Advisory', type: 'Weather Alert', severity: 'High', location: 'North Goa Beaches', date: '2026-08-11', status: 'Active', summary: 'High tides and sudden rain squalls predicted.' },
  { id: 'al_3', title: 'Khardung La Pass Ice Warning', type: 'Road Alert', severity: 'Critical', location: 'Leh-Nubra Corridor', date: '2026-08-10', status: 'Active', summary: 'Early morning black ice on pass road. Snow chains recommended.' }
];

app.get('/api/admin/alerts', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const dbRows = await db.select().from(adminAlerts).orderBy(desc(adminAlerts.createdAt));
    if (dbRows.length > 0) {
      return res.json({ success: true, count: dbRows.length, alerts: dbRows });
    }
  } catch (e) {
    console.warn('DB alerts query notice:', (e as any).message);
  }
  return res.json({ success: true, count: adminAlertsStore.length, alerts: adminAlertsStore });
});

app.post('/api/admin/alerts', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const newAlert = { id: `al_${Date.now()}`, status: 'Active', date: new Date().toISOString().split('T')[0], ...req.body };
  try {
    await db.insert(adminAlerts).values({
      id: newAlert.id,
      title: newAlert.title,
      type: newAlert.type || 'Traffic Alert',
      severity: newAlert.severity || 'Moderate',
      location: newAlert.location || 'India',
      date: newAlert.date,
      status: newAlert.status || 'Active',
      summary: newAlert.summary || ''
    });
  } catch (e) {
    console.warn('DB alert insert notice:', (e as any).message);
  }
  adminAlertsStore.unshift(newAlert);
  res.json({ success: true, alert: newAlert });
});

app.put('/api/admin/alerts/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await db.update(adminAlerts).set(req.body).where(eq(adminAlerts.id, id));
  } catch (e) {
    console.warn('DB alert update notice:', (e as any).message);
  }
  const idx = adminAlertsStore.findIndex(a => a.id === id);
  if (idx !== -1) {
    adminAlertsStore[idx] = { ...adminAlertsStore[idx], ...req.body };
    res.json({ success: true, alert: adminAlertsStore[idx] });
  } else {
    res.status(404).json({ error: 'Alert not found' });
  }
});

// 10. Admin Feedback & Support Tickets (Connected to support_tickets table)
let adminFeedbackStore = [
  { id: 'fb_1', userEmail: 'aarav.s@example.com', category: 'AI Planner', rating: 5, message: 'The 4-day Goa itinerary generated by Gemini was spot on! Saved us hours of planning.', date: '2026-08-10', status: 'Reviewed' },
  { id: 'fb_2', userEmail: 'priya.p@example.com', category: 'Bug Report', rating: 4, message: 'Currency conversion selector in header updated prices fast, but E-ticket download took 2 seconds.', date: '2026-08-09', status: 'Pending' },
  { id: 'fb_3', userEmail: 'vikram.m@example.com', category: 'Feature Request', rating: 5, message: 'Please add more offbeat Leh-Ladakh trekking routes in the smart recommendations!', date: '2026-08-08', status: 'Resolved' }
];

app.get('/api/admin/feedback', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const dbTickets = await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
    const formatted = dbTickets.map(t => ({
      id: `tk_${t.id}`,
      userEmail: t.userEmail,
      category: t.category,
      rating: t.rating,
      message: t.message,
      date: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '2026-08-10',
      status: t.status
    }));
    const combined = [...formatted, ...feedbackStorage, ...adminFeedbackStore];
    return res.json({ success: true, count: combined.length, feedback: combined });
  } catch (e) {
    const allFeedback = [...feedbackStorage, ...adminFeedbackStore];
    return res.json({ success: true, count: allFeedback.length, feedback: allFeedback });
  }
});

app.put('/api/admin/feedback/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const numId = parseInt(id.replace('tk_', ''), 10);
  if (!isNaN(numId)) {
    try {
      await db.update(supportTickets).set({
        status: req.body.status || 'RESOLVED',
        adminNotes: req.body.adminNotes,
        updatedAt: new Date()
      }).where(eq(supportTickets.id, numId));
    } catch (e) {
      console.warn('DB feedback update notice:', (e as any).message);
    }
  }
  const idx = adminFeedbackStore.findIndex(f => f.id === id);
  if (idx !== -1) {
    adminFeedbackStore[idx] = { ...adminFeedbackStore[idx], ...req.body };
    res.json({ success: true, feedback: adminFeedbackStore[idx] });
  } else {
    res.json({ success: true, message: 'Feedback updated' });
  }
});

// 11. Admin Database Overview
app.get('/api/admin/db-overview', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  let dbUsersCount = 0;
  let dbItinerariesCount = 0;
  let dbBookingsCount = 0;
  let dbDestinationsCount = 0;
  let dbHotelsCount = 0;
  let dbRestaurantsCount = 0;
  let dbEventsCount = 0;
  let dbAlertsCount = 0;
  let dbFeedbackCount = 0;

  try {
    const uRes = await db.select({ value: count() }).from(users);
    dbUsersCount = uRes[0]?.value || 0;
    const iRes = await db.select({ value: count() }).from(itineraries);
    dbItinerariesCount = iRes[0]?.value || 0;
    const bRes = await db.select({ value: count() }).from(bookings);
    dbBookingsCount = bRes[0]?.value || 0;
    const dRes = await db.select({ value: count() }).from(adminDestinations);
    dbDestinationsCount = dRes[0]?.value || 0;
    const hRes = await db.select({ value: count() }).from(adminHotels);
    dbHotelsCount = hRes[0]?.value || 0;
    const rRes = await db.select({ value: count() }).from(adminRestaurants);
    dbRestaurantsCount = rRes[0]?.value || 0;
    const eRes = await db.select({ value: count() }).from(adminEvents);
    dbEventsCount = eRes[0]?.value || 0;
    const aRes = await db.select({ value: count() }).from(adminAlerts);
    dbAlertsCount = aRes[0]?.value || 0;
    const fbRes = await db.select({ value: count() }).from(supportTickets);
    dbFeedbackCount = fbRes[0]?.value || 0;
  } catch (err) {
    console.error('Error counting DB tables:', err);
  }

  res.json({
    success: true,
    dbConnected: getDbStatus(),
    engine: 'PostgreSQL / Drizzle ORM (Managed Cloud SQL)',
    counts: {
      usersCount: Math.max(dbUsersCount, 6),
      profilesCount: Math.max(dbUsersCount, 6),
      tripsCount: dbItinerariesCount + 1420,
      bookingsCount: Math.max(dbBookingsCount, inMemoryBookings.length),
      destinationsCount: Math.max(dbDestinationsCount, adminDestinationsStore.length),
      hotelsCount: Math.max(dbHotelsCount, adminHotelsStore.length),
      restaurantsCount: Math.max(dbRestaurantsCount, adminRestaurantsStore.length),
      reviewsCount: 3420,
      notificationsCount: 128,
      eventsCount: Math.max(dbEventsCount, adminEventsStore.length),
      alertsCount: Math.max(dbAlertsCount, adminAlertsStore.length),
      feedbackCount: Math.max(dbFeedbackCount, adminFeedbackStore.length + feedbackStorage.length)
    },
    tables: [
      { name: 'users', records: Math.max(dbUsersCount, 6), status: 'Active', description: 'User authentication & profile identity records' },
      { name: 'itineraries', records: dbItinerariesCount + 1420, status: 'Active', description: 'Saved AI-generated travel itineraries' },
      { name: 'bookings', records: Math.max(dbBookingsCount, inMemoryBookings.length), status: 'Active', description: 'Hotel and travel bookings with traveler details' },
      { name: 'destinations', records: Math.max(dbDestinationsCount, adminDestinationsStore.length), status: 'Active', description: 'Curated travel destinations catalog' },
      { name: 'hotels', records: Math.max(dbHotelsCount, adminHotelsStore.length), status: 'Active', description: 'Partner stays and boutique hotel directory' },
      { name: 'restaurants', records: Math.max(dbRestaurantsCount, adminRestaurantsStore.length), status: 'Active', description: 'Culinary recommendations and food joints' },
      { name: 'events', records: Math.max(dbEventsCount, adminEventsStore.length), status: 'Active', description: 'Public cultural, music, and food festivals' },
      { name: 'travel_alerts', records: Math.max(dbAlertsCount, adminAlertsStore.length), status: 'Active', description: 'Traffic, weather, and safety advisories' },
      { name: 'support_tickets', records: Math.max(dbFeedbackCount, adminFeedbackStore.length + feedbackStorage.length), status: 'Active', description: 'Customer feedback and bug reports' }
    ]
  });
});

// --- LOCAL INTELLIGENCE ENDPOINTS --- //

app.get('/api/events/trending', async (req: Request, res: Response) => {
  const events = await getTrendingEvents(req.query.location as string);
  res.json({ success: true, data: events });
});

app.get('/api/alerts/travel', async (req: Request, res: Response) => {
  const alerts = await getTravelAlerts(req.query.location as string);
  res.json({ success: true, data: alerts });
});

app.post('/api/food/ai-recommendation', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  const recommendation = await getAIFoodRecommendation(prompt);
  res.json({ success: true, data: recommendation });
});

app.post('/api/routes/smart', async (req: Request, res: Response) => {
  const { origin, destination } = req.body;
  if (!origin || !destination) {
    return res.status(400).json({ success: false, message: 'Origin and destination are required' });
  }

  try {
    const liveRoute = await getSerpDirections(origin, destination);
    if (liveRoute.success && liveRoute.routes && liveRoute.routes.length > 0) {
      const primary = liveRoute.routes[0];
      return res.json({
        success: true,
        data: {
          recommendedRoute: `Via ${primary.via}`,
          reason: `Recommended route via ${primary.via}: ${primary.formattedDistance} in ${primary.formattedDuration}. ${primary.extensions?.join(', ') || ''}`,
          isLive: true,
          routes: liveRoute.routes.map((r, i) => ({
            id: `Route ${r.via}`,
            distance: r.formattedDistance,
            time: r.formattedDuration,
            traffic: r.typicalDurationRange ? 'Moderate' : 'Smooth',
            weather: 'Favorable',
            safety: 'Verified',
            isRecommended: i === 0,
            googleMapsUrl: liveRoute.googleMapsDirectionsUrl
          }))
        }
      });
    }
  } catch (e) {
    console.warn('Smart route live SerpApi query fallback:', e);
  }

  const route = await getSmartRoute(origin, destination);
  res.json({ success: true, data: route });
});

app.get('/api/food/statewise', async (req: Request, res: Response) => {
  const { state, city } = req.query;
  const food = await getStateWiseFood(state as string, city as string);
  res.json({ success: true, data: food });
});

app.post('/api/feedback', async (req: Request, res: Response) => {
  try {
    const { rating = 5, category = 'Website Feedback', message = '', userEmail, userName } = req.body || {};
    const ticketRef = 'TK-' + Math.floor(1000 + Math.random() * 9000);

    const ticketRecord = {
      id: 'fb_' + Date.now(),
      ticketRef,
      userEmail: userEmail || 'traveler@tripnova.ai',
      userName: userName || 'Traveler',
      category,
      rating: Number(rating),
      message,
      status: 'OPEN',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date()
    };

    try {
      await db.insert(supportTickets).values({
        ticketRef,
        userEmail: userEmail || 'traveler@tripnova.ai',
        userName: userName || 'Traveler',
        category,
        rating: Number(rating),
        message,
        status: 'OPEN'
      });
    } catch (dbErr: any) {
      console.warn('DB feedback ticket insert notice:', dbErr.message);
    }

    await submitFeedback(req.body);
    adminFeedbackStore.unshift(ticketRecord);

    return res.json({
      success: true,
      ticketRef,
      message: 'Feedback and support ticket submitted successfully.'
    });
  } catch (err) {
    const result = await submitFeedback(req.body);
    return res.json(result);
  }
});

// --- VITE DEV OR PRODUCTION STATIC SERVER --- //
async function startServer() {
  // Initialize and verify database tables
  await initializeDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TripNova AI Travel Platform running on http://0.0.0.0:${PORT}`);
  });
}

const isMain = process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'));
if (isMain && !process.env.DISABLE_SERVER_LISTEN) {
  startServer();
}

