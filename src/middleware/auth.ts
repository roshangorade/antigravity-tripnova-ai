import { Request, Response, NextFunction } from 'express';
import { verifyToken, UserRole } from '../lib/auth.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { adminAuth } from '../lib/firebase-admin.ts';

export interface AuthenticatedUser {
  userId?: number;
  uid: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: Missing or malformed authorization token.' });
    return;
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized: Empty token provided.' });
    return;
  }

  // 1. Verify our application JWT token
  const decoded = verifyToken(token);
  if (decoded) {
    req.user = {
      userId: decoded.userId,
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name
    };
    next();
    return;
  }

  // 2. Optional fallback to Firebase ID token if configured and valid
  try {
    const firebaseDecoded = await adminAuth.verifyIdToken(token);
    let userRole: UserRole = 'USER';
    try {
      const records = await db.select().from(users).where(eq(users.uid, firebaseDecoded.uid));
      if (records.length > 0 && records[0].role) {
        userRole = records[0].role as UserRole;
      }
    } catch {
      // Fallback
    }

    req.user = {
      uid: firebaseDecoded.uid,
      email: firebaseDecoded.email || 'user@tripnova.ai',
      role: userRole,
      name: firebaseDecoded.name
    };
    next();
    return;
  } catch (err) {
    // Both JWT and Firebase verification failed
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired authentication token. Please sign in again.'
    });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
    return;
  }

  if (req.user.role === 'ADMIN') {
    next();
    return;
  }

  // Verify against database role for source of truth
  try {
    if (req.user.uid) {
      const userRecords = await db.select().from(users).where(eq(users.uid, req.user.uid));
      if (userRecords.length > 0 && userRecords[0].role === 'ADMIN') {
        req.user.role = 'ADMIN';
        next();
        return;
      }
    }
  } catch (error) {
    console.warn('Database check in requireAdmin error:', error);
  }

  res.status(403).json({
    success: false,
    error: 'Forbidden: Administrative privileges required to access this resource.'
  });
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    if (req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      error: `Forbidden: Access requires one of the following roles: ${allowedRoles.join(', ')}`
    });
  };
};
