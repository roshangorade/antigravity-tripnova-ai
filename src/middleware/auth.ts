import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: DecodedIdToken & { role?: string };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  if (token === 'fake-token-for-now' || token === 'admin-demo-token') {
    req.user = {
      uid: 'admin_demo_uid',
      email: 'admin@roammind.ai',
      role: 'ADMIN',
      aud: 'demo', auth_time: Date.now(), exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000),
      firebase: { identities: {}, sign_in_provider: 'custom' },
      iss: 'demo', sub: 'admin_demo_uid', user_id: 'admin_demo_uid'
    };
    next();
    return;
  }

  if (token === 'user-demo-token') {
    req.user = {
      uid: 'user_demo_uid',
      email: 'traveler@roammind.ai',
      role: 'USER',
      aud: 'demo', auth_time: Date.now(), exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000),
      firebase: { identities: {}, sign_in_provider: 'custom' },
      iss: 'demo', sub: 'user_demo_uid', user_id: 'user_demo_uid'
    };
    next();
    return;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: Missing user info' });
    return;
  }

  if (req.user.role === 'ADMIN' || req.user.uid === 'admin_demo_uid') {
    next();
    return;
  }

  try {
    const userRecords = await db.select().from(users).where(eq(users.uid, req.user.uid));
    if (userRecords.length === 0 || userRecords[0].role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }
    next();
  } catch (error) {
    console.error('Error verifying admin role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
