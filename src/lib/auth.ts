import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export type UserRole = 'USER' | 'ADMIN' | 'SUPPORT' | 'CONTENT_MANAGER' | 'FINANCE' | 'ANALYST';

export const VALID_ROLES: UserRole[] = ['USER', 'ADMIN', 'SUPPORT', 'CONTENT_MANAGER', 'FINANCE', 'ANALYST'];

export interface AuthTokenPayload {
  userId: number;
  uid: string;
  email: string;
  role: UserRole;
  name?: string;
}

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'tripnova_production_jwt_secret_key_2026_secure';
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const hashPasswordSync = (password: string): string => {
  return bcrypt.hashSync(password, 10);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '7d',
    issuer: 'tripnova.ai'
  });
};

export const verifyToken = (token: string): AuthTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { issuer: 'tripnova.ai' });
    return decoded as AuthTokenPayload;
  } catch (err) {
    return null;
  }
};

export interface SafeUser {
  id: string | number;
  uid: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  profileImage: string;
  avatar: string;
  bio: string;
  role: UserRole;
  verified: boolean;
  memberSince: string;
  visitedDestinationsCount: number;
  totalKmTraveled: number;
  badges: string[];
}

export const sanitizeUser = (user: any): SafeUser => {
  const travelStats = user.travelStats || {};
  const firstName = user.firstName || (user.name ? user.name.split(' ')[0] : 'Traveler');
  const lastName = user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : 'User');
  const computedName = user.name || `${firstName} ${lastName}`.trim();
  const avatarUrl = user.profileImage || user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

  return {
    id: user.id ? (typeof user.id === 'number' ? `USR${user.id}` : user.id) : `USR${Math.floor(100 + Math.random() * 900)}`,
    uid: user.uid || `uid_${Date.now()}`,
    email: user.email,
    name: computedName,
    firstName,
    lastName,
    username: user.username || firstName.toLowerCase() + '_t',
    phone: user.phone || '+91 9876543210',
    city: user.city || 'Chhatrapati Sambhajinagar',
    state: user.state || 'Maharashtra',
    country: user.country || 'India',
    profileImage: avatarUrl,
    avatar: avatarUrl,
    bio: user.bio || 'Passionate traveler exploring India and the world.',
    role: (user.role as UserRole) || 'USER',
    verified: true,
    memberSince: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '2026-01-10',
    visitedDestinationsCount: travelStats.visitedDestinationsCount || (user.role === 'ADMIN' ? 24 : 14),
    totalKmTraveled: travelStats.totalKmTraveled || (user.role === 'ADMIN' ? 24000 : 18450),
    badges: travelStats.badges || (user.role === 'ADMIN' ? ['System Admin', 'Verified Executive'] : ['Himalayan Explorer', 'Beach Nomad', 'Foodie Pioneer'])
  };
};
