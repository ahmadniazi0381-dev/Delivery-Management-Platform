import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required.');
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    phone: string;
    role: 'CUSTOMER' | 'ADMIN' | 'RIDER';
    phoneVerified: boolean;
  };
}

/**
 * Middleware to authenticate requests using JWT tokens.
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as {
      id: string;
      phone: string;
      role: 'CUSTOMER' | 'ADMIN' | 'RIDER';
      phoneVerified: boolean;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

/**
 * Middleware generator to enforce access control based on user roles.
 */
export function requireRole(...roles: Array<'CUSTOMER' | 'ADMIN' | 'RIDER'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
}
